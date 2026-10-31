/**
 * Academy and User Management Service for Multi-Tenant Hierarchy
 * Collections:
 * - users/{userId}: { uid, email, name, role, academyId, academyName, status, createdAt, phone }
 * - academies/{academyId}: { academyId, academyName, code, address, phone, adminId, adminName, adminEmail, createdBy, createdAt, isActive }
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import { type Academy, type AppUser, type UserRole, type AlertNotification } from '../types';
import { erpStorage } from './storage';

export const DEV_EMAILS = [
  'developer@hisaabkitaab.com',
  'socialman121@gmail.com',
  'sajjadaliqasmi@gmail.com',
  'meerhadi12199@gmail.com',
];

// Initial seeded academies
export const DEFAULT_ACADEMIES: Academy[] = [
  {
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    code: 'TAK-01',
    address: 'Station Road, Near Post Office, Kandhkot, Sindh',
    phone: '0300-1234567',
    adminId: 'usr-admin-1',
    adminName: 'Prof. Ghulam Rasool',
    adminEmail: 'admin.kandhkot@taleemacademy.edu.pk',
    createdBy: 'developer@hisaabkitaab.com',
    createdAt: Date.now() - 30 * 86400000,
    isActive: true,
  },
  {
    academyId: 'inst-2',
    academyName: 'Taleem Academy Sukkur City Campus',
    code: 'TSK-02',
    address: 'Military Road, Sukkur, Sindh',
    phone: '0301-9876543',
    adminId: 'usr-admin-2',
    adminName: 'Dr. Tariq Mehmood',
    adminEmail: 'admin.sukkur@taleemacademy.edu.pk',
    createdBy: 'developer@hisaabkitaab.com',
    createdAt: Date.now() - 20 * 86400000,
    isActive: true,
  },
  {
    academyId: 'inst-3',
    academyName: 'Taleem Academy Kashmore Campus',
    code: 'TGK-03',
    address: 'Indus Highway, Kashmore, Sindh',
    phone: '0302-5551234',
    adminId: 'usr-admin-3',
    adminName: 'Engr. Farhan Soomro',
    adminEmail: 'admin.kashmore@taleemacademy.edu.pk',
    createdBy: 'developer@hisaabkitaab.com',
    createdAt: Date.now() - 10 * 86400000,
    isActive: true,
  },
];

// Default users across all 5 roles
export const DEFAULT_USERS: AppUser[] = [
  {
    uid: 'usr-dev-master',
    id: 'usr-dev-master',
    name: 'Sajjad Ali Qasmi (Chief Developer)',
    email: 'developer@hisaabkitaab.com',
    phone: '0300-1234567',
    role: 'developer',
    academyId: null,
    academyName: 'All Academies (Global Network)',
    status: 'approved',
    createdAt: 1761400000000,
  },
  {
    uid: 'usr-admin-kandhkot',
    id: 'usr-admin-kandhkot',
    name: 'Prof. Ghulam Rasool (Director & Admin)',
    email: 'admin.kandhkot@taleemacademy.edu.pk',
    phone: '0300-7861122',
    role: 'admin',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761450000000,
  },
  {
    uid: 'usr-admin-sukkur',
    id: 'usr-admin-sukkur',
    name: 'Dr. Tariq Mehmood (Sukkur Admin)',
    email: 'admin.sukkur@taleemacademy.edu.pk',
    phone: '0301-9876543',
    role: 'admin',
    academyId: 'inst-2',
    academyName: 'Taleem Academy Sukkur City Campus',
    status: 'approved',
    createdAt: 1761480000000,
  },
  {
    uid: 'usr-teach-1',
    id: 'usr-teach-1',
    name: 'Sir Saeed Ahmed (Senior Physics Faculty)',
    email: 'teacher@taleemacademy.edu.pk',
    phone: '0300-1112233',
    role: 'teacher',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761500000000,
  },
  {
    uid: 'usr-teach-2',
    id: 'usr-teach-2',
    name: 'Dr. Naila Jatoi (Head of Biology)',
    email: 'dr.naila@taleemacademy.edu.pk',
    phone: '0333-9988776',
    role: 'teacher',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761520000000,
  },
  {
    uid: 'usr-teach-3',
    id: 'usr-teach-3',
    name: 'Engr. Waqas Chachar (Lead IT Instructor)',
    email: 'waqas.cs@taleemacademy.edu.pk',
    phone: '0312-5566778',
    role: 'teacher',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761530000000,
  },
  {
    uid: 'usr-stud-1',
    id: 'usr-stud-1',
    name: 'Ahmed Ali Qasmi (Pre-Engineering)',
    email: 'student.ahmed@taleemacademy.edu.pk',
    phone: '0300-7861122',
    role: 'student',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761540000000,
  },
  {
    uid: 'usr-stud-2',
    id: 'usr-stud-2',
    name: 'Dua Fatima Soomro (Pre-Medical)',
    email: 'dua.fatima@taleemacademy.edu.pk',
    phone: '0333-4455889',
    role: 'student',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761545000000,
  },
  {
    uid: 'usr-stud-3',
    id: 'usr-stud-3',
    name: 'Shahzaib Khan Bangash (Computer Science)',
    email: 'shahzaib.khan@taleemacademy.edu.pk',
    phone: '0312-6677889',
    role: 'student',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761550000000,
  },
  {
    uid: 'usr-parent-1',
    id: 'usr-parent-1',
    name: 'Haji Mohammad Qasmi (Parent of Ahmed Ali)',
    email: 'parent.qasmi@taleemacademy.edu.pk',
    phone: '0300-7861122',
    role: 'parent',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761560000000,
  },
  {
    uid: 'usr-parent-2',
    id: 'usr-parent-2',
    name: 'Dr. Imtiaz Ahmed Soomro (Parent of Dua Fatima)',
    email: 'parent.soomro@taleemacademy.edu.pk',
    phone: '0333-4455889',
    role: 'parent',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    status: 'approved',
    createdAt: 1761565000000,
  },
];

// Helper to get local stored academies
export function getLocalAcademies(): Academy[] {
  let deletedList: string[] = [];
  try {
    const deletedRaw = localStorage.getItem('taleemos_deleted_academies') || '[]';
    deletedList = JSON.parse(deletedRaw);
  } catch {}

  try {
    const saved = localStorage.getItem('taleemos_academies');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((a) => a && !deletedList.includes(a.academyId));
      }
    }
  } catch {}

  const initial = DEFAULT_ACADEMIES.filter((a) => !deletedList.includes(a.academyId));
  localStorage.setItem('taleemos_academies', JSON.stringify(initial));
  return initial;
}

export function saveLocalAcademies(academies: Academy[]) {
  localStorage.setItem('taleemos_academies', JSON.stringify(academies));
}

// Helper to get local stored users
export function getLocalUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem('taleemos_users_collection');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem('taleemos_users_collection', JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveLocalUsers(users: AppUser[]) {
  localStorage.setItem('taleemos_users_collection', JSON.stringify(users));
}

/**
 * Fetch all active academies from Firestore (falls back to localStorage)
 */
