"use client"

export type UserRole = 'Usto' | 'Client';

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
  favorites?: string[]; // Array of listing IDs
  lastSeen?: string;
  balance: number; // User's wallet balance
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type DealStatus = 'Pending' | 'Accepted' | 'Completed' | 'Confirmed' | 'Cancelled';

export interface Deal {
  id: string;
  listingId: string;
  clientId: string;
  artisanId: string;
  title: string;
  price: number;
  durationDays: number;
  status: DealStatus;
  senderId: string;
  createdAt: string;
  updatedAt: string;
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

const VIP_PRICE = 20;

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User) {
  const users = getUsers();
  users.push({ ...user, favorites: [], balance: 0, lastSeen: new Date().toISOString() });
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

export function updateLastSeen() {
  const user = getCurrentUser();
  if (user) {
    const updated = { ...user, lastSeen: new Date().toISOString() };
    updateUser(updated);
  }
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
  return data ? JSON.parse(data) : null;
}

export function getListings(): Listing[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LISTINGS);
  return data ? JSON.parse(data) : [];
}

export function saveListing(listing: Omit<Listing, 'views'>) {
  const listings = getListings();
  const currentUser = getCurrentUser();
  const listingWithPhoneCount = {
    ...listing,
    userPhone: currentUser?.phone || listing.userPhone,
    isVip: false,
    views: 0
  };
  listings.unshift(listingWithPhoneCount);
  localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
}

export function incrementViews(listingId: string) {
  const listings = getListings();
  const index = listings.findIndex(l => l.id === listingId);
  if (index !== -1) {
    listings[index].views = (listings[index].views || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }
}

export function makeListingVip(listingId: string): { success: boolean, message: string } {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Вуруд лозим аст" };
  
  if ((user.balance || 0) < VIP_PRICE) {
    return { success: false, message: `Тавозуни нокифоя. Нархи VIP ${VIP_PRICE} сомонӣ аст.` };
  }

  const listings = getListings();
  const index = listings.findIndex(l => l.id === listingId);
  
  if (index !== -1) {
    if (listings[index].isVip) return { success: false, message: "Эълон аллакай VIP аст" };
    
    listings[index].isVip = true;
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    
    // Deduct funds
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

// Review functions
export function getReviews(listingId: string): Review[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  const allReviews: Review[] = data ? JSON.parse(data) : [];
  return allReviews.filter(r => r.listingId === listingId);
}

export function saveReview(review: Review) {
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  const allReviews: Review[] = data ? JSON.parse(data) : [];
  allReviews.unshift(review);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(allReviews));
}

// Message functions
export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  return data ? JSON.parse(data) : [];
}

export function getMessages(listingId: string): Message[] {
  const allMessages = getAllMessages();
  return allMessages.filter(m => m.listingId === listingId);
}

export function sendMessage(message: Message) {
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

// Deal functions (Escrow System)
export function getDeals(): Deal[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.DEALS);
  return data ? JSON.parse(data) : [];
}

export function saveDeal(deal: Deal) {
  const deals = getDeals();
  deals.push(deal);
  localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
}

export function updateDealStatus(dealId: string, status: DealStatus) {
  const deals = getDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index !== -1) {
    const deal = deals[index];
    const prevStatus = deal.status;
    deal.status = status;
    deal.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));

    // Funds Logic
    const users = getUsers();
    const client = users.find(u => u.id === deal.clientId);
    const artisan = users.find(u => u.id === deal.artisanId);

    if (status === 'Accepted' && prevStatus === 'Pending') {
      // Deduct from client
      if (client && client.balance >= deal.price) {
        client.balance -= deal.price;
        updateUser(client);
      } else {
        // Should have been checked before
        return { success: false, message: "Тавозуни мизоҷ нокифоя аст" };
      }
    } else if (status === 'Confirmed' && prevStatus === 'Completed') {
      // Transfer to artisan
      if (artisan) {
        artisan.balance += deal.price;
        updateUser(artisan);
      }
    } else if (status === 'Cancelled' && prevStatus === 'Accepted') {
      // Refund client
      if (client) {
        client.balance += deal.price;
        updateUser(client);
      }
    }
    return { success: true };
  }
  return { success: false, message: "Шартнома ёфт нашуд" };
}