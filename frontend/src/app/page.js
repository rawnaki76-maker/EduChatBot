'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { MessageSquare, ShieldCheck, BookOpen, Calendar, BarChart3, ArrowRight, CheckCircle2, Sparkles, GraduationCap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const handleQuickLogin = async (email, password, redirectPath) => {
    try {
      await login(email, password);
      router.push(redirectPath);
    } catch (err) {
      router.push(`/login?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Official Academic AI for GSTU CSE Department
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Smart Academic Advising <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Powered by Verified Facts & AI
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            EduBot assists GSTU Computer Science students with instant prerequisite checks, credit calculations, course materials search, and seamless faculty advising appointment booking.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              href={user?.role === 'student' ? '/dashboard/student/chat' : '/login'}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 text-base"
            >
              <MessageSquare className="w-5 h-5" />
              Chat with EduBot Advisor
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/courses"
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-2 text-base"
            >
              <BookOpen className="w-5 h-5" />
              Explore CSE Curriculum
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Demo Login Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Instant Demo Access (One-Click)</h2>
            <p className="text-sm text-slate-500">Test EduBot immediately across all three user roles with pre-seeded data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Card */}
            <div className="border border-emerald-100 bg-emerald-50/50 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md uppercase">
                    Student
                  </span>
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Tanvir Hasan</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Reg: <span className="font-mono font-medium">ASH2101001M</span> | Sem 5 | CGPA: 3.82
                </p>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>• Chat with Core Advising AI</p>
                  <p>• Check eligibility for CSE301, CSE302</p>
                  <p>• Book advising appointment</p>
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('student1@gstu.edu.bd', 'Password123!', '/dashboard/student/chat')}
                className="mt-5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Log In as Student 1
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Teacher Card */}
            <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md uppercase">
                    Teacher / Advisor
                  </span>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Dr. Anisur Rahman</h3>
                <p className="text-xs text-slate-600 mt-1">Associate Professor & Academic Advisor</p>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>• Manage advising slots & queue</p>
                  <p>• Upload PDF/DOCX course notes</p>
                  <p>• Resolve escalated student queries</p>
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('dr.rahman@gstu.edu.bd', 'Password123!', '/dashboard/teacher')}
                className="mt-5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Log In as Faculty Advisor
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Card */}
            <div className="border border-purple-100 bg-purple-50/50 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-md uppercase">
                    Admin
                  </span>
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Dr. Mahbubul Alam</h3>
                <p className="text-xs text-slate-600 mt-1">Department Head & System Admin</p>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>• User role management & verification</p>
                  <p>• Add/edit curriculum courses</p>
                  <p>• Analytics: chat resolution rate</p>
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('admin@gstu.edu.bd', 'Password123!', '/dashboard/admin')}
                className="mt-5 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Log In as Dept Admin
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Why EduBot is Accurate & Reliable</h2>
          <p className="text-slate-600 mt-2">Zero hallucinations for academic rules, degree credits, and course prerequisites</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900">Deterministic Prerequisite Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prerequisite checks (e.g. &quot;Can I take CSE301?&quot;) are verified directly against MySQL student enrollment records, not guessed by the LLM.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900">Ground-Truth RAG Retrieval</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Course lecture slides, syllabi, and notes uploaded as PDF or DOCX are parsed, chunked, and retrieved with source citations under every answer.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900">Interactive Slot Booking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Students can book open advising slots directly within the chat UI and receive confirmed appointment tickets for faculty consultation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-bold text-slate-900">Smart Human Escalation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If a student is confused or explicitly requests a faculty member, the full chat conversation is instantly escalated to the advisor&apos;s queue.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
