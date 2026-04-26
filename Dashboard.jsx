const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || { motion: { div: ({children, ...props}) => <div {...props}>{children}</div>, span: ({children, ...props}) => <span {...props}>{children}</span> }, AnimatePresence: ({children}) => <>{children}</> };

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [score, setScore] = useState(0);
  const [view, setView] = useState('dashboard'); // dashboard, proposal, settings

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('ebb_user_id');
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
        const rows = await response.json();
        const userProfile = rows.find(r => r.user_id === userId);
        
        if (userProfile) {
          setProfile(userProfile);
          // Simulate an AI calculation of the score based on the logic framework
          // In reality, an agent would have pre-calculated this.
          setTimeout(() => {
            setScore(82); // Example Reset Score
            setLoading(false);
          }, 2000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-ebb-sage/20 rounded-full animate-spin border-t-ebb-sage"></div>
          <div className="absolute inset-0 flex items-center justify-center font-serif text-ebb-sage font-bold text-xl">
            {score > 0 ? score : ''}
          </div>
        </div>
        <h1 className="text-3xl font-serif">Generating your Reset Plan...</h1>
        <p className="text-slate-500 max-w-sm">Our AI is analyzing your sleep windows, chore requirements, and screen time to design your ideal flow.</p>
      </div>
    );
  }

  const upcomingBlocks = [
    { title: 'Deep Work: Strategy', time: '09:00 - 11:30', category: 'Focus', color: 'bg-ebb-slate text-white' },
    { title: 'Commute & Audio Book', time: '08:15 - 08:45', category: 'Transition', color: 'bg-ebb-sage/20 text-ebb-slate' },
    { title: 'Personal Interest: Reading', time: '20:30 - 21:30', category: 'Growth', color: 'bg-ebb-rose/20 text-ebb-slate' }
  ];

  return (
    <div className="min-h-screen bg-ebb-cream text-ebb-slate pb-24">
      {/* Top Nav */}
      <nav className="flex items-center justify-between p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ebb-sage flex items-center justify-center text-white text-xs font-bold">E</div>
          <span className="font-serif font-semibold">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-ebb-sage/10 text-[10px] font-bold uppercase tracking-wider text-ebb-sage">
          <span className="w-1.5 h-1.5 rounded-full bg-ebb-sage animate-pulse"></span>
          Coach: Active
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 space-y-10">
        {/* Reset Score Section */}
        <section className="text-center pt-8">
          <div className="relative inline-block mb-6">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-ebb-sage/10" />
              <motion.circle 
                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={552.92}
                initial={{ strokeDashoffset: 552.92 }}
                animate={{ strokeDashoffset: 552.92 - (552.92 * score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-ebb-sage" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-serif font-semibold">{score}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Reset Score</span>
            </div>
          </div>
          <h2 className="text-2xl font-serif font-semibold">You're in the Flow</h2>
          <p className="text-slate-500 mt-2 text-sm">Your schedule is 82% aligned with your intentions. Keep protecting your recovery windows.</p>
        </section>

        {/* Priority Blocks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-semibold text-lg">Upcoming Focus</h3>
            <button onClick={() => setView('proposal')} className="text-xs font-bold text-ebb-sage uppercase tracking-wider">View Full Plan</button>
          </div>
          <div className="space-y-3">
            {upcomingBlocks.map((block, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`p-5 rounded-3xl flex items-center justify-between border border-white shadow-sm ${block.color}`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 block mb-1">{block.category}</span>
                  <h4 className="font-serif font-semibold text-lg">{block.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{block.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button className="bg-white p-6 rounded-3xl border border-ebb-sage/10 text-center hover:bg-ebb-sage/5 transition-all">
            <span className="block text-2xl mb-2">💬</span>
            <span className="text-sm font-semibold">Message AI</span>
          </button>
          <button className="bg-white p-6 rounded-3xl border border-ebb-sage/10 text-center hover:bg-ebb-sage/5 transition-all">
            <span className="block text-2xl mb-2">🔄</span>
            <span className="text-sm font-semibold">Rerun Reset</span>
          </button>
        </section>

        {/* Stolen Time Alert */}
        <div className="bg-ebb-rose/10 p-6 rounded-3xl border border-ebb-rose/20 space-y-2">
          <h4 className="font-serif font-semibold text-ebb-slate">Stolen Time Detected</h4>
          <p className="text-sm text-slate-600">You spent 42 minutes on Instagram during your planned "Reading" block yesterday. Want to lock your phone tonight?</p>
          <button className="text-xs font-bold text-ebb-slate uppercase tracking-wider underline">Yes, help me focus</button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6 max-w-xl mx-auto">
        <div className="bg-ebb-slate text-white p-2 rounded-full flex items-center justify-between shadow-2xl">
          <button onClick={() => setView('dashboard')} className={`flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-ebb-sage' : 'hover:bg-white/10'}`}>Dash</button>
          <button onClick={() => setView('proposal')} className={`flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${view === 'proposal' ? 'bg-ebb-sage' : 'hover:bg-white/10'}`}>Plan</button>
          <button onClick={() => setView('settings')} className={`flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${view === 'settings' ? 'bg-ebb-sage' : 'hover:bg-white/10'}`}>Settings</button>
        </div>
      </div>

      {/* AI Proposal Modal (Simplified) */}
      <AnimatePresence>
        {view === 'proposal' && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 bg-ebb-cream p-6 overflow-y-auto"
          >
            <div className="max-w-xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif font-semibold">The Reset Proposal</h2>
                <button onClick={() => setView('dashboard')} className="p-2 bg-ebb-slate text-white rounded-full">✕</button>
              </div>
              <p className="text-slate-500">I've redesigned your week to prioritize recovery. Take a look at the key changes.</p>
              
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-ebb-sage/20">
                  <h4 className="font-bold text-ebb-sage text-xs uppercase mb-2">Biological Lock</h4>
                  <p className="font-serif text-lg">Sleep moved to 10:30 PM (was 11:30 PM)</p>
                  <p className="text-sm text-slate-500 mt-2">To hit your 8-hour goal before your 6:30 AM alarm.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-ebb-sage/20">
                  <h4 className="font-bold text-ebb-sage text-xs uppercase mb-2">Chore Batching</h4>
                  <p className="font-serif text-lg">Groceries & Prep: Tuesday 6:00 PM</p>
                  <p className="text-sm text-slate-500 mt-2">Clears your Sunday afternoon for pure rest.</p>
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <button className="w-full py-5 bg-ebb-sage text-white rounded-full font-bold shadow-xl shadow-ebb-sage/20">Accept Reset Plan</button>
                <button className="w-full py-5 border border-ebb-slate rounded-full font-bold">Request Edits</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
