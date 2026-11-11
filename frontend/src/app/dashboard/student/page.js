'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/authContext';
import { apiFetch } from '../../../lib/api';
import {
  MessageSquare,
  BookOpen,
  BarChart3,
  Calendar,
  GraduationCap,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      router.push('/login');
      return;
    }

    if (user?.role === 'student') {
      loadStudentData();
    }
  }, [user, authLoading]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [profRes, sesRes] = await Promise.all([
        apiFetch('/students/profile'),
        apiFetch('/advising/sessions')
      ]);

      if (profRes.success) setProfileData(profRes.profile);
      if (sesRes.success) setSessions(sesRes.sessions || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 font-medium animate-pulse">
        Loading Student Academic Profile...
      </div>
    );
  }

  const { profile } = { profile: profileData };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase mb-1">
            <GraduationCap className="w-4 h-4" /> Student Academic Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Department of Computer Science & Engineering • GSTU
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/student/chat"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Launch AI Advising Chat
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase">Cumulative GPA</div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
              {parseFloat(profile.cgpa).toFixed(2)}
              <span className="text-sm font-normal text-slate-400">/ 4.00</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <Award className="w-3.5 h-3.5" />
              {profile.cgpa >= 3.75 ? 'First Class Distinction' : 'Good Standing'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase">Completed Credits</div>
            <div className="text-3xl font-black text-emerald-600 flex items-baseline gap-1">
              {profile.completed_credits}
              <span className="text-sm font-normal text-slate-400">/ 140.0 Cr</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Degree Progress: {Math.round((profile.completed_credits / 140) * 100)}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase">Remaining Credits</div>
            <div className="text-3xl font-black text-amber-600">
              {profile.remaining_credits} <span className="text-sm font-normal text-slate-400">Cr</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ~{Math.ceil(profile.remaining_credits / 18)} Semesters Remaining
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase">Current Term</div>
            <div className="text-3xl font-black text-slate-900">
              Semester {profile.semester}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Reg: {profile.student_reg_no}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Course Enrollments & Advising Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrollments Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Course Enrollment & Grade Records
            </h3>
            <Link
              href="/dashboard/student/progress"
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <BarChart3 className="w-3.5 h-3.5" /> View Analytics
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Course Code</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profile?.enrollments?.map((e) => (
                  <tr key={e.enrollment_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{e.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{e.title}</td>
                    <td className="px-4 py-3">{e.semester}</td>
                    <td className="px-4 py-3">{e.credits} Cr</td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          e.grade === 'IP' || e.grade === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : e.grade === 'F'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {e.grade || 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advising Sessions Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              Faculty Advising
            </h3>
            <Link
              href="/dashboard/student/chat"
              className="text-xs font-semibold text-purple-600 hover:underline"
            >
              Book in Chat
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No advising appointments scheduled. Ask EduBot in chat to &quot;Book an advising session&quot;.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.session_id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{s.advisor_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {s.start_time ? new Date(s.start_time).toLocaleString() : 'Scheduled'}
                  </div>
                  {s.summary && (
                    <div className="text-[11px] text-slate-600 font-medium">
                      Note: {s.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
