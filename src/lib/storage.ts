
"use client"

export type UserRole = 'Usto' | 'Client';
export type IdentificationStatus = 'None' | 'Pending' | 'Verified' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  birthDate?: string;
  region?: string;
  phone?: string;
  profileImage?: string;
  favorites?: string[];
  lastSeen?: string;
  balance: number;
  identificationStatus: IdentificationStatus;
  idPhotoUrl?: string;
  isPremium?: boolean;
  premiumExpiry?: string;
  isArtisanFeePaid?: boolean;
  warningCount?: number;
  isBlocked?: boolean;
  blockedUntil?: string;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  dealId?: string;
}

export type DealStatus = 'Pending' | 'Accepted' | 'Completed' | 'Confirmed' | 'Cancelled' | 'Expired';

export interface Deal {
  id: string;
  listingId: string;
  clientId: string;
  artisanId: string;
  title: string;
  price: number;
  fee: number;
  durationDays: number;
  status: DealStatus;
  senderId: string;
  createdAt: string;
  updatedAt: string;
  isReviewed?: boolean;
}

export interface Message {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
  type?: 'text' | 'deal';
  dealId?: string;
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
  createdAt: string;
  isVip?: boolean;
  views: number;
}

const STORAGE_KEYS = {
  USERS: 'hunar_yob_users',
  CURRENT_USER: 'hunar_yob_current_user',
  LISTINGS: 'hunar_yob_listings',
  REVIEWS: 'hunar_yob_reviews',
  MESSAGES: 'hunar_yob_messages',
  DEALS: 'hunar_yob_deals',
};

export const VIP_PRICE = 20;
export const PREMIUM_PRICE = 100;
export const ARTISAN_REGISTRATION_FEE = 10;
export const MAX_FREE_LISTINGS = 2;
export const MAX_PREMIUM_LISTINGS = 5;

// List of prohibited words (placeholders for demonstration)
const BANNED_WORDS = ['дашном1', 'дашном2', 'ҳақорат', 'бетарбия'];

export const ALL_REGIONS = [
  "Душанбе", "Бохтар", "Кӯлоб", "Хуҷанд", "Истаравшан", "Конибодом", "Панҷакент", 
  "Хоруғ", "Ваҳдат", "Ҳисор", "Турсунзода", "Рашт", "Данғара", "Ёвон"
];

export const ALL_CATEGORIES = [
  "Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", 
  "Ронанда", "Ошпаз", "Муаллим", "Табиб", "Сартарош", "Рангуборчӣ", 
  "Кафшергар", "Кондиционерсоз", "Автомеханик", "Дигар"
];

export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word));
}

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User) {
  const users = getUsers();
  users.push({ 
    ...user, 
    favorites: [], 
    balance: user.balance || 0, 
    lastSeen: new Date().toISOString(),
    identificationStatus: 'None',
    warningCount: 0,
    isBlocked: false
  });
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function updateUser(updatedUser: User) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    const current = getCurrentUser();
    if (current && current.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }
}

export function reportUser(userId: string) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    const user = users[index];
    user.warningCount = (user.warningCount || 0) + 1;
    if (user.warningCount >= 3) {
      user.isBlocked = true;
      const blockTime = new Date();
      blockTime.setDate(blockTime.getDate() + 7); // Block for 7 days after 3 reports
      user.blockedUntil = blockTime.toISOString();
    }
    updateUser(user);
    return { success: true, message: "Шикояти шумо қабул шуд" };
  }
  return { success: false, message: "Корбар ёфт нашуд" };
}

export function blockUserForProfanity(userId: string) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    const user = users[index];
    user.isBlocked = true;
    const blockTime = new Date();
    blockTime.setHours(blockTime.getHours() + 24); // Block for 24 hours
    user.blockedUntil = blockTime.toISOString();
    updateUser(user);
  }
}

export function buyPremium(): { success: boolean, message: string } {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Вуруд лозим аст" };
  if (user.balance < PREMIUM_PRICE) return { success: false, message: "Маблағ нокифоя аст" };

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);

  const updatedUser = { 
    ...user, 
    balance: user.balance - PREMIUM_PRICE,
    isPremium: true,
    premiumExpiry: expiry.toISOString()
  };
  updateUser(updatedUser);
  return { success: true, message: "Обунаи Premium фаъол шуд!" };
}

