import { 
  FileCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  MoreVertical,
  CalendarDays,
  User,
  Hash,
  Download,
  X,
  BookOpen,
  CreditCard,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  AlignLeft
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { confirmBookReturn, getCachedLoans, getLoans, getMemberProfile, LoanRecord, MemberProfileRecord } from '@/src/lib/firebaseBackend';

const defaultMemberAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#e2e8f0"/>
  <circle cx="100" cy="78" r="36" fill="#94a3b8"/>
  <path d="M38 178c8-42 35-66 62-66s54 24 62 66" fill="#94a3b8"/>
</svg>
`)}`;

function parseIndonesianDate(dateValue: string) {
  const [day, month, year] = dateValue.split('/').map(Number);
  if (!day || !month || !year) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function isLoanOverdue(loan: LoanRecord) {
  if (loan.returned) {
    return false;
  }

  const dueDate = parseIndonesianDate(loan.dueDate);
  if (!dueDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LoanDataSubView() {
  const [loans, setLoans] = useState<LoanRecord[]>(() => getCachedLoans());
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberProfileRecord | null>(null);
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getLoans()
      .then(setLoans)
      .catch((error) => console.error(error));
  }, []);

  const handleConfirmReturn = async (loan: LoanRecord) => {
    setMessage('');
    setIsConfirmingReturn(true);
    try {
      const returnedLoan = await confirmBookReturn(loan);
      setLoans((currentLoans) => currentLoans.map((currentLoan) => currentLoan.id === returnedLoan.id ? returnedLoan : currentLoan));
      setSelectedLoan(returnedLoan);
      setMessage(`Buku "${returnedLoan.bookTitle}" berhasil dikonfirmasi kembali.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal mengonfirmasi pengembalian buku.');
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  const openLoanDetail = (loan: LoanRecord) => {
    setSelectedLoan(loan);
    setSelectedMember(null);
    getMemberProfile(loan.memberUid)
      .then(setSelectedMember)
      .catch(() => setSelectedMember(null));
  };

  const closeLoanDetail = () => {
    setSelectedLoan(null);
    setSelectedMember(null);
  };

  const summary = useMemo(() => {
    const returned = loans.filter((loan) => loan.returned).length;
    const active = loans.length - returned;
    const overdue = loans.filter((loan) => Number(loan.fine || 0) > 0).length;
    return { active, overdue, returned };
  }, [loans]);
  const memberCard = selectedLoan ? {
    fullName: selectedMember?.profile?.fullName || selectedLoan.memberName,
    username: selectedMember?.profile?.username || selectedLoan.memberUsername || selectedLoan.memberUid,
    email: selectedMember?.profile?.email || selectedLoan.memberEmail || '-',
    phone: selectedMember?.profile?.phone || selectedLoan.memberPhone || '-',
    location: selectedMember?.profile?.location || selectedLoan.memberLocation || '-',
    bio: selectedMember?.profile?.bio || selectedLoan.memberBio || '-',
    photoUrl: selectedMember?.profile?.photoUrl || selectedLoan.memberPhotoUrl || defaultMemberAvatar,
  } : null;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Data Peminjaman</h1>
          <p className="text-sm text-on-surface-variant mt-1">Kelola dan monitor status peminjaman buku oleh mahasiswa.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-outline-variant px-5 py-3 rounded-xl font-bold text-sm text-on-surface hover:bg-surface-container transition-all">
            <Download className="w-5 h-5" />
            Laporan
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-lg transition-all">
            <PlusCircle className="w-5 h-5" />
            Input Baru
          </button>
        </div>
      </div>
      {message && <p className="text-sm font-semibold text-primary">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Aktif', count: summary.active, icon: Clock, color: 'text-primary' },
          { label: 'Total Terlambat', count: summary.overdue, icon: AlertCircle, color: 'text-error' },
          { label: 'Total Kembali', count: summary.returned, icon: CheckCircle2, color: 'text-on-secondary-container' },
        ].map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-container-high", c.color)}>
              <c.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-1">{c.label}</p>
              <div className="text-3xl font-bold text-on-surface leading-none">{c.count}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
             <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">ID Peminjaman</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Peminjam</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Buku yang Dipinjam</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Masa Pinjam</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Status</th>
                <th className="py-5 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loans.map((loan) => {
                const statusType = loan.returned ? 'returned' : isLoanOverdue(loan) || Number(loan.fine || 0) > 0 ? 'overdue' : 'active';
                const status = loan.returned ? 'Sudah Kembali' : statusType === 'overdue' ? 'Terlambat Kembali' : 'Peminjaman Aktif';

                return (
                <tr
                  key={loan.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openLoanDetail(loan)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openLoanDetail(loan);
                    }
                  }}
                  className="cursor-pointer hover:bg-surface-container-low/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30 transition-colors"
                >
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-2">
                       <Hash className="w-4 h-4 text-on-surface-variant" />
                       <span className="text-sm font-mono font-bold text-on-surface">LN-{loan.id}</span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                         <User className="w-4 h-4" />
                       </div>
                       <div>
                         <div className="text-sm font-bold text-on-surface">{loan.memberName}</div>
                         <div className="text-[11px] font-semibold text-on-surface-variant">{loan.memberEmail || loan.memberUid}</div>
                       </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <span className="text-sm font-bold text-on-surface block truncate max-w-[200px]">{loan.bookTitle}</span>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-on-surface font-semibold">
                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                        {loan.borrowDate}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
                        <ArrowRight className="w-3.5 h-3.5" />
                        Sampai: <span className="font-bold">{loan.dueDate}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[11px] font-bold border",
                        statusType === 'active' && "bg-primary/5 text-primary border-primary/20",
                        statusType === 'overdue' && "bg-error/5 text-error border-error/20",
                        statusType === 'returned' && "bg-secondary/10 text-secondary border-secondary/20"
                      )}>
                        {status}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="p-2 rounded-full hover:bg-surface-container transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-outline" />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedLoan && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLoanDetail}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="loan-detail-title"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 p-6">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Detail Peminjaman</p>
                  <h2 id="loan-detail-title" className="text-2xl font-bold text-on-surface">LN-{selectedLoan.id}</h2>
                </div>
                <button
                  type="button"
                  onClick={closeLoanDetail}
                  className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  aria-label="Tutup detail peminjaman"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-gradient-to-br from-[#e0eafc] via-[#f8fafe] to-white p-5 shadow-sm md:col-span-2">
                  <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                  <div className="relative z-10 flex flex-col gap-5 sm:flex-row">
                    <img
                      src={memberCard?.photoUrl || defaultMemberAvatar}
                      alt="Foto member"
                      className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Member Card</p>
                      <h3 className="mt-1 text-2xl font-bold text-on-surface">{memberCard?.fullName}</h3>
                      <p className="text-sm font-semibold text-primary">{memberCard?.username}</p>
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <Mail className="mt-0.5 h-4 w-4 text-on-surface-variant" />
                          <span className="font-semibold text-on-surface">{memberCard?.email}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="mt-0.5 h-4 w-4 text-on-surface-variant" />
                          <span className="font-semibold text-on-surface">{memberCard?.phone}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-on-surface-variant" />
                          <span className="font-semibold text-on-surface">{memberCard?.location}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlignLeft className="mt-0.5 h-4 w-4 text-on-surface-variant" />
                          <span className="font-semibold text-on-surface">{memberCard?.bio}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <BookOpen className="h-4 w-4" />
                    Informasi Buku
                  </div>
                  <p className="text-lg font-bold text-on-surface">{selectedLoan.bookTitle}</p>
                  <p className="mt-1 text-sm font-semibold text-on-surface-variant">ID Buku: BK-{selectedLoan.bookId}</p>
                  <p className="text-sm font-semibold text-on-surface-variant">Jenis: {selectedLoan.bookJenis}</p>
                </div>

                <div className="rounded-xl border border-outline-variant/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <User className="h-4 w-4" />
                    Nama Peminjam
                  </div>
                  <p className="text-lg font-bold text-on-surface">{memberCard?.fullName || selectedLoan.memberName}</p>
                  <p className="mt-1 text-sm font-semibold text-on-surface-variant">{memberCard?.email || selectedLoan.memberEmail || selectedLoan.memberUid}</p>
                </div>

                <div className="rounded-xl border border-outline-variant/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <CalendarDays className="h-4 w-4" />
                    Jadwal Pengembalian
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Pinjam</p>
                      <p className="font-bold text-on-surface">{selectedLoan.borrowDate}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Wajib Kembali</p>
                      <p className="font-bold text-on-surface">{selectedLoan.dueDate}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-on-surface-variant">Durasi: {selectedLoan.borrowDays} hari</p>
                </div>

                <div className="rounded-xl border border-outline-variant/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <CreditCard className="h-4 w-4" />
                    Informasi Pembayaran
                  </div>
                  <div className="space-y-2 text-sm font-semibold">
                    <div className="flex justify-between gap-4">
                      <span className="text-on-surface-variant">Biaya Pinjam</span>
                      <span className="text-on-surface">{formatCurrency(Number(selectedLoan.totalHarga || 0))}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-on-surface-variant">Denda</span>
                      <span className="text-on-surface">{formatCurrency(Number(selectedLoan.fine || 0))}</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-outline-variant/30 pt-2">
                      <span className="text-on-surface-variant">Status</span>
                      <span className={selectedLoan.paid ? 'text-secondary' : 'text-tertiary'}>
                        {selectedLoan.paid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "md:col-span-2 rounded-xl p-4",
                  selectedLoan.returned
                    ? "bg-secondary/15 text-secondary"
                    : isLoanOverdue(selectedLoan)
                      ? "bg-error/10 text-error"
                      : "bg-primary/10 text-primary"
                )}>
                  <div className="flex items-center gap-3">
                    {isLoanOverdue(selectedLoan) ? (
                      <AlertTriangle className="h-6 w-6" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6" />
                    )}
                    <div>
                      <p className="font-bold">
                        {selectedLoan.returned
                            ? 'Buku sudah dikembalikan'
                          : isLoanOverdue(selectedLoan)
                            ? 'Sudah melewati tanggal pengembalian'
                            : 'Belum melewati tanggal pengembalian'}
                      </p>
                      <p className="text-sm font-semibold opacity-80">
                        {selectedLoan.returned
                          ? `Tanggal kembali: ${selectedLoan.returnDate || '-'}`
                          : `Batas pengembalian: ${selectedLoan.dueDate}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-outline-variant/30 bg-white/70 p-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeLoanDetail}
                  className="rounded-lg border border-outline-variant px-5 py-3 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={selectedLoan.returned || isConfirmingReturn}
                  onClick={() => handleConfirmReturn(selectedLoan)}
                  className={cn(
                    "rounded-lg px-5 py-3 text-sm font-bold transition-all",
                    selectedLoan.returned
                      ? "border border-secondary/20 bg-secondary/10 text-secondary"
                      : "bg-secondary text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                  )}
                >
                  {selectedLoan.returned
                    ? 'Sudah Dikembalikan'
                    : isConfirmingReturn
                      ? 'Mengonfirmasi...'
                      : 'Konfirmasi Pengembalian Buku'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlusCircle({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
