'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/authContext';
import { apiFetch } from '../../../../lib/api';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
  ExternalLink,
  Trash2,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function AdvisingChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bookingSuccessTicket, setBookingSuccessTicket] = useState(null);

  const messagesEndRef = useRef(null);

  // Suggested quick prompts
  const quickPrompts = [
    'Explain merge sort algorithm from sir\'s slide',
    'Can I take CSE301 next semester?',
    'What is my current CGPA?',
    'What courses should I take next semester?',
    'Find lecture notes and slides',
    'Book an advising session with a teacher'
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('query');
      if (query) {
        setInputMessage(query);
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.role === 'student') {
      fetchChatHistory();
    }
  }, [user, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const res = await apiFetch('/chat/history');
      if (res.success && res.history) {
        if (res.history.length === 0) {
          // Add initial welcome message
          setMessages([
            {
              sender: 'bot',
              text: `Hello ${user?.name || 'Student'}! 👋 I am **EduBot**, your GSTU CSE academic advisor.\n\nI can verify course prerequisites, calculate your remaining degree credits, check your CGPA, find course notes, or help you book an appointment with our faculty advisors.\n\nHow can I help you today?`,
              timestamp: new Date().toISOString()
            }
          ]);
        } else {
          // Transform history
          const loaded = [];
          res.history.forEach((h) => {
            loaded.push({
              sender: 'user',
              text: h.message,
              timestamp: h.timestamp
            });
            loaded.push({
              sender: 'bot',
              text: h.response,
              timestamp: h.timestamp,
              escalated: Boolean(h.escalated)
            });
          });
          setMessages(loaded);
        }
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text })
      });

      if (res.success) {
        const botMsg = {
          sender: 'bot',
          text: res.response,
          timestamp: res.timestamp || new Date().toISOString(),
          facts: res.facts,
          intent: res.intent,
          material_cards: res.material_cards || [],
          rag_sources: res.rag_sources || [],
          slots: res.slots || [],
          escalated: res.escalated,
          escalation_ticket: res.escalation_ticket
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ **Error:** ${err.message || 'Unable to process your request at this moment.'}`,
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId) => {
    try {
      setLoading(true);
      const res = await apiFetch('/advising/book', {
        method: 'POST',
        body: JSON.stringify({
          slot_id: slotId,
          summary: 'Course Advising & Degree Planning'
        })
      });

      if (res.success) {
        setBookingSuccessTicket(res.ticket);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `🎉 **Advising Session Confirmed!**\n\n* **Advisor:** ${res.ticket.advisor_name}\n* **Start Time:** ${new Date(res.ticket.start_time).toLocaleString()}\n* **End Time:** ${new Date(res.ticket.end_time).toLocaleString()}\n* **Status:** Confirmed (Pending Advisor Review)\n\nA notification has been dispatched to your faculty advisor.`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      alert(`Booking Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your chat history?')) return;
    try {
      await apiFetch('/chat/history', { method: 'DELETE' });
      setMessages([
        {
          sender: 'bot',
          text: `Chat history cleared. How may I assist you with your academic planning?`,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">EduBot Advising Assistant</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Gemini 2.0 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Department of Computer Science & Engineering • GSTU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm chat-scroll space-y-5">
        {initialLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm animate-pulse">
            Connecting to EduBot Advising Engine...
          </div>
        ) : (
          messages.map((msg, index) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                    isBot ? 'bg-emerald-600' : 'bg-slate-800'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className="space-y-3 max-w-2xl">
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isBot
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                        : 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                    }`}
                  >
                    {/* Markdown rendering with simple whitespace / bold / bullets */}
                    <div className="whitespace-pre-line space-y-1">
                      {msg.text}
                    </div>

                    {/* Source material citation if present */}
                    {msg.rag_sources && msg.rag_sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Sources: </span>
                        {msg.rag_sources.map((s, sIdx) => (
                          <span key={sIdx} className="inline-block mr-2 underline decoration-emerald-500">
                            {s.title} ({s.course_code})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Smart Escalation Warning Banner */}
                  {msg.escalated && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2 shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Escalated to Faculty Advisor</div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          This inquiry has been logged in Dr. Anisur Rahman&apos;s advising queue for faculty review.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Interactive Booking Slots (Increment 4) - Grouped by Faculty Advisor */}
                  {msg.slots && msg.slots.length > 0 && (() => {
                    const grouped = msg.slots.reduce((acc, slot) => {
                      const key = slot.advisor_name || 'Faculty Advisor';
                      if (!acc[key]) {
                        acc[key] = {
                          name: key,
                          designation: slot.advisor_designation || 'Academic Advisor',
                          slots: []
                        };
                      }
                      acc[key].slots.push(slot);
                      return acc;
                    }, {});

                    return (
                      <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 space-y-3.5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                            <Calendar className="w-4 h-4 text-emerald-700" />
                            Available Faculty Advising Appointments
                          </div>
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                            {msg.slots.length} open slots across {Object.keys(grouped).length} faculty members
                          </span>
                        </div>

                        <div className="space-y-3">
                          {Object.values(grouped).map((group) => (
                            <div key={group.name} className="bg-white border border-emerald-200/80 rounded-xl p-3 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{group.name}</span>
                                  <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
                                    • {group.designation}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                  {group.slots.length} available slot{group.slots.length > 1 ? 's' : ''}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                                {group.slots.map((slot) => {
                                  const startTime = new Date(slot.start_time);
                                  const endTime = new Date(slot.end_time);
                                  const dateStr = startTime.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                  const timeStr = `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                                  return (
                                    <button
                                      key={slot.slot_id}
                                      onClick={() => handleBookSlot(slot.slot_id)}
                                      className="text-left p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 rounded-lg text-xs transition-all group flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-800 group-hover:text-emerald-800">
                                          {dateStr}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono">
                                          {timeStr}
                                        </div>
                                      </div>
                                      <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                                        Book <ArrowRight className="w-3 h-3" />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Clickable Course Material Cards (Increment 3) */}
                  {msg.material_cards && msg.material_cards.length > 0 && (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                        Matching Course Materials & Notes:
                      </div>
                      <div className="space-y-1.5">
                        {msg.material_cards.map((mat) => (
                          <div
                            key={mat.material_id}
                            className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between gap-3 text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900">{mat.title}</span>
                                <span className="ml-1.5 text-[10px] text-slate-500 font-mono">
                                  [{mat.course_code}]
                                </span>
                              </div>
                            </div>
                            {mat.file_path ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`http://localhost:5000/api/materials/download/${encodeURIComponent(mat.file_path)}?inline=1`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                                <a
                                  href={`http://localhost:5000/api/materials/download/${encodeURIComponent(mat.file_path)}`}
                                  download
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </a>
                              </div>
                            ) : mat.link_url ? (
                              <a
                                href={mat.link_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" /> Open Link
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="pt-1 text-right">
                        <a
                          href="/dashboard/student/materials"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          Open Course Materials Hub <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 items-center mr-auto">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-slate-100 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-slate-500 font-medium ml-2">Consulting GSTU CSE academic records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2.5 overflow-x-auto flex gap-2 shrink-0 no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 text-xs font-medium rounded-full whitespace-nowrap transition-colors shadow-xs disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about prerequisites (e.g. 'Can I take CSE301?'), credits, or advising..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all disabled:opacity-40 disabled:hover:bg-emerald-600 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
