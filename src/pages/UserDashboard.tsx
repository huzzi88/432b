import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RetroCard } from '../components/RetroCard';
import { RetroButton } from '../components/RetroButton';
import { RetroInput } from '../components/RetroInput';
import { UserTasksTab } from '../components/UserTasksTab';
import { UserNotifications } from '../components/UserNotifications';
import { LiveClock } from '../components/LiveClock';
import { TermsModal } from '../components/TermsModal';
import { CryptoDeposit } from '../components/CryptoDeposit';
import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Gift, User, LogOut, ClipboardList, CreditCard, Shield, Trophy, BookOpen } from 'lucide-react';

type Tab = 'overview'|'invest'|'deposit'|'withdraw'|'tasks'|'history'|'competitions'|'blog'|'profile';

export const UserDashboard: React.FC<{siteLogo?: string}> = ({ siteLogo }) => {
  const { currentUser, logout, investments, refreshProfile } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  if (!currentUser) return null;

  const ai = (investments||[]).filter(i => i.userId === currentUser.id && i.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      <div className="bg-black border-b border-cyan-400/40 p-3">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            {siteLogo ? <img src={siteLogo} alt="Logo" className="h-8 w-auto object-contain" /> : null}
            <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 uppercase tracking-wider">Kepler432B</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-sm hidden sm:inline">👤 {currentUser.name}</span>
            <RetroButton variant="danger" size="sm" onClick={logout}><LogOut className="w-4 h-4" /></RetroButton>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-3 md:p-4">
        <LiveClock /><UserNotifications />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {([
            { l: 'Balance', v: currentUser.balance, c: 'cyan', I: Wallet },
            { l: 'Capital', v: currentUser.totalInvested, c: 'pink', I: ArrowDownToLine },
            { l: 'Active', v: ai.reduce((s,i)=>s+i.amount,0), c: 'purple', I: TrendingUp },
            { l: 'Earned', v: ai.reduce((s,i)=>s+i.earnedProfit,0), c: 'green', I: Gift },
            { l: 'Withdrawn', v: currentUser.totalWithdrawn, c: 'yellow', I: ArrowUpFromLine },
          ] as const).map(({l,v,c,I})=>(
            <RetroCard key={l} color={c} className="!p-3"><div className="flex items-center justify-between"><div><p className={`text-${c}-400 text-xs font-bold uppercase`}>{l}</p><p className="text-white text-lg md:text-xl font-bold">$ {v.toLocaleString()}</p></div><I className={`w-8 h-8 text-${c}-400 hidden sm:block`} /></div></RetroCard>
          ))}
        </div>
        <div className="overflow-x-auto mb-4 -mx-3 px-3">
          <div className="flex gap-2 min-w-max">
            {([
              {t:'overview' as Tab,l:'Overview'},{t:'invest' as Tab,l:'Invest',i:<TrendingUp className="w-4 h-4"/>},
              {t:'deposit' as Tab,l:'Deposit',i:<ArrowDownToLine className="w-4 h-4"/>},{t:'withdraw' as Tab,l:'Withdraw',i:<ArrowUpFromLine className="w-4 h-4"/>},
              {t:'tasks' as Tab,l:'Tasks',i:<ClipboardList className="w-4 h-4"/>},{t:'history' as Tab,l:'History',i:<CreditCard className="w-4 h-4"/>},
              {t:'competitions' as Tab,l:'Compete',i:<Trophy className="w-4 h-4"/>},{t:'blog' as Tab,l:'Blog',i:<BookOpen className="w-4 h-4"/>},
              {t:'profile' as Tab,l:'Profile',i:<User className="w-4 h-4"/>},
            ]).map(({t:tb,l,i})=>(
              <RetroButton key={tb} variant={tab===tb?'primary':'secondary'} size="sm" onClick={()=>setTab(tb)}>{i}<span className="ml-1">{l}</span></RetroButton>
            ))}
            <RetroButton variant="secondary" size="sm" onClick={()=>refreshProfile()}>↻</RetroButton>
          </div>
        </div>
        {tab==='overview'&&<OverviewTab/>}
        {tab==='invest'&&<InvestTab/>}
        {tab==='deposit'&&<DepositTab/>}
        {tab==='withdraw'&&<WithdrawTab/>}
        {tab==='tasks'&&<UserTasksTab/>}
        {tab==='history'&&<HistoryTab/>}
        {tab==='competitions'&&<CompetitionsTab/>}
        {tab==='blog'&&<BlogTab/>}
        {tab==='profile'&&<ProfileTab/>}
      </div>
    </div>
  );
};

