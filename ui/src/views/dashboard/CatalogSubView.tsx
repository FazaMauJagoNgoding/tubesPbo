import { 
  Search, 
  BookOpen, 
  Star, 
  MapPin, 
  LayoutGrid, 
  List,
  Filter,
  CheckCircle2,
  XCircle,
  Bookmark,
  X,
  Hash,
  CalendarDays,
  BadgeCheck
} from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { BookRecord, LoanRecord, borrowBook, getBooks, getCachedBooks } from '@/src/lib/firebaseBackend';

const fallbackCoverUrl = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
const BOOKMARKS_KEY = 'campuslibBookmarks';

function readBookmarksFromStorage(): number[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) as number[] : [];
  } catch {
    return [];
  }
}

export default function CatalogSubView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [books, setBooks] = useState<BookRecord[]>(() => getCachedBooks());
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookRecord | null>(null);
  const [borrowDays, setBorrowDays] = useState(7);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowedLoan, setBorrowedLoan] = useState<LoanRecord | null>(null);

  // New states for bookmark and filter
  const [bookmarks, setBookmarks] = useState<number[]>(() => readBookmarksFromStorage());
  const [showFilter, setShowFilter] = useState(false);
  const [filterJenis, setFilterJenis] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [kategoriOpen, setKategoriOpen] = useState(false);
  const [ketersediaanOpen, setKetersediaanOpen] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);

  const kategoriRef = useRef<HTMLDivElement | null>(null);
  const ketersediaanRef = useRef<HTMLDivElement | null>(null);

  const bookmarkedBooks = useMemo(() => books.filter((b) => bookmarks.includes(b.id)), [books, bookmarks]);

  // close dropdowns when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (kategoriRef.current && !kategoriRef.current.contains(e.target as Node)) {
        setKategoriOpen(false);
      }
      if (ketersediaanRef.current && !ketersediaanRef.current.contains(e.target as Node)) {
        setKetersediaanOpen(false);
      }
      // close bookmarks modal when clicking outside
      // (modal covers screen so this is mostly defensive)
    }

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    // persist bookmarks
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  const loadBooks = () => {
    getBooks()
      .then((loadedBooks) => {
        setBooks(loadedBooks);
        setSelectedBook((currentBook) => {
          if (!currentBook) {
            return null;
          }

          return loadedBooks.find((book) => book.id === currentBook.id) || currentBook;
        });
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Gagal memuat buku.'));
  };

  useEffect(loadBooks, []);

  const toggleBookmark = (bookId: number) => {
    setBookmarks((prev) => (prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]));
  };

  const availableJenis = useMemo(() => {
    const map = new Map<string, string>();
    books.forEach((b) => {
      const raw = String(b.jenis || '').trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      const nice = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      if (!map.has(key)) map.set(key, nice);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([key, label]) => ({ key, label }));
  }, [books]);

  const filteredBooks = useMemo(() => {
    const keyword = query.toLowerCase().trim();
    return books.filter((book) => {
      if (keyword && !(`${book.judul} ${book.jenis}`.toLowerCase().includes(keyword))) {
        return false;
      }
      if (filterJenis !== 'all' && (String(book.jenis || '').toLowerCase() !== filterJenis)) {
        return false;
      }
      if (filterAvailability === 'available' && book.stock <= 0) {
        return false;
      }
      if (filterAvailability === 'unavailable' && book.stock > 0) {
        return false;
      }
      return true;
    });
  }, [books, query, filterJenis, filterAvailability]);

  const handleBorrow = async (book: BookRecord, days = 7) => {
    setMessage('');
    setIsBorrowing(true);
    try {
      const loan = await borrowBook(book, days);
      setMessage(`Buku "${book.judul}" berhasil dipinjam.`);
      setBorrowedLoan(loan);
      setSelectedBook(null);
      loadBooks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal meminjam buku.');
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Katalog Buku</h1>
          <p className="text-on-surface-variant mt-1">Eksplorasi ribuan koleksi buku digital dan fisik kami.</p>
        </div>
        <div className="flex bg-surface-container-high rounded-xl p-1 shrink-0">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'grid' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Cari judul, pengarang, atau kategori..." 
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-white border border-outline-variant pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowFilter((s) => !s)}
            className="bg-white border border-outline-variant px-4 py-2 rounded-2xl flex items-center justify-center gap-2 font-bold text-on-surface hover:bg-surface-container transition-all shadow-sm"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBookmarksModal(true)}
            className="bg-white border border-outline-variant px-4 py-2 rounded-2xl flex items-center justify-center gap-2 font-bold text-on-surface hover:bg-surface-container transition-all shadow-sm relative"
            aria-label="Bookmarks"
          >
            <Bookmark className="w-5 h-5" />
            <span className="hidden sm:inline">Bookmarks</span>
            {bookmarks.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center px-1 font-bold border-2 border-white">{bookmarks.length}</span>
            )}
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="bg-white border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-on-surface-variant">Kategori</label>
            <div className="ml-2 relative" ref={kategoriRef}>
              <button
                type="button"
                onClick={() => setKategoriOpen((s) => !s)}
                className="flex items-center justify-between w-44 rounded-lg border border-outline-variant px-3 py-2 bg-white"
                aria-haspopup="listbox"
                aria-expanded={String(kategoriOpen)}
              >
                <span className="truncate">
                  {filterJenis === 'all' ? 'Semua' : (availableJenis.find((x) => x.key === filterJenis)?.label || 'Semua')}
                </span>
                <span className="ml-2 text-on-surface-variant">▾</span>
              </button>

              <AnimatePresence>
                {kategoriOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute left-0 mt-2 w-44 z-20 rounded-lg bg-white border border-outline-variant shadow-lg overflow-hidden"
                    role="listbox"
                  >
                    <button
                      type="button"
                      onClick={() => { setFilterJenis('all'); setKategoriOpen(false); }}
                      className={cn('w-full text-left px-3 py-2 hover:bg-surface-container', filterJenis === 'all' ? 'bg-primary/10 text-primary' : '')}
                    >
                      Semua
                    </button>
                    {availableJenis.map((j) => (
                      <button
                        key={j.key}
                        type="button"
                        onClick={() => { setFilterJenis(j.key); setKategoriOpen(false); }}
                        className={cn('w-full text-left px-3 py-2 hover:bg-surface-container', filterJenis === j.key ? 'bg-primary/10 text-primary' : '')}
                      >
                        {j.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2" ref={ketersediaanRef}>
            <label className="text-xs font-bold text-on-surface-variant">Ketersediaan</label>
            <div className="ml-2 relative">
              <button
                type="button"
                onClick={() => setKetersediaanOpen((s) => !s)}
                className="flex items-center justify-between w-44 rounded-lg border border-outline-variant px-3 py-2 bg-white"
                aria-haspopup="listbox"
                aria-expanded={String(ketersediaanOpen)}
              >
                <span className="truncate">
                  {filterAvailability === 'all' ? 'Semua' : filterAvailability === 'available' ? 'Tersedia' : 'Habis'}
                </span>
                <span className="ml-2 text-on-surface-variant">▾</span>
              </button>

              <AnimatePresence>
                {ketersediaanOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute left-0 mt-2 w-44 z-20 rounded-lg bg-white border border-outline-variant shadow-lg overflow-hidden"
                    role="listbox"
                  >
                    <button
                      type="button"
                      onClick={() => { setFilterAvailability('all'); setKetersediaanOpen(false); }}
                      className={cn('w-full text-left px-3 py-2 hover:bg-surface-container', filterAvailability === 'all' ? 'bg-primary/10 text-primary' : '')}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterAvailability('available'); setKetersediaanOpen(false); }}
                      className={cn('w-full text-left px-3 py-2 hover:bg-surface-container', filterAvailability === 'available' ? 'bg-primary/10 text-primary' : '')}
                    >
                      Tersedia
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterAvailability('unavailable'); setKetersediaanOpen(false); }}
                      className={cn('w-full text-left px-3 py-2 hover:bg-surface-container', filterAvailability === 'unavailable' ? 'bg-primary/10 text-primary' : '')}
                    >
                      Habis
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterJenis('all');
                setFilterAvailability('all');
                setShowFilter(false);
              }}
              className="px-3 py-2 rounded-lg border"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setShowFilter(false)}
              className="px-3 py-2 rounded-lg bg-primary text-white"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm font-semibold text-primary">{message}</p>}

      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"
      )}>
        {filteredBooks.map((book, i) => (
          <motion.div 
            key={book.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedBook(book)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedBook(book);
              }
            }}
            className={cn(
              "bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:translate-y-[-4px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all group cursor-pointer",
              viewMode === 'list' && "flex items-start h-auto sm:h-48"
            )}
          >
            <div className={cn(
              "relative bg-surface-container-high aspect-[3/4] overflow-hidden",
              viewMode === 'list' ? "w-24 sm:w-36 flex-shrink-0" : "w-full"
            )}>
              <img 
                src={book.coverUrl || `${fallbackCoverUrl}&sig=${book.id}`}
                alt={book.judul} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <button 
                type="button"
                onClick={(event) => { event.stopPropagation(); toggleBookmark(book.id); }}
                aria-label={bookmarks.includes(book.id) ? 'Hapus bookmark' : 'Tambah bookmark'}
                className={cn(
                  "absolute top-3 right-3 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100",
                  bookmarks.includes(book.id) ? 'bg-primary/10 text-primary' : 'bg-white/80 text-on-surface-variant hover:text-primary'
                )}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col flex-1 h-full">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                  {book.jenis}
                </div>
                <h3 className="font-bold text-on-surface leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {book.judul}
                </h3>
                <p className="text-xs font-semibold text-on-surface-variant mb-4">ID Buku: {book.id}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-xs font-bold text-on-surface font-mono">
                    <Star className="w-3.5 h-3.5 text-tertiary fill-tertiary" />
                    {book.stock}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
                    <MapPin className="w-3.5 h-3.5" />
                    Rak Perpustakaan
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 mt-auto">
                <div className="flex items-center gap-1.5">
                  {book.stock > 0 
                    ? <CheckCircle2 className="w-4 h-4 text-secondary" />
                    : <XCircle className="w-4 h-4 text-error" />
                  }
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    book.stock > 0 ? "text-secondary" : "text-error"
                  )}>
                    {book.stock > 0 ? 'Tersedia' : 'Habis'}
                  </span>
                </div>
                <button 
                  type="button"
                  disabled={book.stock <= 0 || isBorrowing}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBook(book);
                    setBorrowDays(7);
                  }}
                  className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-primary-container disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Pinjam
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bookmarks modal */}
      <AnimatePresence>
        {showBookmarksModal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowBookmarksModal(false)}>
            <motion.div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6"
              initial={{ y: 12, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:12, opacity:0 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Bookmarks</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowBookmarksModal(false)} className="px-3 py-1 rounded bg-primary text-white">Tutup</button>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {bookmarkedBooks.length === 0 && <div className="text-on-surface-variant">Belum ada bookmark.</div>}
                {bookmarkedBooks.map((b) => (
                  <motion.div key={b.id} className="bg-surface-container-high rounded-lg overflow-hidden border border-outline-variant p-3 flex flex-col"
                    whileHover={{ scale: 1.02 }} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}>
                    <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden rounded-md mb-3">
                      <img src={b.coverUrl || `${fallbackCoverUrl}&sig=${b.id}`} alt={b.judul} className="w-full h-full object-cover" />
                      <button onClick={() => toggleBookmark(b.id)} className="absolute top-2 right-2 p-2 rounded-full bg-white/90">
                        <Bookmark className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">{b.judul}</div>
                      <div className="text-xs text-on-surface-variant mt-1">{b.jenis}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button onClick={() => { setSelectedBook(b); setShowBookmarksModal(false); }} className="text-sm px-3 py-1 rounded border">Detail</button>
                      <button onClick={() => { toggleBookmark(b.id); }} className="text-sm px-3 py-1 rounded bg-error/10 text-error">Hapus</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBook && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-book-title"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="grid md:grid-cols-[240px_1fr]">
                <div className="relative aspect-[3/4] bg-surface-container-high md:aspect-auto">
                  <img
                    src={selectedBook.coverUrl || `${fallbackCoverUrl}&sig=${selectedBook.id}`}
                    alt={selectedBook.judul}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex min-h-[360px] flex-col p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">{selectedBook.jenis}</p>
                      <h2 id="catalog-book-title" className="text-2xl font-bold leading-tight text-on-surface">
                        {selectedBook.judul}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBook(null)}
                      className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                      aria-label="Tutup detail buku"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-outline-variant/40 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        <Hash className="h-4 w-4" />
                        ID Buku
                      </div>
                      <p className="font-bold text-on-surface">{selectedBook.id}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/40 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        <BookOpen className="h-4 w-4" />
                        Stok
                      </div>
                      <p className="font-bold text-on-surface">{selectedBook.stock} tersedia</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/40 p-4 sm:col-span-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        <CalendarDays className="h-4 w-4" />
                        Durasi Peminjaman
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          step="1"
                          value={borrowDays}
                          onChange={(event) => {
                            const nextDays = Number(event.target.value);
                            setBorrowDays(Number.isFinite(nextDays) ? nextDays : 1);
                          }}
                          className="w-24 rounded-lg border border-outline-variant px-3 py-2 font-bold text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          aria-label="Lama peminjaman dalam hari"
                        />
                        <p className="font-semibold text-on-surface">hari, biaya Rp2.000</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 border-t border-outline-variant/30 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      {selectedBook.stock > 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-secondary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-error" />
                      )}
                      <span className={cn(
                        "text-sm font-bold",
                        selectedBook.stock > 0 ? "text-secondary" : "text-error"
                      )}>
                        {selectedBook.stock > 0 ? 'Buku tersedia untuk dipinjam' : 'Stok buku habis'}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={selectedBook.stock <= 0 || isBorrowing || borrowDays < 1}
                      onClick={() => handleBorrow(selectedBook, borrowDays)}
                      className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {isBorrowing ? 'Meminjam...' : 'Konfirmasi Pinjam'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {borrowedLoan && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBorrowedLoan(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="borrow-success-title"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <BadgeCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 id="borrow-success-title" className="text-xl font-bold text-on-surface">Peminjaman Berhasil</h2>
                    <p className="text-sm font-semibold text-on-surface-variant">ID Peminjaman: LN-{borrowedLoan.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBorrowedLoan(null)}
                  className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  aria-label="Tutup konfirmasi peminjaman"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 rounded-xl border border-outline-variant/40 p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Buku</p>
                  <p className="font-bold text-on-surface">{borrowedLoan.bookTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tanggal Pinjam</p>
                    <p className="font-bold text-on-surface">{borrowedLoan.borrowDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Lama Pinjam</p>
                    <p className="font-bold text-on-surface">{borrowedLoan.borrowDays} hari</p>
                  </div>
                </div>
                <div className="rounded-lg bg-error/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-error">Harus Dikembalikan</p>
                  <p className="text-2xl font-bold text-error">{borrowedLoan.dueDate}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBorrowedLoan(null)}
                className="mt-5 w-full rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-primary-container"
              >
                Mengerti
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
