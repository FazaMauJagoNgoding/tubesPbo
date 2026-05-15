export type UserRole = 'admin' | 'member';

export type AuthSession = {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  idToken: string;
};

export type BookRecord = {
  id: number;
  judul: string;
  jenis: string;
  stock: number;
  coverUrl?: string;
};

export type LoanRecord = {
  id: string;
  memberUid: string;
  memberName: string;
  memberEmail?: string;
  bookId: number;
  bookTitle: string;
  bookJenis: string;
  borrowDate: string;
  borrowDays: number;
  dueDate: string;
  returnDate?: string;
  totalHarga?: number;
  paid?: boolean;
  fine?: number;
  returned?: boolean;
};

const SESSION_KEY = 'campuslibSession';
const BOOKS_CACHE_KEY = 'campuslibBooksCache';
const LOANS_CACHE_KEY = 'campuslibLoansCache';
const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const API_KEY = viteEnv.VITE_FIREBASE_API_KEY || 'AIzaSyCe__H081_RPls06QgNWrO4Ad0L5hKFir0';
const DATABASE_URL = (viteEnv.VITE_FIREBASE_DATABASE_URL || 'https://tubes-pbo-d50e4-default-rtdb.asia-southeast1.firebasedatabase.app').replace(/\/+$/, '');

const demoBooks: BookRecord[] = [
  {
    id: 1,
    judul: 'Clean Code',
    jenis: 'Pemrograman',
    stock: 3,
    coverUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 2,
    judul: 'Laskar Pelangi',
    jenis: 'Novel',
    stock: 5,
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 3,
    judul: 'Atomic Habits',
    jenis: 'Pengembangan Diri',
    stock: 2,
    coverUrl: 'https://images.unsplash.com/photo-1581333100576-b73bbe923b91?auto=format&fit=crop&q=80&w=400',
  },
];

function hasFirebaseConfig() {
  return Boolean(API_KEY && DATABASE_URL);
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.error?.message || data?.error || 'Request Firebase gagal.';
    throw new Error(String(message).replaceAll('_', ' '));
  }

  return data as T;
}

function authUrl(endpoint: 'signInWithPassword' | 'signUp') {
  return `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${encodeURIComponent(API_KEY)}`;
}

function dbUrl(path: string, idToken: string) {
  const cleanPath = path.replace(/^\/+/, '');
  return `${DATABASE_URL}/${cleanPath}.json?auth=${encodeURIComponent(idToken)}`;
}

