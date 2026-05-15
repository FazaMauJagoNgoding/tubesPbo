import { 
  History, 
  Search, 
  Calendar, 
  Download, 
  ArrowRight,
  BookOpen,
  User,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useEffect, useState } from 'react';
import { getCachedLoans, getLoans, getSession, LoanRecord } from '@/src/lib/firebaseBackend';

function getVisibleLoans(loans: LoanRecord[], session: ReturnType<typeof getSession>) {
  return session?.role === 'admin'
    ? loans
    : loans.filter((loan) => loan.memberUid === session?.uid);
}

export default function LoanHistorySubView() {
  const session = getSession();
  const [historyData, setHistoryData] = useState<LoanRecord[]>(() => getVisibleLoans(getCachedLoans(), session));

  useEffect(() => {
    getLoans()
      .then((loans) => setHistoryData(getVisibleLoans(loans, session)))
      .catch((error) => console.error(error));
  }, [session?.role, session?.uid]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Riwayat Peminjaman</h1>
          <p className="text-sm text-on-surface-variant mt-1">Daftar lengkap rekam jejak peminjaman buku yang telah selesai.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-outline-variant px-5 py-3 rounded-xl font-bold text-sm text-on-surface hover:bg-surface-container transition-all">
          <Download className="w-5 h-5" />
          Ekspor Semua
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 bg-surface-container-low/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan NIM atau ID..." 
              className="w-full bg-white pl-10 pr-4 py-2 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all">
              <Calendar className="w-4 h-4" /> Pilih Periode
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Detail Peminjam</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Informasi Buku</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Timeline</th>
                <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Status</th>
                <th className="py-5 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {historyData.map((item) => {
                const isLate = Number(item.fine || 0) > 0;

                return (
                <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                        <User className="w-5 h-5 text-on-surface-variant" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{item.memberName}</div>
                        <div className="text-[11px] font-semibold text-on-surface-variant uppercasetracking-wide">{item.memberEmail || item.memberUid}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-3">
                       <BookOpen className="w-4 h-4 text-primary" />
                       <div>
                         <div className="text-sm font-bold text-on-surface">{item.bookTitle}</div>
                         <div className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">LN-{item.id}</div>
                       </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Pinjam</div>
                        <div className="text-xs font-bold text-on-surface">{item.borrowDate}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-outline" />
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Kembali</div>
                        <div className={cn("text-xs font-bold", !isLate ? 'text-on-surface' : 'text-error')}>
                          {item.returnDate || item.dueDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex justify-center">
                      <span className={cn("px-4 py-1.5 rounded-full text-[11px] font-bold", isLate ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary')}>
                        {isLate ? 'Terlambat' : item.returned ? 'Selesai' : 'Aktif'}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <button className="text-xs font-bold text-primary hover:underline">Detail Nota</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
