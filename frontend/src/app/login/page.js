'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/authContext';
import { LogIn, AlertCircle, CheckCircle2, GraduationCap, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/student/chat');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div>
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
            Sign In to EduBot
          </h2>
          <p className="mt-1 text-center text-xs text-slate-500">
            GSTU Department of Computer Science & Engineering
          </p>
        </div>

        {/* Quick Demo Pickers */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Click to auto-fill demo accounts (Password: Password123!):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('student1@gstu.edu.bd')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-left font-medium text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Student 1 (Sem 5)</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('student3@gstu.edu.bd')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-left font-medium text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Student 3 (Failed Prereq)</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('dr.rahman@gstu.edu.bd')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-left font-medium text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Dr. Rahman (Advisor)</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('admin@gstu.edu.bd')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-300 text-left font-medium text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">Admin (Dept Head)</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student1@gstu.edu.bd"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
