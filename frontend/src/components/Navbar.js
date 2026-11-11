'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { GraduationCap, MessageSquare, BookOpen, BarChart3, UserCheck, Shield, LogOut, LogIn, FileText } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                EduBot
              </div>
              <div className="text-[10px] tracking-wider text-slate-400 font-semibold uppercase">
                GSTU • CSE Dept
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/courses"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === '/courses'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Course Catalog
            </Link>

            {user?.role === 'student' && (
              <>
                <Link
                  href="/dashboard/student/chat"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.includes('/chat')
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-400 hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  AI Advising Chat
                </Link>
                <Link
                  href="/dashboard/student/materials"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.includes('/materials')
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Course Materials
                </Link>
                <Link
                  href="/dashboard/student/progress"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.includes('/progress')
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  My Progress
                </Link>
              </>
            )}

            {user?.role === 'teacher' && (
              <Link
                href="/dashboard/teacher"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.includes('/teacher')
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Faculty Portal
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                href="/dashboard/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.includes('/admin')
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Console
              </Link>
            )}
          </nav>

          {/* Right Action / Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider">
                    {user.role} {user.profile?.student_reg_no ? `• ${user.profile.student_reg_no}` : ''}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