export async function fetchActiveAcademies(): Promise<Academy[]> {
  const local = getLocalAcademies();
  let deletedList: string[] = [];
  try {
    const deletedRaw = localStorage.getItem('taleemos_deleted_academies') || '[]';
    deletedList = JSON.parse(deletedRaw);
  } catch {}

  if (!db) return local.filter((a) => a.isActive && !deletedList.includes(a.academyId));

  try {
    const q = query(collection(db, 'academies'), where('isActive', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const remote = snap.docs
        .map((d) => ({ ...d.data(), academyId: d.id } as Academy))
        .filter((a) => a.isActive && !deletedList.includes(a.academyId));
      saveLocalAcademies(remote);
      return remote;
    }
  } catch (err) {
    console.warn('Firestore fetchActiveAcademies offline fallback:', err);
  }
  return local.filter((a) => a.isActive && !deletedList.includes(a.academyId));
}

/**
 * Create a new Academy (Developer role only)
 */
export async function createAcademy(
  academyData: Omit<Academy, 'createdAt' | 'isActive'>,
  developerId: string
): Promise<Academy> {
  const newAcademy: Academy = {
    ...academyData,
    createdBy: developerId,
    createdAt: Date.now(),
    isActive: true,
  };

  // Save to Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'academies', newAcademy.academyId), newAcademy);
    } catch (err) {
      console.warn('Firestore createAcademy offline:', err);
    }
  }

  // Save locally
  const current = getLocalAcademies();
  const updated = [newAcademy, ...current.filter((a) => a.academyId !== newAcademy.academyId)];
  saveLocalAcademies(updated);

  return newAcademy;
}

/**
 * Update an existing Academy's details (Developer role only)
 */
