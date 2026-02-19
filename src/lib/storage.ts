
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

export interface User {
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

// Firestore Mutation Functions
export function saveListingToFirestore(db: Firestore, userId: string, userName: string, phone: string, listing: Partial<Listing>) {
  const listingRef = doc(collection(db, 'listings'));
  const data = {
    ...listing,
    id: listingRef.id,
    userId,
    userName,
    userPhone: phone,
    views: 0,
    createdAt: serverTimestamp(),
  };

  setDoc(listingRef, data)
    .catch(async (err) => {
      const error = new FirestorePermissionError({
        path: listingRef.path,
        operation: 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', error);
    });
  
  return listingRef.id;
}

export function sendMessageToFirestore(db: Firestore, listingId: string, senderId: string, senderName: string, text: string, type: 'text' | 'deal' = 'text', dealId?: string) {
  const msgRef = doc(collection(db, 'listings', listingId, 'messages'));
  const data = {
    listingId,
    senderId,
    senderName,
    text,
    type,
    dealId: dealId || null,
    createdAt: serverTimestamp(),
    isRead: false
  };

  setDoc(msgRef, data)
    .catch(async (err) => {
      const error = new FirestorePermissionError({
        path: msgRef.path,
        operation: 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', error);
    });
}

export function createDealInFirestore(db: Firestore, deal: Partial<Deal>) {
  const dealRef = doc(collection(db, 'deals'));
  const data = {
    ...deal,
    id: dealRef.id,
    status: 'Pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  setDoc(dealRef, data)
    .catch(async (err) => {
      const error = new FirestorePermissionError({
        path: dealRef.path,
        operation: 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', error);
    });
  
  return dealRef.id;
}

export function updateDealStatusInFirestore(db: Firestore, dealId: string, status: string) {
  const dealRef = doc(db, 'deals', dealId);
  updateDoc(dealRef, {
    status,
    updatedAt: serverTimestamp()
  }).catch(async (err) => {
      const error = new FirestorePermissionError({
        path: dealRef.path,
        operation: 'update',
        requestResourceData: { status },
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', error);
    });
}

export function incrementListingViews(db: Firestore, listingId: string) {
  const listingRef = doc(db, 'listings', listingId);
  updateDoc(listingRef, {
    views: increment(1)
  }).catch(() => {});
}
