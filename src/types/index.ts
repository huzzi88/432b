export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  loginPin: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  profileImage?: string;
  balance: number;
  totalInvested: number;
  totalEarnings: number;
  totalWithdrawn: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralBonusPercentage: number;
  referralEarnings: number;
  referralLevel2Count: number;
  joinedDate: string;
  isBlocked: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected' | 'none';
  kycData?: { cnicNumber: string; cnicImage: string; selfieImage: string };
  twoFactorEnabled: boolean;
  isAdmin?: boolean;
  walletAddress?: string;
  adminPin1?: string;
  adminPin2?: string;
  adminPin3?: string;
}

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  lotId?: string;
  productId?: string;
  categoryName?: string;
  slotName?: string;
  lotName?: string;
  productName?: string;
  amount: number;
  startDate: string;
  endDate: string;
  dailyProfit: number;
  totalProfit: number;
  earnedProfit: number;
  status: 'pending' | 'pooled' | 'active' | 'completed' | 'cancelled';
  adminNotes?: string;
  cancelRequested?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'referral';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod?: string;
  paymentDetails?: string;
  chain?: string;
  txHash?: string;
  walletFrom?: string;
  proofImage?: string;
  date: string;
  notes?: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'jazzcash' | 'easypaisa' | 'bank' | 'crypto';
  accountDetails: string;
  walletAddress?: string;
  chain?: string;
  image?: string;
  isActive: boolean;
  icon: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  roiPercentage: number;
  durationDays: number;
  isActive: boolean;
  description: string;
  image?: string;
  poolTargetAmount?: number;
  currentPooledAmount?: number;
  poolStatus?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  assignedTo: string;
  title: string;
  description: string;
  rewardAmount: number;
  screenshotUrl?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}
