import { motion } from 'motion/react';
import { Book, Menu, Search, User, LogIn, ChevronRight, Library, BookOpen, Clock, LayoutDashboard, CreditCard, Pointer as TouchApp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingView() {
  const features = [
    {
      title: 'Katalog Buku Digital',
      desc: 'Akses ribuan koleksi buku kapan saja. Temukan literatur yang Anda butuhkan dengan sistem pencarian pintar kami.',
      icon: <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
      span: 'md:col-span-2',
      bgIcon: <BookOpen className="w-24 h-24 md:w-32 md:h-32 absolute -right-4 -bottom-4 opacity-5" />
    },
    {
      title: 'Peminjaman Online',
      desc: 'Pinjam buku tanpa antre. Reservasi langsung dari perangkat Anda.',
      icon: <TouchApp className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
      span: 'md:col-span-1',
      bgIcon: null
    },
    {
      title: 'Dashboard Personal',
      desc: 'Pantau status peminjaman Anda dengan tampilan antarmuka yang bersih dan terstruktur.',
      icon: <LayoutDashboard className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
      span: 'md:col-span-1',
      bgIcon: null
    },
    {
      title: 'Riwayat Lengkap',
      desc: 'Lihat daftar bacaan yang pernah dipinjam. Simpan rekam jejak literasi Anda untuk referensi masa depan.',
      icon: <Clock className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
      span: 'md:col-span-2',
      bgIcon: <Clock className="w-24 h-24 md:w-32 md:h-32 absolute -right-4 -bottom-4 opacity-5" />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 md:px-16 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-primary tracking-tight">CampusLib</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/register" className="hidden md:block text-sm font-semibold text-primary hover:text-primary-container px-4 py-2 border border-outline-variant rounded-lg transition-colors">
              Daftar Member
            </Link>
            <Link to="/login" className="text-sm font-semibold bg-primary text-white hover:bg-primary-container px-4 py-2 rounded-lg transition-colors shadow-sm">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-16 py-12 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-[1.1] tracking-tight">
            Perpustakaan Digital Kampus dalam Genggaman
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-lg">
            Kelola peminjaman buku, eksplorasi katalog digital, dan pantau riwayat bacaan Anda dengan mudah dan efisien.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/login" className="bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-container transition-all shadow-md">
              Login Now
            </Link>
            <Link to="/register" className="border border-outline text-on-surface font-semibold px-8 py-3 rounded-lg hover:bg-surface-container-low transition-all">
              Daftar Member
            </Link>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-white"
        >
          <img 
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1000" 
            alt="Modern Library" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
        </motion.div>
      </section>

      {/* Features Bento Grid */}
      <section className="bg-surface-container-low py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16 text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-primary mb-4"
          >
            Fitur Utama CampusLib
          </motion.h2>
          <p className="text-on-surface-variant">Dirancang untuk memudahkan pengalaman akademik Anda.</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/30 relative overflow-hidden group hover:shadow-md transition-all ${f.span}`}
            >
              <div className="relative z-10">
                <div className="mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold text-on-surface mb-3">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {f.desc}
                </p>
              </div>
              {f.bgIcon}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-outline-variant bg-surface-container">
        <div className="max-w-7xl mx-auto px-4 md:px-16 text-center text-sm text-on-surface-variant">
          © 2024 CampusLib Digital Management. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
