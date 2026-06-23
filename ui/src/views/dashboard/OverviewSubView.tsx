import { 
  Library, 
  CheckCircle, 
  RefreshCcw, 
  AlertTriangle,
  Download,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookRecord, getBooks, getCachedBooks, getCachedLoans, getLoans, getMemberProfile, getSession, LoanRecord, MemberProfileRecord } from '@/src/lib/firebaseBackend';

export default function OverviewSubView() {
  const session = getSession();
  const role = session?.role || localStorage.getItem('userRole') || 'member';
  const [books, setBooks] = useState<BookRecord[]>(() => getCachedBooks());
  const [loans, setLoans] = useState<LoanRecord[]>(() => getCachedLoans());
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfileRecord | null>>({});

  useEffect(() => {
    Promise.all([getBooks(), getLoans()])
      .then(([bookData, loanData]) => {
        setBooks(bookData);
        setLoans(loanData);
      })
      .catch((error) => console.error(error));
  }, []);

  const visibleLoans = useMemo(
    () => role === 'admin' ? loans : loans.filter((loan) => loan.memberUid === session?.uid),
    [loans, role, session?.uid]
  );
  const activeLoans = loans.filter((loan) => !loan.returned);
  const returnedLoans = loans.filter((loan) => loan.returned);
  const totalStock = books.reduce((total, book) => total + book.stock, 0);

  useEffect(() => {
    const memberIds: string[] = Array.from(new Set<string>(visibleLoans.slice(0, 5).map((loan) => loan.memberUid))).filter(
      (memberUid) => !memberProfiles[memberUid]
    );

    if (memberIds.length === 0) {
      return;
    }

    let isActive = true;
    Promise.all(
      memberIds.map(async (memberUid) => {
        const profile = await getMemberProfile(memberUid).catch(() => null);
        return [memberUid, profile] as const;
      })
    ).then((entries) => {
      if (!isActive) {
        return;
      }

      setMemberProfiles((currentProfiles) => ({
        ...currentProfiles,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      isActive = false;
    };
  }, [visibleLoans, memberProfiles]);

  const fullStats = [
    { label: 'Total Buku', value: String(books.length), icon: Library, color: 'bg-primary/10 text-primary' },
    { label: 'Stok Tersedia', value: String(totalStock), icon: CheckCircle, color: 'bg-secondary/10 text-secondary' },
    { label: 'Peminjaman Aktif', value: String(activeLoans.length), icon: RefreshCcw, color: 'bg-tertiary/10 text-tertiary' },
    { label: 'Selesai', value: String(returnedLoans.length), icon: AlertTriangle, color: 'bg-error/10 text-error', border: 'border-error' },
  ];

  const memberStats = [
    { label: 'Total Buku', value: String(books.length), icon: Library, color: 'bg-primary/10 text-primary' },
    { label: 'Stok Tersedia', value: String(totalStock), icon: CheckCircle, color: 'bg-secondary/10 text-secondary' },
    { label: 'Pinjaman Saya', value: String(visibleLoans.length), icon: AlertTriangle, color: 'bg-error/10 text-error', border: 'border-error' },
  ];

  const stats = role === 'admin' ? fullStats : memberStats;

  const filteredActivities = visibleLoans.slice(0, 5).map((loan) => {
    const memberCard = memberProfiles[loan.memberUid]?.profile;

    return {
      member: memberCard?.fullName || loan.memberName || '-',
      nim: memberCard?.username || loan.memberUsername || '-',
      book: loan.bookTitle,
      id: `BK-${loan.bookId}`,
      date: loan.borrowDate,
      due: loan.returned ? `Kembali: ${loan.returnDate || '-'}` : `Sampai: ${loan.dueDate}`,
      status: loan.returned ? 'Returned' : 'Active',
      statusColor: loan.returned ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-secondary/10 text-secondary',
    };
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">
            {role === 'admin' ? 'Admin Dashboard' : 'Member Dashboard'}
          </h2>
          <p className="text-on-surface-variant mt-1">
            {role === 'admin' 
              ? 'Statistik perpustakaan dan aktivitas member terbaru.' 
              : 'Pantau status peminjaman dan rekam jejak literasi Anda.'}
          </p>
        </div>
        {role === 'admin' && (
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-outline-variant px-5 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-surface-container transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        )}
      </div>

      <div className={cn(
        "grid gap-6",
        role === 'admin' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
      )}>
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-36",
              stat.border
            )}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
              <div className={cn("p-2.5 rounded-xl", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <span className="text-3xl font-bold text-on-surface">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
          <h3 className="text-xl font-bold text-on-surface">
            {role === 'admin' ? 'Aktivitas Terbaru' : 'Aktivitas Saya'}
          </h3>
          <Link to="/dashboard/history" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group">
            Lihat Semua
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Member</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Buku</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tanggal</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredActivities.length > 0 ? filteredActivities.map((act, i) => (
                <tr key={i} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary flex items-center justify-center text-xs font-bold tracking-tighter">
                        {act.member.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{act.member}</div>
                        <div className="text-[11px] font-semibold text-on-surface-variant">NIM: {act.nim}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="text-sm font-bold text-on-surface">{act.book}</div>
                    <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">ID: {act.id}</div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="text-sm font-medium text-on-surface">{act.date}</div>
                    <div className={cn("text-[11px] font-bold", act.status === 'Late' ? 'text-error' : 'text-on-surface-variant')}>
                      {act.due}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex justify-center">
                      <span className={cn("px-4 py-1 rounded-full text-xs font-bold", act.statusColor)}>
                        {act.status}
                      </span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-on-surface-variant font-medium">
                    Tidak ada aktivitas terbaru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
