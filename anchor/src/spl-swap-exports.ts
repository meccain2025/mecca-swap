// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import SplSwapIDL from '../target/idl/spl_swap.json'
import type { SplSwap } from '../target/types/spl_swap'

// Re-export the generated IDL and type
export { SplSwap, SplSwapIDL }

// The programId is imported from the program IDL.
export const COUNTER_PROGRAM_ID = new PublicKey(SplSwapIDL.address)

// This is a helper function to get the Anchor program.
export function getCounterProgram(provider: AnchorProvider, address?: PublicKey): Program<SplSwap> {
  return new Program({ ...SplSwapIDL, address: address ? address.toBase58() : SplSwapIDL.address } as SplSwap, provider)
}

export function getCounterProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID
      return new PublicKey('3mztcTdP6gBtPURpNzXMApGXXxKKwU1tcF6E3xwPubtZ')
    case 'mainnet-beta':
    default:
      return COUNTER_PROGRAM_ID
  }
}
