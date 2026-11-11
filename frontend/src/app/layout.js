import './globals.css';
import { AuthProvider } from '../lib/authContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'EduBot - GSTU CSE Academic Assistant & AI Advising',
  description: 'AI-Powered Academic Advising & Knowledge Assistant for Department of Computer Science & Engineering, GSTU',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-slate-300">EduBot Academic Assistant</p>
              <p className="mt-1">Gopalganj Science and Technology University (GSTU) • Department of Computer Science & Engineering</p>
              <p className="mt-2 text-[10px] text-slate-500">Powered by Next.js, Express, MySQL & Google Gemini 2.0 Flash</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
