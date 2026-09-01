/**
 * db.js
 * Database layer using IndexedDB for binary media and portfolio items,
 * combined with LocalStorage for settings and profile preferences.
 */

import {
  INITIAL_PROFILE,
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_PORTFOLIO_ITEMS,
  INITIAL_SETTINGS
} from './initialData.js';

const DB_NAME = 'PortoCraftDB';
const DB_VERSION = 1;
const STORE_ITEMS = 'portfolio_items';
const STORE_MEDIA = 'media_blobs';

const STORAGE_KEYS = {
  PROFILE: 'portocraft_profile',
  CATEGORIES: 'portocraft_categories',
  SERVICES: 'portocraft_services',
  SETTINGS: 'portocraft_settings',
  INQUIRIES: 'portocraft_inquiries',
  LIKED_ITEMS: 'portocraft_liked_items',
  INITIALIZED: 'portocraft_db_initialized',
  FASHION_SEED: 'portocraft_fashion_seed_v2'
};

class PortfolioDB {
  constructor() {
    this.db = null;
    this.initPromise = this.openDB();
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_ITEMS)) {
          const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
          itemStore.createIndex('category', 'category', { unique: false });
          itemStore.createIndex('mediaType', 'mediaType', { unique: false });
          itemStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.ensureInitialData().then(() => resolve(this.db));
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async ensureInitialData() {
    const isFashionSeeded = localStorage.getItem(STORAGE_KEYS.FASHION_SEED);
    if (!isFashionSeeded) {
      // Auto seed Fashion data
      await this.resetToDefaultData();
      localStorage.setItem(STORAGE_KEYS.FASHION_SEED, 'true');
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  async getDB() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  // --- Portfolio Items CRUD ---

  async getAllItems() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS], 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getItemById(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS], 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveItem(item) {
    const db = await this.getDB();
    if (!item.id) {
      item.id = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    item.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS], 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.put(item);

      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async putRawItem(item) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS], 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteItem(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS], 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async incrementViews(id) {
    const item = await this.getItemById(id);
    if (item) {
      item.views = (item.views || 0) + 1;
      await this.saveItem(item);
      return item.views;
    }
    return 0;
  }

  async toggleLike(id) {
    const likedStr = localStorage.getItem(STORAGE_KEYS.LIKED_ITEMS) || '[]';
    let liked = JSON.parse(likedStr);
    const isLiked = liked.includes(id);

    const item = await this.getItemById(id);
    if (!item) return { liked: false, count: 0 };

    if (isLiked) {
      liked = liked.filter(itemId => itemId !== id);
      item.likes = Math.max(0, (item.likes || 1) - 1);
    } else {
      liked.push(id);
      item.likes = (item.likes || 0) + 1;
    }

    localStorage.setItem(STORAGE_KEYS.LIKED_ITEMS, JSON.stringify(liked));
    await this.saveItem(item);
    return { liked: !isLiked, count: item.likes };
  }

  isItemLiked(id) {
    const likedStr = localStorage.getItem(STORAGE_KEYS.LIKED_ITEMS) || '[]';
    const liked = JSON.parse(likedStr);
    return liked.includes(id);
  }

  // --- Profile Management ---

  getProfile() {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? { ...INITIAL_PROFILE, ...JSON.parse(data) } : INITIAL_PROFILE;
  }

  saveProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    return profile;
  }

  // --- Categories Management ---

  getCategories() {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : INITIAL_CATEGORIES;
  }

  saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories;
  }

  // --- Services Management ---

  getServices() {
    const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return data ? JSON.parse(data) : INITIAL_SERVICES;
  }

  saveServices(services) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return services;
  }

  // --- Settings & Auth ---

  getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = data ? JSON.parse(data) : {};
    return { ...INITIAL_SETTINGS, ...parsed };
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }

  verifyAdminPin(inputPin) {
    const settings = this.getSettings();
    return String(inputPin).trim() === String(settings.adminPin || '1234').trim();
  }

  // --- Inquiries / Contact Messages ---

  getInquiries() {
    const data = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
    return data ? JSON.parse(data) : [];
  }

  saveInquiry(inquiry) {
    const inquiries = this.getInquiries();
    const newInquiry = {
      id: 'inq_' + Date.now(),
      name: inquiry.name || 'Anonymous',
      email: inquiry.email || '',
      phone: inquiry.phone || '',
      subject: inquiry.subject || 'Pesan Konsultasi Busana',
      message: inquiry.message || '',
      date: new Date().toISOString(),
      read: false
    };
    inquiries.unshift(newInquiry);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    return newInquiry;
  }

  deleteInquiry(id) {
    let inquiries = this.getInquiries();
    inquiries = inquiries.filter(inq => inq.id !== id);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    return true;
  }

  markInquiryAsRead(id) {
    const inquiries = this.getInquiries();
    const inq = inquiries.find(i => i.id === id);
    if (inq) {
      inq.read = true;
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    }
  }

  // --- Full Backup Export & Import ---

  async exportAllData() {
    const items = await this.getAllItems();
    const profile = this.getProfile();
    const categories = this.getCategories();
    const services = this.getServices();
    const settings = this.getSettings();
    const inquiries = this.getInquiries();

    return {
      version: "2.0",
      exportDate: new Date().toISOString(),
      profile,
      categories,
      services,
      settings,
      inquiries,
      items
    };
  }

  async importAllData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Format data JSON tidak valid.');
    }

    if (data.profile) this.saveProfile(data.profile);
    if (data.categories) this.saveCategories(data.categories);
    if (data.services) this.saveServices(data.services);
    if (data.settings) this.saveSettings(data.settings);
    if (data.inquiries) localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(data.inquiries));

    if (Array.isArray(data.items)) {
      const db = await this.getDB();
      const tx = db.transaction([STORE_ITEMS], 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      
      await new Promise((res, rej) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => res();
        clearReq.onerror = () => rej(clearReq.error);
      });

      for (const item of data.items) {
        await this.saveItem(item);
      }
    }

    return true;
  }

  async resetToDefaultData() {
    const db = await this.getDB();
    const tx = db.transaction([STORE_ITEMS], 'readwrite');
    const store = tx.objectStore(STORE_ITEMS);
    
    await new Promise((res, rej) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => res();
      clearReq.onerror = () => rej(clearReq.error);
    });

    for (const item of INITIAL_PORTFOLIO_ITEMS) {
      await this.saveItem(item);
    }

    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LIKED_ITEMS, JSON.stringify([]));

    return true;
  }
}

export const db = new PortfolioDB();
