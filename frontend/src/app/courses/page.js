'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { BookOpen, Search, Filter, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedPrereq, setSelectedPrereq] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [selectedLevel, selectedPrereq]);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      let query = '?department=CSE';
      if (selectedLevel) query += `&level=${selectedLevel}`;
      if (selectedPrereq) query += `&prerequisite=${selectedPrereq}`;

      const res = await apiFetch(`/courses${query}`);
      if (res.success) {
        setCourses(res.courses || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Curriculum Structure
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            GSTU CSE Course Catalog
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse all 17 department courses, credit distributions, and prerequisite dependencies
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filters:
        </div>

        {/* Level Filter */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Academic Levels (1 - 4)</option>
          <option value="1">Level 1 (1st Year)</option>
          <option value="2">Level 2 (2nd Year)</option>
          <option value="3">Level 3 (3rd Year)</option>
          <option value="4">Level 4 (4th Year)</option>
        </select>

        {/* Prerequisite Filter */}
        <select
          value={selectedPrereq}
          onChange={(e) => setSelectedPrereq(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Prerequisites</option>
          <option value="none">No Prerequisite (Open to all)</option>
          <option value="CSE102">Requires CSE102 (Structured Programming)</option>
          <option value="CSE104">Requires CSE104 (Data Structures)</option>
          <option value="CSE202">Requires CSE202 (Algorithms)</option>
          <option value="CSE203">Requires CSE203 (Digital Logic)</option>
          <option value="CSE302">Requires CSE302 (Operating Systems)</option>
          <option value="CSE303">Requires CSE303 (Software Engineering)</option>
        </select>

        {(selectedLevel || selectedPrereq || search) && (
          <button
            onClick={() => {
              setSelectedLevel('');
              setSelectedPrereq('');
              setSearch('');
            }}
            className="text-xs text-red-600 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading GSTU CSE Curriculum...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center text-sm">
          {error}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
          No courses found matching the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.course_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-slate-900 text-emerald-400 font-mono text-xs font-bold rounded-lg tracking-wider">
                    {course.code}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                    {course.credits} Credits • Level {course.level}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {course.title}
                </h3>

                {course.instructor_name && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <span>Instructor:</span>
                    <span className="font-semibold text-slate-800">{course.instructor_name}</span>
                    {course.instructor_designation && (
                      <span className="text-slate-400">({course.instructor_designation})</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {course.description || 'Comprehensive departmental coursework covering core theory and laboratory practice.'}
                </p>

                {/* Attached Faculty Resources Badge/Link */}
                <div className="mt-3">
                  <a
                    href={`/dashboard/student/materials`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    {course.materials_count > 0
                      ? `${course.materials_count} Attached Resource${course.materials_count > 1 ? 's' : ''}`
                      : 'Browse Course Materials'}
                  </a>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Prerequisite:</span>
                {course.prerequisite_code ? (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold">
                    {course.prerequisite_code} ({course.prerequisite_title || 'Required'})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> None (Direct Entry)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