export async function updateAcademy(
  academyId: string,
  updatedData: Partial<Academy>
): Promise<{ success: boolean; academy?: Academy; error?: string }> {
  try {
    const list = getLocalAcademies();
    const index = list.findIndex((a) => a.academyId === academyId);
    if (index === -1) {
      return { success: false, error: 'Academy not found.' };
    }

    const updated: Academy = {
      ...list[index],
      ...updatedData,
      academyId, // preserve ID
    };

    list[index] = updated;
    saveLocalAcademies(list);

    // Save to Firestore if available
    if (db) {
      try {
        await updateDoc(doc(db, 'academies', academyId), updatedData as any);
      } catch (err) {
        console.warn('Firestore updateAcademy offline:', err);
      }
    }

    // Notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('taleemos_academies_changed', { detail: { academyId, action: 'update' } }));

    return { success: true, academy: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update academy' };
  }
}

/**
 * Delete an Academy permanently (Developer role only)
 */
export async function deleteAcademy(
  academyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Add to persistent deleted blacklist immediately
    try {
      const deletedRaw = localStorage.getItem('taleemos_deleted_academies') || '[]';
      const deletedList: string[] = JSON.parse(deletedRaw);
      if (!deletedList.includes(academyId)) {
        deletedList.push(academyId);
        localStorage.setItem('taleemos_deleted_academies', JSON.stringify(deletedList));
      }
    } catch {}

    // 2. Remove from local stored academies
    const list = getLocalAcademies();
    const filtered = list.filter((a) => a.academyId !== academyId);
    saveLocalAcademies(filtered);

    // 3. If active institution was this academy, reset it
    const activeInstId = erpStorage.getState().activeInstitutionId;
    if (activeInstId === academyId) {
      const fallbackId = filtered[0]?.academyId || 'all';
      erpStorage.setActiveInstitution(fallbackId);
    }

    // 4. Delete or mark inactive in Firestore if available
    if (db) {
      try {
        await deleteDoc(doc(db, 'academies', academyId)).catch(() => {});
        await updateDoc(doc(db, 'academies', academyId), { isActive: false, isDeleted: true }).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteAcademy offline:', err);
      }
    }

    // 5. Update any users assigned to this deleted academy
    try {
      const users = getLocalUsers();
      const updatedUsers = users.map((u) =>
        u.academyId === academyId
          ? { ...u, academyId: null, academyName: 'Unassigned (Former Branch Deleted)' }
          : u
      );
      saveLocalUsers(updatedUsers);
    } catch {}

    // Notify components
    window.dispatchEvent(new CustomEvent('taleemos_academies_changed', { detail: { academyId, action: 'delete' } }));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete academy' };
  }
}

/**
 * Register a new User Account
 */
export async function registerUserAccount(user: {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  academyId: string | null;
  academyName: string;
  phone?: string;
  password?: string;
}): Promise<AppUser> {
  const isDev = DEV_EMAILS.includes(user.email.toLowerCase()) || user.role === 'developer';

  const newUser: AppUser = {
    uid: user.uid || `usr-${Date.now()}`,
    id: user.uid || `usr-${Date.now()}`,
    email: user.email.toLowerCase().trim(),
    name: user.name.trim(),
    role: isDev ? 'developer' : (user.role as any),
    academyId: isDev ? null : user.academyId,
    academyName: isDev ? 'Global Multi-Academy Network' : user.academyName,
    status: isDev ? 'approved' : 'pending',
    createdAt: Date.now(),
    phone: user.phone?.trim() || '',
  };

  // Sync with Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } catch (err) {
      console.warn('Firestore registerUserAccount offline:', err);
    }
  }

  // Sync locally
  const localUsers = getLocalUsers();
  const updated = [...localUsers.filter((u) => u.email !== newUser.email), newUser];
  saveLocalUsers(updated);

  return newUser;
}

/**
 * Synchronize Google-authenticated user directly to Firestore 'users' collection
 * Enforces Developer roles for developer emails and saves profile metadata
 */
