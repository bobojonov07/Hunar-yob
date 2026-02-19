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

export interface Message {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
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
}

const STORAGE_KEYS = {
  USERS: 'hunar_yob_users',
  CURRENT_USER: 'hunar_yob_current_user',
  LISTINGS: 'hunar_yob_listings',
  REVIEWS: 'hunar_yob_reviews',
  MESSAGES: 'hunar_yob_messages',
};

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User) {
  const users = getUsers();
  users.push({ ...user, favorites: [], balance: 0 });
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

export function saveListing(listing: Listing) {
  const listings = getListings();
  const currentUser = getCurrentUser();
  const listingWithPhone = {
    ...listing,
    userPhone: currentUser?.phone || listing.userPhone
  };
  listings.unshift(listingWithPhone);
  localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
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