import { motion } from 'motion/react';
import { Library, Eye, EyeOff, ArrowRight, AlertCircle, Mail, Lock } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isProfileCompleted, login, saveSession } from '@/src/lib/firebaseBackend';

export default function LoginView() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    setError('');
    setIsLoading(true);
    try {
      const session = await login(email, password);
      saveSession(session);
      navigate(isProfileCompleted(session) ? '/dashboard' : '/profile-completion');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg text-white mb-6">
            <Library className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">CampusLib</h1>
          <p className="text-on-surface-variant">Digital Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/30 p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  id="email"
                  type="email" 
                  placeholder="nama@email.com"
                  className={`w-full bg-surface pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${error ? 'border-error ring-error/20' : 'border-outline-variant focus:ring-primary/20 focus:border-primary'}`}
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-error font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full bg-surface pl-10 pr-12 py-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-primary hover:underline">Forgot Password?</a>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Memproses...' : 'Login'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-outline-variant/30 text-center">
            <p className="text-sm text-on-surface-variant">
              Don't have an account? 
              <Link to="/register" className="ml-2 font-bold text-primary hover:underline">Register Here</Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-on-surface-variant/70">
          Secure login provided by Campus IT Services.
        </p>
      </motion.div>
    </div>
  );
}
