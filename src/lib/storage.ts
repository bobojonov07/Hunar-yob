
'use client';

export type UserRole = 'Usto' | 'Client';
export type IdentificationStatus = 'None' | 'Pending' | 'Verified' | 'Rejected' | 'Blocked';
export type TransactionStatus = 'Pending' | 'Completed' | 'Rejected';
export type TransactionType = 'Deposit' | 'Withdrawal' | 'PremiumPurchase' | 'DealPayment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  region?: string;
  profileImage?: string;
  balance: number;
  identificationStatus: IdentificationStatus;
  isPremium?: boolean;
  favorites?: string[];
  fcmTokens?: string[];
  lastActive?: any;
  createdAt: any;
  warningCount: number;
  isBlocked: boolean;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  receiptImage: string;
  status: TransactionStatus;
  submittedAt: any;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  cardNumber: string;
  status: TransactionStatus;
  submittedAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: any;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  photos: string[]; 
  receipt: string;  
  status: IdentificationStatus;
  submittedAt: any;
  errorReason?: string;
}

export interface Complaint {
  id: string;
  reportedUserId: string;
  reporterUserId: string;
  reason: string;
  createdAt: any;
  status: 'Pending' | 'Resolved';
}

export interface Listing {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  title: string;
  category: string;
  description: string;
  images: string[];
  createdAt: any;
  isVip?: boolean;
  views: number;
}

export interface Chat {
  id: string;
  listingId: string;
  clientId: string;
  artisanId: string;
  lastMessage: string;
  lastSenderId: string;
  updatedAt: any;
  unreadCount: Record<string, number>;
  deletedBy?: string[]; 
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isRead: boolean;
  type: 'text' | 'deal';
  dealId?: string;
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  deletedFor?: string[]; 
}

export const VIP_PRICE = 20;
export const KYC_PRICE = 10;
export const PREMIUM_PRICE = 50;

export const REGULAR_LISTING_LIMIT = 1;
export const PREMIUM_LISTING_LIMIT = 5;

export const REGULAR_CHAR_LIMIT = 1000;
export const PREMIUM_CHAR_LIMIT = 5000;

export const ALL_REGIONS = [
  "Душанбе", "Бохтар", "Кӯлоб", "Хуҷанд", "Истаравшан", "Конибодом", "Панҷакент", 
  "Хоруғ", "Ваҳдат", "Ҳисор", "Турсунзода", "Рашт", "Данғара", "Ёвон"
];

export const ALL_CATEGORIES = [
  "Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", 
  "Ронанда", "Ошпаз", "Муаллим", "Табиб", "Сартарош", "Рангуборчӣ", 
  "Кафшергар", "Кондиционерсоз", "Автомеханик", "Дигар"
];

export const FORBIDDEN_WORDS = [
  "сука", "лаънат", "харом", "ганд", "наҳс", "кун", "гом", "хароми", "даюс"
];
