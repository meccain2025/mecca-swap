import React, { useState, useMemo } from 'react'
import { Wallet, Info, Copy, ExternalLink, HelpCircle, X, Lock, AlertCircle, ArrowDown, Loader2 } from 'lucide-react'
import { useSwapProgram } from './swap-data-access'
import { MEA_SPL2022_MINT, MEA_SPL_MINT } from '@/lib/utils'
import { useWallet } from '@solana/wallet-adapter-react'

// --- i18n Dictionary ---
const translations = {
  ko: {
    pageTitle: '1:1 스왑',
    detailsTitle: '자세히(검증)',
    detailsSub: '필요 데이터만 모아서 제공합니다.',
    ratioLine: '비율 1:1',
    feeLine: '수수료 0.2%',
    pillLock: '입력 토큰은 락업',
    navDetails: '자세히(검증)',
    navBackMain: '메인으로',
    langToggle: 'EN',
    t22Badge: 'Token-2022',
    splBadge: 'SPL',
    labelMint: 'Mint',
    btnCopy: '복사',
    sectionExchanges: '거래지원 거래소',
    centerTitle: '스왑',
    labelDirection: '방향',
    optT22ToSPL: 'Token-2022 → SPL',
    optSPLToT22: 'SPL → Token-2022',
    labelAmountIn: '입력 수량',
    labelUserReceives: '유저 수령',
    labelFee: '수수료(0.2%)',
    labelTreasuryReceives: '운영사 수령',
    btnSwap: '스왑 실행',
    hintText1: '* 스왑된 입력 토큰은 락업됩니다. 상세 주소/검증은 ',
    hintText2: '에서 확인.',
    helpTitle: '스왑 규칙',
    helpClose: '닫기',
    helpItem1: '비율은 <strong>1:1</strong> 입니다.',
    helpItem2: '수수료 <strong>',
    helpItem21: '</strong>는 <strong>출력 토큰</strong>에서 차감되어 트레저리로 이동합니다.',
    helpItem3: '입력 토큰은 <strong>락업</strong>되어 이중 유통을 방지합니다.',
    helpBottom1: '상세 주소(락업/트레저리)·검증 링크는 ',
    helpBottom2: '에서 확인하십시오.',
    cardAddresses: '주소',
    rowLockVault: 'Lock Vault (입력 토큰 락업)',
    rowTreasury: 'Treasury (수수료 수령)',
    rowExplorer: 'Explorer',
    linkViewLock: 'Lock Vault 보기',
    linkViewTreasury: 'Treasury 보기',
    cardKeyPoints: '공급량/납득 포인트',
    kp1: '스왑 시 입력 토큰은 Lock Vault로 이동(락업)합니다.',
    kp2: '출력 토큰은 1:1 기준으로 지급되며, 수수료 ',
    kp21: '는 출력 토큰에서 차감됩니다.',
    kp3: '좌측(Token-2022)/우측(SPL) 거래지원 거래소를 분리 표기합니다.',
    labelExample: '예시',
    exampleText: '1,000개 입력 시 -> 유저 998개 수령 / 트레저리 2개 수령',
    cardTokenInfo: '토큰 정보',
    rowT22Mint: 'Token-2022 Mint',
    rowSPLMint: 'SPL Mint',
    connectWallet: '지갑 연결',
    connected: '연결됨',
    copied: '복사되었습니다!',
  },
  en: {
    pageTitle: '1:1 Swap',
    detailsTitle: 'Details (Verify)',
    detailsSub: 'All necessary data collected for verification.',
    ratioLine: 'Ratio 1:1',
    feeLine: 'Fee 0.2%',
    pillLock: 'Input tokens are locked',
    navDetails: 'Details (Verify)',
    navBackMain: 'Back to Main',
    langToggle: 'KO',
    t22Badge: 'Token-2022',
    splBadge: 'SPL',
    labelMint: 'Mint',
    btnCopy: 'Copy',
    sectionExchanges: 'Supported Exchanges',
    centerTitle: 'Swap',
    labelDirection: 'Direction',
    optT22ToSPL: 'Token-2022 → SPL',
    optSPLToT22: 'SPL → Token-2022',
    labelAmountIn: 'Input Amount',
    labelUserReceives: 'User Receives',
    labelFee: 'Fee (0.2%)',
    labelTreasuryReceives: 'Treasury Receives',
    btnSwap: 'Execute Swap',
    hintText1: '* Swapped input tokens are locked. For details/verification, see ',
    hintText2: '.',
    helpTitle: 'Swap Rules',
    helpClose: 'Close',
    helpItem1: 'The ratio is exactly <strong>1:1</strong>.',
    helpItem2: 'A <strong>',
    helpItem21: ' fee</strong> is deducted from the <strong>output token</strong> and sent to the Treasury.',
    helpItem3: 'Input tokens are <strong>locked</strong> to prevent double circulation.',
    helpBottom1: 'For detailed addresses (Lockup/Treasury) and verification links, check ',
    helpBottom2: '.',
    cardAddresses: 'Addresses',
    rowLockVault: 'Lock Vault (Input Token Lockup)',
    rowTreasury: 'Treasury (Fee Collection)',
    rowExplorer: 'Explorer',
    linkViewLock: 'View Lock Vault',
    linkViewTreasury: 'View Treasury',
    cardKeyPoints: 'Supply / Verification Points',
    kp1: 'During a swap, input tokens are moved to the Lock Vault (locked).',
    kp2: 'Output tokens are given at a 1:1 ratio, and the ',
    kp21: ' fee is deducted from the output tokens.',
    kp3: 'Supported exchanges for Left (Token-2022) / Right (SPL) are displayed separately.',
    labelExample: 'Example',
    exampleText: 'Input 1,000 -> User receives 998 / Treasury receives 2',
    cardTokenInfo: 'Token Info',
    rowT22Mint: 'Token-2022 Mint',
    rowSPLMint: 'SPL Mint',
    connectWallet: 'Connect Wallet',
    connected: 'Connected',
    copied: 'Copied!',
  },
}