export async function syncGoogleUserToFirestore(userData: {
  uid: string;
  email: string;
  name?: string;
  role?: UserRole;
  academyId?: string | null;
  academyName?: string;
  photoURL?: string;
  status?: 'approved' | 'pending' | 'rejected';
}): Promise<AppUser> {
  const cleanEmail = userData.email.toLowerCase().trim();
  const isDev = DEV_EMAILS.includes(cleanEmail) || userData.role === 'developer';

  const userDoc: AppUser = {
    uid: userData.uid,
    id: userData.uid,
    email: cleanEmail,
    name: userData.name || (isDev ? 'Developer Architect' : 'Academy User'),
    role: isDev ? 'developer' : ((userData.role as any) || 'teacher'),
    academyId: isDev ? null : (userData.academyId || 'inst-1'),
    academyName: isDev ? 'All Academies (Global Network)' : (userData.academyName || 'Taleem Academy Main Campus'),
    status: isDev ? 'approved' : (userData.status || 'approved'),
    createdAt: Date.now(),
    phone: '',
    authProvider: 'google',
    photoURL: userData.photoURL || undefined,
    lastLoginAt: Date.now(),
  };

  // 1. Commit directly to Firestore collection 'users'
  if (db) {
    try {
      await setDoc(doc(db, 'users', userData.uid), userDoc, { merge: true });
    } catch (err) {
      console.warn('Firestore syncGoogleUserToFirestore error:', err);
    }
  }

  // 2. Commit to local storage
  const localUsers = getLocalUsers();
  const updated = [
    ...localUsers.filter((u) => u.uid !== userDoc.uid && u.email.toLowerCase() !== cleanEmail),
    userDoc,
  ];
  saveLocalUsers(updated);

  return userDoc;
}

/**
 * Query user account by Firebase Auth UID
 */
export async function getUserAccountByUid(uid: string): Promise<AppUser | null> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as AppUser;
      }
    } catch (err) {
      console.warn('Firestore getUserAccountByUid offline:', err);
    }
  }

  const localUsers = getLocalUsers();
  return localUsers.find((u) => u.uid === uid || u.id === uid) || null;
}

/**
 * Fetch notices from Firestore with academy scoping
 * Admin & Academy users: fetch notices where academyId == userAcademyId OR academyId == 'all'
 * Developer: fetch all notices
 */
export async function fetchNoticesFromFirestore(
  userAcademyId?: string,
  isDev?: boolean
): Promise<AlertNotification[]> {
  if (!db) {
    return erpStorage.getState().alerts;
  }

  try {
    const noticesRef = collection(db, 'notices');
    let remoteNotices: AlertNotification[] = [];

    if (isDev) {
      const snap = await getDocs(noticesRef);
      remoteNotices = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AlertNotification));
    } else if (userAcademyId) {
      const qAcademy = query(noticesRef, where('academyId', '==', userAcademyId));
      const qGlobal = query(noticesRef, where('academyId', '==', 'all'));

      const [snapAcademy, snapGlobal] = await Promise.all([
        getDocs(qAcademy).catch(() => ({ docs: [] })),
        getDocs(qGlobal).catch(() => ({ docs: [] })),
      ]);

      const map = new Map<string, AlertNotification>();
      snapAcademy.docs.forEach((d: any) => map.set(d.id, { ...d.data(), id: d.id }));
      snapGlobal.docs.forEach((d: any) => map.set(d.id, { ...d.data(), id: d.id }));
      remoteNotices = Array.from(map.values());
    }

    if (remoteNotices.length > 0) {
      const localAlerts = erpStorage.getState().alerts;
      const combinedMap = new Map<string, AlertNotification>();
      localAlerts.forEach((a) => combinedMap.set(a.id, a));
      remoteNotices.forEach((a) => combinedMap.set(a.id, a));

      const mergedList = Array.from(combinedMap.values());
      erpStorage.setAlerts(mergedList);
      return remoteNotices;
    }
  } catch (err) {
    console.warn('Firestore fetchNoticesFromFirestore offline:', err);
  }

  return erpStorage.getState().alerts;
}

/**
 * Save notice to Firestore
 */
export async function saveNoticeToFirestore(notice: AlertNotification): Promise<void> {
  if (db) {
    try {
      await setDoc(doc(db, 'notices', notice.id), notice, { merge: true });
    } catch (err) {
      console.warn('Firestore saveNoticeToFirestore error:', err);
    }
  }
}

/**
 * Delete notice from Firestore
 */
export async function deleteNoticeFromFirestore(noticeId: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'notices', noticeId));
    } catch (err) {
      console.warn('Firestore deleteNoticeFromFirestore error:', err);
    }
  }
}

/**
 * Query user account by email
 */
