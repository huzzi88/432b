// ═══════════════════════════════════════════════════════
// KEPLER432B — Hardened API Client
// - Uses credentials:'include' for httpOnly cookie auth
// - Also stores token in localStorage as fallback
// - Auto-handles 401 (session expired → redirect to login)
// - CSRF token sent via X-CSRF-Token header
// ═══════════════════════════════════════════════════════

const VITE_URL: string = (import.meta.env.VITE_API_URL as string) || '';
const API_BASE = VITE_URL || ((typeof window !== 'undefined' && (window as any).__API_URL__) || '/api');

// localStorage token = fallback for environments where cookies don't work
let authToken: string | null = localStorage.getItem('k432b_token');

export const setToken = (t: string | null) => {
  authToken = t;
  if (t) localStorage.setItem('k432b_token', t);
  else localStorage.removeItem('k432b_token');
};
export const getToken = (): string | null => authToken;

// Read CSRF token from cookie (non-httpOnly, readable by JS)
const getCsrfToken = (): string => {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : '';
};

// Request headers — includes auth token + CSRF
const headers = (): HeadersInit => {
  const h: HeadersInit = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(), // CSRF double-submit
  };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
};

// Core request function with credentials:'include' for cookies
const rq = async (method: string, path: string, body?: any) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',  // ← sends/receives httpOnly cookies
  });

  // Handle non-JSON responses gracefully
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return {};
  }

  const data = await res.json();

  // Auto-handle session expiry
  if (res.status === 401 && data.error?.includes('expired')) {
    setToken(null);
    // Trigger re-render to show login page
    window.dispatchEvent(new Event('auth-expired'));
  }

  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
};

