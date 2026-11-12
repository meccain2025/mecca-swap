import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { SplSwap } from '../target/types/spl_swap'

describe('SPL Swap - Admin Security', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.SplSwap as Program<SplSwap>

  const adminA = Keypair.generate()
  const adminB = Keypair.generate()

  const [swapState] = PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    program.programId,
  )

  async function fundWallet(wallet: Keypair) {
    const signature = await provider.connection.requestAirdrop(
      wallet.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    )

    await provider.connection.confirmTransaction(signature, 'confirmed')
  }

  it('checks initialization, admin permissions, fee limits and admin transfer', async () => {
    await fundWallet(adminA)
    await fundWallet(adminB)

    // 1. Admin A initializes the state.
    await program.methods
      .initialize(10)
      .accountsPartial({
        signer: adminA.publicKey,
        swapState,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminA])
      .rpc()

    let state = await program.account.swapState.fetch(swapState)

    expect(state.initialized).toBe(true)
    expect(state.admin.equals(adminA.publicKey)).toBe(true)
    expect(state.feeBps).toBe(10)

    // 2. Admin B must not initialize the existing state again.
    await expect(
      program.methods
        .initialize(10)
        .accountsPartial({
          signer: adminB.publicKey,
          swapState,
          systemProgram: SystemProgram.programId,
        })
        .signers([adminB])
        .rpc(),
    ).rejects.toThrow()

    // 3. Admin A can update the fee.
    await program.methods
      .updateFee(15)
      .accountsPartial({
        signer: adminA.publicKey,
        swapState,
      })
      .signers([adminA])
      .rpc()

    state = await program.account.swapState.fetch(swapState)
    expect(state.feeBps).toBe(15)

    // 4. Admin B cannot update the fee before ownership transfer.
    await expect(
      program.methods
        .updateFee(12)
        .accountsPartial({
          signer: adminB.publicKey,
          swapState,
        })
        .signers([adminB])
        .rpc(),
    ).rejects.toThrow()

    // 5. Fees above MAX_BPS (20) must be rejected.
    await expect(
      program.methods
        .updateFee(21)
        .accountsPartial({
          signer: adminA.publicKey,
          swapState,
        })
        .signers([adminA])
        .rpc(),
    ).rejects.toThrow()

    // 6. Admin A transfers ownership to Admin B.
    await program.methods
      .updateAdmin(adminB.publicKey)
      .accountsPartial({
        signer: adminA.publicKey,
        swapState,
      })
      .signers([adminA])
      .rpc()

    state = await program.account.swapState.fetch(swapState)
    expect(state.admin.equals(adminB.publicKey)).toBe(true)

    // 7. Admin B can update the fee after ownership transfer.
    await program.methods
      .updateFee(20)
      .accountsPartial({
        signer: adminB.publicKey,
        swapState,
      })
      .signers([adminB])
      .rpc()

    state = await program.account.swapState.fetch(swapState)
    expect(state.feeBps).toBe(20)

    // The former admin A must no longer have admin privileges.
    await expect(
      program.methods
        .updateFee(5)
        .accountsPartial({
          signer: adminA.publicKey,
          swapState,
        })
        .signers([adminA])
        .rpc(),
    ).rejects.toThrow()
  })
})
