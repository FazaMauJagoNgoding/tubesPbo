import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, UserPlus, Info, LockKeyhole } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerMember, saveSession } from '@/src/lib/firebaseBackend';

export default function RegisterView() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (document.getElementById('fullName') as HTMLInputElement).value;
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const session = await registerMember(name, email, password);
      saveSession(session);
      navigate('/dashboard');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Registrasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-secondary/5 blur-[100px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">CampusLib</h1>
          <p className="text-lg text-on-surface-variant font-medium">Buat akun untuk mulai meminjam buku</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/30 p-10">
          <form onSubmit={handleRegister} className="flex flex-col gap-8">
            {/* Nama Lengkap */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface" htmlFor="fullName">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input 
                  id="fullName"
                  type="text" 
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full bg-white pl-11 pr-4 py-3.5 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input 
                  id="email"
                  type="email" 
                  placeholder="nama@kampus.ac.id"
                  className="w-full bg-white pl-11 pr-4 py-3.5 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                  required
                />
              </div>
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1">
                <Info className="w-3.5 h-3.5" />
                Gunakan email kampus Anda untuk verifikasi otomatis
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-white pl-11 pr-12 py-3.5 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface" htmlFor="confirmPassword">Konfirmasi Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input 
                  id="confirmPassword"
                  type="password" 
                  placeholder="Ulangi password Anda"
                  className="w-full bg-white pl-11 pr-4 py-3.5 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Memproses...' : 'Daftar'}
              <ArrowRight className="w-5 h-5" />
            </button>
            {error && (
              <p className="text-sm font-semibold text-error text-center">{error}</p>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Sudah punya akun? 
              <Link to="/login" className="ml-2 font-bold text-primary hover:underline underline-offset-4 decoration-2">Kembali ke Login</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
