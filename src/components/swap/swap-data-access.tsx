import { getSwapProgram, getSwapProgramId } from '@/lib/swap-exports'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { toast } from 'sonner'
import * as anchor from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { MEA_SPL2022_MINT } from '@/lib/utils'

export function useSwapProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const queryClient = useQueryClient()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getSwapProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getSwapProgram(provider, programId), [provider, programId])

  const statePda = useMemo(() => {
    return PublicKey.findProgramAddressSync([Buffer.from('state')], program.programId)[0]
  }, [program])

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', cluster],
    enabled: !!programId,
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['swap-state', 'initialize', cluster],
    mutationFn: () => program.methods.initialize(20).rpc(),
    onSuccess: async (signature) => {
      transactionToast(signature)
      queryClient.invalidateQueries({
        queryKey: ['swap-state', cluster],
      })
    },
    onError: () => {
      toast.error('Failed to initialize account')
    },
  })

  const swapStateQuery = useQuery({
    queryKey: ['swap-state', cluster],
    enabled: !!program && !!statePda,
    queryFn: async () => {
      try {
        return await program.account.swapState.fetch(statePda)
      } catch (error) {
        console.error('Error fetching swap state account:', error)
        return null
      }
    },
  })

  const updateFeeMutation = useMutation({
    mutationKey: ['swap-state', 'updateFee', cluster],
    mutationFn: (feeBps: number) => {
      return program.methods.updateFee(feeBps).rpc()
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
      queryClient.invalidateQueries({
        queryKey: ['swap-state', cluster],
      })
    },
    onError: (error) => {
      console.error('Update fee failed:', error)
    },
  })

  const updateAdminMutation = useMutation({
    mutationKey: ['swap-state', 'updateAdmin', cluster],
    mutationFn: (newAdmin: PublicKey) => {
      return program.methods.updateAdmin(newAdmin).rpc()
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
      queryClient.invalidateQueries({
        queryKey: ['swap-state', cluster],
      })
    },
    onError: (error) => {
      console.error('Update admin failed:', error)
    },
  })

  const withdrawFeesMutation = useMutation({
    mutationKey: ['withdrawFees', cluster],
    mutationFn: () => {
      return program.methods
        .withdrawFees()
        .accounts({
          mea2022: MEA_SPL2022_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
    },
    onError: (error) => {
      console.error('Withdraw fees failed:', error)
    },
  })

  const add2022ReserveMutation = useMutation({
    mutationKey: ['add2022Reserve', cluster],
    mutationFn: (amount: string) => {
      return program.methods
        .add2022Reserve(new anchor.BN(amount))
        .accounts({
          mea2022: MEA_SPL2022_MINT,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
    },
    onError: (error) => {
      console.error('Add 2022 reserve failed:', error)
    },
  })

  const addSplReserveMutation = useMutation({
    mutationKey: ['addSplReserve', cluster],
    mutationFn: (amount: string) => {
      return program.methods.addSplReserve(new anchor.BN(amount)).accounts({ tokenProgram: TOKEN_PROGRAM_ID }).rpc()
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
    },
    onError: (error) => {
      console.error('Add SPL reserve failed:', error)
    },
  })

  const swapSplTo2022 = useMutation({
    mutationKey: ['swapSplTo2022', cluster],
    mutationFn: (amount: string) => {
      return program.methods
        .swapSplToSpl2022(new anchor.BN(amount))
        .accounts({
          mea2022: MEA_SPL2022_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
    },
    onError: (error) => {
      console.error('Swap SPL to 2022 failed:', error)
    },
  })

  const swap2022ToSpl = useMutation({
    mutationKey: ['swap2022ToSpl', cluster],
    mutationFn: (amount: string) => {
      return program.methods
        .swapSpl2022ToSpl(new anchor.BN(amount))
        .accounts({
          mea2022: MEA_SPL2022_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
    },
    onError: (error) => {
      console.error('Swap 2022 to SPL failed:', error)
    },
  })

  return {
    program,
    programId,
    getProgramAccount,
    initialize,
    swapStateQuery,
    updateFeeMutation,
    updateAdminMutation,
    withdrawFeesMutation,
    add2022ReserveMutation,
    addSplReserveMutation,
    swapSplTo2022,
    swap2022ToSpl,
  }
}
