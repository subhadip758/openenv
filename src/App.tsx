import { useState, useEffect } from 'react';
import { Mail, Calendar, Ticket, CheckSquare, RefreshCw, Play, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [state, setState] = useState<any>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const fetchState = async () => {
    const res = await fetch('/state');
    const data = await res.json();
    setState(data);
  };

  const fetchTasks = async () => {
    const res = await fetch('/tasks');
    const data = await res.json();
    setTasks(data.tasks || data);
  };

  const resetEnv = async (taskId: string) => {
    setLoading(true);
    await fetch(`/reset?task_id=${taskId}`, { method: 'POST' });
    await fetchState();
    setScore(null);
    setLoading(false);
  };

  const gradeEnv = async () => {
    const res = await fetch('/grader');
    const data = await res.json();
    setScore(data.score);
  };

  useEffect(() => {
    fetchTasks();
    fetchState();
    const interval = setInterval(() => {
      fetchState();
      gradeEnv();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!state) return <div className="p-8 font-mono">Loading OfficeOpsEnv...</div>;

  const { observation, done } = state;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight flex items-center gap-3">
            OfficeOpsEnv <span className="text-sm font-mono bg-black text-white px-2 py-1 rounded">v1.0</span>
          </h1>
          <p className="text-muted-foreground mt-1">OpenEnv-compatible AI Office Simulation</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedTask} 
            onChange={(e) => setSelectedTask(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {tasks.map(t => <option key={t} value={t}>Task {t}</option>)}
          </select>
          <button 
            onClick={() => resetEnv(selectedTask)}
            disabled={loading}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Reset
          </button>
          <button 
            onClick={gradeEnv}
            className="flex items-center gap-2 border border-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <BarChart2 size={16} />
            Grade
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats */}
        <div className="lg:col-span-4 flex gap-8 mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Step</span>
            <span className="text-2xl font-mono">{observation.step_count} / {observation.max_steps}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Status</span>
            <span className={`text-2xl font-mono ${done ? "text-red-500" : "text-green-500"}`}>
              {done ? "DONE" : "ACTIVE"}
            </span>
          </div>
          {score !== null && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col"
            >
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Score</span>
              <span className="text-2xl font-mono text-blue-600">{(score * 100).toFixed(0)}%</span>
            </motion.div>
          )}
        </div>

        {/* Emails */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Mail size={20} /> Emails</h2>
            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{observation.emails.length}</span>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
            {observation.emails.map((e: any) => (
              <div key={e.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                <div className="font-bold truncate">{e.subject}</div>
                <div className="text-xs text-gray-500 truncate">{e.sender}</div>
                {e.folder && e.folder !== "inbox" && (
                  <span className="mt-2 inline-block text-[10px] uppercase font-bold bg-black text-white px-1.5 py-0.5 rounded">
                    {e.folder}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Calendar */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar size={20} /> Calendar</h2>
            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{observation.calendar.length}</span>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
            {observation.calendar.map((m: any) => (
              <div key={m.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                <div className="font-bold">{m.title}</div>
                <div className="text-xs text-gray-500">{m.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tickets */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Ticket size={20} /> Tickets</h2>
            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{observation.tickets.length}</span>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
            {observation.tickets.map((t: any) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-bold">{t.customer}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-xs mt-1">{t.issue}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tasks */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><CheckSquare size={20} /> Tasks</h2>
            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{observation.pending_tasks.length}</span>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
            {observation.pending_tasks.map((t: any) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>{t.description}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-6">
          <a href="/state" target="_blank" className="hover:text-black">API State</a>
          <a href="/tasks" target="_blank" className="hover:text-black">Tasks List</a>
          <a href="/grader" target="_blank" className="hover:text-black">Grader</a>
        </div>
        <div>
          Built with OpenEnv API & TypeScript
        </div>
      </footer>
    </div>
  );
}
