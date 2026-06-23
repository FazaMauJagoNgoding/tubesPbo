import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookText, 
  ReceiptText, 
  LibraryBig, 
  History, 
  CreditCard, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  Library,
  User,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { clearSession, getSession, getNotifications, markNotificationRead, NotificationRecord } from '@/src/lib/firebaseBackend';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'member'] },
  { icon: BookText, label: 'Kelola Buku', path: '/dashboard/manage-books', roles: ['admin'] },
  { icon: ReceiptText, label: 'Data Peminjaman', path: '/dashboard/loans', roles: ['admin'] },
  { icon: LibraryBig, label: 'Katalog Buku', path: '/dashboard/catalog', roles: ['member'] },
  { icon: History, label: 'Riwayat Peminjaman', path: '/dashboard/history', roles: ['admin', 'member'] },
  { icon: CreditCard, label: 'Pemasukan', path: '/dashboard/payment', roles: ['admin'] },
  { icon: CreditCard, label: 'Pembayaran', path: '/dashboard/payment', roles: ['member'] },
];

const defaultMemberAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#e2e8f0"/>
  <circle cx="100" cy="78" r="36" fill="#94a3b8"/>
  <path d="M38 178c8-42 35-66 62-66s54 24 62 66" fill="#94a3b8"/>
</svg>
`)}`;

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [headerMessage, setHeaderMessage] = useState('');
  const session = getSession();
  const role = session?.role || (localStorage.getItem('userRole') as 'admin' | 'member') || 'member';

  const filteredItems = sidebarItems.filter(item => item.roles.includes(role));

  const profile = role === 'admin' ? {
    name: session?.name || 'Admin Library',
    role: 'Administrator',
    avatar: 'https://images.unsplash.com/photo-1556157382-97dee2dcb7aa?auto=format&fit=crop&q=80&w=100'
  } : {
    name: session?.name || 'Member',
    role: 'Member',
    avatar: session?.photoUrl || defaultMemberAvatar
  };

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch {
      // ignore
    }
  };

  // poll notifications every 10s
  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 10000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllNotificationsRead = () => {
    const unreadNotifications = notifications.filter((n) => !n.read);

    if (unreadNotifications.length === 0) {
      return;
    }

    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    Promise.all(unreadNotifications.map((n) => markNotificationRead(n.id))).catch(() => {});
  };

  const handleNotificationToggle = () => {
    setIsNotifOpen((isOpen) => {
      if (!isOpen) {
        markAllNotificationsRead();
      }

      return !isOpen;
    });
  };

  const showHeaderMessage = (message: string) => {
    setHeaderMessage(message);
    window.setTimeout(() => setHeaderMessage(''), 3000);
  };

  const handleGlobalSearch = () => {
    const keyword = searchValue.trim();
    if (!keyword) {
      showHeaderMessage('Masukkan kata kunci pencarian terlebih dahulu.');
      return;
    }

    navigate(role === 'admin' ? '/dashboard/manage-books' : '/dashboard/catalog');
    showHeaderMessage(`Pencarian "${keyword}" dibuka di menu ${role === 'admin' ? 'Kelola Buku' : 'Katalog Buku'}.`);
  };

  return (
    <div className="min-h-screen bg-surface flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-container-low border-r border-outline-variant h-screen fixed left-0 top-0 z-40">
        <div className="p-8 pb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-primary tracking-tight">CampusLib</h1>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest leading-none mt-1">Digital Management</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/10" 
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-on-surface-variant")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-outline-variant/30">
          <Link 
            to="/" 
            onClick={clearSession}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-error-container hover:text-error transition-all font-semibold text-sm"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="fixed left-0 top-0 h-screen w-64 bg-surface-container-low border-r border-outline-variant z-[60] lg:hidden flex flex-col"
            >
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Library className="w-8 h-8 text-primary" />
                  <span className="font-bold text-primary tracking-tight">CampusLib</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-surface-container">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-1">
                {filteredItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm",
                      location.pathname === item.path 
                        ? "bg-primary text-white" 
                        : "text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-outline-variant h-16 flex items-center justify-between px-4 md:px-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-full hover:bg-surface-container"
          >
            <Menu className="w-6 h-6 text-on-surface" />
          </button>

          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleGlobalSearch();
                  }
                }}
                placeholder="Search resources..." 
                className="w-full bg-surface-container-low pl-10 pr-4 py-2 text-sm border-none rounded-full focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <button onClick={handleNotificationToggle} className="p-2 rounded-full hover:bg-surface-container transition-colors relative">
                <Bell className="w-5 h-5 text-on-surface-variant" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-4 bg-error rounded-full text-[10px] text-white flex items-center justify-center px-1 font-bold border-2 border-white">{unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className="absolute right-0 mt-2 w-80 z-50 rounded-xl bg-white border border-outline-variant shadow-2xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-outline-variant/30 flex items-center justify-between">
                      <h3 className="text-sm font-bold">Notifikasi</h3>
                      <button onClick={markAllNotificationsRead} className="text-xs text-on-surface-variant">Tandai semua</button>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {notifications.length === 0 && <div className="p-4 text-sm text-on-surface-variant">Tidak ada notifikasi.</div>}
                      {notifications.map((n) => (
                        <div key={n.id} className={cn('p-3 border-b border-outline-variant/20 flex items-start gap-3', !n.read ? 'bg-surface-container-low' : '')}>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{n.title}</div>
                            <div className="text-xs text-on-surface-variant mt-1">{n.body}</div>
                            <div className="text-[10px] text-on-surface-variant mt-2">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!n.read && (
                              <button onClick={() => { markNotificationRead(n.id).then(()=>loadNotifications()); }} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Tandai</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {headerMessage && (
              <div className="hidden xl:block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {headerMessage}
              </div>
            )}
            <button onClick={() => showHeaderMessage('Halaman settings belum tersedia.')} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <Settings className="w-5 h-5 text-on-surface-variant" />
            </button>
            <div className="h-8 w-px bg-outline-variant/30 hidden sm:block mx-2" />
            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
              <div className="hidden text-right lg:block">
                <p className="text-sm font-bold text-on-surface leading-none group-hover:text-primary transition-colors">{profile.name}</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-1 uppercase tracking-wider">{profile.role}</p>
              </div>
              <img 
                src={profile.avatar} 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover border border-outline-variant group-hover:border-primary transition-all shadow-sm"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Alternative UI) */}
      {/* Based on user request screenshots, some dashboards show bottom navigation, so we implement the desktop sidebar but also have mobile accessibility */}
    </div>
  );
}