export const api = {
  // Auth
  register: (name: string, email: string, password: string, login_pin: string, referral_code?: string) =>
    rq('POST', '/auth/register', { name, email, password, login_pin, referral_code }),
  login: (email: string, password: string, login_pin: string) =>
    rq('POST', '/auth/login', { email, password, login_pin }),
  verifyAdminPins: (userId: string, p1: string, p2: string, p3: string) =>
    rq('POST', '/auth/admin/verify-pins', { userId, pin1: p1, pin2: p2, pin3: p3 }),
  getProfile: () => rq('GET', '/auth/profile'),
  logout: () => rq('POST', '/auth/logout'),

  // Users
  getUsers: () => rq('GET', '/users/all-users'),
  getWalletUsers: () => rq('GET', '/users/wallet-users'),
  getReferralTracking: () => rq('GET', '/users/referrals'),
  updateUserBalance: (id: string, amount: number, type: 'add'|'subtract') => rq('PUT', `/users/users/${id}/balance`, { amount, type }),
  updateUser: (id: string, data: any) => rq('PUT', `/users/users/${id}/update`, data),
  blockUser: (id: string) => rq('PUT', `/users/users/${id}/block`),
  updateProfile: (data: any) => rq('PUT', '/users/profile', data),
  forgotPassword: (email: string, phone?: string, cnic_number?: string) => rq('POST', '/users/forgot-password', { email, phone, cnic_number }),

  // KYC
  submitKYC: (cnic_number: string, cnic_front_image: string) => rq('POST', '/users/kyc/submit', { cnic_number, cnic_front_image }),
  getPendingKYC: () => rq('GET', '/users/kyc/pending'),
  getAllKYC: () => rq('GET', '/users/kyc/all'),
  reviewKYC: (user_id: string, status: string, rejection_reason?: string) => rq('PUT', `/users/kyc/review/${user_id}`, { status, rejection_reason }),

  // Plans
  getPlans: () => rq('GET', '/investments/plans'),
  createPlan: (d: any) => rq('POST', '/investments/plans', d),
  updatePlan: (id: string, d: any) => rq('PUT', `/investments/plans/${id}`, d),
  deletePlan: (id: string) => rq('DELETE', `/investments/plans/${id}`),

  // Slots
  getSlots: (plan_id?: string) => rq('GET', `/slots${plan_id ? '?plan_id=' + plan_id : ''}`),
  createSlot: (d: any) => rq('POST', '/slots', d),
  updateSlot: (id: string, d: any) => rq('PUT', `/slots/${id}`, d),
  deleteSlot: (id: string) => rq('DELETE', `/slots/${id}`),

  // Lots
  getLots: (slot_id?: string) => rq('GET', `/lots${slot_id ? '?slot_id=' + slot_id : ''}`),
  createLot: (d: any) => rq('POST', '/lots', d),
  updateLot: (id: string, d: any) => rq('PUT', `/lots/${id}`, d),
  deleteLot: (id: string) => rq('DELETE', `/lots/${id}`),

  // Investments
  invest: (plan_id: string, amount: number, level?: string, slot_id?: string, lot_id?: string) =>
    rq('POST', '/investments/invest', { plan_id, amount, level, slot_id, lot_id }),
  reviewInvestment: (id: string, status: string, admin_notes?: string) =>
    rq('PUT', `/investments/investments/${id}/review`, { status, admin_notes }),
  getMyInvestments: () => rq('GET', '/investments/my-investments'),
  getAllInvestments: () => rq('GET', '/investments/all-investments'),

  // Transactions
  deposit: (amount: number, payment_method: string, payment_details: string, proof_image: string, chain?: string, tx_hash?: string) =>
    rq('POST', '/transactions/deposit', { amount, payment_method, payment_details, proof_image, chain, tx_hash }),
  withdraw: (amount: number, payment_method: string, payment_details: string, login_pin: string, chain?: string, wallet_address?: string) =>
    rq('POST', '/transactions/withdraw', { amount, payment_method, payment_details, login_pin, chain, wallet_address }),
  getMyTransactions: () => rq('GET', '/transactions/my-transactions'),
  getAllTransactions: (status?: string, type?: string) =>
    rq('GET', `/transactions/all-transactions?${status ? 'status=' + status : ''}${type ? '&type=' + type : ''}`),
  updateTransaction: (id: string, status: string, notes?: string) =>
    rq('PUT', `/transactions/transactions/${id}`, { status, notes }),
  getDashboardStats: () => rq('GET', '/transactions/dashboard-stats'),

  // Gateways
  getGateways: () => rq('GET', '/gateways'),
  createGateway: (d: any) => rq('POST', '/gateways', d),
  updateGateway: (id: string, d: any) => rq('PUT', `/gateways/${id}`, d),
  deleteGateway: (id: string) => rq('DELETE', `/gateways/${id}`),

  // Wallet Auth
  getWalletNonce: (address: string) => rq('GET', `/wallet/nonce?address=${address}`),
  walletLogin: (address: string, signature: string, nonce: string, email?: string, name?: string, pin?: string, referral_code?: string) => rq('POST', '/wallet/login', { address, signature, nonce, email, name, pin, referral_code }),
  linkWallet: (address: string) => rq('POST', '/wallet/link', { address }),

  // Notifications
  getNotifications: () => rq('GET', '/notifications'),
  createNotification: (d: any) => rq('POST', '/notifications', d),
  updateNotification: (id: string, d: any) => rq('PUT', `/notifications/${id}`, d),

  // Tasks
  createTask: (d: any) => rq('POST', '/tasks', d),
  getMyTasks: () => rq('GET', '/my-tasks'),
  getAllTasks: () => rq('GET', '/all-tasks'),
  submitTask: (id: string, screenshot_url: string) => rq('PUT', `/tasks/${id}/submit`, { screenshot_url }),
  reviewTask: (id: string, status: string, rejection_reason?: string) => rq('PUT', `/tasks/${id}/review`, { status, rejection_reason }),

  // Competitions
  getCompetitions: () => rq('GET', '/competitions'),
  createCompetition: (d: any) => rq('POST', '/competitions', d),
  updateCompetition: (id: string, d: any) => rq('PUT', `/competitions/${id}`, d),
  deleteCompetition: (id: string) => rq('DELETE', `/competitions/${id}`),
  joinCompetition: (id: string) => rq('POST', `/competitions/${id}/join`),
  getMyCompEntries: () => rq('GET', '/competitions/my-entries'),
  getAllCompEntries: () => rq('GET', '/competitions/all-entries'),

  // Blogs
  getBlogCategories: () => rq('GET', '/blogs/categories'),
  createBlogCategory: (d: any) => rq('POST', '/blogs/categories', d),
  updateBlogCategory: (id: string, d: any) => rq('PUT', `/blogs/categories/${id}`, d),
  deleteBlogCategory: (id: string) => rq('DELETE', `/blogs/categories/${id}`),
  getBlogPosts: (category_id?: string) => rq('GET', `/blogs/posts${category_id ? '?category_id=' + category_id : ''}`),
  createBlogPost: (d: any) => rq('POST', '/blogs/posts', d),
  updateBlogPost: (id: string, d: any) => rq('PUT', `/blogs/posts/${id}`, d),
  deleteBlogPost: (id: string) => rq('DELETE', `/blogs/posts/${id}`),

  // CSV
  exportTable: (table: string) => rq('GET', `/csv/export/${table}`),
  importTable: (table: string, csvData: any[]) => rq('POST', `/csv/import/${table}`, { csvData }),
  getTableCounts: () => rq('GET', '/csv/tables'),

  // ROI Rates (Admin)
  getCurrentROI: () => rq('GET', '/roi-rates/current'),
  getROIHistory: () => rq('GET', '/roi-rates/history'),
  setDailyROI: (roi_percentage: number, note?: string) => rq('POST', '/roi-rates/today', { roi_percentage, note }),
  updateROIDate: (date: string, roi_percentage: number, note?: string) => rq('PUT', `/roi-rates/${date}`, { roi_percentage, note }),

  // Currency Conversion
  convertCurrency: (from: string, to: string, amount: number) => rq('GET', `/currency/convert?from=${from}&to=${to}&amount=${amount}`),

  // Site Settings
  getSettings: () => rq('GET', '/settings'),
  setSetting: (key: string, value: string) => rq('PUT', `/settings/${key}`, { value }),

  // Crypto Deposits
  submitWeb3Deposit: (tx_hash: string, chain: string, amount: number, token_symbol: string) =>
    rq('POST', '/crypto-deposit/web3/submit', { tx_hash, chain, amount, token_symbol }),
  createBinancePayOrder: (amount: number, currency?: string) =>
    rq('POST', '/crypto-deposit/binance/create-order', { amount, currency }),
  createOKXPayOrder: (amount: number, currency?: string) =>
    rq('POST', '/crypto-deposit/okx/create-order', { amount, currency }),
  getMyCryptoDeposits: () => rq('GET', '/crypto-deposit/my-deposits'),
  getAllCryptoDeposits: () => rq('GET', '/crypto-deposit/all-deposits'),

  // Health
  health: () => rq('GET', '/health'),
};