export async function getUserAccountByEmail(email: string): Promise<AppUser | null> {
  const cleanEmail = email.toLowerCase().trim();

  // Check Developer hardcoded override
  if (DEV_EMAILS.includes(cleanEmail)) {
    return {
      uid: 'dev-master',
      id: 'dev-master',
      email: cleanEmail,
      name: 'Super Developer / Chief Architect',
      role: 'developer',
      academyId: null,
      academyName: 'All Academies Network',
      status: 'approved',
      createdAt: Date.now(),
    };
  }

  // Check Firestore
  if (db) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as AppUser;
      }
    } catch (err) {
      console.warn('Firestore getUserAccountByEmail offline:', err);
    }
  }

  // Check local users
  const localUsers = getLocalUsers();
  return localUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

let lastPendingFetch = 0;
let cachedPendingList: AppUser[] = [];

/**
 * Fetch pending users from Firestore collection 'users' where status == 'pending'
 * Directly implements user Firestore query snippet:
 * query(collection(db, "users"), where("status", "==", "pending"))
 */
export async function fetchPendingUsers(
  academyId?: string | null,
  isDev?: boolean,
  forceRefresh = false
): Promise<AppUser[]> {
  const now = Date.now();
  // Throttle background queries to max once per 6 seconds unless forced
  if (!forceRefresh && cachedPendingList.length > 0 && now - lastPendingFetch < 6000) {
    if (!isDev && academyId) {
      return cachedPendingList.filter(
        (u) => u.academyId === academyId && u.role !== 'admin' && u.role !== 'developer'
      );
    }
    return cachedPendingList;
  }

  try {
    if (!db) {
      const local = getLocalUsers();
      return local.filter((u) => u.status === 'pending');
    }

    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);

    const pendingUsersList: AppUser[] = [];
    querySnapshot.forEach((docSnap) => {
      pendingUsersList.push({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() } as AppUser);
    });

    lastPendingFetch = Date.now();
    cachedPendingList = pendingUsersList;
    console.log('Pending Users:', pendingUsersList);

    // Sync any newly discovered pending users into local cache so all UI components can see them
    if (pendingUsersList.length > 0) {
      const localUsers = getLocalUsers();
      const userMap = new Map<string, AppUser>();
      localUsers.forEach((u) => userMap.set(u.uid || u.id || '', u));
      pendingUsersList.forEach((u) => userMap.set(u.uid || u.id || '', u));
      saveLocalUsers(Array.from(userMap.values()));
    }

    // Role-based scoping:
    // If scoped for Academy Admin, show only members of this academy (excluding admins & developers)
    if (!isDev && academyId) {
      return pendingUsersList.filter(
        (u) =>
          u.academyId === academyId &&
          u.role !== 'admin' &&
          u.role !== 'developer'
      );
    }

    // Developer sees all pending users
    return pendingUsersList;
  } catch (error: any) {
    // Graceful fallback if security rules or offline network occurs
    if (error?.code === 'permission-denied' || error?.message?.includes('insufficient permissions')) {
      console.warn('Firestore notice: Update firestore.rules in Firebase Console to grant permission on collection "users". Falling back to local store.');
    } else {
      console.warn('Error fetching pending users from Firestore:', error?.message || error);
    }
    const local = getLocalUsers();
    return local.filter((u) => {
      if (u.status !== 'pending') return false;
      if (isDev) return true;
      if (academyId) return u.academyId === academyId && u.role !== 'admin' && u.role !== 'developer';
      return false;
    });
  }
}

/**
 * Developer view: Get all pending Admin registrations
 */
export async function getPendingAdmins(): Promise<AppUser[]> {
  try {
    const list = await fetchPendingUsers(undefined, true);
    return list.filter((u) => u.role === 'admin');
  } catch (err) {
    console.warn('Notice in getPendingAdmins:', err);
    const local = getLocalUsers();
    return local.filter((u) => u.role === 'admin' && u.status === 'pending');
  }
}

/**
 * Admin view: Get all pending Teachers, Students, and Parents for his own academy
 */
export async function getPendingAcademyMembers(academyId: string): Promise<AppUser[]> {
  try {
    const list = await fetchPendingUsers(academyId, false);
    return list;
  } catch (err) {
    console.warn('Notice in getPendingAcademyMembers:', err);
    const local = getLocalUsers();
    return local.filter(
      (u) =>
        u.academyId === academyId &&
        u.role !== 'admin' &&
        u.role !== 'developer' &&
        u.status === 'pending'
    );
  }
}