const MOCK_DATA = {
  t22Name: 'MEA',
  splName: 'MEA-SPL',
  t22Exchanges: ['MEXC', 'BingX', 'BitMart', 'LBank', 'Biconomy.com'],
  splExchanges: ['TBD'],
}

// --- Sub-components for Token Badges (Theme Aware) ---
const T22Badge = () => (
  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 border border-slate-200 dark:border-white/5 shrink-0 ml-4">
    <div className="w-6 h-6 rounded-full bg-[#9945FF] flex items-center justify-center text-[10px] font-bold text-white">
      T22
    </div>
    <div className="flex flex-col text-left">
      <span className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{MOCK_DATA.t22Name}</span>
      <span className="text-[10px] text-[#9945FF] leading-tight font-medium">Token-2022</span>
    </div>
  </div>
)

const SPLBadge = () => (
  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 border border-slate-200 dark:border-white/5 shrink-0 ml-4">
    <div className="w-6 h-6 rounded-full bg-[#14F195] flex items-center justify-center text-[10px] font-bold text-black">
      SPL
    </div>
    <div className="flex flex-col text-left">
      <span className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{MOCK_DATA.splName}</span>
      <span className="text-[10px] text-[#14F195] leading-tight font-medium">Standard</span>
    </div>
  </div>
)