export function calculateFee(price: number): number {
  if (price < 100) return 10;
  if (price < 1000) return 20;
  if (price < 10000) return 100;
  return 1000;
}

export function requestIdentification(photoUrl: string) {
  const user = getCurrentUser();
  if (!user) return false;
  
  const updated = { 
    ...user, 
    idPhotoUrl: photoUrl, 
    identificationStatus: 'Pending' as IdentificationStatus 
  };
  updateUser(updated);
  return true;
}

export function setCurrentUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  const user = data ? JSON.parse(data) : null;
  
  if (user && user.isBlocked && user.blockedUntil) {
    if (new Date() > new Date(user.blockedUntil)) {
      user.isBlocked = false;
      user.blockedUntil = undefined;
      updateUser(user);
    }
  }
  return user;
}

export function getListings(): Listing[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LISTINGS);
  return data ? JSON.parse(data) : [];
}

export function saveListing(listing: Omit<Listing, 'views'>): { success: boolean, message: string } {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Вуруд лозим аст" };
  if (user.isBlocked) return { success: false, message: "Акаунти шумо маҳкам аст" };

  if (containsProfanity(listing.title) || containsProfanity(listing.description)) {
    blockUserForProfanity(user.id);
    return { success: false, message: "Дашном ёфт шуд! Акаунти шумо барои 24 соат маҳкам шуд." };
  }

  const userListings = getListings().filter(l => l.userId === user.id);
  const limit = user.isPremium ? MAX_PREMIUM_LISTINGS : MAX_FREE_LISTINGS;

  if (userListings.length >= limit) {
    return { 
      success: false, 
      message: user.isPremium 
        ? `Шумо наметавонед зиёда аз ${MAX_PREMIUM_LISTINGS} эълон дошта бошед.` 
        : `Маҳдудият: ${MAX_FREE_LISTINGS} эълон. Барои зиёд кардан Premium харед.` 
    };
  }

  const listings = getListings();
  const listingWithPhoneCount = {
    ...listing,
    userPhone: user.phone || listing.userPhone,
    isVip: user.isPremium ? true : false,
    views: 0
  };
  listings.unshift(listingWithPhoneCount);
  localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  return { success: true, message: "Эълон нашр шуд" };
}

export function makeListingVip(listingId: string): { success: boolean, message: string } {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Вуруд лозим аст" };
  
  if (user.identificationStatus !== 'Verified') {
    return { success: false, message: "Барои ин амал идентификатсия лозим аст" };
  }

  if ((user.balance || 0) < VIP_PRICE) {
    return { success: false, message: `Тавозуни нокифоя. Нархи VIP ${VIP_PRICE} сомонӣ аст.` };
  }

  const listings = getListings();
  const index = listings.findIndex(l => l.id === listingId);
  
  if (index !== -1) {
    if (listings[index].isVip) return { success: false, message: "Эълон аллакай VIP аст" };
    
    listings[index].isVip = true;
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    
    const updatedUser = { ...user, balance: user.balance - VIP_PRICE };
    updateUser(updatedUser);
    
    return { success: true, message: "Эълон VIP шуд!" };
  }
  
  return { success: false, message: "Эълон пайдо нашуд" };
}

export function deleteListing(listingId: string) {
  const listings = getListings().filter(l => l.id !== listingId);
  localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
}

export function toggleFavorite(listingId: string) {
  const user = getCurrentUser();
  if (!user) return false;

  const favorites = user.favorites || [];
  const index = favorites.indexOf(listingId);
  
  if (index === -1) {
    favorites.push(listingId);
  } else {
    favorites.splice(index, 1);
  }

  const updatedUser = { ...user, favorites };
  updateUser(updatedUser);
  return true;
}

export function depositFunds(amount: number) {
  const user = getCurrentUser();
  if (!user) return false;
  const updatedUser = { ...user, balance: (user.balance || 0) + amount };
  updateUser(updatedUser);
  return true;
}

export function withdrawFunds(amount: number): { success: boolean, message: string } {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Вуруд лозим аст" };
  if (user.identificationStatus !== 'Verified') return { success: false, message: "Аввал идентификатсия кунед" };
  if (user.balance < amount) return { success: false, message: "Маблағи нокифоя" };

  const updatedUser = { ...user, balance: user.balance - amount };
  updateUser(updatedUser);
  return { success: true, message: "Дархост барои бозхонд фиристода шуд" };
}

