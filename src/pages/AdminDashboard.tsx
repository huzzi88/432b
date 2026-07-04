import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RetroCard } from '../components/RetroCard';
import { RetroButton } from '../components/RetroButton';
import { RetroInput } from '../components/RetroInput';
import { TasksTab } from '../components/TasksTab';
import { LiveClock } from '../components/LiveClock';
import { Users, TrendingUp, Wallet, LogOut, Bell, CreditCard, BarChart3, ClipboardList, PackagePlus, Shield, Trophy, Database, BookOpen, Percent, Settings, Bitcoin, GitBranch } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
type Tab = 'overview'|'users'|'transactions'|'investments'|'plans'|'kyc'|'roi'|'tasks'|'competitions'|'blog'|'csv'|'notifications'|'gateways'|'crypto'|'referrals'|'site';

export const AdminDashboard: React.FC<{siteLogo?: string}> = ({ siteLogo }) => {
  const { currentUser, logout, users, investments, transactions, kycDocs, refreshAll } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  if (!currentUser || !currentUser.isAdmin) return null;

  const totalUsers = (users||[]).filter(u=>!u.isAdmin).length;
  const totalBalance = (users||[]).reduce((s,u)=>s+u.balance,0);
  const pendingTxns = (transactions||[]).filter(t=>t.status==='pending').length;
  const pendingInvs = (investments||[]).filter(i=>i.status==='pending').length;
  const pendingKyc = (kycDocs||[]).filter((k:any)=>k.status==='pending').length;

  const tabs: {id:Tab,l:string,icon:React.ReactNode,badge?:number}[] = [
    {id:'overview',l:'Overview',icon:<BarChart3 className="w-4 h-4"/>},
    {id:'users',l:'Users',icon:<Users className="w-4 h-4"/>},
    {id:'transactions',l:'Txns',icon:<CreditCard className="w-4 h-4"/>,badge:pendingTxns},
    {id:'investments',l:'Invest',icon:<TrendingUp className="w-4 h-4"/>,badge:pendingInvs},
    {id:'plans',l:'Plans',icon:<PackagePlus className="w-4 h-4"/>},
    {id:'kyc',l:'KYC',icon:<Shield className="w-4 h-4"/>,badge:pendingKyc},
    {id:'roi',l:'ROI',icon:<Percent className="w-4 h-4"/>},
    {id:'tasks',l:'Tasks',icon:<ClipboardList className="w-4 h-4"/>},
    {id:'competitions',l:'Compete',icon:<Trophy className="w-4 h-4"/>},
    {id:'blog',l:'Blog',icon:<BookOpen className="w-4 h-4"/>},
    {id:'csv',l:'CSV',icon:<Database className="w-4 h-4"/>},
    {id:'notifications',l:'Alerts',icon:<Bell className="w-4 h-4"/>},
    {id:'gateways',l:'Gateways',icon:<Wallet className="w-4 h-4"/>},
    {id:'crypto',l:'Crypto',icon:<Bitcoin className="w-4 h-4"/>},
    {id:'referrals',l:'Refs',icon:<GitBranch className="w-4 h-4"/>},
    {id:'site',l:'Site',icon:<Settings className="w-4 h-4"/>},
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      <div className="bg-black border-b border-pink-400/40 p-3">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            {siteLogo && <img src={siteLogo} alt="Logo" className="h-8 w-auto object-contain" />}
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 uppercase tracking-wider">⚡ Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pink-400 font-bold text-sm hidden sm:inline">👑 {currentUser.name}</span>
            <RetroButton variant="secondary" size="sm" onClick={()=>refreshAll()}>↻</RetroButton>
            <RetroButton variant="danger" size="sm" onClick={logout}><LogOut className="w-4 h-4"/></RetroButton>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-3 md:p-4">
        <LiveClock/>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[{l:'Users',v:totalUsers,c:'cyan'},{l:'Balance',v:`$ ${totalBalance.toLocaleString()}`,c:'green'},{l:'Pending Txns',v:pendingTxns,c:'yellow'},{l:'Pending Invest',v:pendingInvs,c:'purple'}].map(({l,v,c})=>(
            <RetroCard key={l} color={c as any} className="!p-3"><p className={`text-${c}-400 text-xs font-bold uppercase`}>{l}</p><p className="text-white text-lg font-bold">{v}</p></RetroCard>
          ))}
        </div>
        {/* Tabs — scrollable */}
        <div className="overflow-x-auto mb-4 -mx-3 px-3">
          <div className="flex gap-2 min-w-max">
            {tabs.map(t=>(
              <RetroButton key={t.id} variant={tab===t.id?'primary':'secondary'} size="sm" onClick={()=>setTab(t.id)}>
                {t.icon}<span className="ml-1">{t.l}</span>{t.badge?<span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">{t.badge}</span>:null}
              </RetroButton>
            ))}
          </div>
        </div>

        {tab==='overview'&&<OverviewContent/>}
        {tab==='users'&&<UsersTab/>}
        {tab==='transactions'&&<TransactionsTab/>}
        {tab==='investments'&&<InvestmentsTab/>}
        {tab==='plans'&&<PlansTab/>}
        {tab==='kyc'&&<KYCTab/>}
        {tab==='roi'&&<ROITab/>}
        {tab==='tasks'&&<TasksTab/>}
        {tab==='competitions'&&<CompetitionsAdminTab/>}
        {tab==='blog'&&<BlogAdminTab/>}
        {tab==='csv'&&<CSVTab/>}
        {tab==='notifications'&&<NotificationsTab/>}
        {tab==='gateways'&&<GatewaysTab/>}
        {tab==='crypto'&&<CryptoAdminTab/>}
        {tab==='referrals'&&<ReferralsTab/>}
        {tab==='site'&&<SiteSettingsTab/>}
      </div>
    </div>
  );
};