/**
 * Approve or Reject a user account
 */
export async function setUserApprovalStatus(
  userId: string,
  newStatus: 'approved' | 'rejected',
  allottedAcademyId?: string
): Promise<void> {
  const updates: Partial<AppUser> = { status: newStatus };
  if (allottedAcademyId) {
    updates.academyId = allottedAcademyId;
  }

  // Update Firestore
  if (db) {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      console.warn('Firestore setUserApprovalStatus offline:', err);
    }
  }

  // Update local users
  const local = getLocalUsers();
  const updated = local.map((u) => (u.uid === userId || u.id === userId ? { ...u, ...updates } : u));
  saveLocalUsers(updated);
}

/**
 * Delete a user account (Developer can delete ANY role/user; Admin can delete their academy users)
 */
export async function deleteUserAccount(
  userId: string,
  targetUser: AppUser,
  operatorUser: AppUser
): Promise<{ success: boolean; error?: string }> {
  const isDev =
    operatorUser.role === 'developer' ||
    DEV_EMAILS.includes(operatorUser.email.toLowerCase());
  const isAdmin = operatorUser.role === 'admin';

  // Rule: Developer can delete ANY user and ANY role!
  if (!isDev) {
    if (targetUser.role === 'developer') {
      return { success: false, error: 'Only Developers have permission to delete Developer accounts.' };
    }
    if (targetUser.role === 'admin') {
      return { success: false, error: 'Administrators cannot delete other Administrator accounts.' };
    }
    // Admin can only delete members of their own academy
    const opAcad = operatorUser.academyId;
    const targetAcad = targetUser.academyId;
    if (isAdmin && opAcad && targetAcad && opAcad !== targetAcad) {
      return { success: false, error: 'You can only manage and delete users from your assigned academy.' };
    }
  }

  // Delete from Firestore if enabled
  if (db) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.warn('Firestore deleteDoc fallback:', err);
    }
  }

  // Delete from local users collections
  const local = getLocalUsers();
  const updated = local.filter((u) => u.uid !== userId && u.id !== userId);
  saveLocalUsers(updated);

  // Also remove from taleemos_users_v5 if present
  try {
    const v5 = JSON.parse(localStorage.getItem('taleemos_users_v5') || '[]');
    const updatedV5 = v5.filter((u: any) => u.id !== userId && u.email !== targetUser.email);
    localStorage.setItem('taleemos_users_v5', JSON.stringify(updatedV5));
  } catch {}

  // Log audit trail
  erpStorage.logAudit(
    'USER_DELETED',
    'User Management',
    `${operatorUser.name} (${operatorUser.role}) deleted ${targetUser.name} (${targetUser.role}) [${targetUser.email}]`
  );

  window.dispatchEvent(new Event('storage'));
  return { success: true };
}

/**
 * Update user role or assigned academy (Developer authority)
 */
export async function updateUserRole(
  userId: string,
  newRole: AppUser['role'],
  newAcademyId?: string | null,
  newAcademyName?: string
): Promise<void> {
  const updates: Partial<AppUser> = {
    role: newRole,
  };
  if (newAcademyId !== undefined) updates.academyId = newAcademyId;
  if (newAcademyName !== undefined) updates.academyName = newAcademyName;

  if (db) {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      console.warn('Firestore updateUserRole offline:', err);
    }
  }

  const local = getLocalUsers();
  const updated = local.map((u) => (u.uid === userId || u.id === userId ? { ...u, ...updates } : u));
  saveLocalUsers(updated);
  window.dispatchEvent(new Event('storage'));
}

/**
 * Update full user account details (name, phone, role, status, academy)
 */
export async function updateUserAccount(
  userId: string,
  updates: Partial<AppUser>
): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      console.warn('Firestore updateUserAccount offline:', err);
    }
  }

  const local = getLocalUsers();
  const updated = local.map((u) => (u.uid === userId || u.id === userId ? { ...u, ...updates } : u));
  saveLocalUsers(updated);

  try {
    const v5 = JSON.parse(localStorage.getItem('taleemos_users_v5') || '[]');
    const updatedV5 = v5.map((u: any) =>
      u.id === userId || (updates.email && u.email === updates.email) ? { ...u, ...updates } : u
    );
    localStorage.setItem('taleemos_users_v5', JSON.stringify(updatedV5));
  } catch {}

  window.dispatchEvent(new Event('storage'));
}


