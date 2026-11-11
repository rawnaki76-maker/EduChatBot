'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/authContext';
import { apiFetch } from '../../../../lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, Award, CheckCircle2, Clock, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentProgressPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.role === 'student') {
      fetchProgressData();
    }
  }, [user, authLoading]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/analytics/progress');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load progress analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = () => {
    window.open('http://localhost:5000/api/advising/summary', '_blank');
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 font-medium animate-pulse">
        Calculating academic degree progress and CGPA trends...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-4">{error}</div>
        <button
          onClick={fetchProgressData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { student, cgpaTrend, submissionChartData, levelProgress } = data;
  const progressPercent = Math.min(100, Math.round((student.completedCredits / student.totalRequiredCredits) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase mb-1">
            <BarChart3 className="w-4 h-4" /> Academic Performance & Analytics
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {student.name}&apos;s Degree Progress
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Department of Computer Science & Engineering • GSTU
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/student/chat"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Chat
          </Link>
          <button
            onClick={handleExportSummary}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Official Summary
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Cumulative GPA</div>
          <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
            {student.cgpa.toFixed(2)}
            <span className="text-sm font-normal text-slate-400">/ 4.00</span>
          </div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <Award className="w-3.5 h-3.5" />
            {student.cgpa >= 3.75 ? 'First Class Distinction' : 'Good Standing'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Completed Credits</div>
          <div className="text-3xl font-black text-emerald-600 flex items-baseline gap-1">
            {student.completedCredits}
            <span className="text-sm font-normal text-slate-400">/ {student.totalRequiredCredits} Cr</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {progressPercent}% of CSE Degree Completed
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Remaining Credits</div>
          <div className="text-3xl font-black text-amber-600">
            {student.remainingCredits} <span className="text-sm font-normal text-slate-400">Cr</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Estimated ~{Math.ceil(student.remainingCredits / 18)} semesters to graduation
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Current Standing</div>
          <div className="text-3xl font-black text-slate-900">
            Semester {student.semester}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Active Regular Student
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CGPA Trend Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Semester GPA Trajectory
            </h3>
            <span className="text-xs text-slate-400">Scale: 0.00 - 4.00</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cgpaTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="semester" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[2.0, 4.0]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assignment Submissions Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Coursework & Assignment Submissions
            </h3>
            <span className="text-xs text-slate-400">Total Status Breakdown</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={submissionChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {submissionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Degree Level Progression Progress Bars */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h3 className="font-bold text-slate-900 text-base">Curriculum Level Completion (Year 1 - Year 4)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {levelProgress.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-800">{item.level}</span>
                <span className="text-slate-500">
                  {item.completed} / {item.required} Credits ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