// ─── OVERVIEW ────────────────────────────────────
const OverviewContent: React.FC = () => {
  const { users, transactions, investments } = useApp();
  const txns = transactions||[];
  const invs = investments||[];

  // Financial calculations
  const totalDeposits = txns.filter(t=>t.type==='deposit'&&t.status==='approved').reduce((s,t)=>s+t.amount,0);
  const totalWithdrawals = txns.filter(t=>t.type==='withdrawal'&&t.status==='approved').reduce((s,t)=>s+t.amount,0);
  const totalProfit = txns.filter(t=>t.type==='profit').reduce((s,t)=>s+t.amount,0);
  const totalInvested = invs.filter(i=>i.status==='active').reduce((s,i)=>s+i.amount,0);
  const totalUserBalance = (users||[]).filter(u=>!u.isAdmin).reduce((s,u)=>s+u.balance,0);
  const totalInvestorEarnings = (users||[]).filter(u=>!u.isAdmin).reduce((s,u)=>s+u.totalEarnings,0);
  const platformRevenue = totalDeposits - totalWithdrawals - totalInvestorEarnings;
  const profitOrLoss = platformRevenue > 0 ? 'PROFIT' : 'LOSS';
  const pendingCount = txns.filter(t=>t.status==='pending').length;

  // Chart data - deposits vs withdrawals by type
  const barData = [
    { name: 'Deposits', amount: totalDeposits, fill: '#22c55e' },
    { name: 'Withdrawals', amount: totalWithdrawals, fill: '#eab308' },
    { name: 'Profits Paid', amount: totalProfit, fill: '#a855f7' },
    { name: 'Active Invested', amount: totalInvested, fill: '#06b6d4' },
  ];

  // Pie data
  const pieData = [
    { name: 'Platform Revenue', value: Math.max(0, platformRevenue), fill: '#22c55e' },
    { name: 'User Earnings', value: totalInvestorEarnings, fill: '#a855f7' },
    { name: 'User Balances', value: totalUserBalance, fill: '#06b6d4' },
  ];

  return (
    <div className="space-y-4">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RetroCard color="green" className="!p-3">
          <p className="text-green-400 text-xs font-bold uppercase">Total Deposits</p>
          <p className="text-white text-lg font-bold">$ {totalDeposits.toLocaleString()}</p>
        </RetroCard>
        <RetroCard color="yellow" className="!p-3">
          <p className="text-yellow-400 text-xs font-bold uppercase">Total Withdrawals</p>
          <p className="text-white text-lg font-bold">$ {totalWithdrawals.toLocaleString()}</p>
        </RetroCard>
        <RetroCard color="purple" className="!p-3">
          <p className="text-purple-400 text-xs font-bold uppercase">Profits Distributed</p>
          <p className="text-white text-lg font-bold">$ {totalProfit.toLocaleString()}</p>
        </RetroCard>
        <RetroCard color={profitOrLoss==='PROFIT'?'green':'pink'} className="!p-3">
          <p className={`text-${profitOrLoss==='PROFIT'?'green':'pink'}-400 text-xs font-bold uppercase`}>Platform {profitOrLoss}</p>
          <p className={`text-${platformRevenue >= 0 ? 'green' : 'pink'}-400 text-lg font-bold`}>{platformRevenue >= 0 ? '+':''}$ {platformRevenue.toLocaleString()}</p>
        </RetroCard>
      </div>

      {/* Second row summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <RetroCard color="cyan" className="!p-3">
          <p className="text-cyan-400 text-xs font-bold uppercase">Active Investments</p>
          <p className="text-white text-lg font-bold">$ {totalInvested.toLocaleString()}</p>
        </RetroCard>
        <RetroCard color="pink" className="!p-3">
          <p className="text-pink-400 text-xs font-bold uppercase">Total User Balances</p>
          <p className="text-white text-lg font-bold">$ {totalUserBalance.toLocaleString()}</p>
        </RetroCard>
        <RetroCard color="cyan" className="!p-3">
          <p className="text-cyan-400 text-xs font-bold uppercase">Pending Transactions</p>
          <p className="text-white text-lg font-bold">{pendingCount} awaiting review</p>
        </RetroCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <RetroCard title="📊 Financial Overview" color="cyan">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{fill:'#888',fontSize:11}} />
                <YAxis tick={{fill:'#888',fontSize:11}} />
                <Tooltip contentStyle={{backgroundColor:'#111',borderColor:'#22d3ee',borderRadius:4}} labelStyle={{color:'#22d3ee'}} />
                <Bar dataKey="amount" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </RetroCard>

        {/* Pie Chart */}
        <RetroCard title="🥧 Fund Distribution" color="purple">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name}: ${((percent||0)*100).toFixed(0)}%`}>
                  {pieData.map((_,i)=><Cell key={i} fill={pieData[i].fill}/>)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor:'#111',borderColor:'#c084fc',borderRadius:4}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </RetroCard>
      </div>

      {/* Recent Transactions */}
      <RetroCard title="📋 Recent Transactions" color="cyan">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b-4 border-cyan-400"><th className="text-left text-cyan-400 p-2">User</th><th className="text-left text-cyan-400 p-2">Type</th><th className="text-left text-cyan-400 p-2">Amount</th><th className="text-left text-cyan-400 p-2">Status</th></tr></thead><tbody>
          {[...txns].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,10).map(t=>{const u=(users||[]).find(x=>x.id===t.userId);return(
            <tr key={t.id} className="border-b border-gray-800"><td className="p-2 text-white text-xs">{u?.name||'?'}</td><td className="p-2"><span className={`font-bold text-xs ${t.type==='deposit'?'text-green-400':t.type==='withdrawal'?'text-yellow-400':'text-purple-400'}`}>{t.type}</span></td><td className="p-2 text-white font-bold text-xs">${t.amount.toLocaleString()}</td><td className="p-2"><span className={`px-1 py-0.5 text-xs font-bold ${t.status==='approved'?'bg-green-400 text-black':t.status==='pending'?'bg-yellow-400 text-black':'bg-red-400 text-black'}`}>{t.status}</span></td></tr>
          );})}
        </tbody></table></div>
      </RetroCard>
    </div>
  );
};

// ─── USERS ───────────────────────────────────────
const UsersTab: React.FC = () => {
  const { users, apiBlockUser, apiUpdateUserBalance, apiUpdateUser, refreshUsers } = useApp();
  const [search, setSearch] = useState(''); const [editId, setEditId] = useState<string|null>(null);
  const [balAmt, setBalAmt] = useState(''); const [walletEdit, setWalletEdit] = useState('');
  const [ld, setLd] = useState(false); const [showWallet, setShowWallet] = useState<string|null>(null);
  const filtered = (users||[]).filter(u=>!u.isAdmin&&(u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase())));
  const handleBal = async (id:string, type:'add'|'subtract') => { const a=parseFloat(balAmt);if(isNaN(a)||a<=0)return; setLd(true);try{await apiUpdateUserBalance(id,a,type);}catch{}finally{setLd(false);setEditId(null);setBalAmt('');} };
  const updateWallet = async (id:string) => { if(!walletEdit.trim())return; setLd(true);try{await apiUpdateUser(id,{wallet_address:walletEdit.trim()});setShowWallet(null);setWalletEdit('');}catch{}finally{setLd(false);} };
  return (
    <RetroCard title="👥 Users" color="cyan">
      <div className="flex gap-2 mb-3"><RetroInput value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="flex-1"/><RetroButton variant="secondary" size="sm" onClick={()=>refreshUsers()}>↻</RetroButton></div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">{filtered.map(u=>(
        <div key={u.id} className={`bg-black border-4 p-3 ${u.isBlocked?'border-red-400':'border-cyan-400'}`}>
          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
            <div><h3 className="text-cyan-400 font-bold text-sm">{u.name}</h3>
              <p className="text-gray-400 text-xs">{u.email}</p>
              <p className="text-gray-500 text-xs">KYC: {u.kycStatus} · Ref: {u.referralCode}</p>
              {u.walletAddress ? <p className="text-purple-400 text-xs mt-1 truncate font-mono">🔗 {u.walletAddress}</p> : <p className="text-gray-600 text-xs mt-1">No wallet connected</p>}
            </div>
            <div className="flex gap-1 flex-wrap">
              {u.walletAddress ? <RetroButton size="sm" variant="secondary" onClick={()=>{setShowWallet(showWallet===u.id?null:u.id);setWalletEdit(u.walletAddress||'');}}>✏️ Wallet</RetroButton> : <RetroButton size="sm" variant="secondary" onClick={()=>{setShowWallet(u.id);setWalletEdit('');}}>+ Link Wallet</RetroButton>}
              <RetroButton size="sm" variant={u.isBlocked?'success':'danger'} onClick={async()=>{setLd(true);try{await apiBlockUser(u.id);}catch{}finally{setLd(false);}}} disabled={ld}>{u.isBlocked?'Unblock':'Block'}</RetroButton>
            </div>
          </div>
          {showWallet===u.id && (
            <div className="flex gap-1 mb-2"><input type="text" value={walletEdit} onChange={e=>setWalletEdit(e.target.value)} placeholder="0x... wallet address" className="flex-1 min-w-0 bg-black border-2 border-purple-400 text-white px-2 py-1 font-mono text-xs"/>
              <RetroButton size="sm" variant="success" onClick={()=>updateWallet(u.id)} disabled={ld}>Save</RetroButton>
              <RetroButton size="sm" variant="secondary" onClick={()=>setShowWallet(null)}>✕</RetroButton>
            </div>
          )}
          <div className="grid grid-cols-4 gap-1 text-center text-xs mb-2">{[{l:'Bal',v:u.balance,c:'cyan'},{l:'Inv',v:u.totalInvested,c:'purple'},{l:'Earn',v:u.totalEarnings,c:'green'},{l:'With',v:u.totalWithdrawn,c:'yellow'}].map(x=>(
            <div key={x.l} className="bg-gray-900 p-1"><p className={`text-${x.c}-400 text-xs`}>{x.l}</p><p className="text-white font-bold text-xs">${x.v.toLocaleString()}</p></div>
          ))}</div>
          {editId===u.id?<div className="flex gap-1 flex-wrap"><input type="number" value={balAmt} onChange={e=>setBalAmt(e.target.value)} placeholder="Amount" className="flex-1 min-w-0 bg-black border-2 border-cyan-400 text-white px-2 py-1 font-mono text-sm"/>
            <RetroButton size="sm" variant="success" onClick={()=>handleBal(u.id,'add')} disabled={ld}>+</RetroButton><RetroButton size="sm" variant="danger" onClick={()=>handleBal(u.id,'subtract')} disabled={ld}>-</RetroButton><RetroButton size="sm" variant="secondary" onClick={()=>setEditId(null)}>✕</RetroButton></div>:
            <RetroButton size="sm" variant="primary" onClick={()=>{setEditId(u.id);setBalAmt('');}}>Edit Bal</RetroButton>}
        </div>
      ))}</div>
    </RetroCard>
  );
};

// ─── TRANSACTIONS ────────────────────────────────
const TransactionsTab: React.FC = () => {
  const { transactions, users, apiUpdateTransaction, refreshTransactions } = useApp();
  const [f, setF] = useState<'all'|'pending'|'approved'|'rejected'>('pending'); const [ld, setLd] = useState(false);
  const filtered = (transactions||[]).filter(t=>f==='all'||t.status===f).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  return (
    <RetroCard title="💳 Transactions" color="green">
      <div className="overflow-x-auto mb-3 -mx-3 px-3"><div className="flex gap-2 min-w-max">
        {(['all','pending','approved','rejected'] as const).map(x=>(<RetroButton key={x} variant={f===x?'primary':'secondary'} size="sm" onClick={()=>setF(x)}>{x} ({x==='all'?(transactions||[]).length:(transactions||[]).filter(t=>t.status===x).length})</RetroButton>))}
        <RetroButton variant="secondary" size="sm" onClick={()=>refreshTransactions()}>↻</RetroButton>
      </div></div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">{filtered.map(t=>{const u=(users||[]).find(x=>x.id===t.userId);return(
        <div key={t.id} className={`bg-black border-4 p-2 ${t.status==='pending'?'border-yellow-400':t.status==='approved'?'border-green-400':'border-red-400'}`}>
          <div className="flex flex-wrap justify-between items-start gap-1">
            <div className="min-w-0"><p className="text-white font-bold text-xs truncate">{u?.name||'?'}</p><p className={`font-bold text-xs ${t.type==='deposit'?'text-green-400':t.type==='withdrawal'?'text-yellow-400':'text-purple-400'}`}>{t.type} · ${t.amount.toLocaleString()}</p>
              {t.paymentMethod&&<p className="text-cyan-400 text-xs mt-1">💳 {t.paymentMethod}</p>}
              {t.chain&&<p className="text-purple-400 text-xs mt-0.5">⛓️ Network: {t.chain}</p>}
              {t.walletFrom&&<p className="text-purple-400 text-xs mt-0.5">👛 {t.type==='withdrawal'?'To':'From'}: <span className="font-mono">{t.walletFrom}</span></p>}
              {t.txHash&&<div className="bg-purple-900 border border-purple-400 px-2 py-1 mt-1 rounded"><p className="text-purple-400 text-xs font-bold">🔗 Tx Hash:</p><p className="text-white font-mono text-xs break-all">{t.txHash}</p></div>}
              {t.paymentDetails&&<div className="bg-yellow-900 border border-yellow-400 px-2 py-1 mt-1 rounded"><p className="text-yellow-400 text-xs font-bold">🔑 Trx/Ref ID:</p><p className="text-white font-mono text-xs break-all">{t.paymentDetails}</p></div>}
              {t.proofImage&&<div className="mt-1"><p className="text-pink-400 text-xs font-bold mb-1">📸 Receipt:</p><img src={t.proofImage} alt="Receipt" className="max-h-32 border-2 border-pink-400 rounded cursor-pointer" onClick={()=>window.open(t.proofImage,'_blank')}/></div>}
              {t.notes&&<p className="text-gray-400 text-xs mt-1">📝 {t.notes}</p>}
              <p className="text-gray-600 text-xs mt-1">{new Date(t.date).toLocaleString()}</p>
            </div>
            <div className="flex gap-1 items-center">{t.status==='pending'&&<><RetroButton size="sm" variant="success" onClick={async()=>{setLd(true);try{await apiUpdateTransaction(t.id,'approved');}catch{}finally{setLd(false);}}} disabled={ld}>✓</RetroButton><RetroButton size="sm" variant="danger" onClick={async()=>{setLd(true);try{await apiUpdateTransaction(t.id,'rejected');}catch{}finally{setLd(false);}}} disabled={ld}>✕</RetroButton></>}
              <span className={`px-1 py-0.5 text-xs font-bold ${t.status==='approved'?'bg-green-400 text-black':t.status==='pending'?'bg-yellow-400 text-black':'bg-red-400 text-black'}`}>{t.status}</span></div>
          </div>
        </div>
      );})}</div>
    </RetroCard>
  );
};

// ─── INVESTMENTS APPROVAL ────────────────────────
const InvestmentsTab: React.FC = () => {
  const { investments, users, refreshInvestments } = useApp();
  const [f, setF] = useState<'all'|'pooled'|'active'|'completed'>('all');
  const filtered = (investments||[]).filter(i=>f==='all'||i.status===f).sort((a,b)=>new Date(b.startDate).getTime()-new Date(a.startDate).getTime());
  return (
    <RetroCard title="📈 Investments" color="purple">
      <div className="overflow-x-auto mb-3 -mx-3 px-3"><div className="flex gap-2 min-w-max">
        {(['all','pooled','active','completed'] as const).map(x=>(<RetroButton key={x} variant={f===x?'primary':'secondary'} size="sm" onClick={()=>setF(x)}>{x} ({(investments||[]).filter(i=>x==='all'||i.status===x).length})</RetroButton>))}
        <RetroButton variant="secondary" size="sm" onClick={()=>refreshInvestments()}>↻</RetroButton>
      </div></div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">{filtered.map(inv=>{const u=(users||[]).find(x=>x.id===inv.userId);return(
        <div key={inv.id} className={`bg-black border rounded p-3 ${inv.status==='pooled'?'border-yellow-400/60':inv.status==='active'?'border-cyan-400/60':inv.status==='completed'?'border-green-400/60':'border-red-400/60'}`}>
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-white font-bold text-xs">{u?.name||'?'} <span className="text-gray-500">({u?.email})</span></p>
              <p className="text-cyan-400 text-xs font-bold">{inv.productName||inv.planId} · ${inv.amount.toLocaleString()}</p>
              <p className="text-gray-500 text-xs">ROI: ${inv.totalProfit.toFixed(2)} · {Math.ceil((new Date(inv.endDate).getTime()-new Date(inv.startDate).getTime())/86400000)}d</p>
              {inv.adminNotes&&<p className="text-yellow-400 text-xs mt-1">📝 {inv.adminNotes}</p>}
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${inv.status==='active'?'bg-cyan-400 text-black':inv.status==='pooled'?'bg-yellow-400 text-black':inv.status==='completed'?'bg-green-400 text-black':'bg-red-400 text-black'}`}>{inv.status.toUpperCase()}</span>
              {inv.status==='pooled'&&<p className="text-yellow-400 text-xs mt-1">⏳ Pool filling</p>}
              {inv.adminNotes&&<p className="text-gray-500 text-xs mt-1">📝 {inv.adminNotes}</p>}
            </div>
          </div>
        </div>
      );})}</div>
    </RetroCard>
  );
};

