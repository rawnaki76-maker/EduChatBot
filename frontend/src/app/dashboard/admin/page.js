'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/authContext';
import { apiFetch } from '../../../lib/api';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  XCircle,
  Plus,
  BarChart,
  Layers,
  Database
} from 'lucide-react';

export default function AdminConsolePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // New course state
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCredits, setNewCredits] = useState('3.0');
  const [newLevel, setNewLevel] = useState('1');
  const [newPrereq, setNewPrereq] = useState('');
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [courseSuccess, setCourseSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, authLoading]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/analytics/admin');
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (userId, currentStatus) => {
    try {
      await apiFetch(`/analytics/users/${userId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ verified: !currentStatus })
      });
      loadAdminData();
    } catch (err) {
      alert(`Verification toggle failed: ${err.message}`);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setCourseSubmitting(true);
    setCourseSuccess('');

    try {
      await apiFetch('/courses', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode,
          title: newTitle,
          credits: parseFloat(newCredits),
          level: parseInt(newLevel, 10),
          prerequisite_code: newPrereq || null
        })
      });

      setCourseSuccess(`Course ${newCode} created successfully!`);
      setNewCode('');
      setNewTitle('');
      setNewPrereq('');
      loadAdminData();
    } catch (err) {
      alert(`Failed to create course: ${err.message}`);
    } finally {
      setCourseSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 font-medium animate-pulse">
        Loading EduBot System Administration Console...
      </div>
    );
  }

  const { metrics, users } = analytics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> System Administration Console
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            GSTU CSE EduBot Control Panel
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage user roles, verify faculty advisors, manage curriculum courses, and monitor chatbot resolution analytics.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
              Total Users
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black text-slate-900">{metrics.total_users}</div>
            <div className="text-xs text-slate-500 mt-1">
              {metrics.users_by_role.student} Students • {metrics.users_by_role.teacher} Faculty
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
              Chat Interactions
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600">{metrics.total_chats}</div>
            <div className="text-xs text-slate-500 mt-1">
              Resolution Rate: <span className="font-bold text-emerald-600">{metrics.resolution_rate}%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
              Escalated Inquiries
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600">{metrics.escalated_chats}</div>
            <div className="text-xs text-slate-500 mt-1">
              Referred to human faculty advisors
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
              Knowledge Base Chunks
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-blue-600">{metrics.indexed_chunks}</div>
            <div className="text-xs text-slate-500 mt-1">
              Across {metrics.total_materials} uploaded materials
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: User Management & Add Course */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Registered Department Users & Verification
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name & Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users?.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {u.name}
                      <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleVerification(u.user_id, Boolean(u.verified))}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            u.verified
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {u.verified ? 'Revoke' : 'Verify Advisor'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Course to Curriculum Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Add Course to Curriculum
          </h3>
          <p className="text-xs text-slate-500">
            Define course codes, credits, and prerequisite chains for the deterministic engine.
          </p>

          {courseSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-200">
              {courseSuccess}
            </div>
          )}

          <form onSubmit={handleAddCourse} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course Code</label>
              <input
                type="text"
                required
                placeholder="e.g. CSE405"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Cyber Security & Cryptography"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credits</label>
                <select
                  value={newCredits}
                  onChange={(e) => setNewCredits(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1.5">1.5 Cr (Lab)</option>
                  <option value="3.0">3.0 Cr (Theory)</option>
                  <option value="4.0">4.0 Cr (Theory+Lab)</option>
                  <option value="6.0">6.0 Cr (Thesis)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Year / Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1">Level 1 (1st Year)</option>
                  <option value="2">Level 2 (2nd Year)</option>
                  <option value="3">Level 3 (3rd Year)</option>
                  <option value="4">Level 4 (4th Year)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prerequisite Course Code</label>
              <input
                type="text"
                placeholder="e.g. CSE304 (Leave blank if None)"
                value={newPrereq}
                onChange={(e) => setNewPrereq(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={courseSubmitting}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {courseSubmitting ? 'Adding Course...' : 'Register Course'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
