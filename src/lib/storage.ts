
'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Firestore,
  increment
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export type UserRole = 'Usto' | 'Client';
export type IdentificationStatus = 'None' | 'Pending' | 'Verified' | 'Rejected';

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
  isArtisanFeePaid?: boolean;
  warningCount?: number;
  isBlocked?: boolean;
  createdAt: any;
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

export interface Deal {
  id: string;
  listingId: string;
  clientId: string;
  artisanId: string;
  title: string;
  price: number;
  fee: number;
  durationDays: number;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Confirmed' | 'Cancelled' | 'Expired';
  senderId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isRead: boolean;
  type: 'text' | 'deal';
  dealId?: string;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
  dealId: string;
}

export const VIP_PRICE = 20;
export const PREMIUM_PRICE = 100;
export const ARTISAN_REGISTRATION_FEE = 10;

export const ALL_REGIONS = [
  "Душанбе", "Бохтар", "Кӯлоб", "Хуҷанд", "Истаравшан", "Конибодом", "Панҷакент", 
  "Хоруғ", "Ваҳдат", "Ҳисор", "Турсунзода", "Рашт", "Данғара", "Ёвон"
];

export const ALL_CATEGORIES = [
  "Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", 
  "Ронанда", "Ошпаз", "Муаллим", "Табиб", "Сартарош", "Рангуборчӣ", 
  "Кафшергар", "Кондиционерсоз", "Автомеханик", "Дигар"
];

export function calculateFee(price: number): number {
  if (price < 100) return 10;
  if (price < 1000) return 20;
  if (price < 10000) return 100;
  return 1000;
}

// Нигоҳ доштани Types ва константаҳо барои мутобиқат.
// Логикаи LocalStorage нест карда шуд ва бо Firebase Hooks иваз гардид.