// ─── KYC REVIEW — shows CNIC image ──────────────
const KYCTab: React.FC = () => {
  const { kycDocs, apiReviewKYC, refreshKYC } = useApp();
  const [ld, setLd] = useState(false);
  const pending = (kycDocs||[]).filter((k:any)=>k.status==='pending');
  const all = kycDocs||[];

  return (
    <RetroCard title="🪪 KYC Review" color="pink">
      <div className="flex gap-2 mb-3">
        <span className="bg-yellow-400 text-black px-2 py-1 font-bold text-xs">{pending.length} pending</span>
        <RetroButton variant="secondary" size="sm" onClick={()=>refreshKYC()}>↻ Refresh</RetroButton>
      </div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {all.length === 0 && <p className="text-gray-400 text-center py-6">No KYC submissions yet.</p>}
        {all.map((k:any) => (
          <div key={k.id} className={`bg-black border rounded p-4 ${k.status==='pending'?'border-yellow-400/60':k.status==='verified'?'border-green-400/60':'border-red-400/60'}`}>
            <div className="flex flex-wrap justify-between items-start gap-3">
              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{k.user_name} <span className="text-gray-500 text-xs">({k.user_email})</span></p>
                <p className="text-cyan-400 text-sm font-bold mt-1">CNIC: {k.cnic_number}</p>
                <p className="text-gray-500 text-xs mt-1">Submitted: {new Date(k.created_at).toLocaleString()}</p>
              </div>
              {/* Status + Actions */}
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${k.status==='verified'?'bg-green-400 text-black':k.status==='pending'?'bg-yellow-400 text-black':'bg-red-400 text-black'}`}>
                  {k.status.toUpperCase()}
                </span>
                {k.status==='pending' && (
                  <div className="flex gap-1">
                    <RetroButton size="sm" variant="success" onClick={async()=>{setLd(true);try{await apiReviewKYC(k.user_id,'verified');}catch{}finally{setLd(false);}}} disabled={ld}>✓ Verify</RetroButton>
                    <RetroButton size="sm" variant="danger" onClick={async()=>{setLd(true);try{await apiReviewKYC(k.user_id,'rejected','Documents insufficient');}catch{}finally{setLd(false);}}} disabled={ld}>✕ Reject</RetroButton>
                  </div>
                )}
              </div>
            </div>
            {/* CNIC Front Image */}
            {k.cnic_front_image && (
              <div className="mt-3">
                <p className="text-gray-400 text-xs font-bold mb-2">📸 CNIC Front Image:</p>
                <img src={k.cnic_front_image} alt="CNIC Front" className="max-h-48 border-2 border-cyan-400/40 rounded object-contain cursor-pointer" onClick={()=>window.open(k.cnic_front_image,'_blank')}/>
                <p className="text-gray-500 text-xs mt-1">Click to view full size</p>
              </div>
            )}
            {k.rejection_reason && (
              <p className="text-red-400 text-xs mt-2">❌ Rejection reason: {k.rejection_reason}</p>
            )}
          </div>
        ))}
      </div>
    </RetroCard>
  );
};

// ─── PLANS + SLOTS + LOTS ────────────────────────
const PlansTab: React.FC = () => {
  const { plans, slots, lots, apiCreatePlan, apiUpdatePlan, apiDeletePlan, apiCreateSlot, apiUpdateSlot, apiDeleteSlot, apiCreateLot, apiUpdateLot, apiDeleteLot, refreshPlans, refreshSlots, refreshLots } = useApp();
  const [show, setShow] = useState(''); // 'plan','slot','lot' or ''
  const [ld, setLd] = useState(false); const [msg, setMsg] = useState('');
  const [pf, setPf] = useState({name:'',description:'',min_amount:'',max_amount:'',roi_percentage:'',duration_days:'',pool_target_amount:''});
  const [sf, setSf] = useState({plan_id:'',name:'',description:'',roi_percentage:'',duration_days:'',min_amount:'',max_amount:''});
  const [lf, setLf] = useState({slot_id:'',name:'',description:'',roi_percentage:'',duration_days:'',lot_size:'',max_persons:''});
  // Edit states
  const [editPlan, setEditPlan] = useState<string|null>(null);
  const [editSlot, setEditSlot] = useState<string|null>(null);
  const [editLot, setEditLot] = useState<string|null>(null);
  const [ef, setEf] = useState<any>({});

  const createPlan = async () => { if(!pf.name||!pf.roi_percentage){setMsg('Fill required');return;} setLd(true);setMsg('');try{await apiCreatePlan({...pf,min_amount:parseFloat(pf.min_amount)||0,max_amount:parseFloat(pf.max_amount)||0,roi_percentage:parseFloat(pf.roi_percentage),duration_days:parseInt(pf.duration_days)||30,pool_target_amount:parseFloat(pf.pool_target_amount)||0});setPf({name:'',description:'',min_amount:'',max_amount:'',roi_percentage:'',duration_days:'',pool_target_amount:''});setShow('');setMsg('✅ Plan created!');}catch(e:any){setMsg(e.message);}finally{setLd(false);} };
  const createSlot = async () => { if(!sf.plan_id||!sf.name){setMsg('Select plan & name');return;} setLd(true);setMsg('');try{await apiCreateSlot({...sf,roi_percentage:parseFloat(sf.roi_percentage)||0,duration_days:parseInt(sf.duration_days)||30,min_amount:parseFloat(sf.min_amount)||0,max_amount:parseFloat(sf.max_amount)||0});setSf({plan_id:'',name:'',description:'',roi_percentage:'',duration_days:'',min_amount:'',max_amount:''});setShow('');setMsg('✅ Slot created!');}catch(e:any){setMsg(e.message);}finally{setLd(false);} };
  const createLot = async () => { if(!lf.slot_id||!lf.name){setMsg('Select slot & name');return;} setLd(true);setMsg('');try{await apiCreateLot({...lf,roi_percentage:parseFloat(lf.roi_percentage)||0,duration_days:parseInt(lf.duration_days)||30,lot_size:parseFloat(lf.lot_size)||0,max_persons:parseInt(lf.max_persons)||10});setLf({slot_id:'',name:'',description:'',roi_percentage:'',duration_days:'',lot_size:'',max_persons:''});setShow('');setMsg('✅ Lot created!');}catch(e:any){setMsg(e.message);}finally{setLd(false);} };

  return (
    <div className="space-y-4">
      {msg&&<div className={`p-2 font-bold border-4 text-sm ${msg.includes('✅')?'bg-green-500 border-green-700':'bg-red-500 border-red-700'} text-black`}>{msg}</div>}

      {/* Create buttons */}
      <div className="overflow-x-auto -mx-3 px-3"><div className="flex gap-2 min-w-max">
        <RetroButton variant="success" size="sm" onClick={()=>setShow(show==='plan'?'':'plan')}>+ Plan</RetroButton>
        <RetroButton variant="success" size="sm" onClick={()=>setShow(show==='slot'?'':'slot')}>+ Slot</RetroButton>
        <RetroButton variant="success" size="sm" onClick={()=>setShow(show==='lot'?'':'lot')}>+ Lot</RetroButton>
        <RetroButton variant="secondary" size="sm" onClick={()=>{refreshPlans();refreshSlots();refreshLots();}}>↻ All</RetroButton>
      </div></div>

      {/* Create forms */}
      {show==='plan'&&<div className="bg-black border-4 border-purple-400 p-3 space-y-2"><h3 className="text-purple-400 font-bold text-sm">New Plan</h3><div className="grid grid-cols-2 gap-2">
        <RetroInput label="Name*" value={pf.name} onChange={e=>setPf({...pf,name:e.target.value})}/><RetroInput label="Desc" value={pf.description} onChange={e=>setPf({...pf,description:e.target.value})}/>
        <RetroInput label="ROI%*" type="number" value={pf.roi_percentage} onChange={e=>setPf({...pf,roi_percentage:e.target.value})}/><RetroInput label="Days" type="number" value={pf.duration_days} onChange={e=>setPf({...pf,duration_days:e.target.value})}/>
        <RetroInput label="Min$" type="number" value={pf.min_amount} onChange={e=>setPf({...pf,min_amount:e.target.value})}/><RetroInput label="Max$" type="number" value={pf.max_amount} onChange={e=>setPf({...pf,max_amount:e.target.value})}/>
        <RetroInput label="Pool Target $" type="number" value={pf.pool_target_amount} onChange={e=>setPf({...pf,pool_target_amount:e.target.value})}/>
      </div><p className="text-gray-500 text-xs mb-2">Pool Target: 0 = instant activate. Above 0 = wait until pool fills.</p>
      <RetroButton variant="success" onClick={createPlan} disabled={ld}>{ld?'...':'Create Plan'}</RetroButton></div>}

      {show==='slot'&&<div className="bg-black border-4 border-green-400 p-3 space-y-2"><h3 className="text-green-400 font-bold text-sm">New Slot</h3>
        <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Plan</label><select value={sf.plan_id} onChange={e=>setSf({...sf,plan_id:e.target.value})} className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-1 font-mono text-sm"><option value="">Select plan</option>{(plans||[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2"><RetroInput label="Name*" value={sf.name} onChange={e=>setSf({...sf,name:e.target.value})}/><RetroInput label="ROI%" type="number" value={sf.roi_percentage} onChange={e=>setSf({...sf,roi_percentage:e.target.value})}/><RetroInput label="Days" type="number" value={sf.duration_days} onChange={e=>setSf({...sf,duration_days:e.target.value})}/><RetroInput label="Min$" type="number" value={sf.min_amount} onChange={e=>setSf({...sf,min_amount:e.target.value})}/></div>
        <RetroButton variant="success" onClick={createSlot} disabled={ld}>{ld?'...':'Create Slot'}</RetroButton></div>}

      {show==='lot'&&<div className="bg-black border-4 border-yellow-400 p-3 space-y-2"><h3 className="text-yellow-400 font-bold text-sm">New Lot</h3>
        <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Slot</label><select value={lf.slot_id} onChange={e=>setLf({...lf,slot_id:e.target.value})} className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-1 font-mono text-sm"><option value="">Select slot</option>{(slots||[]).map((s:any)=><option key={s.id} value={s.id}>{(plans||[]).find(p=>p.id===s.plan_id)?.name} → {s.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2"><RetroInput label="Name*" value={lf.name} onChange={e=>setLf({...lf,name:e.target.value})}/><RetroInput label="ROI%" type="number" value={lf.roi_percentage} onChange={e=>setLf({...lf,roi_percentage:e.target.value})}/><RetroInput label="Lot Size$" type="number" value={lf.lot_size} onChange={e=>setLf({...lf,lot_size:e.target.value})}/><RetroInput label="Max Persons" type="number" value={lf.max_persons} onChange={e=>setLf({...lf,max_persons:e.target.value})}/></div>
        <RetroButton variant="success" onClick={createLot} disabled={ld}>{ld?'...':'Create Lot'}</RetroButton></div>}

      {/* Plans list with nested slots/lots — with EDIT functionality */}
      {(plans||[]).map(p=>{
        const pSlots = (slots||[]).filter((s:any)=>s.plan_id===p.id);
        const isPlanEditing = editPlan === p.id;
        return <RetroCard key={p.id} title={`📦 ${p.name}`} color={p.isActive?'purple':'cyan'}>
          <div className="flex flex-wrap gap-1 mb-2">
            <RetroButton size="sm" variant="primary" onClick={()=>{if(isPlanEditing){setEditPlan(null);}else{setEditPlan(p.id);setEf({name:p.name,description:p.description||'',roi_percentage:String(p.roiPercentage),duration_days:String(p.durationDays),min_amount:String(p.minAmount),max_amount:String(p.maxAmount)});}}}>{isPlanEditing?'Cancel':'Edit'}</RetroButton>
            <RetroButton size="sm" variant={p.isActive?'warning':'success'} onClick={async()=>{try{await apiUpdatePlan(p.id,{is_active:!p.isActive});}catch{}}} disabled={ld}>{p.isActive?'Off':'On'}</RetroButton>
            <RetroButton size="sm" variant="danger" onClick={async()=>{try{await apiDeletePlan(p.id);}catch{}}} disabled={ld}>Del</RetroButton>
          </div>
          {isPlanEditing && (
            <div className="bg-black border-2 border-cyan-400 p-2 mb-2 space-y-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                <input value={ef.name||''} onChange={e=>setEf({...ef,name:e.target.value})} placeholder="Name" className="bg-black border border-cyan-400 text-white px-2 py-1 text-xs font-mono"/>
                <input value={ef.roi_percentage||''} onChange={e=>setEf({...ef,roi_percentage:e.target.value})} placeholder="ROI %" type="number" className="bg-black border border-green-400 text-white px-2 py-1 text-xs font-mono"/>
                <input value={ef.duration_days||''} onChange={e=>setEf({...ef,duration_days:e.target.value})} placeholder="Days" type="number" className="bg-black border border-purple-400 text-white px-2 py-1 text-xs font-mono"/>
                <input value={ef.min_amount||''} onChange={e=>setEf({...ef,min_amount:e.target.value})} placeholder="Min $" type="number" className="bg-black border border-cyan-400 text-white px-2 py-1 text-xs font-mono"/>
                <input value={ef.max_amount||''} onChange={e=>setEf({...ef,max_amount:e.target.value})} placeholder="Max $" type="number" className="bg-black border border-yellow-400 text-white px-2 py-1 text-xs font-mono"/>
                <RetroButton size="sm" variant="success" disabled={ld} onClick={async()=>{setLd(true);try{await apiUpdatePlan(p.id,{name:ef.name,description:ef.description,roi_percentage:parseFloat(ef.roi_percentage),duration_days:parseInt(ef.duration_days),min_amount:parseFloat(ef.min_amount),max_amount:parseFloat(ef.max_amount),pool_target_amount:parseFloat(ef.pool_target_amount)||0});setEditPlan(null);setMsg('✅ Updated');}catch(e:any){setMsg(e.message);}finally{setLd(false);}}}>Save</RetroButton>
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 gap-1 text-center text-xs mb-2">{[{l:'≈ROI',v:`${p.roiPercentage}%`},{l:'Days',v:p.durationDays},{l:'Min',v:`$${p.minAmount}`},{l:'Max',v:`$${p.maxAmount}`}].map(x=><div key={x.l} className="bg-gray-900 p-1"><p className="text-cyan-400 font-bold">{x.v}</p><p className="text-gray-500">{x.l}</p></div>)}</div>
          <p className="text-gray-600 text-xs mb-2">⚠️ ROI shown is approximate. Actual daily profit is set via ROI tab.</p>
          {/* Slots */}
          {pSlots.length>0&&<div className="ml-3 border-l-4 border-green-400 pl-3 space-y-2">{pSlots.map((s:any)=>{
            const sLots = (lots||[]).filter((l:any)=>l.slot_id===s.id);
            const isSlotEditing = editSlot === s.id;
            return <div key={s.id} className="bg-gray-900 border-2 border-green-400 p-2">
              <div className="flex flex-wrap justify-between items-center gap-1 mb-1">
                <span className="text-green-400 font-bold text-sm">📁 {s.name} <span className="text-gray-500 text-xs">≈ROI:{parseFloat(s.roi_percentage)}% · {s.duration_days}d</span></span>
                <div className="flex gap-1">
                  <RetroButton size="sm" variant="primary" onClick={()=>{if(isSlotEditing){setEditSlot(null);}else{setEditSlot(s.id);setEf({name:s.name,roi_percentage:String(parseFloat(s.roi_percentage)),duration_days:String(s.duration_days)});}}}>{isSlotEditing?'✕':'Edit'}</RetroButton>
                  <RetroButton size="sm" variant={s.is_active?'warning':'success'} onClick={async()=>{try{await apiUpdateSlot(s.id,{is_active:!s.is_active});}catch{}}} disabled={ld}>{s.is_active?'Off':'On'}</RetroButton>
                  <RetroButton size="sm" variant="danger" onClick={async()=>{try{await apiDeleteSlot(s.id);}catch{}}} disabled={ld}>✕</RetroButton>
                </div>
              </div>
              {isSlotEditing && (
                <div className="flex gap-1 mb-1 flex-wrap">
                  <input value={ef.name||''} onChange={e=>setEf({...ef,name:e.target.value})} placeholder="Name" className="bg-black border border-green-400 text-white px-2 py-1 text-xs font-mono flex-1 min-w-[80px]"/>
                  <input value={ef.roi_percentage||''} onChange={e=>setEf({...ef,roi_percentage:e.target.value})} placeholder="ROI%" type="number" className="bg-black border border-green-400 text-white px-2 py-1 text-xs font-mono w-16"/>
                  <input value={ef.duration_days||''} onChange={e=>setEf({...ef,duration_days:e.target.value})} placeholder="Days" type="number" className="bg-black border border-green-400 text-white px-2 py-1 text-xs font-mono w-16"/>
                  <RetroButton size="sm" variant="success" disabled={ld} onClick={async()=>{setLd(true);try{await apiUpdateSlot(s.id,{name:ef.name,roi_percentage:parseFloat(ef.roi_percentage),duration_days:parseInt(ef.duration_days)});setEditSlot(null);setMsg('✅ Slot updated');}catch(e:any){setMsg(e.message);}finally{setLd(false);}}}>Save</RetroButton>
                </div>
              )}
              {sLots.length>0&&<div className="ml-3 border-l-4 border-yellow-400 pl-2 space-y-1">{sLots.map((l:any)=>{
                const isLotEditing = editLot === l.id;
                return <div key={l.id} className="bg-black border border-yellow-400 p-1">
                  <div className="flex flex-wrap justify-between items-center gap-1">
                    <span className="text-yellow-400 text-xs font-bold">📋 {l.name} <span className="text-gray-500">≈ROI:{parseFloat(l.roi_percentage)}% · ${parseFloat(l.lot_size)} · {l.current_persons}/{l.max_persons}p</span></span>
                    <div className="flex gap-1">
                      <RetroButton size="sm" variant="primary" onClick={()=>{if(isLotEditing){setEditLot(null);}else{setEditLot(l.id);setEf({name:l.name,roi_percentage:String(parseFloat(l.roi_percentage)),lot_size:String(parseFloat(l.lot_size)),max_persons:String(l.max_persons)});}}}>{isLotEditing?'✕':'Edit'}</RetroButton>
                      <RetroButton size="sm" variant={l.is_active?'warning':'success'} onClick={async()=>{try{await apiUpdateLot(l.id,{is_active:!l.is_active});}catch{}}} disabled={ld}>{l.is_active?'Off':'On'}</RetroButton>
                      <RetroButton size="sm" variant="danger" onClick={async()=>{try{await apiDeleteLot(l.id);}catch{}}} disabled={ld}>✕</RetroButton>
                    </div>
                  </div>
                  {isLotEditing && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <input value={ef.name||''} onChange={e=>setEf({...ef,name:e.target.value})} placeholder="Name" className="bg-black border border-yellow-400 text-white px-2 py-1 text-xs font-mono flex-1 min-w-[80px]"/>
                      <input value={ef.roi_percentage||''} onChange={e=>setEf({...ef,roi_percentage:e.target.value})} placeholder="ROI%" type="number" className="bg-black border border-yellow-400 text-white px-2 py-1 text-xs font-mono w-16"/>
                      <input value={ef.lot_size||''} onChange={e=>setEf({...ef,lot_size:e.target.value})} placeholder="Size$" type="number" className="bg-black border border-yellow-400 text-white px-2 py-1 text-xs font-mono w-16"/>
                      <input value={ef.max_persons||''} onChange={e=>setEf({...ef,max_persons:e.target.value})} placeholder="Persons" type="number" className="bg-black border border-yellow-400 text-white px-2 py-1 text-xs font-mono w-16"/>
                      <RetroButton size="sm" variant="success" disabled={ld} onClick={async()=>{setLd(true);try{await apiUpdateLot(l.id,{name:ef.name,roi_percentage:parseFloat(ef.roi_percentage),lot_size:parseFloat(ef.lot_size),max_persons:parseInt(ef.max_persons)});setEditLot(null);setMsg('✅ Lot updated');}catch(e:any){setMsg(e.message);}finally{setLd(false);}}}>Save</RetroButton>
                    </div>
                  )}
                </div>;
              })}</div>}
            </div>;
          })}</div>}
        </RetroCard>;
      })}
    </div>
  );
};

// ─── COMPETITIONS (admin) ────────────────────────
const CompetitionsAdminTab: React.FC = () => {
  const { competitions, apiCreateCompetition, apiUpdateCompetition, apiDeleteCompetition, refreshCompetitions } = useApp();
  const [show, setShow] = useState(false); const [ld, setLd] = useState(false);
  const [form, setForm] = useState({title:'',description:'',type:'referral',target_referrals:'',target_deposit_amount:'',target_invest_amount:'',prize_description:'',prize_amount:'',end_date:''});
  const create = async () => { if(!form.title){return;} setLd(true);try{await apiCreateCompetition(form);setForm({title:'',description:'',type:'referral',target_referrals:'',target_deposit_amount:'',target_invest_amount:'',prize_description:'',prize_amount:'',end_date:''});setShow(false);}catch{}finally{setLd(false);} };
  return (
    <RetroCard title="🏆 Competitions" color="yellow">
      <div className="flex gap-2 mb-3"><RetroButton variant="success" size="sm" onClick={()=>setShow(!show)}>{show?'Cancel':'+ Competition'}</RetroButton><RetroButton variant="secondary" size="sm" onClick={()=>refreshCompetitions()}>↻</RetroButton></div>
      {show&&<div className="bg-black border-4 border-yellow-400 p-3 mb-3 space-y-2"><div className="grid grid-cols-2 gap-2">
        <RetroInput label="Title *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-2 font-mono text-sm"><option value="referral">Referrals</option><option value="deposit">Deposits</option><option value="investment">Investments</option><option value="mixed">Mixed</option></select></div>
        <RetroInput label="Target Referrals" type="number" value={form.target_referrals} onChange={e=>setForm({...form,target_referrals:e.target.value})}/>
        <RetroInput label="Target Deposit $" type="number" value={form.target_deposit_amount} onChange={e=>setForm({...form,target_deposit_amount:e.target.value})}/>
        <RetroInput label="Target Invest $" type="number" value={form.target_invest_amount} onChange={e=>setForm({...form,target_invest_amount:e.target.value})}/>
        <RetroInput label="Prize $" type="number" value={form.prize_amount} onChange={e=>setForm({...form,prize_amount:e.target.value})}/>
        <RetroInput label="Prize Description" value={form.prize_description} onChange={e=>setForm({...form,prize_description:e.target.value})}/>
        <RetroInput label="End Date" type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/>
      </div><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Competition details..." className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-2 font-mono text-sm" rows={2}/>
        <RetroButton variant="success" onClick={create} disabled={ld}>{ld?'...':'Create'}</RetroButton></div>}
      <div className="space-y-2">{(competitions||[]).map((c:any)=>(
        <div key={c.id} className={`bg-black border-4 p-3 ${c.is_active?'border-yellow-400':'border-gray-700'}`}>
          <div className="flex flex-wrap justify-between items-start gap-2"><div><h3 className="text-yellow-400 font-bold">{c.title}</h3><p className="text-gray-400 text-xs">{c.description}</p><p className="text-gray-500 text-xs">Type: {c.type} · Prize: {c.prize_description||'—'} ${parseFloat(c.prize_amount||0).toLocaleString()}</p></div>
            <div className="flex gap-1"><RetroButton size="sm" variant={c.is_active?'warning':'success'} onClick={async()=>{try{await apiUpdateCompetition(c.id,{is_active:!c.is_active});}catch{}}} disabled={ld}>{c.is_active?'Stop':'Start'}</RetroButton><RetroButton size="sm" variant="danger" onClick={async()=>{try{await apiDeleteCompetition(c.id);}catch{}}} disabled={ld}>Del</RetroButton></div></div>
        </div>
      ))}</div>
    </RetroCard>
  );
};

// ─── CSV ─────────────────────────────────────────
const CSVTab: React.FC = () => {
  const { apiExportTable, apiImportTable } = useApp();
  const [msg, setMsg] = useState(''); const [ld, setLd] = useState(false);
  const tables = ['users','investment_plans','investments','transactions','payment_gateways','kyc_documents','notifications','tasks','referral_earnings','activity_logs','profit_distribution_logs','competitions','competition_entries'];

  const exportCSV = async (table: string) => {
    setLd(true); try {
      const data = await apiExportTable(table);
      const rows = data.rows || []; if (!rows.length) { setMsg('No data'); return; }
      const keys = Object.keys(rows[0]);
      const csv = [keys.join(','), ...rows.map((r:any)=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${table}_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
      setMsg(`✅ Exported ${rows.length} rows from ${table}`);
    } catch (e: any) { setMsg(e.message); } finally { setLd(false); }
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>, table: string) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.trim().split('\n'); if (lines.length < 2) { setMsg('Empty CSV'); return; }
    const headers = lines[0].split(',').map(h=>h.replace(/^"|"$/g,'').trim());
    const data = lines.slice(1).map(line => {
      const vals: string[] = []; let cur = ''; let inQ = false;
      for (const ch of line) { if(ch==='"')inQ=!inQ; else if(ch===','&&!inQ){vals.push(cur.replace(/^"|"$/g,'').trim());cur='';} else cur+=ch; }
      vals.push(cur.replace(/^"|"$/g,'').trim());
      const row: any = {}; headers.forEach((h,i) => { const v = vals[i]||''; row[h] = v==='true'?true:v==='false'?false:!isNaN(Number(v))&&v!==''?Number(v):v; }); return row;
    });
    setLd(true); try { await apiImportTable(table, data); setMsg(`✅ Imported ${data.length} rows into ${table}`); } catch (err: any) { setMsg(err.message); } finally { setLd(false); e.target.value = ''; }
  };

  return (
    <RetroCard title="📊 CSV Export / Import" color="yellow">
      {msg&&<div className={`p-2 font-bold mb-3 border-4 text-sm ${msg.includes('✅')?'bg-green-500 border-green-700':'bg-red-500 border-red-700'} text-black`}>{msg}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {tables.map(t=>(
          <div key={t} className="bg-black border-2 border-cyan-400 p-2">
            <p className="text-cyan-400 font-bold text-xs mb-1 truncate">{t}</p>
            <div className="flex gap-1">
              <RetroButton size="sm" variant="success" onClick={()=>exportCSV(t)} disabled={ld} className="flex-1 !text-xs !px-2">↓ Export</RetroButton>
              <label className="flex-1"><input type="file" accept=".csv" onChange={e=>importCSV(e,t)} className="hidden" id={`csv-${t}`}/>
                <RetroButton size="sm" variant="primary" className="w-full !text-xs !px-2" disabled={ld} onClick={()=>document.getElementById(`csv-${t}`)?.click()}>↑ Import</RetroButton>
              </label>
            </div>
          </div>
        ))}
      </div>
    </RetroCard>
  );
};

// ─── NOTIFICATIONS ───────────────────────────────
const NotificationsTab: React.FC = () => {
  const { notifications, apiCreateNotification, apiUpdateNotification, refreshNotifications } = useApp();
  const [title, setTitle] = useState(''); const [message, setMessage] = useState(''); const [ld, setLd] = useState(false);
  const add = async () => { if(!title||!message)return; setLd(true);try{await apiCreateNotification({title,message});setTitle('');setMessage('');}catch{}finally{setLd(false);} };
  return (
    <RetroCard title="🔔 Notifications" color="yellow">
      <div className="bg-black border-4 border-yellow-400 p-3 mb-3 space-y-2">
        <RetroInput label="Title" value={title} onChange={e=>setTitle(e.target.value)}/>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message..." className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-2 font-mono text-sm" rows={2}/>
        <RetroButton variant="success" onClick={add} disabled={ld}>{ld?'...':'Send'}</RetroButton>
      </div>
      <RetroButton variant="secondary" size="sm" className="mb-3" onClick={()=>refreshNotifications()}>↻</RetroButton>
      <div className="space-y-2">{(notifications||[]).map(n=>(
        <div key={n.id} className={`bg-black border-2 p-2 flex flex-wrap justify-between items-center gap-2 ${n.isActive?'border-yellow-400':'border-gray-700'}`}>
          <div className="min-w-0"><p className="text-yellow-400 font-bold text-xs truncate">{n.title}</p><p className="text-gray-400 text-xs truncate">{n.message}</p></div>
          <RetroButton size="sm" variant={n.isActive?'warning':'success'} onClick={async()=>{try{await apiUpdateNotification(n.id,{isActive:!n.isActive});}catch{}}}>{n.isActive?'Hide':'Show'}</RetroButton>
        </div>
      ))}</div>
    </RetroCard>
  );
};

// ─── GATEWAYS (with edit/delete) ─────────────────
const GatewaysTab: React.FC = () => {
  const { paymentGateways, apiCreateGateway, apiUpdateGateway, apiDeleteGateway, refreshGateways } = useApp();
  const [form, setForm] = useState({name:'',type:'bank',accountDetails:'',icon:'💳',walletAddress:'',chain:''});
  const [ld, setLd] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [ef, setEf] = useState({name:'',accountDetails:'',icon:'',walletAddress:'',chain:''});
  const add = async () => {
    if(!form.name||!form.accountDetails)return;
    setLd(true);try{await apiCreateGateway(form);setForm({name:'',type:'bank',accountDetails:'',icon:'💳',walletAddress:'',chain:''});}catch{}finally{setLd(false);}
  };
  const saveEdit = async (id:string) => {
    setLd(true);try{await apiUpdateGateway(id,{name:ef.name||undefined,accountDetails:ef.accountDetails||undefined,icon:ef.icon||undefined,walletAddress:ef.walletAddress||undefined,chain:ef.chain||undefined});setEditId(null);}catch{}finally{setLd(false);}
  };
  return (
    <RetroCard title="💳 Payment Gateways" color="pink">
      {/* Add Gateway Form */}
      <div className="bg-black border-4 border-pink-400 p-3 mb-3 space-y-2">
        <h3 className="text-pink-400 font-bold text-sm mb-2">Add New Gateway</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RetroInput label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <RetroInput label="Icon" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})}/>
          <RetroInput label="Account Details" value={form.accountDetails} onChange={e=>setForm({...form,accountDetails:e.target.value})}/>
          <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-1 font-mono text-sm"><option value="jazzcash">JazzCash</option><option value="easypaisa">EasyPaisa</option><option value="bank">Bank</option><option value="crypto">Crypto</option></select></div>
          <RetroInput label="Wallet Address (Crypto)" value={form.walletAddress} onChange={e=>setForm({...form,walletAddress:e.target.value})} placeholder="0x... or TRX address"/>
          <RetroInput label="Chain/Network" value={form.chain} onChange={e=>setForm({...form,chain:e.target.value})} placeholder="BSC, Ethereum, Tron, etc."/>
        </div>
        <RetroButton variant="success" onClick={add} disabled={ld}>{ld?'...':'Add Gateway'}</RetroButton>
      </div>
      <RetroButton variant="secondary" size="sm" className="mb-3" onClick={()=>refreshGateways()}>↻ Refresh</RetroButton>
      <div className="space-y-2">{(paymentGateways||[]).map(g=>(
        <div key={g.id} className={`bg-black border-2 p-2 ${g.isActive?'border-pink-400':'border-gray-700'}`}>
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{g.icon}</span>
                <p className="text-pink-400 font-bold text-sm">{g.name}</p>
                <span className={`px-1 py-0.5 text-xs font-bold ${g.type==='crypto'?'bg-purple-400 text-black':'bg-cyan-400 text-black'}`}>{g.type}</span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5 truncate">{g.accountDetails}</p>
              {g.walletAddress && <p className="text-purple-400 text-xs mt-0.5 font-mono truncate">🔗 {g.walletAddress}</p>}
              {g.chain && <p className="text-yellow-400 text-xs mt-0.5">⛓️ {g.chain}</p>}
            </div>
            <div className="flex gap-1 flex-wrap">
              <RetroButton size="sm" variant="primary" onClick={()=>{setEditId(editId===g.id?null:g.id);setEf({name:g.name||'',accountDetails:g.accountDetails||'',icon:g.icon||'',walletAddress:g.walletAddress||'',chain:g.chain||''});}}>Edit</RetroButton>
              <RetroButton size="sm" variant={g.isActive?'warning':'success'} onClick={async()=>{try{await apiUpdateGateway(g.id,{isActive:!g.isActive});}catch{}}}>{g.isActive?'Off':'On'}</RetroButton>
              <RetroButton size="sm" variant="danger" onClick={async()=>{try{await apiDeleteGateway(g.id);}catch{}}}>Del</RetroButton>
            </div>
          </div>
          {editId===g.id && (
            <div className="mt-2 bg-gray-900 border-2 border-cyan-400 p-2 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <input value={ef.name} onChange={e=>setEf({...ef,name:e.target.value})} placeholder="Name" className="bg-black border border-cyan-400 text-white px-2 py-1 text-xs font-mono"/>
                <input value={ef.accountDetails} onChange={e=>setEf({...ef,accountDetails:e.target.value})} placeholder="Account" className="bg-black border border-cyan-400 text-white px-2 py-1 text-xs font-mono"/>
                <RetroButton size="sm" variant="success" onClick={()=>saveEdit(g.id)} disabled={ld}>Save</RetroButton>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <input value={ef.icon} onChange={e=>setEf({...ef,icon:e.target.value})} placeholder="Icon 💳" className="bg-black border border-cyan-400 text-white px-2 py-1 text-xs font-mono"/>
                <input value={ef.walletAddress} onChange={e=>setEf({...ef,walletAddress:e.target.value})} placeholder="Wallet Address" className="bg-black border border-purple-400 text-white px-2 py-1 text-xs font-mono"/>
                <input value={ef.chain} onChange={e=>setEf({...ef,chain:e.target.value})} placeholder="Chain/Network" className="bg-black border border-yellow-400 text-white px-2 py-1 text-xs font-mono"/>
              </div>
            </div>
          )}
        </div>
      ))}</div>
    </RetroCard>
  );
};

// ─── BLOG ADMIN ──────────────────────────────────
const BlogAdminTab: React.FC = () => {
  const { blogCategories, blogPosts, apiCreateBlogCategory, apiDeleteBlogCategory, apiCreateBlogPost, apiUpdateBlogPost, apiDeleteBlogPost, refreshBlogs } = useApp();
  const [catName, setCatName] = useState('');
  const [showPost, setShowPost] = useState(false);
  const [pf, setPf] = useState({category_id:'',title:'',content:'',image:''});
  const [ld, setLd] = useState(false); const [msg, setMsg] = useState('');

  const addCat = async () => { if(!catName.trim())return; setLd(true);try{await apiCreateBlogCategory({name:catName});setCatName('');setMsg('✅ Category added');}catch(e:any){setMsg(e.message);}finally{setLd(false);} };
  const addPost = async () => { if(!pf.title||!pf.content){setMsg('Title & content required');return;} setLd(true);setMsg('');try{await apiCreateBlogPost(pf);setPf({category_id:'',title:'',content:'',image:''});setShowPost(false);setMsg('✅ Post published');}catch(e:any){setMsg(e.message);}finally{setLd(false);} };

  return (
    <div className="space-y-4">
      {msg&&<div className={`p-2 font-bold border-4 text-sm ${msg.includes('✅')?'bg-green-500 border-green-700':'bg-red-500 border-red-700'} text-black`}>{msg}</div>}

      {/* Categories */}
      <RetroCard title="📁 Blog Categories" color="pink">
        <div className="flex gap-2 mb-3">
          <RetroInput value={catName} onChange={e=>setCatName(e.target.value)} placeholder="Category name" className="flex-1"/>
          <RetroButton variant="success" size="sm" onClick={addCat} disabled={ld}>+ Add</RetroButton>
          <RetroButton variant="secondary" size="sm" onClick={()=>refreshBlogs()}>↻</RetroButton>
        </div>
        <div className="flex flex-wrap gap-2">{(blogCategories||[]).map((c:any)=>(
          <span key={c.id} className="bg-pink-400 text-black px-2 py-1 font-bold text-xs flex items-center gap-1">
            {c.name} <button onClick={async()=>{try{await apiDeleteBlogCategory(c.id);}catch{}}} className="text-red-800 font-bold cursor-pointer">✕</button>
          </span>
        ))}</div>
      </RetroCard>

      {/* Posts */}
      <RetroCard title="📝 Blog Posts" color="pink">
        <RetroButton variant="success" size="sm" className="mb-3" onClick={()=>setShowPost(!showPost)}>{showPost?'Cancel':'+ New Post'}</RetroButton>
        {showPost&&<div className="bg-black border-4 border-pink-400 p-3 mb-3 space-y-2">
          <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Category</label>
            <select value={pf.category_id} onChange={e=>setPf({...pf,category_id:e.target.value})} className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-1 font-mono text-sm"><option value="">Select</option>{(blogCategories||[]).map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <RetroInput label="Title *" value={pf.title} onChange={e=>setPf({...pf,title:e.target.value})}/>
          <RetroInput label="Image URL" value={pf.image} onChange={e=>setPf({...pf,image:e.target.value})} placeholder="https://..."/>
          <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Content *</label>
            <textarea value={pf.content} onChange={e=>setPf({...pf,content:e.target.value})} rows={4} className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-2 font-mono text-sm focus:outline-none"/></div>
          <RetroButton variant="success" onClick={addPost} disabled={ld}>{ld?'...':'Publish Post'}</RetroButton>
        </div>}
        <div className="space-y-2">{(blogPosts||[]).map((p:any)=>(
          <div key={p.id} className="bg-black border-2 border-pink-400 p-2">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div className="min-w-0"><h4 className="text-pink-400 font-bold text-sm truncate">{p.title}</h4>
                <p className="text-gray-500 text-xs">{p.category_name||'Uncategorized'} · {new Date(p.created_at).toLocaleDateString()}</p></div>
              <div className="flex gap-1">
                <RetroButton size="sm" variant={p.is_published?'warning':'success'} onClick={async()=>{try{await apiUpdateBlogPost(p.id,{is_published:!p.is_published});}catch{}}}>{p.is_published?'Hide':'Show'}</RetroButton>
                <RetroButton size="sm" variant="danger" onClick={async()=>{try{await apiDeleteBlogPost(p.id);}catch{}}}>Del</RetroButton>
              </div>
            </div>
          </div>
        ))}</div>
      </RetroCard>
    </div>
  );
};

// ─── ROI MANAGEMENT ──────────────────────────────────
const ROITab: React.FC = () => {
  const { apiGetCurrentROI, apiSetDailyROI, apiGetROIHistory } = useApp();
  const [roi, setRoi] = useState('');
  const [note, setNote] = useState('');
  const [current, setCurrent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [ld, setLd] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const c = await apiGetCurrentROI(); setCurrent(c);
      const h = await apiGetROIHistory(); setHistory(h || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const setROI = async () => {
    const r = parseFloat(roi);
    if (isNaN(r) || r < 0) { setMsg('Enter a valid ROI %'); return; }
    setLd(true); setMsg('');
    try { await apiSetDailyROI(r, note); setMsg(`✅ Daily ROI set to ${r}%`); setRoi(''); setNote(''); await load(); }
    catch (e: any) { setMsg(e.message); }
    finally { setLd(false); }
  };

  return (
    <div className="space-y-4">
      <RetroCard title="📊 Daily ROI Management" color="green">
        {msg && <div className={`p-2 font-bold mb-3 border-4 text-sm ${msg.includes('✅')?'bg-green-500 border-green-700':'bg-red-500 border-red-700'} text-black`}>{msg}</div>}
        {current && (
          <div className={`p-4 mb-3 border-4 ${parseFloat(current.roi_percentage)>0?'bg-green-900 border-green-400':'bg-yellow-900 border-yellow-400'}`}>
            <p className="text-gray-400 text-xs uppercase">Today's Active ROI Rate</p>
            <p className={`text-4xl font-bold ${parseFloat(current.roi_percentage)>0?'text-green-400':'text-yellow-400'}`}>{parseFloat(current.roi_percentage).toFixed(4)}%</p>
            {current.note && <p className="text-gray-400 text-xs mt-1">📝 {current.note}</p>}
            <p className="text-gray-500 text-xs mt-1">Set on: {new Date(current.created_at).toLocaleString()}</p>
          </div>
        )}
        <div className="bg-black border-4 border-cyan-400 p-3 space-y-2">
          <h3 className="text-cyan-400 font-bold text-sm">Set Today's ROI %</h3>
          <div className="flex gap-2 flex-wrap">
            <RetroInput value={roi} onChange={e=>setRoi(e.target.value)} type="number" placeholder="e.g. 0.5 (daily %)" className="flex-1 min-w-[150px]"/>
            <RetroInput value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note..." className="flex-1 min-w-[150px]"/>
            <RetroButton variant="success" onClick={setROI} disabled={ld}>{ld?'Setting...':'Set ROI'}</RetroButton>
          </div>
          <p className="text-gray-500 text-xs">This rate applies to ALL active investments. Profits credited once per day.</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {[0.1, 0.25, 0.5, 1.0, 2.0, 5.0].map(r => (
            <RetroButton key={r} variant="secondary" size="sm" onClick={()=>setRoi(r.toString())}>{r}%</RetroButton>
          ))}
        </div>
      </RetroCard>
      <RetroCard title="📈 ROI History" color="cyan">
        {history.length===0?<p className="text-gray-400 text-center py-4">No rates set yet.</p>:
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b-4 border-cyan-400">
          <th className="text-left text-cyan-400 p-2">Date</th><th className="text-left text-cyan-400 p-2">ROI %</th><th className="text-left text-cyan-400 p-2">Note</th>
        </tr></thead><tbody>{history.slice(0,30).map((r:any)=>(
          <tr key={r.id} className="border-b border-gray-800">
            <td className="p-2 text-white text-xs">{r.rate_date}</td>
            <td className="p-2 text-green-400 font-bold">{parseFloat(r.roi_percentage).toFixed(4)}%</td>
            <td className="p-2 text-gray-400 text-xs">{r.note||'—'}</td>
          </tr>
        ))}</tbody></table></div>}
      </RetroCard>
    </div>
  );
};

// ─── SITE SETTINGS (Logo, Favicon, Name) ─────────
const SiteSettingsTab: React.FC = () => {
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [siteName, setSiteName] = useState('');
  const [settings, setSettings] = useState<any>({});
  const [ld, setLd] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/settings', { credentials: 'include' });
        const s = await r.json();
        setSettings(s);
        if (s.logo) setLogo(s.logo);
        if (s.favicon) setFavicon(s.favicon);
        if (s.site_name) setSiteName(s.site_name);
      } catch {}
    })();
  }, []);

  const handleFile = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg('Max 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async (key: string, value: string) => {
    if (!value) return;
    setLd(true); setMsg('');
    try {
      await fetch(`/api/settings/${key}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }), credentials: 'include'
      });

      // Apply favicon immediately in browser
      if (key === 'favicon') {
        const existing = document.querySelectorAll("link[rel*='icon']");
        existing.forEach(el => el.remove());
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = value.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        link.href = value + '?v=' + Date.now();
        document.head.appendChild(link);
      }

      // Update page title
      if (key === 'site_name') {
        document.title = `🪐 ${value} — Investment Platform`;
      }

      setSettings({ ...settings, [key]: value });
      setMsg(`✅ ${key} saved & applied!`);
    } catch (e: any) { setMsg(e.message); }
    finally { setLd(false); }
  };

  return (
    <div className="space-y-4">
      {msg&&<div className={`p-2 font-bold border text-sm rounded ${msg.includes('✅')?'bg-green-500/20 border-green-400 text-green-400':'bg-red-500/20 border-red-400 text-red-400'}`}>{msg}</div>}
      <RetroCard title="🏢 Company Logo" color="pink">
        <p className="text-gray-400 text-xs mb-2">Upload logo. Max 2MB. Auto-sized to fit header on all pages.</p>
        <input type="file" accept="image/*" onChange={handleFile(setLogo)} className="w-full bg-black border border-pink-400/60 rounded text-white px-3 py-1.5 text-sm file:mr-3 file:bg-pink-400 file:text-black file:border-0 file:font-bold file:px-3 file:py-1 file:cursor-pointer file:rounded"/>
        <div className="mt-2 flex items-center gap-3">
          {(logo || settings.logo) && <img src={logo || settings.logo} alt="Logo" className="h-12 w-auto object-contain border border-cyan-400/40 rounded bg-black p-1"/>}
          {logo && <RetroButton size="sm" variant="success" onClick={()=>save('logo',logo)} disabled={ld}>{ld?'Saving...':'Save Logo'}</RetroButton>}
          {!logo && settings.logo && <span className="text-green-400 text-xs">✅ Logo is set</span>}
          {!logo && !settings.logo && <span className="text-gray-500 text-xs">No logo uploaded yet</span>}
        </div>
      </RetroCard>

      <RetroCard title="🌐 Browser Favicon" color="cyan">
        <p className="text-gray-400 text-xs mb-2">Square image for browser tab icon. Recommended 32x32 or 64x64 pixels.</p>
        <input type="file" accept="image/*" onChange={handleFile(setFavicon)} className="w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-1.5 text-sm file:mr-3 file:bg-cyan-400 file:text-black file:border-0 file:font-bold file:px-3 file:py-1 file:cursor-pointer file:rounded"/>
        <div className="mt-2 flex items-center gap-3">
          {(favicon || settings.favicon) && <img src={favicon || settings.favicon} alt="Fav" className="h-10 w-10 object-contain border border-cyan-400/40 rounded bg-black p-0.5"/>}
          {favicon && <RetroButton size="sm" variant="success" onClick={()=>save('favicon',favicon)} disabled={ld}>{ld?'Saving...':'Save Favicon'}</RetroButton>}
          {!favicon && settings.favicon && <span className="text-green-400 text-xs">✅ Favicon is set</span>}
          {!favicon && !settings.favicon && <span className="text-gray-500 text-xs">No favicon uploaded yet (uses default 🪐)</span>}
        </div>
      </RetroCard>

      <RetroCard title="📝 Site Name" color="purple">
        <div className="flex gap-2 flex-wrap">
          <RetroInput value={siteName} onChange={e=>setSiteName(e.target.value)} placeholder="Kepler432B" className="flex-1"/>
          <RetroButton variant="success" onClick={()=>save('site_name',siteName)} disabled={ld}>{ld?'Saving...':'Save'}</RetroButton>
        </div>
        {settings.site_name && <p className="text-green-400 text-xs mt-1">Current: {settings.site_name}</p>}
      </RetroCard>

      {/* CEX Gateway Toggles */}
      <RetroCard title="🔗 Crypto Payment Gateways" color="cyan">
        <p className="text-gray-400 text-xs mb-3">Enable/disable Binance Pay and OKX Pay for users. Configure API keys in .env file.</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-black border border-yellow-400/40 rounded p-3">
            <div><p className="text-yellow-400 font-bold">🟡 Binance Pay</p><p className="text-gray-500 text-xs">Users can deposit via Binance Pay checkout</p></div>
            <RetroButton size="sm" variant={settings.binance_pay_enabled==='true'?'warning':'success'} onClick={()=>{const nv=settings.binance_pay_enabled==='true'?'false':'true';save('binance_pay_enabled',nv);setSettings({...settings,binance_pay_enabled:nv});}} disabled={ld}>
              {settings.binance_pay_enabled==='true'?'Disable':'Enable'}
            </RetroButton>
          </div>
          <div className="flex justify-between items-center bg-black border border-purple-400/40 rounded p-3">
            <div><p className="text-purple-400 font-bold">⚫ OKX Pay</p><p className="text-gray-500 text-xs">Users can deposit via OKX Pay checkout</p></div>
            <RetroButton size="sm" variant={settings.okx_pay_enabled==='true'?'warning':'success'} onClick={()=>{const nv=settings.okx_pay_enabled==='true'?'false':'true';save('okx_pay_enabled',nv);setSettings({...settings,okx_pay_enabled:nv});}} disabled={ld}>
              {settings.okx_pay_enabled==='true'?'Disable':'Enable'}
            </RetroButton>
          </div>
        </div>
      </RetroCard>
    </div>
  );
};

