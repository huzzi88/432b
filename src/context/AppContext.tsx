import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, InvestmentPlan, Investment, Transaction, PaymentGateway, Notification, Task } from '../types';
import { isValidEmail, isValidPin, validatePasswordStrength, sanitize } from '../utils/security';
import { api, setToken, getToken } from '../utils/api';

interface Ctx {
  currentUser: User|null; isAdmin: boolean; isLoading: boolean; apiError: string|null;
  isDarkMode: boolean; toggleTheme: () => void;
  login: (e:string,p:string,pin:string)=>Promise<any>; verifyAdminPins: (p1:string,p2:string,p3:string)=>Promise<any>;
  register: (n:string,e:string,p:string,pin:string,ref?:string)=>Promise<any>; logout: ()=>void;
  users: User[]; walletUsers: any[]; plans: InvestmentPlan[]; slots: any[]; lots: any[];
  investments: Investment[]; transactions: Transaction[]; paymentGateways: PaymentGateway[];
  notifications: Notification[]; tasks: Task[]; competitions: any[]; competitionEntries: any[]; kycDocs: any[];
  blogCategories: any[]; blogPosts: any[];
  refreshUsers:()=>Promise<void>; refreshWalletUsers:()=>Promise<void>; refreshPlans:()=>Promise<void>;
  refreshSlots:()=>Promise<void>; refreshLots:()=>Promise<void>;
  refreshInvestments:()=>Promise<void>; refreshTransactions:()=>Promise<void>; refreshGateways:()=>Promise<void>;
  refreshNotifications:()=>Promise<void>; refreshTasks:()=>Promise<void>; refreshProfile:()=>Promise<void>;
  refreshCompetitions:()=>Promise<void>; refreshKYC:()=>Promise<void>;
  refreshBlogs:()=>Promise<void>; refreshAll:()=>Promise<void>;
  apiUpdateUserBalance:(id:string,a:number,t:'add'|'subtract')=>Promise<void>;
  apiBlockUser:(id:string)=>Promise<void>;
  apiUpdateUser:(id:string,d:any)=>Promise<void>;
  apiCreatePlan:(d:any)=>Promise<void>; apiUpdatePlan:(id:string,d:any)=>Promise<void>; apiDeletePlan:(id:string)=>Promise<void>;
  apiCreateSlot:(d:any)=>Promise<void>; apiUpdateSlot:(id:string,d:any)=>Promise<void>; apiDeleteSlot:(id:string)=>Promise<void>;
  apiCreateLot:(d:any)=>Promise<void>; apiUpdateLot:(id:string,d:any)=>Promise<void>; apiDeleteLot:(id:string)=>Promise<void>;
  apiUpdateTransaction:(id:string,s:string,n?:string)=>Promise<void>;
  apiReviewInvestment:(id:string,s:string,n?:string)=>Promise<void>;
  apiCreateGateway:(d:any)=>Promise<void>; apiUpdateGateway:(id:string,d:any)=>Promise<void>; apiDeleteGateway:(id:string)=>Promise<void>;
  apiCreateNotification:(d:any)=>Promise<void>; apiUpdateNotification:(id:string,d:any)=>Promise<void>;
  apiCreateTask:(d:any)=>Promise<void>; apiReviewTask:(id:string,s:string,r?:string)=>Promise<void>;
  apiReviewKYC:(uid:string,s:string,r?:string)=>Promise<void>;
  apiCreateCompetition:(d:any)=>Promise<void>; apiUpdateCompetition:(id:string,d:any)=>Promise<void>; apiDeleteCompetition:(id:string)=>Promise<void>;
  apiCreateBlogCategory:(d:any)=>Promise<void>; apiUpdateBlogCategory:(id:string,d:any)=>Promise<void>; apiDeleteBlogCategory:(id:string)=>Promise<void>;
  apiCreateBlogPost:(d:any)=>Promise<void>; apiUpdateBlogPost:(id:string,d:any)=>Promise<void>; apiDeleteBlogPost:(id:string)=>Promise<void>;
  apiExportTable:(t:string)=>Promise<any>; apiImportTable:(t:string,d:any[])=>Promise<void>;
  apiGetCurrentROI:()=>Promise<any>; apiGetROIHistory:()=>Promise<any>;
  apiSetDailyROI:(roi:number,note?:string)=>Promise<any>; apiUpdateROIDate:(d:string,roi:number,note?:string)=>Promise<any>;
  apiConvertCurrency:(from:string,to:string,amt:number)=>Promise<any>;
  apiDeposit:(a:number,m:string,trxId:string,proofImg:string,chain?:string,txHash?:string)=>Promise<void>;
  apiWithdraw:(a:number,m:string,d:string,p:string,chain?:string,wallet?:string)=>Promise<void>;
  apiInvest:(planId:string,amt:number,level?:string,slotId?:string,lotId?:string)=>Promise<void>;
  apiSubmitTask:(id:string,url:string)=>Promise<void>;
  apiSubmitKYC:(cnic:string,cnicImg:string)=>Promise<void>;
  apiUpdateProfile:(d:any)=>Promise<void>;
  apiForgotPassword:(e:string,p?:string,c?:string)=>Promise<any>;
  apiJoinCompetition:(id:string)=>Promise<void>;
}

