'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/authContext';
import { apiFetch } from '../../../lib/api';
import {
  Calendar,
  Upload,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  BookOpen,
  Send,
  Eye
} from 'lucide-react';

export default function TeacherPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'materials', 'escalations', 'slots'
  const [sessions, setSessions] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // New slot form
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  // Material upload form
  const [materialCourseId, setMaterialCourseId] = useState('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('pdf');
  const [materialFile, setMaterialFile] = useState(null);
  const [materialLink, setMaterialLink] = useState('');
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'teacher' && user.role !== 'admin'))) {
      router.push('/login');
      return;
    }

    if (user?.role === 'teacher' || user?.role === 'admin') {
      loadAllData();
    }
  }, [user, authLoading]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sesRes, escRes, crsRes, matRes] = await Promise.all([
        apiFetch('/advising/sessions'),
        apiFetch('/advising/escalations'),
        apiFetch('/courses'),
        apiFetch('/materials')
      ]);

      if (sesRes.success) setSessions(sesRes.sessions || []);
      if (escRes.success) setEscalations(escRes.escalations || []);
      if (crsRes.success) {
        setCourses(crsRes.courses || []);
        if (crsRes.courses?.length > 0) setMaterialCourseId(crsRes.courses[0].course_id);
      }
      if (matRes.success) setMaterials(matRes.materials || []);
    } catch (err) {
      console.error('Teacher portal load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId, status) => {
    try {
      const summary = prompt('Enter advising notes or summary for the student (optional):', 'Session conducted. Academic plan approved.');
      await apiFetch(`/advising/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, summary })
      });
      loadAllData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleResolveEscalation = async (escalationId) => {
    const notes = prompt('Enter resolution notes for this escalation:', 'Consulted with student directly via email.');
    if (notes === null) return;

    try {
      await apiFetch(`/advising/escalations/${escalationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved', resolution_notes: notes })
      });
      loadAllData();
    } catch (err) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!slotDate || !slotStartTime || !slotEndTime) {
      alert('Please fill out all slot fields.');
      return;
    }

    setSlotSubmitting(true);
    try {
      const startDateTime = new Date(`${slotDate}T${slotStartTime}`);
      const endDateTime = new Date(`${slotDate}T${slotEndTime}`);

      await apiFetch('/advising/slots', {
        method: 'POST',
        body: JSON.stringify({
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        })
      });

      alert('Advising slot created successfully!');
      setSlotDate('');
      setSlotStartTime('');
      setSlotEndTime('');
      loadAllData();
    } catch (err) {
      alert(`Failed to create slot: ${err.message}`);
    } finally {
      setSlotSubmitting(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialTitle || !materialCourseId) {
      alert('Please enter a title and select a course.');
      return;
    }

    setUploadSubmitting(true);
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('course_id', materialCourseId);
      formData.append('title', materialTitle);
      formData.append('type', materialType);

      if (materialType === 'link') {
        formData.append('link_url', materialLink);
      } else if (materialFile) {
        formData.append('file', materialFile);
      }

      const res = await apiFetch('/materials/upload', {
        method: 'POST',
        isFormData: true,
        body: formData
      });

      if (res.success) {
        setUploadSuccess(`Material uploaded! Extracted and indexed ${res.material.chunks_indexed} knowledge chunks for EduBot.`);
        setMaterialTitle('');
        setMaterialFile(null);
        setMaterialLink('');
        loadAllData();
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-1">
            <UserCheck className="w-4 h-4" /> Faculty Portal & Advising Hub
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Department of Computer Science & Engineering • GSTU
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sessions' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Advising Queue ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('escalations')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'escalations' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Escalations ({escalations.filter(e => e.status === 'open').length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'materials' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Course Materials & RAG ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'slots' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Open Slots
          </button>
        </div>
      </div>

      {/* Tab 1: Advising Sessions Queue */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Student Advising Session Appointments
          </h3>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              No advising sessions booked yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Reg No.</th>
                      <th className="px-5 py-3.5">CGPA</th>
                      <th className="px-5 py-3.5">Scheduled Time</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Notes</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((ses) => (
                      <tr key={ses.session_id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {ses.student_name}
                          <div className="text-[10px] text-slate-400 font-normal">{ses.student_email}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono">{ses.student_reg_no}</td>
                        <td className="px-5 py-3.5 font-semibold text-emerald-700">{parseFloat(ses.cgpa).toFixed(2)}</td>
                        <td className="px-5 py-3.5">
                          {ses.start_time ? new Date(ses.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Flexible'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ses.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ses.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ses.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs truncate">{ses.summary || 'None'}</td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {ses.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateSessionStatus(ses.session_id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {ses.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateSessionStatus(ses.session_id, 'completed')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[11px]"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Escalations Inbox */}
      {activeTab === 'escalations' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            AI Chatbot Escalation Inbox
          </h3>

          {escalations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              No unresolved escalations from EduBot.
            </div>
          ) : (
            <div className="space-y-4">
              {escalations.map((esc) => (
                <div
                  key={esc.escalation_id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 ${
                    esc.status === 'open' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{esc.student_name}</span>
                        <span className="font-mono text-xs text-slate-500">({esc.student_reg_no})</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          CGPA: {parseFloat(esc.cgpa).toFixed(2)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            esc.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {esc.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Escalated: {new Date(esc.created_at).toLocaleString()}
                      </div>
                    </div>

                    {esc.status === 'open' && (
                      <button
                        onClick={() => handleResolveEscalation(esc.escalation_id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  {/* Question & AI Response Snippet */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">Student Question: </span>
                      <span className="text-slate-900 font-medium">{esc.student_question}</span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700">EduBot AI Response: </span>
                      <span className="text-slate-600 line-clamp-3">{esc.bot_response}</span>
                    </div>
                    {esc.resolution_notes && (
                      <div className="pt-2 border-t border-slate-200 text-emerald-800">
                        <span className="font-bold">Faculty Notes: </span>
                        {esc.resolution_notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Materials & RAG Knowledge Base */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Upload Course Knowledge Base
            </h3>
            <p className="text-xs text-slate-500">
              Files are automatically parsed, chunked, and stored in MySQL for EduBot RAG answers.
            </p>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadMaterial} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course</label>
                <select
                  value={materialCourseId}
                  onChange={(e) => setMaterialCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title / Topic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Dynamic Programming & Shortest Paths"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material Type</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="docx">Word Document (.docx)</option>
                  <option value="link">Web Link / Reference URL</option>
                </select>
              </div>

              {materialType === 'link' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={materialLink}
                    onChange={(e) => setMaterialLink(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select File</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => setMaterialFile(e.target.files[0])}
                    className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={uploadSubmitting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {uploadSubmitting ? 'Extracting & Chunking...' : 'Upload & Index for AI'}
              </button>
            </form>
          </div>

          {/* Uploaded Materials List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Indexed Course Knowledge Base ({materials.length})
            </h3>

            {materials.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No materials uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {materials.map((m) => (
                  <div key={m.material_id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold rounded">
                        {m.course_code}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{m.type}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{m.title}</h4>
                    <p className="text-[11px] text-slate-400">Uploaded by {m.teacher_name}</p>
                    {m.file_path && (
                      <a
                        href={`http://localhost:5000/api/materials/download/${m.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline"
                      >
                        <FileText className="w-3 h-3" /> Download Attached File
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Open Slots Management */}
      {activeTab === 'slots' && (
        <div className="max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" />
            Create Available Advising Slot
          </h3>
          <p className="text-xs text-slate-500">
            Slots appear instantly in student advising chats for one-click interactive booking.
          </p>

          <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={slotSubmitting}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {slotSubmitting ? 'Creating Slot...' : 'Publish Advising Slot'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