function toArray<T extends object>(records: Record<string, T | null> | T[] | null | undefined, mapId?: (key: string, value: T) => T) {
  if (!records) {
    return [];
  }

  return Object.entries(records)
    .filter((entry): entry is [string, T] => entry[1] !== null)
    .map(([key, value]) => mapId ? mapId(key, value) : value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function readCache<T>(key: string, fallback: T): T {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache is only a speed-up layer. Firebase remains the source of truth.
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('userRole', session.role);
}

export function getSession(): AuthSession | null {
  const rawSession = localStorage.getItem(SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('userRole');
}

export function getCachedBooks(): BookRecord[] {
  return readCache<BookRecord[]>(BOOKS_CACHE_KEY, []);
}

export function getCachedLoans(): LoanRecord[] {
  return readCache<LoanRecord[]>(LOANS_CACHE_KEY, []);
}

export async function login(email: string, password: string): Promise<AuthSession> {
  if (!hasFirebaseConfig()) {
    throw new Error('Konfigurasi Firebase frontend belum tersedia.');
  }

  const auth = await requestJson<{ idToken: string; localId: string; email: string }>(authUrl('signInWithPassword'), {
    method: 'POST',
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const user = await requestJson<{ name?: string; role?: UserRole } | null>(dbUrl(`users/${auth.localId}`, auth.idToken));

  return {
    uid: auth.localId,
    email: auth.email,
    idToken: auth.idToken,
    name: user?.name || auth.email,
    role: user?.role === 'admin' ? 'admin' : 'member',
  };
}

export async function registerMember(name: string, email: string, password: string): Promise<AuthSession> {
  if (!hasFirebaseConfig()) {
    throw new Error('Konfigurasi Firebase frontend belum tersedia.');
  }

  const auth = await requestJson<{ idToken: string; localId: string; email: string }>(authUrl('signUp'), {
    method: 'POST',
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const user = { name, email: auth.email, role: 'member' as UserRole };
  await requestJson(dbUrl(`users/${auth.localId}`, auth.idToken), {
    method: 'PUT',
    body: JSON.stringify(user),
  });

  return {
    uid: auth.localId,
    email: auth.email,
    idToken: auth.idToken,
    ...user,
  };
}

export async function getBooks(session = getSession()): Promise<BookRecord[]> {
  if (!session) {
    return demoBooks;
  }

  const records = await requestJson<Record<string, BookRecord> | null>(dbUrl('books', session.idToken));
  const books = toArray(records).sort((a, b) => a.id - b.id);
  writeCache(BOOKS_CACHE_KEY, books);
  return books;
}

export async function saveBook(book: BookRecord, session = getSession()) {
  if (!session) {
    throw new Error('Silakan login terlebih dahulu.');
  }

  await requestJson(dbUrl(`books/${book.id}`, session.idToken), {
    method: 'PUT',
    body: JSON.stringify(book),
  });
  const cachedBooks = getCachedBooks();
  writeCache(
    BOOKS_CACHE_KEY,
    [...cachedBooks.filter((cachedBook) => cachedBook.id !== book.id), book].sort((a, b) => a.id - b.id)
  );
}

export async function deleteBook(bookId: number, session = getSession()) {
  if (!session) {
    throw new Error('Silakan login terlebih dahulu.');
  }

  await requestJson(dbUrl(`books/${bookId}`, session.idToken), { method: 'DELETE' });
  writeCache(BOOKS_CACHE_KEY, getCachedBooks().filter((book) => book.id !== bookId));
}

export async function getLoans(session = getSession()): Promise<LoanRecord[]> {
  if (!session) {
    return [];
  }

  const records = await requestJson<Record<string, Omit<LoanRecord, 'id'> | null> | null>(dbUrl('loans', session.idToken));
  if (!records) {
    writeCache(LOANS_CACHE_KEY, []);
    return [];
  }

  const loans = Object.entries(records)
    .filter((entry): entry is [string, Omit<LoanRecord, 'id'>] => entry[1] !== null)
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.id.localeCompare(a.id));
  writeCache(LOANS_CACHE_KEY, loans);
  return loans;
}

export async function borrowBook(book: BookRecord, days = 7, session = getSession()): Promise<LoanRecord> {
  if (!session) {
    throw new Error('Silakan login terlebih dahulu.');
  }
  if (book.stock <= 0) {
    throw new Error('Stok buku habis.');
  }

  const updatedBook = { ...book, stock: book.stock - 1 };
  const borrowDate = new Date();
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + days);
  const loan: Omit<LoanRecord, 'id'> = {
    memberUid: session.uid,
    memberName: session.name,
    memberEmail: session.email,
    bookId: book.id,
    bookTitle: book.judul,
    bookJenis: book.jenis,
    borrowDate: formatDate(borrowDate),
    borrowDays: days,
    dueDate: formatDate(dueDate),
    totalHarga: 2000,
    paid: false,
    fine: 0,
    returned: false,
  };

  await saveBook(updatedBook, session);
  const loanId = String(book.id);
  await requestJson(dbUrl(`loans/${loanId}`, session.idToken), {
    method: 'PUT',
    body: JSON.stringify(loan),
  });
  const loanRecord = { id: loanId, ...loan };
  writeCache(
    LOANS_CACHE_KEY,
    [loanRecord, ...getCachedLoans().filter((cachedLoan) => cachedLoan.id !== loanId)]
  );
  return loanRecord;
}

export async function confirmBookReturn(loan: LoanRecord, session = getSession()): Promise<LoanRecord> {
  if (!session) {
    throw new Error('Silakan login terlebih dahulu.');
  }

  const returnedLoan: LoanRecord = {
    ...loan,
    returned: true,
    returnDate: formatDate(new Date()),
  };
  const { id: _id, ...returnedLoanData } = returnedLoan;

  await requestJson(dbUrl(`loans/${loan.id}`, session.idToken), {
    method: 'PUT',
    body: JSON.stringify(returnedLoanData),
  });

  const books = await getBooks(session);
  const borrowedBook = books.find((book) => book.id === loan.bookId);
  if (borrowedBook) {
    await saveBook({ ...borrowedBook, stock: borrowedBook.stock + 1 }, session);
  }

  writeCache(
    LOANS_CACHE_KEY,
    getCachedLoans().map((cachedLoan) => cachedLoan.id === returnedLoan.id ? returnedLoan : cachedLoan)
  );

  return returnedLoan;
}