const AppContext = createContext<Ctx|undefined>(undefined);

export const AppProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
  const [currentUser,setCurrentUser]=useState<User|null>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [apiError,setApiError]=useState<string|null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [users,setUsers]=useState<User[]>([]);
  const [walletUsers,setWalletUsers]=useState<any[]>([]);
  const [plans,setPlans]=useState<InvestmentPlan[]>([]);
  const [slots,setSlots]=useState<any[]>([]);
  const [lots,setLots]=useState<any[]>([]);
  const [investments,setInvestments]=useState<Investment[]>([]);
  const [transactions,setTransactions]=useState<Transaction[]>([]);
  const [paymentGateways,setPaymentGateways]=useState<PaymentGateway[]>([]);
  const [notifications,setNotifications]=useState<Notification[]>([]);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [competitions,setCompetitions]=useState<any[]>([]);
  const [competitionEntries,setCompetitionEntries]=useState<any[]>([]);
  const [kycDocs,setKycDocs]=useState<any[]>([]);
  const [blogCategories,setBlogCategories]=useState<any[]>([]);
  const [blogPosts,setBlogPosts]=useState<any[]>([]);
  const [pendingAdminId,setPendingAdminId]=useState<string|null>(null);

  // Theme toggle
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // Add smooth transition class during theme change
    root.classList.add('theme-transition');
    const timer = setTimeout(() => root.classList.remove('theme-transition'), 400);
    return () => clearTimeout(timer);
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Session restore
  useEffect(()=>{(async()=>{const t=getToken();if(!t){setIsLoading(false);return;} try{const d=await api.getProfile();if(d.user)setCurrentUser(d.user as User);else setToken(null);}catch{setToken(null);}finally{setIsLoading(false);}})();},[]);

  // Load data
  useEffect(()=>{
    if(!currentUser){setUsers([]);setWalletUsers([]);setPlans([]);setSlots([]);setLots([]);setInvestments([]);setTransactions([]);setPaymentGateways([]);setNotifications([]);setTasks([]);setCompetitions([]);setCompetitionEntries([]);setKycDocs([]);setBlogCategories([]);setBlogPosts([]);return;}
    (async()=>{try{
      const [pl,gw,no,co,sl,lo,bc,bp,wu]=await Promise.allSettled([api.getPlans(),api.getGateways(),api.getNotifications(),api.getCompetitions(),api.getSlots(),api.getLots(),api.getBlogCategories(),api.getBlogPosts(),api.getWalletUsers()]);
      if(pl.status==='fulfilled')setPlans(pl.value.plans||pl.value||[]);
      if(gw.status==='fulfilled')setPaymentGateways(gw.value.gateways||gw.value||[]);
      if(no.status==='fulfilled')setNotifications(no.value.notifications||no.value||[]);
      if(co.status==='fulfilled')setCompetitions(co.value||[]);
      if(sl.status==='fulfilled')setSlots(sl.value||[]);
      if(lo.status==='fulfilled')setLots(lo.value||[]);
      if(bc.status==='fulfilled')setBlogCategories(bc.value||[]);
      if(bp.status==='fulfilled')setBlogPosts(bp.value||[]);
      if(wu.status==='fulfilled')setWalletUsers(wu.value||[]);
      if(currentUser.isAdmin){
        const [u,i,t,tk,k,ce]=await Promise.allSettled([api.getUsers(),api.getAllInvestments(),api.getAllTransactions(),api.getAllTasks(),api.getAllKYC(),api.getAllCompEntries()]);
        if(u.status==='fulfilled')setUsers(u.value.users||u.value||[]);
        if(i.status==='fulfilled')setInvestments(i.value.investments||i.value||[]);
        if(t.status==='fulfilled')setTransactions(t.value.transactions||t.value||[]);
        if(tk.status==='fulfilled')setTasks(tk.value.tasks||tk.value||[]);
        if(k.status==='fulfilled')setKycDocs(k.value||[]);
        if(ce.status==='fulfilled')setCompetitionEntries(ce.value||[]);
      } else {
        const [i,t,tk,ce]=await Promise.allSettled([api.getMyInvestments(),api.getMyTransactions(),api.getMyTasks(),api.getMyCompEntries()]);
        if(i.status==='fulfilled')setInvestments(i.value.investments||i.value||[]);
        if(t.status==='fulfilled')setTransactions(t.value.transactions||t.value||[]);
        if(tk.status==='fulfilled')setTasks(tk.value.tasks||tk.value||[]);
        if(ce.status==='fulfilled')setCompetitionEntries(ce.value||[]);
      }
    }catch(e:any){setApiError(e.message);}})();
  },[currentUser]);

  // Refreshers
  const refreshProfile=useCallback(async()=>{try{const d=await api.getProfile();if(d.user)setCurrentUser(d.user as User);}catch{}},[]);
  const refreshUsers=useCallback(async()=>{try{const d=await api.getUsers();setUsers(d.users||d||[]);}catch{}},[]);
  const refreshWalletUsers=useCallback(async()=>{try{setWalletUsers(await api.getWalletUsers());}catch{}},[]);
  const refreshPlans=useCallback(async()=>{try{const d=await api.getPlans();setPlans(d.plans||d||[]);}catch{}},[]);
  const refreshSlots=useCallback(async()=>{try{setSlots(await api.getSlots());}catch{}},[]);
  const refreshLots=useCallback(async()=>{try{setLots(await api.getLots());}catch{}},[]);
  const refreshInvestments=useCallback(async()=>{try{const d=currentUser?.isAdmin?await api.getAllInvestments():await api.getMyInvestments();setInvestments(d.investments||d||[]);}catch{}},[currentUser]);
  const refreshTransactions=useCallback(async()=>{try{const d=currentUser?.isAdmin?await api.getAllTransactions():await api.getMyTransactions();setTransactions(d.transactions||d||[]);}catch{}},[currentUser]);
  const refreshGateways=useCallback(async()=>{try{const d=await api.getGateways();setPaymentGateways(d.gateways||d||[]);}catch{}},[]);
  const refreshNotifications=useCallback(async()=>{try{const d=await api.getNotifications();setNotifications(d.notifications||d||[]);}catch{}},[]);
  const refreshTasks=useCallback(async()=>{try{const d=currentUser?.isAdmin?await api.getAllTasks():await api.getMyTasks();setTasks(d.tasks||d||[]);}catch{}},[currentUser]);
  const refreshCompetitions=useCallback(async()=>{try{setCompetitions(await api.getCompetitions());}catch{}},[]);
  const refreshKYC=useCallback(async()=>{try{setKycDocs(await api.getAllKYC());}catch{}},[]);
  const refreshBlogs=useCallback(async()=>{try{setBlogCategories(await api.getBlogCategories());setBlogPosts(await api.getBlogPosts());}catch{}},[]);
  const refreshAll=useCallback(async()=>{await Promise.allSettled([refreshProfile(),refreshUsers(),refreshWalletUsers(),refreshPlans(),refreshSlots(),refreshLots(),refreshInvestments(),refreshTransactions(),refreshGateways(),refreshNotifications(),refreshTasks(),refreshCompetitions(),refreshKYC(),refreshBlogs()]);},[refreshProfile,refreshUsers,refreshWalletUsers,refreshPlans,refreshSlots,refreshLots,refreshInvestments,refreshTransactions,refreshGateways,refreshNotifications,refreshTasks,refreshCompetitions,refreshKYC,refreshBlogs]);

  // Auth
  const login=useCallback(async(email:string,password:string,pin:string)=>{const e=sanitize(email).toLowerCase().trim();if(!e||!password)return{success:false,error:'Fill all fields'};if(!isValidEmail(e))return{success:false,error:'Invalid email'};if(!isValidPin(pin))return{success:false,error:'PIN must be 4 digits'};try{const d=await api.login(e,password,pin);if(d.requireAdminPins){setPendingAdminId(d.userId);return{success:false,requireAdminPins:true};}if(d.token){setToken(d.token);setCurrentUser(d.user as User);return{success:true};}return{success:false,error:'Login failed'};}catch(err:any){return{success:false,error:err.message};}},[]);
  const verifyAdminPins=useCallback(async(p1:string,p2:string,p3:string)=>{if(!pendingAdminId)return{success:false,error:'Session expired'};try{const d=await api.verifyAdminPins(pendingAdminId,p1,p2,p3);if(d.token){setToken(d.token);setCurrentUser(d.user as User);setPendingAdminId(null);return{success:true};}return{success:false,error:'Failed'};}catch(err:any){return{success:false,error:err.message};}},[pendingAdminId]);
  const register=useCallback(async(name:string,email:string,password:string,pin:string,ref?:string)=>{const cn=sanitize(name),ce=sanitize(email).toLowerCase().trim();if(!cn||cn.length<2)return{success:false,error:'Name min 2 chars'};if(!isValidEmail(ce))return{success:false,error:'Invalid email'};const pw=validatePasswordStrength(password);if(!pw.valid)return{success:false,error:pw.errors[0]};if(!isValidPin(pin))return{success:false,error:'PIN must be 4 digits'};try{const d=await api.register(cn,ce,password,pin,ref);return d.user||d.success?{success:true}:{success:false,error:'Failed'};}catch(err:any){return{success:false,error:err.message};}},[]);
  const logout=useCallback(()=>{setToken(null);setCurrentUser(null);setPendingAdminId(null);},[]);

  // Admin actions
  const apiUpdateUserBalance=useCallback(async(id:string,a:number,t:'add'|'subtract')=>{await api.updateUserBalance(id,a,t);await refreshUsers();},[refreshUsers]);
  const apiBlockUser=useCallback(async(id:string)=>{await api.blockUser(id);await refreshUsers();},[refreshUsers]);
  const apiUpdateUser=useCallback(async(id:string,d:any)=>{await api.updateUser(id,d);await refreshUsers();await refreshWalletUsers();},[refreshUsers,refreshWalletUsers]);
  const apiCreatePlan=useCallback(async(d:any)=>{await api.createPlan(d);await refreshPlans();},[refreshPlans]);
  const apiUpdatePlan=useCallback(async(id:string,d:any)=>{await api.updatePlan(id,d);await refreshPlans();},[refreshPlans]);
  const apiDeletePlan=useCallback(async(id:string)=>{await api.deletePlan(id);await refreshPlans();},[refreshPlans]);
  const apiCreateSlot=useCallback(async(d:any)=>{await api.createSlot(d);await refreshSlots();},[refreshSlots]);
  const apiUpdateSlot=useCallback(async(id:string,d:any)=>{await api.updateSlot(id,d);await refreshSlots();},[refreshSlots]);
  const apiDeleteSlot=useCallback(async(id:string)=>{await api.deleteSlot(id);await refreshSlots();},[refreshSlots]);
  const apiCreateLot=useCallback(async(d:any)=>{await api.createLot(d);await refreshLots();},[refreshLots]);
  const apiUpdateLot=useCallback(async(id:string,d:any)=>{await api.updateLot(id,d);await refreshLots();},[refreshLots]);
  const apiDeleteLot=useCallback(async(id:string)=>{await api.deleteLot(id);await refreshLots();},[refreshLots]);
  const apiUpdateTransaction=useCallback(async(id:string,s:string,n?:string)=>{await api.updateTransaction(id,s,n);await Promise.allSettled([refreshTransactions(),refreshUsers(),refreshProfile()]);},[refreshTransactions,refreshUsers,refreshProfile]);
  const apiReviewInvestment=useCallback(async(id:string,s:string,n?:string)=>{await api.reviewInvestment(id,s,n);await Promise.allSettled([refreshInvestments(),refreshUsers(),refreshProfile()]);},[refreshInvestments,refreshUsers,refreshProfile]);
  const apiCreateGateway=useCallback(async(d:any)=>{await api.createGateway(d);await refreshGateways();},[refreshGateways]);
  const apiUpdateGateway=useCallback(async(id:string,d:any)=>{await api.updateGateway(id,d);await refreshGateways();},[refreshGateways]);
  const apiDeleteGateway=useCallback(async(id:string)=>{await api.deleteGateway(id);await refreshGateways();},[refreshGateways]);
  const apiCreateNotification=useCallback(async(d:any)=>{await api.createNotification(d);await refreshNotifications();},[refreshNotifications]);
  const apiUpdateNotification=useCallback(async(id:string,d:any)=>{await api.updateNotification(id,d);await refreshNotifications();},[refreshNotifications]);
  const apiCreateTask=useCallback(async(d:any)=>{await api.createTask(d);await refreshTasks();},[refreshTasks]);
  const apiReviewTask=useCallback(async(id:string,s:string,r?:string)=>{await api.reviewTask(id,s,r);await Promise.allSettled([refreshTasks(),refreshUsers(),refreshProfile()]);},[refreshTasks,refreshUsers,refreshProfile]);
  const apiReviewKYC=useCallback(async(uid:string,s:string,r?:string)=>{await api.reviewKYC(uid,s,r);await Promise.allSettled([refreshKYC(),refreshUsers()]);},[refreshKYC,refreshUsers]);
  const apiCreateCompetition=useCallback(async(d:any)=>{await api.createCompetition(d);await refreshCompetitions();},[refreshCompetitions]);
  const apiUpdateCompetition=useCallback(async(id:string,d:any)=>{await api.updateCompetition(id,d);await refreshCompetitions();},[refreshCompetitions]);
  const apiDeleteCompetition=useCallback(async(id:string)=>{await api.deleteCompetition(id);await refreshCompetitions();},[refreshCompetitions]);
  const apiCreateBlogCategory=useCallback(async(d:any)=>{await api.createBlogCategory(d);await refreshBlogs();},[refreshBlogs]);
  const apiUpdateBlogCategory=useCallback(async(id:string,d:any)=>{await api.updateBlogCategory(id,d);await refreshBlogs();},[refreshBlogs]);
  const apiDeleteBlogCategory=useCallback(async(id:string)=>{await api.deleteBlogCategory(id);await refreshBlogs();},[refreshBlogs]);
  const apiCreateBlogPost=useCallback(async(d:any)=>{await api.createBlogPost(d);await refreshBlogs();},[refreshBlogs]);
  const apiUpdateBlogPost=useCallback(async(id:string,d:any)=>{await api.updateBlogPost(id,d);await refreshBlogs();},[refreshBlogs]);
  const apiDeleteBlogPost=useCallback(async(id:string)=>{await api.deleteBlogPost(id);await refreshBlogs();},[refreshBlogs]);
  const apiExportTable=useCallback(async(t:string)=>await api.exportTable(t),[]);
  const apiImportTable=useCallback(async(t:string,d:any[])=>{await api.importTable(t,d);await refreshAll();},[refreshAll]);
  const apiGetCurrentROI=useCallback(async()=>await api.getCurrentROI(),[]);
  const apiGetROIHistory=useCallback(async()=>await api.getROIHistory(),[]);
  const apiSetDailyROI=useCallback(async(roi:number,note?:string)=>await api.setDailyROI(roi,note),[]);
  const apiUpdateROIDate=useCallback(async(d:string,roi:number,note?:string)=>await api.updateROIDate(d,roi,note),[]);
  const apiConvertCurrency=useCallback(async(from:string,to:string,amt:number)=>await api.convertCurrency(from,to,amt),[]);
  const apiDeposit=useCallback(async(a:number,m:string,trxId:string,proofImg:string,chain?:string,txHash?:string)=>{await api.deposit(a,m,trxId,proofImg,chain,txHash);await refreshTransactions();},[refreshTransactions]);
  const apiWithdraw=useCallback(async(a:number,m:string,d:string,p:string,chain?:string,wallet?:string)=>{await api.withdraw(a,m,d,p,chain,wallet);await refreshTransactions();},[refreshTransactions]);
  const apiInvest=useCallback(async(pid:string,a:number,level?:string,sid?:string,lid?:string)=>{await api.invest(pid,a,level,sid,lid);await Promise.allSettled([refreshInvestments(),refreshProfile(),refreshTransactions()]);},[refreshInvestments,refreshProfile,refreshTransactions]);
  const apiSubmitTask=useCallback(async(id:string,u:string)=>{await api.submitTask(id,u);await refreshTasks();},[refreshTasks]);
  const apiSubmitKYC=useCallback(async(cnic:string,cnicImg:string)=>{await api.submitKYC(cnic,cnicImg);await refreshProfile();},[refreshProfile]);
  const apiUpdateProfile=useCallback(async(d:any)=>{const r=await api.updateProfile(d);if(r.user)setCurrentUser(r.user as User);},[]);
  const apiForgotPassword=useCallback(async(e:string,p?:string,c?:string)=>await api.forgotPassword(e,p,c),[]);
  const apiJoinCompetition=useCallback(async(id:string)=>{await api.joinCompetition(id);await refreshCompetitions();},[refreshCompetitions]);

  const isAdmin=currentUser?.isAdmin===true;

  if(isLoading) return <div className="min-h-screen bg-theme-primary flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 mb-4 uppercase">Kepler432B</h1><div className="text-cyan-400 text-lg font-bold animate-pulse">Connecting...</div></div></div>;

  return <AppContext.Provider value={{currentUser,isAdmin,isLoading,apiError,isDarkMode,toggleTheme,login,verifyAdminPins,register,logout,users,walletUsers,plans,slots,lots,investments,transactions,paymentGateways,notifications,tasks,competitions,competitionEntries,kycDocs,blogCategories,blogPosts,refreshUsers,refreshWalletUsers,refreshPlans,refreshSlots,refreshLots,refreshInvestments,refreshTransactions,refreshGateways,refreshNotifications,refreshTasks,refreshProfile,refreshCompetitions,refreshKYC,refreshBlogs,refreshAll,apiUpdateUserBalance,apiBlockUser,apiUpdateUser,apiCreatePlan,apiUpdatePlan,apiDeletePlan,apiCreateSlot,apiUpdateSlot,apiDeleteSlot,apiCreateLot,apiUpdateLot,apiDeleteLot,apiUpdateTransaction,apiReviewInvestment,apiCreateGateway,apiUpdateGateway,apiDeleteGateway,apiCreateNotification,apiUpdateNotification,apiCreateTask,apiReviewTask,apiReviewKYC,apiCreateCompetition,apiUpdateCompetition,apiDeleteCompetition,apiCreateBlogCategory,apiUpdateBlogCategory,apiDeleteBlogCategory,apiCreateBlogPost,apiUpdateBlogPost,apiDeleteBlogPost,apiExportTable,apiImportTable,apiGetCurrentROI,apiGetROIHistory,apiSetDailyROI,apiUpdateROIDate,apiConvertCurrency,apiDeposit,apiWithdraw,apiInvest,apiSubmitTask,apiSubmitKYC,apiUpdateProfile,apiForgotPassword,apiJoinCompetition}}>{children}</AppContext.Provider>;
};

export const useApp=()=>{const c=useContext(AppContext);if(!c)throw new Error('useApp must be within AppProvider');return c;};