// ─── CRYPTO DEPOSITS / WITHDRAWALS ADMIN ─────────
const CryptoAdminTab: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);

  const loadDeps = async () => {
    try {
      const r = await fetch('/api/crypto-deposit/all-deposits', { credentials: 'include' });
      const d = await r.json();
      setDeposits(Array.isArray(d) ? d : []);
    } catch {}
  };

  useEffect(() => { loadDeps(); }, []);

  const refresh = loadDeps;

  const statusColor = (s: string) => {
    if (s === 'credited') return 'bg-green-400 text-black';
    if (s === 'verifying' || s === 'pending') return 'bg-yellow-400 text-black';
    if (s === 'failed' || s === 'expired') return 'bg-red-400 text-black';
    return 'bg-gray-400 text-black';
  };

  return (
    <div className="space-y-4">
      <RetroCard title="🔗 Crypto Deposits (On-Chain + CEX)" color="cyan">
        <div className="flex gap-2 mb-3">
          <RetroButton variant="secondary" size="sm" onClick={refresh}>↻ Refresh</RetroButton>
          <span className="text-gray-400 text-xs self-center">{deposits.length} total deposits</span>
        </div>
        {deposits.length === 0 ? <p className="text-gray-400 text-center py-6">No crypto deposits yet.</p> :
        <div className="space-y-2 max-h-[500px] overflow-y-auto">{deposits.map((d: any) => (
          <div key={d.id} className="bg-black border border-cyan-400/40 rounded p-3">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-white font-bold text-xs">{d.user_name || 'Unknown'} <span className="text-gray-500">({d.user_email})</span></p>
                <p className="text-cyan-400 text-xs font-bold">{d.method} · ${parseFloat(d.amount_expected || 0).toLocaleString()} {d.token_symbol || ''}</p>
                {d.chain && <p className="text-purple-400 text-xs">⛓️ {d.chain}</p>}
                {d.tx_hash && <p className="text-yellow-400 text-xs font-mono truncate">🔗 {d.tx_hash}</p>}
                {d.from_address && <p className="text-gray-400 text-xs font-mono truncate">From: {d.from_address}</p>}
                {d.to_address && <p className="text-gray-400 text-xs font-mono truncate">To: {d.to_address}</p>}
                {d.cex_order_id && <p className="text-gray-400 text-xs">Order: {d.cex_order_id}</p>}
                {d.verification_error && <p className="text-red-400 text-xs mt-1">❌ {d.verification_error}</p>}
                {d.amount_received && <p className="text-green-400 text-xs">Received: ${parseFloat(d.amount_received).toFixed(6)}</p>}
                <p className="text-gray-600 text-xs mt-1">{new Date(d.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${statusColor(d.verification_status)}`}>
                  {d.verification_status?.toUpperCase()}
                </span>
                {d.block_confirmations > 0 && <p className="text-gray-500 text-xs mt-1">{d.block_confirmations} blocks</p>}
              </div>
            </div>
          </div>
        ))}</div>}
      </RetroCard>
    </div>
  );
};

// ─── REFERRAL TRACKING ──────────────────────────
const ReferralsTab: React.FC = () => {
  const [data, setData] = useState<any>({ users: [], earnings: [], deposits: [] });
  const [tab, setTab] = useState<'users'|'earnings'|'deposits'>('users');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/users/referrals', { credentials: 'include' });
        const d = await r.json();
        setData(d);
      } catch {}
    })();
  }, []);

  const referredUsers = (data.users || []).filter((u: any) => u.referredBy);

  return (
    <div className="space-y-4">
      <RetroCard title="🔗 Referral Tracking" color="purple">
        <div className="flex gap-2 mb-3">
          {(['users', 'earnings', 'deposits'] as const).map(t => (
            <RetroButton key={t} variant={tab === t ? 'primary' : 'secondary'} size="sm" onClick={() => setTab(t)}>
              {t === 'users' ? `Referred Users (${referredUsers.length})` : t === 'earnings' ? `Commissions (${(data.earnings || []).length})` : `Deposits (${(data.deposits || []).length})`}
            </RetroButton>
          ))}
        </div>

        {tab === 'users' && (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {referredUsers.length === 0 ? <p className="text-gray-400 text-center py-4">No referral registrations yet.</p> :
              referredUsers.map((u: any) => {
                const userDeposits = (data.deposits || []).filter((d: any) => d.userId === u.id);
                const totalDeposited = userDeposits.reduce((s: number, d: any) => s + d.amount, 0);
                return (
                  <div key={u.id} className="bg-black border border-purple-400/40 rounded p-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <p className="text-white font-bold text-sm">{u.name}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                        <p className="text-purple-400 text-xs mt-1">Referred by: <span className="font-bold">{u.referrerName || u.referredBy}</span> ({u.referrerEmail})</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 text-sm font-bold">${totalDeposited.toLocaleString()} deposited</p>
                        <p className="text-cyan-400 text-xs">Invested: ${u.totalInvested.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">Joined: {new Date(u.joinedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {userDeposits.length > 0 && (
                      <div className="mt-2 bg-gray-900 rounded p-2">
                        <p className="text-gray-400 text-xs font-bold mb-1">Recent Deposits:</p>
                        {userDeposits.slice(0, 5).map((d: any, i: number) => (
                          <p key={i} className="text-gray-500 text-xs">
                            {d.method} · ${d.amount} · <span className={d.status === 'approved' ? 'text-green-400' : d.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}>{d.status}</span> · {new Date(d.date).toLocaleDateString()}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {(data.earnings || []).length === 0 ? <p className="text-gray-400 text-center py-4">No commission earnings yet.</p> :
              (data.earnings || []).map((e: any) => (
                <div key={e.id} className="bg-black border border-green-400/40 rounded p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white text-sm font-bold">{e.referrerName} <span className="text-gray-500 text-xs">({e.referrerEmail})</span></p>
                    <p className="text-gray-400 text-xs">← {e.referredName} ({e.referredEmail}) · Tier {e.tier}</p>
                  </div>
                  <p className="text-green-400 font-bold text-lg">+${e.amount.toFixed(2)}</p>
                </div>
              ))}
          </div>
        )}

        {tab === 'deposits' && (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {(data.deposits || []).slice(0, 50).map((d: any, i: number) => (
              <div key={i} className="bg-black border border-gray-700 rounded p-2 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm">{d.userName} <span className="text-gray-500 text-xs">({d.userEmail})</span></p>
                  <p className="text-gray-400 text-xs">{d.method || '—'} · {new Date(d.date).toLocaleDateString()}</p>
                </div>
                <p className={`font-bold ${d.status === 'approved' ? 'text-green-400' : d.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                  ${d.amount.toLocaleString()} · {d.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </RetroCard>
    </div>
  );
};