export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  return data ? JSON.parse(data) : [];
}

export function getMessages(listingId: string): Message[] {
  checkDealTimeouts(); // Check for expired deals whenever messages are requested
  const allMessages = getAllMessages();
  return allMessages.filter(m => m.listingId === listingId);
}

export function sendMessage(message: Message) {
  const user = getCurrentUser();
  if (user?.isBlocked) return;

  if (containsProfanity(message.text)) {
    if (user) blockUserForProfanity(user.id);
    return;
  }

  const allMessages = getAllMessages();
  allMessages.push({ ...message, isRead: false });
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
}

export function markMessagesAsRead(listingId: string, currentUserId: string) {
  const allMessages = getAllMessages();
  const updated = allMessages.map(m => {
    if (m.listingId === listingId && m.senderId !== currentUserId) {
      return { ...m, isRead: true };
    }
    return m;
  });
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
}

export function getDeals(): Deal[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.DEALS);
  return data ? JSON.parse(data) : [];
}

export function saveDeal(deal: Deal) {
  const user = getCurrentUser();
  if (!user || user.identificationStatus !== 'Verified') {
    throw new Error("Барои бастан шартнома бояд идентификатсия кунед");
  }
  const deals = getDeals();
  deals.push(deal);
  localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
}

export function checkDealTimeouts() {
  const deals = getDeals();
  let changed = false;
  const now = new Date();

  const updated = deals.map(deal => {
    const created = new Date(deal.createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    // If pending for more than 24 hours, expire it
    if (deal.status === 'Pending' && diffHours >= 24) {
      changed = true;
      return { ...deal, status: 'Expired' as DealStatus, updatedAt: now.toISOString() };
    }

    // If work duration exceeded, cancel and penalize
    if (deal.status === 'Accepted') {
      const acceptedAt = new Date(deal.updatedAt);
      const diffDays = (now.getTime() - acceptedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > deal.durationDays) {
        changed = true;
        // Logic to return money and penalize artisan could go here
        return { ...deal, status: 'Cancelled' as DealStatus, updatedAt: now.toISOString() };
      }
    }
    return deal;
  });

  if (changed) {
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(updated));
  }
}

export function updateDealStatus(dealId: string, status: DealStatus) {
  const deals = getDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index !== -1) {
    const deal = deals[index];
    const prevStatus = deal.status;
    const totalToDeduct = deal.price + deal.fee;
    
    deal.status = status;
    deal.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));

    const users = getUsers();
    const client = users.find(u => u.id === deal.clientId);
    const artisan = users.find(u => u.id === deal.artisanId);

    if (status === 'Accepted' && prevStatus === 'Pending') {
      if (client && client.balance >= totalToDeduct) {
        client.balance -= totalToDeduct;
        updateUser(client);
      } else {
        return { success: false, message: "Тавозуни мизоҷ нокифоя аст" };
      }
    } else if (status === 'Confirmed' && prevStatus === 'Completed') {
      if (artisan) {
        artisan.balance += deal.price;
        updateUser(artisan);
      }
    } else if (status === 'Cancelled') {
      if (prevStatus === 'Accepted' && client) {
        client.balance += totalToDeduct;
        updateUser(client);
      }
    }
    return { success: true };
  }
  return { success: false, message: "Шартнома ёфт нашуд" };
}

export function updateLastSeen() {
  const user = getCurrentUser();
  if (user) {
    user.lastSeen = new Date().toISOString();
    updateUser(user);
  }
}

export function incrementViews(listingId: string) {
  const listings = getListings();
  const index = listings.findIndex(l => l.id === listingId);
  if (index !== -1) {
    listings[index].views = (listings[index].views || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }
}

export function getReviews(listingId: string): Review[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  const allReviews: Review[] = data ? JSON.parse(data) : [];
  return allReviews.filter(r => r.listingId === listingId);
}

export function saveReview(review: Review) {
  if (typeof window === 'undefined') return;
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  const allReviews: Review[] = data ? JSON.parse(data) : [];
  allReviews.push(review);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(allReviews));

  // Mark the deal as reviewed
  if (review.dealId) {
    const deals = getDeals();
    const dealIndex = deals.findIndex(d => d.id === review.dealId);
    if (dealIndex !== -1) {
      deals[dealIndex].isReviewed = true;
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
    }
  }
}
