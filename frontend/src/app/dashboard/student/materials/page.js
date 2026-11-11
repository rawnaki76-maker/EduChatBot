'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/authContext';
import {
  FileText,
  Search,
  Filter,
  Download,
  ExternalLink,
  BookOpen,
  Sparkles,
  User,
  Calendar,
  Layers,
  CheckCircle2,
  FileCode,
  Link as LinkIcon
} from 'lucide-react';

export default function StudentMaterialsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (token) {
      fetchMaterials();
    }
  }, [user, token, authLoading]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/materials', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials || []);
      }
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get distinct course codes
  const courseOptions = ['ALL', ...new Set(materials.map(m => m.course_code).filter(Boolean))];

  // Filter materials based on search and filters
  const filteredMaterials = materials.filter(m => {
    const matchesSearch =
      searchTerm === '' ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.course_code && m.course_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.course_title && m.course_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.teacher_name && m.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCourse = selectedCourse === 'ALL' || m.course_code === selectedCourse;
    const matchesType = selectedType === 'ALL' || m.type === selectedType;

    return matchesSearch && matchesCourse && matchesType;
  });

  const handleAskEduBot = (material) => {
    const prompt = `Explain the core concepts and steps from the uploaded material "${material.title}" (${material.course_code}) by ${material.teacher_name}.`;
    router.push(`/dashboard/student/chat?query=${encodeURIComponent(prompt)}`);
  };

  const getFileBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">PDF Document</span>;
      case 'docx':
      case 'doc':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Word Document</span>;
      case 'link':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Web Resource</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Resource</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              GSTU CSE Department Resource Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Course Materials & Notes
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Browse official lecture slides, handouts, and study guides uploaded by faculty advisors. All materials are indexed in EduBot for instant AI tutoring.
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard/student/chat')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Ask EduBot About Materials
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl backdrop-blur-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search topics (e.g. Merge Sort, Cache, Normalization, CSE202)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Course Filter */}
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="ALL">All Courses</option>
                {courseOptions.filter(c => c !== 'ALL').map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="ALL">All File Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="docx">Word Documents</option>
                <option value="link">Web Links</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick Filter:
            </span>
            {courseOptions.slice(0, 6).map(code => (
              <button
                key={code}
                onClick={() => setSelectedCourse(code)}
                className={`px-2.5 py-1 rounded-lg transition-all font-mono ${
                  selectedCourse === code
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {code}
              </button>
            ))}
            <span className="text-slate-500 ml-auto font-mono">
              Showing {filteredMaterials.length} of {materials.length} resources
            </span>
          </div>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse p-5 space-y-4">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                <div className="h-10 bg-slate-800 rounded mt-6"></div>
              </div>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No materials found</h3>
              <p className="text-sm text-slate-400 mt-1">
                No materials matched your filter criteria. Try searching for "Merge Sort", "Algorithms", or reset the course filter.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCourse('ALL');
                setSelectedType('ALL');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map(m => {
              const fileUrl = m.file_path
                ? `http://localhost:5000/api/materials/download/${encodeURIComponent(m.file_path)}`
                : m.link_url;
              const viewUrl = m.file_path
                ? `http://localhost:5000/api/materials/download/${encodeURIComponent(m.file_path)}?inline=1`
                : m.link_url;

              return (
                <div
                  key={m.material_id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-emerald-950/20 group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Course Tag & Format Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold tracking-wide border border-emerald-500/20">
                        {m.course_code || 'CSE'}
                      </span>
                      {getFileBadge(m.type)}
                    </div>

                    {/* Material Title */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        Course: {m.course_title || 'Computer Science'}
                      </p>
                    </div>

                    {/* Metadata: Faculty & Date */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium text-slate-300">
                          {m.teacher_name || 'Faculty Member'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {m.uploaded_at ? new Date(m.uploaded_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Recently Uploaded'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {m.file_path ? (
                        <>
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View PDF
                          </a>
                          <a
                            href={fileUrl}
                            download
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </>
                      ) : (
                        <a
                          href={m.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Reference Link
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleAskEduBot(m)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Ask EduBot About This
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