export default function SwapUi() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const [direction, setDirection] = useState<'t22_to_spl' | 'spl_to_t22'>('t22_to_spl')
  const [amountIn, setAmountIn] = useState('100')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const { publicKey } = useWallet()

  // --- Anchor Integration ---
  const { swapSplTo2022, swap2022ToSpl, swapStateQuery, programId } = useSwapProgram()
  const activeMutation = direction === 'spl_to_t22' ? swapSplTo2022 : swap2022ToSpl
  const isSwapping = activeMutation.isPending
  const isWalletConnected = !!publicKey

  const t = translations[lang]

  // --- Calculations ---
  const { feeAmount, userReceives, numAmount } = useMemo(() => {
    const num = parseFloat(amountIn) || 0
    const bps = swapStateQuery.data?.feeBps ?? 20
    const fee = (num * bps) / 10000
    return { numAmount: num, feeAmount: fee, userReceives: num - fee }
  }, [amountIn, swapStateQuery.data])

  const handleSwap = () => {
    if (numAmount <= 0) return
    const rawAmount = (numAmount * Math.pow(10, 6)).toString() // decimals
    activeMutation.mutate(rawAmount)
  }

  const renderHTML = (rawHTML: string) => React.createElement('span', { dangerouslySetInnerHTML: { __html: rawHTML } })

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#9945FF] rounded-full blur-[150px] opacity-10 dark:opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#14F195] rounded-full blur-[150px] opacity-10 dark:opacity-10 pointer-events-none"></div>

      <header className="relative z-10 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-gray-400">
              {t.pageTitle}
            </h1>
            <div className="flex items-center space-x-2 mt-1 text-xs font-medium text-slate-500 dark:text-gray-400">
              <span>{t.ratioLine}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600"></span>
              <span>{swapStateQuery.data ? `Fee ${(swapStateQuery.data.feeBps / 100).toFixed(1)}%` : t.feeLine}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600"></span>
              <span className="flex items-center text-[#14F195] bg-[#14F195]/10 px-2 py-0.5 rounded-full border border-[#14F195]/20">
                <Lock className="w-3 h-3 mr-1" /> {t.pillLock}
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="text-sm text-slate-600 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center transition-colors"
            >
              <Info className="w-4 h-4 mr-1" /> {t.navDetails}
            </button>
            <button
              onClick={() => setLang((l) => (l === 'ko' ? 'en' : 'ko'))}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold transition-all"
            >
              {t.langToggle}
            </button>
            {/* <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium">
              <Wallet className="w-4 h-4 text-[#14F195]" />
              <span>{isWalletConnected ? 'Connected' : t.connectWallet}</span>
            </div> */}
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT CARD (Token-2022) */}
        <section className="bg-slate-50 dark:bg-[#141518] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1 bg-[#9945FF]/10 dark:bg-[#9945FF]/20 text-[#9945FF] dark:text-[#D8B4FE] border border-[#9945FF]/20 dark:border-[#9945FF]/30 rounded-full text-xs font-bold uppercase">
              {t.t22Badge}
            </span>
            <strong className="text-xl text-slate-900 dark:text-white">{MOCK_DATA.t22Name}</strong>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1C1D22] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
              <span className="text-xs text-slate-500 block mb-1">{t.labelMint}</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-slate-700 dark:text-gray-300 truncate mr-3">
                  {MEA_SPL2022_MINT.toString()}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(MEA_SPL2022_MINT.toString())}
                  className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 hover:text-black dark:hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-3 flex items-center">
                <div className="w-1 h-4 bg-[#9945FF] rounded-full mr-2"></div>
                {t.sectionExchanges}
              </div>
              <ul className="space-y-2">
                {MOCK_DATA.t22Exchanges.map((ex, i) => (
                  <li
                    key={i}
                    className="flex items-center bg-white dark:bg-[#1C1D22] px-4 py-3 rounded-xl border border-slate-200 dark:border-white/5 text-sm text-slate-700 dark:text-gray-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-3"></span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CENTER CARD (SWAP) */}
        <section className="bg-white dark:bg-gradient-to-b dark:from-[#1A1B20] dark:to-[#141518] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative lg:-mt-4 lg:z-10">
          <div className="flex items-center justify-between mb-6">
            <strong className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              {t.centerTitle}
            </strong>
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              {/* You Pay Input Area */}
              <div className="bg-slate-50 dark:bg-[#1C1D22] rounded-2xl p-4 border border-slate-200 dark:border-transparent hover:border-slate-300 dark:hover:border-white/5 group transition-colors">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-500 dark:text-gray-400 font-medium">You Pay</span>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    className="bg-transparent text-3xl font-semibold outline-none w-full text-slate-900 dark:text-white"
                  />
                  {direction === 't22_to_spl' ? <T22Badge /> : <SPLBadge />}
                </div>
              </div>

              {/* Swap Toggle Button */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={() => setDirection((d) => (d === 't22_to_spl' ? 'spl_to_t22' : 't22_to_spl'))}
                  className="bg-white dark:bg-[#1C1D22] border-[4px] border-slate-100 dark:border-[#16171B] p-2 rounded-xl text-slate-400 hover:text-black dark:hover:text-white shadow-sm transition-all"
                >
                  <ArrowDown
                    className={`w-5 h-5 transition-transform duration-300 ${direction === 'spl_to_t22' ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {/* You Receive Output Area */}
              <div className="bg-slate-50 dark:bg-[#1C1D22] rounded-2xl p-4 mt-1 border border-slate-200 dark:border-transparent">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-500 dark:text-gray-400 font-medium">You Receive</span>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={userReceives > 0 ? userReceives.toFixed(4) : ''}
                    readOnly
                    className="bg-transparent text-3xl font-semibold outline-none w-full text-slate-900 dark:text-white"
                  />
                  {direction === 't22_to_spl' ? <SPLBadge /> : <T22Badge />}
                </div>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-black/30 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>{swapStateQuery.data ? `Fee (${(swapStateQuery.data.feeBps / 100).toFixed(1)}%)` : t.labelFee}</span>
                <span className="text-[#14F195] font-medium">{feeAmount.toFixed(4)}</span>
              </div>
            </div>

            <button
              disabled={numAmount <= 0 || isSwapping || !isWalletConnected}
              onClick={handleSwap}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center
                ${numAmount > 0 && !isSwapping && isWalletConnected ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-lg' : 'bg-slate-200 dark:bg-[#2A2B31] text-slate-400 dark:text-gray-500 cursor-not-allowed'}
              `}
            >
              {!isWalletConnected ? (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  {t.connectWallet}
                </>
              ) : (
                <>
                  {isSwapping && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {isSwapping ? 'Executing...' : t.btnSwap}
                </>
              )}
            </button>
          </div>
        </section>

        {/* RIGHT CARD (SPL Standard) */}
        <section className="bg-slate-50 dark:bg-[#141518] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1 bg-[#14F195]/10 dark:bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/20 dark:border-[#14F195]/30 rounded-full text-xs font-bold uppercase">
              {t.splBadge}
            </span>
            <strong className="text-xl text-slate-900 dark:text-white">{MOCK_DATA.splName}</strong>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1C1D22] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
              <span className="text-xs text-slate-500 block mb-1">{t.labelMint}</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-slate-700 dark:text-gray-300 truncate mr-3">
                  {MEA_SPL_MINT.toString()}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(MEA_SPL_MINT.toString())}
                  className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 hover:text-black dark:hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-3 flex items-center">
                <div className="w-1 h-4 bg-[#14F195] rounded-full mr-2"></div>
                {t.sectionExchanges}
              </div>
              <ul className="space-y-2">
                {MOCK_DATA.splExchanges.map((ex, i) => (
                  <li
                    key={i}
                    className="flex items-center bg-white dark:bg-[#1C1D22] px-4 py-3 rounded-xl border border-slate-200 dark:border-white/5 text-sm text-slate-700 dark:text-gray-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-3"></span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* --- DETAILS / VERIFICATION MODAL --- */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#141518] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl scale-in-center">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 dark:bg-[#141518]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/5 p-5 flex items-center justify-between z-10">
              <div>
                <strong className="text-xl flex items-center text-slate-900 dark:text-white">
                  <AlertCircle className="w-5 h-5 mr-2 text-[#14F195]" /> {t.detailsTitle}
                </strong>
                <span className="text-sm text-slate-500 dark:text-gray-500 mt-1 block">{t.detailsSub}</span>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* On-Chain Addresses Section */}
              <section>
                <h3 className="text-sm font-bold text-slate-400 dark:text-gray-500 mb-3 uppercase tracking-wider">
                  {t.cardAddresses}
                </h3>
                <div className="space-y-3">
                  {/* Example: Displaying Program State PDA or Vaults */}
                  <div className="bg-slate-50 dark:bg-[#1C1D22] p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">{t.rowLockVault}</span>
                      <span className="font-mono text-sm text-slate-700 dark:text-gray-300 break-all">
                        {/* You can replace this with your actual Lock Vault PDA if applicable */}
                        {MEA_SPL2022_MINT.toString()}
                      </span>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(MEA_SPL2022_MINT.toString())}
                      className="p-2 bg-white dark:bg-white/5 rounded-lg text-slate-400 hover:text-black dark:hover:text-white shadow-sm border border-slate-200 dark:border-transparent"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4 text-sm px-1">
                    <span className="text-slate-400 dark:text-gray-500">{t.rowExplorer}:</span>
                    <a
                      href={`https://explorer.solana.com/address/${programId}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#9945FF] hover:underline flex items-center"
                    >
                      Program <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              </section>

              {/* Key Verification Points */}
              <section>
                <h3 className="text-sm font-bold text-slate-400 dark:text-gray-500 mb-3 uppercase tracking-wider">
                  {t.cardKeyPoints}
                </h3>
                <div className="bg-slate-50 dark:bg-[#1C1D22] p-5 rounded-xl border border-slate-200 dark:border-white/5">
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 dark:text-gray-300 marker:text-[#14F195]">
                    <li>{t.kp1}</li>
                    <li>{t.kp2 + (swapStateQuery.data ? `${(swapStateQuery.data.feeBps / 100).toFixed(1)}%` : '') + t.kp21}</li>
                    <li>{t.kp3}</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                    <span className="text-xs text-slate-500 block mb-2">{t.labelExample}</span>
                    <div className="font-mono text-xs bg-white dark:bg-black/40 p-3 rounded-lg text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/5">
                      {t.exampleText}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141518] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <strong className="text-lg text-slate-900 dark:text-white">{t.helpTitle}</strong>
              <X
                onClick={() => setShowHelpModal(false)}
                className="w-5 h-5 cursor-pointer text-slate-400 hover:text-black dark:hover:text-white"
              />
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
              <li>{renderHTML(t.helpItem1)}</li>
              <li>{renderHTML(t.helpItem2 + (swapStateQuery.data ? `${(swapStateQuery.data.feeBps / 100).toFixed(1)}%` : '') + t.helpItem21)}</li>
              <li>{renderHTML(t.helpItem3)}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