// ─── OVERVIEW ─────────────────────────────────
const OverviewTab: React.FC = () => {
  const { currentUser, investments, refreshInvestments, apiGetCurrentROI } = useApp();
  const [dailyROI, setDailyROI] = useState(0);
  useEffect(() => { (async()=>{try{const r=await apiGetCurrentROI();setDailyROI(parseFloat(r.roi_percentage)||0);}catch{}})(); }, []);
  if (!currentUser) return null;
  const invs = (investments||[]).filter(i=>i.userId===currentUser.id);
  const active = invs.filter(i=>i.status==='active');
  const totalActive = active.reduce((s,i)=>s+i.amount,0);
  const todayEarning = (totalActive * dailyROI) / 100;

  return (
    <div className="space-y-4">
      {active.length>0&&<div className="bg-gradient-to-r from-green-900/50 to-cyan-900/50 border border-green-400/40 rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div><p className="text-green-400 text-xs font-bold uppercase">📈 Today's Earning</p><p className="text-green-400 text-2xl font-bold">${todayEarning.toFixed(4)}</p></div>
          <div className="text-right"><p className="text-gray-400 text-xs">Daily ROI</p><p className="text-cyan-400 text-lg font-bold">{dailyROI.toFixed(4)}%</p></div>
        </div>
        <p className="text-gray-500 text-xs mt-2">${totalActive.toLocaleString()} × {dailyROI}% = ${todayEarning.toFixed(4)}/day</p>
      </div>}

      <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-white uppercase">Investments</h2><RetroButton variant="secondary" size="sm" onClick={()=>refreshInvestments()}>↻</RetroButton></div>
      <RetroCard title="My Investments" color="cyan">
        {invs.length===0?<p className="text-gray-400">No investments yet.</p>:
        <div className="space-y-3">{invs.map(inv=>{
          const prog=inv.totalProfit>0?Math.min((inv.earnedProfit/inv.totalProfit)*100,100):0;
          const days=Math.max(0,Math.ceil((new Date(inv.endDate).getTime()-Date.now())/86400000));
          return(
            <div key={inv.id} className={`bg-black border rounded p-3 ${inv.status==='active'?'border-cyan-400/40':inv.status==='pooled'?'border-yellow-400/40':inv.status==='pending'?'border-yellow-400/40':inv.status==='completed'?'border-green-400/40':'border-red-400/40'}`}>
              <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                <div><h3 className="text-cyan-400 font-bold">{inv.productName||'Investment'}</h3>
                  <p className="text-gray-500 text-xs">{new Date(inv.startDate).toLocaleDateString()} → {new Date(inv.endDate).toLocaleDateString()}</p></div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${inv.status==='active'?'bg-cyan-400 text-black':inv.status==='pooled'?'bg-yellow-400 text-black':inv.status==='pending'?'bg-yellow-400 text-black':inv.status==='completed'?'bg-green-400 text-black':'bg-red-400 text-black'}`}>{inv.status.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-2">
                <div><p className="text-white font-bold">${inv.amount.toLocaleString()}</p><p className="text-gray-500">Invested</p></div>
                <div><p className="text-green-400 font-bold">${inv.earnedProfit.toFixed(2)}</p><p className="text-gray-500">Earned</p></div>
                <div><p className="text-purple-400 font-bold">${inv.totalProfit.toFixed(2)}</p><p className="text-gray-500">ROI</p></div>
                <div><p className="text-yellow-400 font-bold">{days}d</p><p className="text-gray-500">Left</p></div>
              </div>
              {inv.status==='active'&&<><div className="w-full bg-gray-700 h-1.5 rounded"><div className="h-full bg-cyan-400 rounded" style={{width:`${prog}%`}}/></div><p className="text-gray-500 text-xs text-right mt-1">{prog.toFixed(0)}%</p></>}
              {inv.status==='pooled'&&<p className="text-yellow-400 text-xs">⏳ Pooled — waiting for pool to fill</p>}
            </div>
          );
        })}</div>}
      </RetroCard>
      <RetroCard title="🔗 Referral Program" color="purple">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-black border border-purple-400/40 rounded p-2 text-center"><p className="text-purple-400 text-xs">Code</p><p className="text-white font-bold text-sm">{currentUser.referralCode}</p></div>
          <div className="bg-black border border-cyan-400/40 rounded p-2 text-center"><p className="text-cyan-400 text-xs">Count</p><p className="text-white font-bold text-sm">{currentUser.referralCount}</p></div>
          <div className="bg-black border border-green-400/40 rounded p-2 text-center"><p className="text-green-400 text-xs">Earned</p><p className="text-white font-bold text-sm">${(currentUser.referralEarnings||0).toLocaleString()}</p></div>
        </div>
        {/* Referral Link with Copy/Share */}
        <div className="bg-black border border-yellow-400/40 rounded p-3">
          <p className="text-yellow-400 text-xs font-bold mb-2">📤 Your Referral Link</p>
          <div className="flex gap-2">
            <input type="text" readOnly value={`${window.location.origin}?ref=${currentUser.referralCode}`}
              className="flex-1 bg-gray-900 border border-gray-700 rounded text-white px-2 py-1.5 font-mono text-xs"/>
            <RetroButton variant="primary" size="sm" onClick={() => {navigator.clipboard.writeText(`${window.location.origin}?ref=${currentUser.referralCode}`);navigator.clipboard.writeText(`Join Kepler432B and earn with me! Use my referral code: ${currentUser.referralCode}\n${window.location.origin}?ref=${currentUser.referralCode}`);}}>
              📋 Copy
            </RetroButton>
            <RetroButton variant="secondary" size="sm" onClick={() => {
              const text = `Join Kepler432B! Use my referral code: ${currentUser.referralCode}\n${window.location.origin}?ref=${currentUser.referralCode}`;
              const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
              window.open(waUrl, '_blank');
            }}>📱 Share</RetroButton>
          </div>
          <p className="text-gray-500 text-xs mt-2">7% commission on Tier 1 referrals, 3% on Tier 2. Earn from every investment they make.</p>
        </div>
      </RetroCard>
    </div>
  );
};

// ─── INVEST ───────────────────────────────────
const InvestTab: React.FC = () => {
  const { currentUser, plans, slots, lots, apiInvest, refreshPlans, refreshSlots, refreshLots } = useApp();
  const [selPlan, setSelPlan] = useState<string|null>(null);
  const [selSlot, setSelSlot] = useState<string|null>(null);
  const [selLot, setSelLot] = useState<string|null>(null);
  const [investLevel, setInvestLevel] = useState<'plan'|'slot'|'lot'>('plan');
  const [amt, setAmt] = useState(''); const [msg, setMsg] = useState(''); const [ld, setLd] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  if (!currentUser) return null;

  const planSlots = (slots||[]).filter((s:any)=>s.plan_id===selPlan && s.is_active);
  const slotLots = (lots||[]).filter((l:any)=>l.slot_id===selSlot && l.is_active);

  const doInvest = async () => {
    const a = parseFloat(amt); if(isNaN(a)||a<=0){setMsg('Invalid amount');return;}
    const pid = investLevel==='plan'?selPlan:investLevel==='slot'?selPlan:selPlan;
    if(!pid){setMsg('Select a plan');return;}
    setLd(true);setMsg('');
    try{await apiInvest(pid, a, investLevel, selSlot||undefined, selLot||undefined);setMsg('✅ Submitted!');setAmt('');setSelPlan(null);setSelSlot(null);setSelLot(null);}
    catch(e:any){setMsg(e.message);}finally{setLd(false);}
  };

  const reset = () => { setSelPlan(null);setSelSlot(null);setSelLot(null);setInvestLevel('plan');setMsg(''); };

  const getPoolInfo = () => {
    const item = investLevel==='lot'?(lots||[]).find((l:any)=>l.id===selLot):investLevel==='slot'?(slots||[]).find((s:any)=>s.id===selSlot):(plans||[]).find(p=>p.id===selPlan);
    if(!item)return null;
    const pt = parseFloat((item as any).pool_target_amount||(item as any).poolTargetAmount||'0');
    const cp = parseFloat((item as any).current_pooled_amount||(item as any).currentPooledAmount||'0');
    const ps = (item as any).pool_status||(item as any).poolStatus||'open';
    return {target:pt,current:cp,status:ps};
  };

  return (
    <RetroCard title="📈 Invest" color="purple">
      <div className="flex flex-wrap gap-2 mb-3">
        <RetroButton variant="secondary" size="sm" onClick={()=>{refreshPlans();refreshSlots();refreshLots();}}>↻</RetroButton>
        {selPlan&&<RetroButton variant="danger" size="sm" onClick={reset}>✕ Reset</RetroButton>}
      </div>
      {msg&&<div className={`p-2 font-bold mb-3 border text-sm rounded ${msg.includes('✅')?'bg-green-500/20 border-green-400 text-green-400':'bg-red-500/20 border-red-400 text-red-400'}`}>{msg}</div>}
      <div className="bg-black border border-cyan-400/40 rounded p-2 mb-3 text-center"><span className="text-cyan-400 font-bold text-sm">Balance: $ {currentUser.balance.toLocaleString()}</span></div>

      {/* Breadcrumb */}
      <div className="flex gap-1 text-xs mb-3 flex-wrap">
        <button onClick={reset} className="text-cyan-400 hover:text-pink-400 font-bold cursor-pointer">🏠 Plans</button>
        {selPlan&&<><span className="text-gray-600">→</span><button onClick={()=>{setSelSlot(null);setSelLot(null);setInvestLevel('plan');}} className="text-purple-400 hover:text-pink-400 font-bold cursor-pointer">{(plans||[]).find(p=>p.id===selPlan)?.name}</button></>}
        {selSlot&&<><span className="text-gray-600">→</span><button onClick={()=>{setSelLot(null);setInvestLevel('slot');}} className="text-green-400 hover:text-pink-400 font-bold cursor-pointer">{(slots||[]).find((s:any)=>s.id===selSlot)?.name}</button></>}
        {selLot&&<><span className="text-gray-600">→</span><span className="text-yellow-400 font-bold">{(lots||[]).find((l:any)=>l.id===selLot)?.name}</span></>}
      </div>

      {/* Plans */}
      {!selPlan&&<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {(plans||[]).filter(p=>p.isActive).map(p=>(
          <div key={p.id} className="bg-black border border-purple-400/40 rounded p-3 cursor-pointer hover:border-pink-400" onClick={()=>{setSelPlan(p.id);setInvestLevel('plan');}}>
            <h3 className="text-purple-400 font-bold">{p.name}</h3><p className="text-gray-400 text-xs">{p.description}</p>
            <div className="grid grid-cols-3 gap-1 mt-2 text-center text-xs">
              <div><p className="text-green-400 font-bold">{p.roiPercentage}%</p><p className="text-gray-500">ROI</p></div>
              <div><p className="text-purple-400 font-bold">{p.durationDays}d</p><p className="text-gray-500">Days</p></div>
              <div><p className="text-yellow-400 font-bold">${p.minAmount}-${p.maxAmount}</p><p className="text-gray-500">Range</p></div>
            </div>
            {(p as any).poolTargetAmount>0&&<p className="text-yellow-400 text-xs mt-1">🎯 Pool: ${(p as any).currentPooledAmount||0}/${(p as any).poolTargetAmount} ({((p as any).poolStatus||'open')})</p>}
          </div>
        ))}
      </div>}

      {/* Slots */}
      {selPlan&&!selSlot&&<>
        {planSlots.length>0&&<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {planSlots.map((s:any)=>(
            <div key={s.id} className="bg-black border border-green-400/40 rounded p-3 cursor-pointer hover:border-pink-400" onClick={()=>{setSelSlot(s.id);setInvestLevel('slot');}}>
              <h3 className="text-green-400 font-bold">{s.name}</h3>
              <div className="grid grid-cols-2 gap-1 mt-1 text-center text-xs">
                <div><p className="text-green-400 font-bold">{parseFloat(s.roi_percentage)}%</p><p className="text-gray-500">ROI</p></div>
                <div><p className="text-purple-400 font-bold">{s.duration_days}d</p><p className="text-gray-500">Days</p></div>
              </div>
              {parseFloat(s.pool_target_amount)>0&&<p className="text-yellow-400 text-xs mt-1">🎯 Pool: ${parseFloat(s.current_pooled_amount||0)}/${parseFloat(s.pool_target_amount)} ({s.pool_status||'open'})</p>}
            </div>
          ))}
        </div>}
      </>}

      {/* Lots */}
      {selSlot&&!selLot&&<>
        {slotLots.length>0&&<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {slotLots.map((l:any)=>(
            <div key={l.id} className="bg-black border border-yellow-400/40 rounded p-3 cursor-pointer hover:border-pink-400" onClick={()=>{setSelLot(l.id);setInvestLevel('lot');}}>
              <h3 className="text-yellow-400 font-bold">{l.name}</h3>
              <div className="grid grid-cols-2 gap-1 mt-1 text-center text-xs">
                <div><p className="text-green-400 font-bold">{parseFloat(l.roi_percentage)}%</p><p className="text-gray-500">ROI</p></div>
                <div><p className="text-purple-400 font-bold">${parseFloat(l.lot_size).toLocaleString()}</p><p className="text-gray-500">Size</p></div>
              </div>
              <p className="text-gray-500 text-xs mt-1">{l.current_persons}/{l.max_persons} persons</p>
            </div>
          ))}
        </div>}
      </>}

      {/* Invest Form */}
      {selPlan&&<div className="bg-black border border-cyan-400/40 rounded p-3 space-y-2">
        <p className="text-cyan-400 font-bold text-sm">Level: <span className="text-pink-400 uppercase">{investLevel}</span></p>
        {(()=>{const pi=getPoolInfo();
          if(pi&&pi.target>0){const pct=Math.min((pi.current/pi.target)*100,100);
            return(<div className="bg-yellow-900/30 border border-yellow-400/40 rounded p-2">
              <p className="text-yellow-400 text-xs font-bold mb-1">📊 Pool: {pi.status==='started'?'✅ STARTED':pi.status==='full'?'✅ FULL':'⏳ FILLING'}</p>
              <div className="w-full bg-gray-700 h-2 rounded"><div className="h-full bg-yellow-400 rounded" style={{width:`${pct}%`}}/></div>
              <p className="text-gray-400 text-xs mt-1">${pi.current.toLocaleString()} / ${pi.target.toLocaleString()} ({pct.toFixed(0)}%)</p>
            </div>);
          }
          return <p className="text-green-400 text-xs">✅ Instant activation — daily returns start immediately.</p>;
        })()}
        <div className="flex gap-2 flex-wrap">
          <RetroInput value={amt} onChange={e=>setAmt(e.target.value)} type="number" placeholder="Amount ($)" className="flex-1 min-w-[120px]"/>
          <RetroButton variant="success" onClick={()=>{if(parseFloat(amt)>0)setShowTerms(true);else setMsg('Enter amount first');}} disabled={ld}>{ld?'...':'Invest'}</RetroButton>
        </div>
      </div>}

      {showTerms&&parseFloat(amt)>0&&<TermsModal
        planName={investLevel==='lot'?(lots||[]).find((l:any)=>l.id===selLot)?.name||'Lot':investLevel==='slot'?(slots||[]).find((s:any)=>s.id===selSlot)?.name||'Slot':(plans||[]).find(p=>p.id===selPlan)?.name||'Plan'}
        amount={parseFloat(amt)}
        onAccept={async()=>{setShowTerms(false);await doInvest();}}
        onDeny={()=>setShowTerms(false)}
      />}
    </RetroCard>
  );
};

// ─── DEPOSIT ──────────────────────────────────
const DepositTab: React.FC = () => {
  const { currentUser, paymentGateways, apiDeposit, apiConvertCurrency, refreshProfile } = useApp();
  const [depositMode, setDepositMode] = useState<'bank'|'crypto'>('bank');
  const [amt, setAmt] = useState(''); const [m, setM] = useState(''); const [trxId, setTrxId] = useState('');
  const [chain, setChain] = useState(''); const [txHash, setTxHash] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [pkrVal, setPkrVal] = useState<number|null>(null);
  const [msg, setMsg] = useState(''); const [ld, setLd] = useState(false);
  if (!currentUser) return null;

  useEffect(() => {
    const a = parseFloat(amt); if(isNaN(a)||a<=0){setPkrVal(null);return;}
    const t=setTimeout(async()=>{try{const r=await apiConvertCurrency('USD','PKR',a);setPkrVal(r.converted);}catch{setPkrVal(a*278.5);}},500);
    return()=>clearTimeout(t);
  }, [amt]);

  const selGw = (paymentGateways||[]).find(g=>g.name===m);
  const isCrypto = selGw?.type === 'crypto';

  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f)return;
    if(!['image/jpeg','image/png'].includes(f.type)){setMsg('Only JPG/PNG');return;}
    if(f.size>5*1024*1024){setMsg('Max 5MB');return;}
    const r=new FileReader();r.onload=()=>{setProofImage(r.result as string);setMsg('');};r.readAsDataURL(f);
  };

  const go = async () => {
    setMsg('');
    const a=parseFloat(amt);
    if(isNaN(a)||a<=0){setMsg('Invalid amount');return;}
    if(!m){setMsg('Select method');return;}
    if(!proofImage){setMsg('Receipt screenshot is required');return;}
    // TRX ID is optional — use empty string if not provided
    const tid = isCrypto ? txHash.trim() : trxId.trim();
    setLd(true);
    try {
      await apiDeposit(a, m, tid || '', proofImage, isCrypto ? chain : undefined, isCrypto ? txHash : undefined);
      setMsg('✅ Submitted! Awaiting admin approval.');
      setAmt(''); setM(''); setTrxId(''); setChain(''); setTxHash(''); setProofImage('');
    } catch(e:any) { setMsg(e.message); }
    finally { setLd(false); }
  };

  return (
    <RetroCard title="💰 Deposit" color="green">
      <div className="flex gap-2 mb-3">
        <button onClick={()=>setDepositMode('bank')} className={`flex-1 p-2 border rounded text-center cursor-pointer text-sm font-bold ${depositMode==='bank'?'border-green-400 bg-green-400/10 text-green-400':'border-gray-700 text-gray-400'}`}>🏦 Bank / Mobile</button>
        <button onClick={()=>setDepositMode('crypto')} className={`flex-1 p-2 border rounded text-center cursor-pointer text-sm font-bold ${depositMode==='crypto'?'border-cyan-400 bg-cyan-400/10 text-cyan-400':'border-gray-700 text-gray-400'}`}>🔗 Crypto</button>
      </div>

      {depositMode==='crypto'&&<CryptoDeposit masterWallet={(paymentGateways||[]).find(g=>g.type==='crypto')?.walletAddress} onSuccess={()=>{refreshProfile();setMsg('✅ Crypto deposit processed!');}} />}

      {depositMode==='bank'&&(<>
        {msg&&<div className={`p-2 font-bold mb-3 border text-sm rounded ${msg.includes('✅')?'bg-green-500/20 border-green-400 text-green-400':'bg-red-500/20 border-red-400 text-red-400'}`}>{msg}</div>}
        <div className="space-y-3">
          <RetroInput label="Amount (USD $)" type="number" value={amt} onChange={e=>setAmt(e.target.value)}/>
          {pkrVal!==null&&<div className="bg-black border border-yellow-400/40 rounded p-2"><p className="text-yellow-400 font-bold text-sm">≈ PKR {pkrVal.toLocaleString(undefined,{maximumFractionDigits:2})}</p></div>}
          <div><label className="block text-cyan-400 font-bold mb-1.5 uppercase text-xs">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">{(paymentGateways||[]).filter(g=>g.isActive&&g.type!=='crypto').map(g=>(
              <button key={g.id} onClick={()=>setM(g.name)} className={`bg-black border rounded p-2 text-left cursor-pointer ${m===g.name?'border-green-400':'border-gray-700'}`}>
                {g.image?<img src={g.image} alt="" className="w-6 h-6 object-contain inline mr-1"/>:<span className="text-xl">{g.icon}</span>}
                <p className="text-white font-bold text-xs">{g.name}</p>
              </button>
            ))}</div>
          </div>
          {m&&selGw?.accountDetails&&<div className="bg-gray-900 border border-gray-700 rounded p-3"><p className="text-gray-400 text-xs mb-1">📤 Send to:</p><p className="text-white text-sm">{selGw.accountDetails}</p></div>}
          {m&&<RetroInput label="Transaction/Reference ID (Optional)" value={trxId} onChange={e=>setTrxId(e.target.value)} placeholder="Bank TRX ID or reference number (optional)"/>}
          {m&&<div><label className="block text-cyan-400 font-bold mb-1.5 uppercase text-xs">Receipt Screenshot * (JPG/PNG) — Required</label>
            <input type="file" accept="image/jpeg,image/png" onChange={handleFile} className="w-full bg-black border border-pink-400/60 rounded text-white px-3 py-1.5 text-sm file:mr-3 file:bg-pink-400 file:text-black file:border-0 file:font-bold file:px-3 file:py-1 file:cursor-pointer file:rounded"/>
            {proofImage&&<img src={proofImage} alt="Receipt" className="mt-2 max-h-32 border border-green-400/40 rounded"/>}
          </div>}
          <RetroButton variant="success" size="lg" className="w-full" onClick={go} disabled={ld}>{ld?'Submitting...':'Submit Deposit'}</RetroButton>
        </div>
      </>)}
    </RetroCard>
  );
};

// ─── WITHDRAW ─────────────────────────────────
const WithdrawTab: React.FC = () => {
  const { currentUser, paymentGateways, apiWithdraw } = useApp();
  const [amt, setAmt] = useState(''); const [m, setM] = useState(''); const [d, setD] = useState('');
  const [pin, setPin] = useState(''); const [wChain, setWChain] = useState(''); const [wAddr, setWAddr] = useState('');
  const [msg, setMsg] = useState(''); const [ld, setLd] = useState(false);
  if (!currentUser) return null;
  const kycOk = currentUser.kycStatus === 'verified';
  const selGw = (paymentGateways||[]).find(g=>g.name===m);
  const isCrypto = selGw?.type === 'crypto';

  const go = async () => {
    setMsg('');
    if(!kycOk){setMsg('KYC required. Go to Profile → Submit KYC.');return;}
    const a=parseFloat(amt);if(isNaN(a)||a<=0){setMsg('Invalid amount');return;}
    if(a>currentUser.balance){setMsg('Insufficient balance');return;}
    if(!m){setMsg('Select method');return;}
    if(!pin||pin.length<4){setMsg('Enter 4-digit PIN');return;}
    const details = isCrypto?(wAddr.trim()||d.trim()):d.trim();
    if(!details){setMsg(isCrypto?'Enter wallet address':'Enter account details');return;}
    if(isCrypto&&!wChain){setMsg('Select network');return;}
    setLd(true);try{await apiWithdraw(a,m,details,pin,isCrypto?wChain:undefined,isCrypto?wAddr:undefined);setMsg('✅ Withdrawal submitted!');setAmt('');setM('');setD('');setPin('');setWChain('');setWAddr('');}catch(e:any){setMsg(e.message);}finally{setLd(false);}
  };

  return (
    <RetroCard title="💸 Withdraw" color="yellow">
      <div className="bg-black border border-cyan-400/40 rounded p-3 mb-3 text-center"><p className="text-cyan-400 text-sm">Balance</p><p className="text-white text-2xl font-bold">$ {currentUser.balance.toLocaleString()}</p></div>
      {!kycOk&&<div className="bg-red-900/30 border border-red-400/40 rounded p-3 mb-3"><p className="text-red-400 font-bold text-sm">⚠️ KYC required.</p></div>}
      {msg&&<div className={`p-2 font-bold mb-3 border text-sm rounded ${msg.includes('✅')?'bg-green-500/20 border-green-400 text-green-400':'bg-red-500/20 border-red-400 text-red-400'}`}>{msg}</div>}
      <div className="space-y-3">
        <RetroInput label="Amount ($)" type="number" value={amt} onChange={e=>setAmt(e.target.value)}/>
        <div><label className="block text-cyan-400 font-bold mb-1.5 uppercase text-xs">Withdraw To</label>
          <div className="grid grid-cols-2 gap-2">{(paymentGateways||[]).filter(g=>g.isActive).map(g=>(
            <button key={g.id} onClick={()=>{setM(g.name);if(g.type!=='crypto'){setWChain('');setWAddr('');}else if(currentUser.walletAddress)setWAddr(currentUser.walletAddress);}}
              className={`bg-black border rounded p-2 text-left cursor-pointer ${m===g.name?'border-yellow-400':'border-gray-700'}`}>
              {g.image?<img src={g.image} alt="" className="w-6 h-6 object-contain inline mr-1"/>:<span className="text-xl">{g.icon}</span>}
              <p className="text-white font-bold text-xs">{g.name}</p>
            </button>
          ))}</div>
        </div>
        {isCrypto&&<>
          <div><label className="block text-cyan-400 font-bold mb-1.5 uppercase text-xs">Network *</label>
            <select value={wChain} onChange={e=>setWChain(e.target.value)} className="w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-1.5 font-mono text-sm">
              <option value="">Select</option><option value="BSC">BSC</option><option value="Ethereum">Ethereum</option><option value="Polygon">Polygon</option><option value="Tron">Tron</option><option value="Base">Base</option>
            </select></div>
          <RetroInput label="Wallet Address *" value={wAddr} onChange={e=>setWAddr(e.target.value)} placeholder="0x... or T..."/>
          {currentUser.walletAddress&&!wAddr&&<button onClick={()=>setWAddr(currentUser.walletAddress||'')} className="text-cyan-400 text-xs underline cursor-pointer">Use: {currentUser.walletAddress.slice(0,10)}...</button>}
        </>}
        {!isCrypto&&m&&<RetroInput label="Account Details *" value={d} onChange={e=>setD(e.target.value)} placeholder="Account number, IBAN..."/>}
        <RetroInput label="PIN / Verification *" type="password" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="••••" maxLength={4}/>
        <RetroButton variant="warning" size="lg" className="w-full" onClick={go} disabled={ld||!kycOk}>{ld?'...':'Submit Withdrawal'}</RetroButton>
        {isCrypto&&<p className="text-gray-500 text-xs">Crypto withdrawals processed manually by admin.</p>}
      </div>
    </RetroCard>
  );
};

// ─── COMPETITIONS ─────────────────────────────
const CompetitionsTab: React.FC = () => {
  const { currentUser, competitions, competitionEntries, apiJoinCompetition } = useApp();
  if (!currentUser) return null;
  const active = (competitions||[]).filter((c:any)=>c.is_active);
  return (
    <RetroCard title="🏆 Competitions" color="yellow">
      {active.length===0?<p className="text-gray-400 text-center py-8">No active competitions.</p>:
      <div className="space-y-3">{active.map((c:any)=>{
        const myEntry = (competitionEntries||[]).find((e:any)=>e.competition_id===c.id&&e.user_id===currentUser.id);
        const daysLeft = c.end_date ? Math.max(0,Math.ceil((new Date(c.end_date).getTime()-Date.now())/86400000)) : '∞';
        return(
          <div key={c.id} className="bg-black border border-yellow-400/40 rounded p-3">
            <h3 className="text-yellow-400 font-bold text-lg mb-1">🏆 {c.title}</h3>
            <p className="text-gray-400 text-sm mb-2">{c.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs mb-2">
              {c.target_referrals>0&&<div className="bg-gray-900 border border-gray-700 rounded p-2"><p className="text-cyan-400 font-bold">{c.target_referrals}</p><p className="text-gray-500">Referrals</p></div>}
              {parseFloat(c.target_deposit_amount)>0&&<div className="bg-gray-900 border border-gray-700 rounded p-2"><p className="text-green-400 font-bold">${parseFloat(c.target_deposit_amount).toLocaleString()}</p><p className="text-gray-500">Deposits</p></div>}
              {parseFloat(c.target_invest_amount)>0&&<div className="bg-gray-900 border border-gray-700 rounded p-2"><p className="text-purple-400 font-bold">${parseFloat(c.target_invest_amount).toLocaleString()}</p><p className="text-gray-500">Invest</p></div>}
              <div className="bg-gray-900 border border-gray-700 rounded p-2"><p className="text-yellow-400 font-bold">{daysLeft}d</p><p className="text-gray-500">Left</p></div>
            </div>
            {c.prize_description&&<p className="text-green-400 text-sm mb-2">🎁 {c.prize_description}</p>}
            {myEntry?<div className="bg-green-900/30 border border-green-400/40 rounded p-2"><p className="text-green-400 font-bold text-sm">✅ Joined! {myEntry.is_completed?'🏆 COMPLETED!':'In progress...'}</p></div>:
              <RetroButton variant="success" className="w-full" onClick={()=>apiJoinCompetition(c.id)}>Join Competition</RetroButton>}
          </div>
        );
      })}</div>}
    </RetroCard>
  );
};

// ─── HISTORY ──────────────────────────────────
const HistoryTab: React.FC = () => {
  const { transactions, refreshTransactions } = useApp();
  const [filter, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('all');
  const myTxns = (transactions||[]).filter(t=>filter==='all'||t.status===filter).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());

  return (
    <RetroCard title="📋 History" color="cyan">
      <div className="flex flex-wrap gap-2 mb-3">
        {(['all','pending','approved','rejected'] as const).map(f=>(
          <RetroButton key={f} variant={filter===f?'primary':'secondary'} size="sm" onClick={()=>setFilter(f)}>{f}</RetroButton>
        ))}
        <RetroButton variant="secondary" size="sm" onClick={()=>refreshTransactions()}>↻</RetroButton>
      </div>
      {myTxns.length===0?<p className="text-gray-400 text-center py-8">No transactions.</p>:
      <div className="space-y-2 max-h-[500px] overflow-y-auto">{myTxns.map(t=>(
        <div key={t.id} className={`bg-black border rounded p-3 ${t.status==='pending'?'border-yellow-400/60':t.status==='approved'?'border-green-400/60':'border-red-400/60'}`}>
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-lg ${t.type==='deposit'?'text-green-400':t.type==='withdrawal'?'text-yellow-400':t.type==='profit'?'text-purple-400':t.type==='investment'?'text-cyan-400':'text-pink-400'}`}>
                  {t.type==='deposit'?'💰':t.type==='withdrawal'?'💸':t.type==='profit'?'🎁':t.type==='investment'?'📈':'⭐'}
                </span>
                <span className="text-white font-bold capitalize text-sm">{t.type}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${t.status==='approved'?'bg-green-400 text-black':t.status==='pending'?'bg-yellow-400 text-black':'bg-red-400 text-black'}`}>{t.status.toUpperCase()}</span>
              </div>
              {t.paymentMethod&&<p className="text-cyan-400 text-xs mt-1">💳 {t.paymentMethod}</p>}
              {t.chain&&<p className="text-purple-400 text-xs">⛓️ {t.chain}</p>}
              {t.walletFrom&&<p className="text-purple-400 text-xs font-mono">👛 {t.type==='withdrawal'?'To':'From'}: {t.walletFrom}</p>}
              {t.txHash&&<p className="text-yellow-400 text-xs font-mono truncate">🔗 {t.txHash}</p>}
              {t.paymentDetails&&<p className="text-gray-500 text-xs">📋 {t.paymentDetails}</p>}
              {t.proofImage&&<img src={t.proofImage} alt="Receipt" className="mt-1 max-h-20 border border-pink-400/40 rounded"/>}
              {t.notes&&<p className="text-gray-400 text-xs mt-0.5">📝 {t.notes}</p>}
              <p className="text-gray-600 text-xs mt-1">{new Date(t.date).toLocaleString()}</p>
            </div>
            <p className={`text-xl font-bold ${t.type==='withdrawal'?'text-yellow-400':'text-green-400'}`}>{t.type==='withdrawal'?'-':'+'} $ {t.amount.toLocaleString()}</p>
          </div>
        </div>
      ))}</div>}
      <div className="mt-3 bg-gray-900 border border-gray-700 rounded p-2"><p className="text-gray-400 text-xs">💡 Crypto deposits verify via blockchain. Bank deposits need admin approval.</p></div>
    </RetroCard>
  );
};

// ─── PROFILE ──────────────────────────────────
const ProfileTab: React.FC = () => {
  const { currentUser, apiUpdateProfile, apiSubmitKYC, refreshProfile } = useApp();
  const [phone, setPhone] = useState(currentUser?.phone||'');
  const [city, setCity] = useState(currentUser?.city||'');
  const [country, setCountry] = useState(currentUser?.country||'');
  const [cnic, setCnic] = useState('');
  const [cnicImage, setCnicImage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [msg, setMsg] = useState(''); const [ld, setLd] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  if (!currentUser) return null;

  const save = async () => { setLd(true);setMsg(''); try{await apiUpdateProfile({phone,city,country});setMsg('✅ Saved!');await refreshProfile();}catch(e:any){setMsg(e.message);}finally{setLd(false);} };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/jpg'].includes(file.type)) { setMsg('Only JPG/PNG allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg('Image max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setCnicImage(reader.result as string); setMsg(''); };
    reader.readAsDataURL(file);
  };

  // Camera capture handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setMsg('');
      }
    } catch (err: any) {
      setMsg('Camera access denied. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCnicImage(dataUrl);
    stopCamera();
    setMsg('✅ Photo captured!');
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const submitKyc = async () => {
    if (!cnic.trim()) { setMsg('Enter CNIC number'); return; }
    if (!cnicImage) { setMsg('CNIC front image is required (upload or take photo)'); return; }
    setLd(true); setMsg('');
    try {
      await apiSubmitKYC(cnic, cnicImage);
      setMsg('✅ KYC submitted! Waiting for admin review.');
      setCnic('');
      setCnicImage('');
      await refreshProfile();
    } catch (e: any) { setMsg(e.message); }
    finally { setLd(false); }
  };

  return (
    <div className="space-y-4">
      {msg && <div className={`p-2 font-bold border text-sm rounded ${msg.includes('✅') ? 'bg-green-500/20 border-green-400 text-green-400' : 'bg-red-500/20 border-red-400 text-red-400'}`}>{msg}</div>}

      {/* Profile Info */}
      <RetroCard title="👤 Profile" color="cyan">
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div><p className="text-cyan-400 text-xs uppercase">Name</p><p className="text-white font-bold">{currentUser.name}</p></div>
          <div><p className="text-cyan-400 text-xs uppercase">Email</p><p className="text-white font-bold">{currentUser.email}</p></div>
          <div><p className="text-cyan-400 text-xs uppercase">Joined</p><p className="text-white font-bold">{new Date(currentUser.joinedDate).toLocaleDateString()}</p></div>
          <div><p className="text-cyan-400 text-xs uppercase">KYC</p><p className={`font-bold ${currentUser.kycStatus === 'verified' ? 'text-green-400' : currentUser.kycStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>{currentUser.kycStatus.toUpperCase()}</p></div>
        </div>
        {currentUser.walletAddress && (
          <div className="bg-black border border-purple-400/40 rounded p-2 mb-3">
            <p className="text-purple-400 text-xs font-bold">🔗 Wallet</p>
            <p className="text-white font-mono text-xs break-all">{currentUser.walletAddress}</p>
          </div>
        )}
        <div className="space-y-3">
          <RetroInput label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 3XX XXXXXXX" />
          <RetroInput label="City" value={city} onChange={e => setCity(e.target.value)} placeholder="Your city" />
          <RetroInput label="Country" value={country} onChange={e => setCountry(e.target.value)} placeholder="Pakistan" />
          <RetroButton variant="success" onClick={save} disabled={ld}>{ld ? 'Saving...' : 'Save Profile'}</RetroButton>
          <p className="text-gray-500 text-xs">Phone required for forgot password recovery.</p>
        </div>
      </RetroCard>

      {/* KYC Section */}
      <RetroCard
        title={`🪪 KYC Verification — ${currentUser.kycStatus.toUpperCase()}`}
        color={currentUser.kycStatus === 'verified' ? 'green' : currentUser.kycStatus === 'pending' ? 'yellow' : 'pink'}
      >
        {currentUser.kycStatus === 'verified' ? (
          <p className="text-green-400 font-bold">✅ Verified. You can withdraw funds.</p>
        ) : currentUser.kycStatus === 'pending' ? (
          <div className="space-y-2">
            <p className="text-yellow-400 font-bold">⏳ Under review. Please wait for admin approval.</p>
            <p className="text-gray-400 text-xs">You will be notified once your CNIC is verified.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Submit your CNIC number and front image for verification. Required before you can withdraw funds.</p>

            {/* CNIC Number */}
            <RetroInput label="CNIC Number *" value={cnic} onChange={e => setCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X" />

            {/* CNIC Front Image Upload */}
            <div>
              <label className="block text-cyan-400 font-bold mb-1.5 uppercase tracking-wider text-xs">
                CNIC Front Image * (Required)
              </label>

              {/* Upload from gallery */}
              <div className="mb-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileUpload}
                  className="w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-2 font-mono text-sm file:mr-3 file:bg-cyan-400 file:text-black file:border-0 file:font-bold file:px-3 file:py-1 file:cursor-pointer file:rounded"
                />
                <p className="text-gray-500 text-xs mt-1">JPG or PNG, max 5MB</p>
              </div>

              {/* Camera capture */}
              <div className="mb-3">
                <p className="text-gray-400 text-xs mb-2">Or take a live photo with your camera:</p>
                {!cameraActive ? (
                  <RetroButton variant="secondary" size="sm" onClick={startCamera}>
                    📷 Open Camera
                  </RetroButton>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-black border border-cyan-400/40 rounded overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2">
                      <RetroButton variant="success" size="sm" onClick={capturePhoto} className="flex-1">
                        📸 Capture
                      </RetroButton>
                      <RetroButton variant="danger" size="sm" onClick={stopCamera} className="flex-1">
                        ✕ Cancel
                      </RetroButton>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              {cnicImage && (
                <div className="mt-2">
                  <p className="text-green-400 text-xs font-bold mb-1">✅ CNIC Image Ready</p>
                  <img
                    src={cnicImage}
                    alt="CNIC Front"
                    className="max-h-40 border-2 border-green-400/40 rounded object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setCnicImage('')}
                    className="text-red-400 text-xs mt-1 cursor-pointer hover:text-red-300"
                  >
                    ✕ Remove image
                  </button>
                </div>
              )}
            </div>

            <RetroButton
              variant="success"
              onClick={submitKyc}
              disabled={ld || !cnicImage}
              className="w-full"
            >
              <Shield className="w-4 h-4 inline mr-1" />
              {ld ? 'Submitting...' : 'Submit KYC'}
            </RetroButton>

            <p className="text-gray-500 text-xs">
              ⚠️ CNIC front image is compulsory. Admin will review and approve your verification.
            </p>
          </div>
        )}
      </RetroCard>
    </div>
  );
};

// ─── BLOG ───────────────────────────────────
const BlogTab: React.FC = () => {
  const { blogCategories, blogPosts } = useApp();
  const [selCat, setSelCat] = useState<string|null>(null);
  const [search, setSearch] = useState('');
  const [expandedPost, setExpandedPost] = useState<string|null>(null);

  const filtered = (blogPosts||[]).filter((p:any) => {
    if (selCat && p.category_id !== selCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.content.toLowerCase().includes(q)) return false;
    }
    return p.is_published;
  });

  return (
    <RetroCard title="📰 Blog & News" color="pink">
      {/* Search */}
      <div className="mb-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..."
          className="w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-pink-400"/>
      </div>

      {/* Category Filter */}
      <div className="overflow-x-auto mb-4 -mx-3 px-3">
        <div className="flex gap-2 min-w-max">
          <button onClick={()=>setSelCat(null)} className={`px-3 py-1 rounded text-xs font-bold border ${!selCat ? 'bg-pink-400 text-black border-pink-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}>All</button>
          {(blogCategories||[]).map((c:any) => (
            <button key={c.id} onClick={()=>setSelCat(c.id)} className={`px-3 py-1 rounded text-xs font-bold border ${selCat===c.id ? 'bg-pink-400 text-black border-pink-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No posts found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p:any) => (
            <div key={p.id} className="bg-black border border-pink-400/40 rounded p-4">
              {p.image && <img src={p.image} alt="" className="w-full h-40 object-cover rounded mb-3 border border-gray-700"/>}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {p.category_name && <span className="bg-purple-900 text-purple-400 text-xs px-2 py-0.5 rounded">{p.category_name}</span>}
                <span className="text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {expandedPost === p.id ? p.content : (p.content.length > 300 ? p.content.substring(0, 300) + '...' : p.content)}
              </p>
              {p.content.length > 300 && (
                <button onClick={()=>setExpandedPost(expandedPost === p.id ? null : p.id)}
                  className="text-cyan-400 text-xs font-bold mt-2 cursor-pointer hover:text-pink-400">
                  {expandedPost === p.id ? 'Show Less ↑' : 'Read More →'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </RetroCard>
  );
};