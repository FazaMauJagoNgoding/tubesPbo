import { 
  CreditCard, 
  Wallet, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  QrCode,
  ArrowRight,
  Download,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { getCachedLoans, getLoans, getSession, LoanRecord } from '@/src/lib/firebaseBackend';

function getVisibleLoans(loans: LoanRecord[], role: string, uid?: string) {
  return role === 'admin' ? loans : loans.filter((loan) => loan.memberUid === uid);
}

export default function PaymentSubView() {
  const session = getSession();
  const role = session?.role || localStorage.getItem('userRole') || 'member';
  const [loans, setLoans] = useState<LoanRecord[]>(() => getVisibleLoans(getCachedLoans(), role, session?.uid));

  useEffect(() => {
    getLoans()
      .then((loanData) => setLoans(getVisibleLoans(loanData, role, session?.uid)))
      .catch((error) => console.error(error));
  }, [role, session?.uid]);

  const totalIncome = useMemo(() => loans.reduce((total, loan) => total + Number(loan.totalHarga || 0) + Number(loan.fine || 0), 0), [loans]);
  const totalFine = useMemo(() => loans.reduce((total, loan) => total + Number(loan.fine || 0), 0), [loans]);
  const transactions = loans.map((loan) => ({
    id: `TRX-${loan.id}`,
    description: `${Number(loan.fine || 0) > 0 ? 'Denda' : 'Biaya Peminjaman'} - LN-${loan.id}`,
    amount: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(loan.totalHarga || 0) + Number(loan.fine || 0)),
    date: loan.borrowDate,
    method: role === 'admin' ? loan.memberName : 'Firebase Realtime Database',
    status: loan.paid ? 'Success' : 'Pending',
    statusColor: loan.paid ? 'text-secondary bg-secondary/10' : 'text-tertiary bg-tertiary/10',
  }));

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">
            {role === 'admin' ? 'Data Pemasukan' : 'Pembayaran & Denda'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {role === 'admin' 
              ? 'Kelola semua transaksi masuk dari denda dan pendaftaran member.' 
              : 'Kelola transaksi denda keterlambatan dan biaya pendaftaran member.'}
          </p>
        </div>
        {role === 'admin' && (
          <button className="flex items-center gap-2 bg-white border border-outline-variant px-5 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-surface-container transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Unduh Laporan Keuangan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-12">
                 <div>
                   <p className="text-sm font-medium text-on-primary-container/80 uppercase tracking-widest mb-1">
                   {role === 'admin' ? 'Total Pemasukan Bulan Ini' : 'Total Tagihan Denda'}
                   </p>
                   <h2 className="text-4xl font-bold">
                     {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(role === 'admin' ? totalIncome : totalFine)}
                   </h2>
                 </div>
                 <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                   {role === 'admin' ? <Wallet className="w-8 h-8" /> : <CreditCard className="w-8 h-8" />}
                 </div>
               </div>
               <div className="flex items-center gap-2 text-on-primary-container/90 font-medium">
                 {role === 'admin' ? (
                   <>
                     <CheckCircle2 className="w-5 h-5 text-secondary-fixed" />
                     <span>Pertumbuhan +12% dari bulan lalu.</span>
                   </>
                 ) : (
                   <>
                     <ShieldCheck className="w-5 h-5 text-secondary-fixed" />
                     <span>Akun Anda bersih dari tagihan denda keterlambatan.</span>
                   </>
                 )}
               </div>
             </div>
             
             {/* Decorative Elements */}
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
             <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-secondary/10 rounded-full blur-2xl" />
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
             <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
               <h3 className="font-bold text-on-surface">Riwayat Transaksi</h3>
               <button className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                 <Download className="w-4 h-4" /> Cetak Rekapan
               </button>
             </div>
             <div className="divide-y divide-outline-variant/20">
               {transactions.map((trx, i) => (
                 <div key={i} className="p-6 flex items-center justify-between hover:bg-surface-container-low/30 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
                       <Receipt className="w-6 h-6 text-on-surface-variant" />
                     </div>
                     <div>
                       <div className="font-bold text-on-surface">{trx.description}</div>
                       <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mt-1">
                         <span>{trx.date}</span>
                         <span className="w-1 h-1 bg-outline-variant rounded-full" />
                         <span>{trx.method}</span>
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-on-surface mb-2">{trx.amount}</div>
                     <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", trx.statusColor)}>
                       {trx.status}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        <div className="space-y-6">
          {role === 'member' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30">
              <h3 className="font-bold text-on-surface mb-6 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Quick Payment
              </h3>
              <div className="aspect-square bg-surface-container rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 p-6 text-center">
                 <div className="w-full h-full bg-white rounded-lg flex items-center justify-center mb-0 shadow-sm border border-outline-variant/30">
                    <span className="text-[10px] uppercase font-bold text-outline tracking-tighter">QR Placeholder</span>
                 </div>
              </div>
              <p className="text-xs text-on-surface-variant text-center mt-6 leading-relaxed">
                Scan QR di atas untuk melakukan pembayaran denda secara otomatis melalui aplikasi mobile banking Anda.
              </p>
            </div>
          )}

          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30">
            <h3 className="font-bold text-on-surface mb-4">
              {role === 'admin' ? 'Rekapitulasi' : 'Informasi Denda'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-error/10 rounded-lg shrink-0">
                  <AlertCircle className="w-4 h-4 text-error" />
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {role === 'admin' 
                    ? 'Terdapat 12 transaksi denda yang belum terverifikasi sistem.' 
                    : 'Denda dihitung Rp 2.000 / hari keterlambatan untuk setiap buku.'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-secondary/10 rounded-lg shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {role === 'admin'
                    ? 'Semua penarikan dana ke rekening kampus berhasil diproses.'
                    : 'Pembayaran yang berhasil dikonfirmasi akan langsung menghapus status cekal di bibliogram Anda.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
