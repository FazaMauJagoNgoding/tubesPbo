import { 
  Plus, 
  Search,
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Edit2,
  Trash2,
  MinusCircle,
  PlusCircle,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookRecord, deleteBook, getBooks, getCachedBooks, getSession, saveBook } from '@/src/lib/firebaseBackend';

export default function ManageBooksSubView() {
  const session = getSession();
  const isAdmin = session?.role === 'admin';
  const [books, setBooks] = useState<BookRecord[]>(() => getCachedBooks());
  const [message, setMessage] = useState(isAdmin ? '' : 'Akun ini bukan admin. Login dengan akun admin untuk mengubah data buku.');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [addButtonActive, setAddButtonActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<number, { mode: 'increase' | 'decrease'; amount: number }>>({});
  const [animatingAdjusts, setAnimatingAdjusts] = useState<Record<number, boolean>>({});
  // transient bump animation state per-book (used to smooth stock update)
  const [bumping, setBumping] = useState<Record<number, boolean>>({});

  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [form, setForm] = useState({
    judul: '',
    jenis: '',
    stock: '1',
    coverUrl: '',
  });

  // optimistic/pending stock updates with undo
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, { delta: number; timerId?: number }>>({});

  // filter & sort state for admin listing
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [sortOption, setSortOption] = useState<'title-asc'|'title-desc'|'stock-asc'|'stock-desc'>('title-asc');

  const jenisOptions = useMemo(() => Array.from(new Set(books.map(b => b.jenis))).filter(Boolean), [books]);

  const displayedBooks = useMemo(() => {
    let items = books.slice();
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      items = items.filter(b => b.judul.toLowerCase().includes(q));
    }
    if (filterJenis) {
      items = items.filter(b => b.jenis === filterJenis);
    }
    switch (sortOption) {
      case 'title-asc': items.sort((a,b) => a.judul.localeCompare(b.judul)); break;
      case 'title-desc': items.sort((a,b) => b.judul.localeCompare(a.judul)); break;
      case 'stock-asc': items.sort((a,b) => a.stock - b.stock); break;
      case 'stock-desc': items.sort((a,b) => b.stock - a.stock); break;
    }
    return items;
  }, [books, filterQuery, filterJenis, sortOption]);

  const nextBookId = useMemo(() => Math.max(0, ...books.map((book) => book.id)) + 1, [books]);

  const loadBooks = async () => {
    try {
      const bookData = await getBooks();
      setBooks(bookData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memuat buku.');
    }
  };

  useEffect(() => {
    void loadBooks();
  }, []);

  // --- optimistic update helpers ---
  const openAdjustForm = (bookId: number, mode: 'increase' | 'decrease') => {
    // allow only one adjust control open at a time
    setPendingAdjustments(() => ({ [bookId]: { mode, amount: 1 } }));
    // trigger entrance animation for the inline control (clear others)
    setAnimatingAdjusts(() => ({ [bookId]: true }));
    // flip to visible on next tick so transition plays consistently
    setTimeout(() => setAnimatingAdjusts(() => ({})), 20);
  };

  const changeAdjustAmount = (bookId: number, delta: number) => {
    setPendingAdjustments((prev) => {
      const entry = prev[bookId];
      if (!entry) return prev;
      const nextAmount = Math.max(1, entry.amount + delta);
      return { ...prev, [bookId]: { ...entry, amount: nextAmount } };
    });
  };

  const setAdjustAmount = (bookId: number, value: number) => {
    setPendingAdjustments((prev) => {
      const entry = prev[bookId];
      if (!entry) return prev;
      const next = Math.max(1, Math.floor(value || 1));
      return { ...prev, [bookId]: { ...entry, amount: next } };
    });
  };

  const cancelAdjust = (bookId: number) => {
    setPendingAdjustments((prev) => { const copy = { ...prev }; delete copy[bookId]; return copy; });
  };

  const confirmAdjust = async (bookId: number) => {
    const entry = pendingAdjustments[bookId];
    if (!entry) return;
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    const amt = entry.amount;
    const newStock = entry.mode === 'increase' ? book.stock + amt : book.stock - amt;
    if (newStock < 0) {
      setMessage('Stok tidak boleh kurang dari 0.');
      return;
    }
    // optimistic UI + smooth bump animation
    triggerBump(bookId);
    setPendingUpdates((prev) => ({ ...prev, [bookId]: { delta: entry.mode === 'increase' ? amt : -amt } }));
    // close adjust UI
    setPendingAdjustments((prev) => { const copy = { ...prev }; delete copy[bookId]; return copy; });

    const success = await runBookAction(() => saveBook({ ...book, stock: newStock }), 'Stok berhasil diperbarui.');

    if (!success) {
      // clear optimistic state on failure
      setPendingUpdates((prev) => { const copy = { ...prev }; delete copy[bookId]; return copy; });
    } else {
      // already reloaded in runBookAction; clear optimistic just in case
      setPendingUpdates((prev) => { const copy = { ...prev }; delete copy[bookId]; return copy; });
    }
  };

  const cancelPending = (bookId: number) => {
    setPendingUpdates((prev) => {
      const entry = prev[bookId];
      if (entry?.timerId) {
        clearTimeout(entry.timerId);
      }
      const copy = { ...prev };
      delete copy[bookId];
      return copy;
    });
  };

  const triggerBump = (bookId: number) => {
    setBumping(prev => ({ ...prev, [bookId]: true }));
    window.setTimeout(() => {
      setBumping(prev => { const copy = { ...prev }; delete copy[bookId]; return copy; });
    }, 260);
  };



  const runBookAction = async (action: () => Promise<void>, successMessage: string) => {
    setMessage('');
    if (!isAdmin) {
      setMessage(`Akun ${session?.email || 'ini'} bukan admin. Update buku ditolak oleh Firebase.`);
      return false;
    }

    try {
      await action();
      await loadBooks();
      setMessage(successMessage);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Aksi gagal.';
      setMessage(
        errorMessage.toLowerCase().includes('permission')
          ? `${errorMessage}. Pastikan login memakai akun dengan role admin di Firebase.`
          : errorMessage
      );
      return false;
    }
  };

  const resetForm = () => {
    // play closing animation first (match smooth-pop duration)
    setAddFormVisible(false);
    // give CSS collapse transition time to finish before unmounting
    setTimeout(() => {
      setForm({ judul: '', jenis: '', stock: '1', coverUrl: '' });
      setEditingBookId(null);
      setIsAddFormOpen(false);
    }, 300);
  };

  const openAddForm = () => {
    setForm({ judul: '', jenis: '', stock: '1', coverUrl: '' });
    setEditingBookId(null);
    setIsAddFormOpen(true);
    // animate button press and show form
    setAddButtonActive(true);
    setTimeout(() => setAddButtonActive(false), 180);
    // trigger enter animation on next tick
    setTimeout(() => setAddFormVisible(true), 10);
  };

  const openEditForm = (book: BookRecord) => {
    setForm({
      judul: book.judul,
      jenis: book.jenis,
      stock: String(book.stock),
      coverUrl: book.coverUrl || '',
    });
    setEditingBookId(book.id);
    // open form and trigger the same smooth pop-in animation used by Add
    setIsAddFormOpen(true);
    setTimeout(() => setAddFormVisible(true), 10);
  };

  const handleCoverFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('File sampul harus berupa gambar.');
      return;
    }

    if (file.size > 900 * 1024) {
      setMessage('Ukuran gambar maksimal 900 KB agar aman disimpan di database.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, coverUrl: String(reader.result || '') }));
      setMessage('');
    };
    reader.onerror = () => setMessage('Gagal membaca file gambar.');
    reader.readAsDataURL(file);
  };

  const handleAddBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const judul = form.judul.trim();
    const jenis = form.jenis.trim();
    const stock = Number(form.stock);
    const coverUrl = form.coverUrl.trim();
    const bookId = editingBookId ?? nextBookId;

    if (!judul || !jenis) {
      setMessage('Judul dan jenis buku wajib diisi.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setMessage('Stock harus berupa angka 0 atau lebih.');
      return;
    }

    try {
      setIsSaving(true);
      const isSuccess = await runBookAction(
        () => saveBook({ id: bookId, judul, jenis, stock, ...(coverUrl ? { coverUrl } : {}) }),
        editingBookId ? 'Buku berhasil diperbarui.' : 'Buku berhasil ditambahkan.'
      );

      if (isSuccess) {
        resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Kelola Buku</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manajemen inventaris, tambah judul baru, dan update stok perpustakaan.</p>
        </div>
        <button disabled={!isAdmin} onClick={openAddForm} className={cn("flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150", addButtonActive ? 'scale-95 shadow-lg' : '')}>
          <Plus className="w-5 h-5" />
          Tambah Buku
        </button>
      </div>
      {message && <p className="text-sm font-semibold text-primary">{message}</p>}

      {isAddFormOpen && (
        <div className={`bg-white rounded-2xl shadow-sm border border-outline-variant/30 transform smooth-collapse ${addFormVisible ? 'smooth-pop opacity-100 translate-y-0 scale-100 collapse-open' : 'opacity-0 -translate-y-2 scale-95 collapse-closed'}`}>
          <div className={`collapse-inner transition-[padding] duration-160 ${addFormVisible ? 'py-6 px-6' : 'py-0 px-6'}`}>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-on-surface">
                {editingBookId ? 'Edit Buku' : 'Tambah Buku Baru'}
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Data akan disimpan ke Firebase path books/{editingBookId ?? nextBookId}.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all"
              title="Tutup form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddBook} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_140px] gap-4 items-end">
            <div className="space-y-2">
              <label htmlFor="judul" className="text-sm font-semibold text-on-surface">Judul Buku</label>
              <input
                id="judul"
                type="text"
                value={form.judul}
                onChange={(event) => setForm((current) => ({ ...current, judul: event.target.value }))}
                className="w-full bg-white px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Contoh: Clean Architecture"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="jenis" className="text-sm font-semibold text-on-surface">Jenis</label>
              <input
                id="jenis"
                type="text"
                value={form.jenis}
                onChange={(event) => setForm((current) => ({ ...current, jenis: event.target.value }))}
                className="w-full bg-white px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Pemrograman"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="stock" className="text-sm font-semibold text-on-surface">Stock</label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                className="w-full bg-white px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_auto] gap-4 items-end">
              <div className="aspect-[3/4] w-32 sm:w-40 rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant">
                {form.coverUrl ? (
                  <img src={form.coverUrl} alt="Pratinjau sampul" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center px-4 text-center text-xs font-bold text-on-surface-variant">
                    Belum ada sampul
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="coverUrl" className="text-sm font-semibold text-on-surface">URL Sampul</label>
                  <input
                    id="coverUrl"
                    type="url"
                    value={form.coverUrl.startsWith('data:') ? '' : form.coverUrl}
                    onChange={(event) => setForm((current) => ({ ...current, coverUrl: event.target.value }))}
                    className="w-full bg-white px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="https://contoh.com/sampul.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="coverFile" className="text-sm font-semibold text-on-surface">Upload Sampul</label>
                  <input
                    id="coverFile"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleCoverFile(event.target.files?.[0])}
                    className="w-full bg-white px-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving || !isAdmin}
                className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-container transition-all disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                {isSaving ? 'Menyimpan...' : editingBookId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low/30">
          <div className="w-full sm:w-auto relative hidden sm:block">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Cari judul..."
                className="w-full bg-white border border-outline-variant pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto relative">
            <div className="relative">
              <button onClick={() => setFilterOpen(prev => { const next = !prev; if (next) setSortOpen(false); return next; })} className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
            <div className="relative">
              <button onClick={() => setSortOpen(prev => { const next = !prev; if (next) setFilterOpen(false); return next; })} className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all">
                <ArrowUpDown className="w-4 h-4" /> Urutkan
              </button>
            </div>

            {(filterOpen || sortOpen) && (
              <div style={{ top: 'calc(100% + 8px)', transitionTimingFunction: 'cubic-bezier(0.2,0.9,0.2,1)', willChange: 'transform, opacity' }} className={cn("absolute left-0 right-0 flex justify-center gap-6 transform transition-all duration-360 z-50", (filterOpen || sortOpen) ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-3 pointer-events-none')}>
                {filterOpen && (
                  <div style={{ transitionTimingFunction: 'cubic-bezier(0.2,0.9,0.2,1)', willChange: 'transform, opacity' }} className={cn('w-72 bg-white p-4 rounded-xl shadow-md transform transition-[transform,opacity] duration-360', filterOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95')}>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Cari judul</label>
                      <input value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm" placeholder="Cari judul..." />
                      <div className="pt-2">
                        <label className="text-xs font-semibold">Jenis</label>
                        <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full px-2 py-2 border border-outline-variant rounded-md text-sm">
                          <option value="">Semua jenis</option>
                          {jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => { setFilterQuery(''); setFilterJenis(''); }} className="px-3 py-1 text-sm border rounded">Reset</button>
                        <button onClick={() => setFilterOpen(false)} className="px-3 py-1 text-sm bg-primary text-white rounded">Terapkan</button>
                      </div>
                    </div>
                  </div>
                )}

                {sortOpen && (
                  <div style={{ transitionTimingFunction: 'cubic-bezier(0.2,0.9,0.2,1)', willChange: 'transform, opacity' }} className={cn('w-48 bg-white p-4 rounded-xl shadow-md transform transition-[transform,opacity] duration-360', sortOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95')}>
                    <label className="text-xs font-semibold">Urutkan</label>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className="w-full px-2 py-2 border border-outline-variant rounded-md text-sm">
                      <option value="title-asc">Judul A-Z</option>
                      <option value="title-desc">Judul Z-A</option>
                      <option value="stock-asc">Stock ↑</option>
                      <option value="stock-desc">Stock ↓</option>
                    </select>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => { setSortOption('title-asc'); }} className="px-3 py-1 text-sm border rounded">Reset</button>
                      <button onClick={() => setSortOpen(false)} className="px-3 py-1 text-sm bg-primary text-white rounded">Terapkan</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest w-32">ID Buku</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Judul</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest w-40">Jenis</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest w-32 text-center">Stock</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest w-48 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {displayedBooks.map((book) => (
                <tr key={book.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="py-6 px-6 text-sm font-mono font-bold text-on-surface-variant">BK-{String(book.id).padStart(4, '0')}</td>
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant shrink-0">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.judul} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-on-surface-variant">No Cover</div>
                        )}
                      </div>
                      <div>
                        <div className="text-base font-bold text-on-surface">{book.judul}</div>
                        <div className="text-xs font-semibold text-on-surface-variant mt-1">{book.coverUrl ? 'Sampul tersedia' : 'Belum ada sampul'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim/30"
                    )}>
                      {book.jenis}
                    </span>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className={cn("inline-flex items-center justify-center w-12 h-10 rounded-xl text-sm font-bold shadow-inner transition-transform duration-220 ease-out", pendingUpdates[book.id] ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-primary', bumping[book.id] ? 'scale-105' : '')}>
                        {book.stock + (pendingUpdates[book.id]?.delta || 0)}
                      </div>
                      {book.stock === 0 && (
                        <div className="text-[10px] text-error mt-1.5 font-bold uppercase tracking-widest">Habis</div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center justify-end gap-2">
                      {pendingAdjustments[book.id] ? (
                        <div className={cn("flex items-center gap-3 transform transition-all duration-180 origin-left", animatingAdjusts[book.id] ? 'opacity-0 -translate-x-2 scale-95' : 'opacity-100 translate-x-0 scale-100')}>
                          <div className="adjust-inline">
                            <button onClick={() => changeAdjustAmount(book.id, -1)} type="button" className="control-btn btn-minus" aria-label="Kurangi">-</button>
                            <input
                              inputMode="numeric"
                              pattern="[0-9]*"
                              type="number"
                              min={1}
                              value={pendingAdjustments[book.id].amount}
                              onChange={(e) => setAdjustAmount(book.id, Number(e.target.value))}
                              className="inline-number-input"
                              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield', appearance: 'textfield', width: `${String(pendingAdjustments[book.id].amount).length + 1}ch` }}
                            />
                            <button onClick={() => changeAdjustAmount(book.id, 1)} type="button" className="control-btn btn-plus" aria-label="Tambah">+</button>
                          </div>
                          <button onClick={() => confirmAdjust(book.id)} className="adjust-confirm">
                            {pendingAdjustments[book.id].mode === 'increase' ? 'Tambah' : 'Kurangi'}
                          </button>
                          <button onClick={() => cancelAdjust(book.id)} className="adjust-cancel">Batal</button>
                        </div>
                      ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openAdjustForm(book.id, 'increase')} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container transition-all" title="Tambah Stok">
                              <PlusCircle className="w-5 h-5" />
                            </button>
                            <button className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                              book.stock === 0 ? "text-outline/30 cursor-not-allowed" : "text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                            )} disabled={book.stock === 0} onClick={() => openAdjustForm(book.id, 'decrease')} title="Kurangi Stok">
                              <MinusCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
<div className="w-px h-6 bg-outline-variant/30 mx-1" />
                      <button onClick={() => openEditForm(book)} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all" title="Edit Buku">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => runBookAction(() => deleteBook(book.id), 'Buku berhasil dihapus.')} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container/10 hover:text-error transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 border-t border-outline-variant/30 bg-surface-container-low/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-on-surface-variant">Menampilkan {displayedBooks.length} dari {books.length} buku dari Firebase</span>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-white hover:text-primary transition-all disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white text-sm font-bold shadow-md">1</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant text-on-surface hover:bg-white hover:text-primary transition-all text-sm font-bold">2</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant text-on-surface hover:bg-white hover:text-primary transition-all text-sm font-bold">3</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-white hover:text-primary transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
