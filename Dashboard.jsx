const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || { 
  motion: { 
    div: ({children, ...props}) => <div {...props}>{children}</div>, 
    span: ({children, ...props}) => <span {...props}>{children}</span>,
    button: ({children, ...props}) => <button {...props}>{children}</button>
  }, 
  AnimatePresence: ({children}) => <>{children}</> 
};

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [score, setScore] = useState(0);
  const [view, setView] = useState('dashboard'); // dashboard, proposal, settings
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fetchData = async () => {
    const userId = localStorage.getItem('ebb_user_id');
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch Profile
      const profileResponse = await fetch(`https://baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
      const profiles = await profileResponse.json();
      const userProfile = profiles.find(r => r.user_id === userId);
      
      if (userProfile) {
        setProfile(userProfile);
        
        // Fetch existing plan if any
        const planResponse = await fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`);
        const plans = await planResponse.json();
        const existingPlan = plans.find(p => p.user_id === userId);
        
        if (existingPlan) {
          setPlan(JSON.parse(existingPlan.plan_json));
          setScore(82); 
        } else {
          // If no plan exists, generate one
          handleGeneratePlan(userId);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (userId) => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || localStorage.getItem('ebb_user_id') })
      });
      const data = await response.json();
      if (data.blocks) {
        setPlan(data);
        setScore(Math.floor(Math.random() * 15) + 80); // Simulate score based on plan
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || analyzing) {
    return (
      <div className="min-h-screen bg-ebb-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-3 border-ebb-sage/20 border-t-ebb-sage rounded-full animate-spin mb-8"></div>
        <h1 className="text-3xl font-serif text-ebb-slate mb-3 italic">
          {analyzing ? 'AI Analyzing Your Week...' : 'Syncing your life...'}
        </h1>
        <p className="text-slate-500 max-w-xs leading-relaxed">
          {analyzing 
            ? 'Our Life Design engine is balancing your sleep, chores, and personal interests.' 
            : 'Designing a week around your biological foundations and personal recovery goals.'}
        </p>
      </div>
    );
  }

  // Fallback blocks if plan is missing (though our flow generates it)
  const displayBlocks = plan?.blocks?.filter(b => b.day === 'Monday').slice(0, 3) || [
    { title: 'Sleep & Recovery', start_time: '23:00', category: 'Foundation', color: 'bg-ebb-sage/10 text-ebb-slate' },
    { title: 'Morning Ritual', start_time: '07:00', category: 'Foundation', color: 'bg-ebb-sage/10 text-ebb-slate' }
  ];

  const weeklyGoals = [
    { title: 'Sleep Hygiene', desc: '8h nightly average', status: 'On Track', progress: 85 },
    { title: 'Domestic Flow', desc: 'Complete chores by Tue', status: 'Paused', progress: 40 }
  ];

  return (
    <div className="min-h-screen bg-ebb-cream text-ebb-slate pb-32">
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 bg-ebb-cream/80 backdrop-blur-lg z-40 border-b border-ebb-sage/10">
        <div className="max-w-xl mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ebb-sage flex items-center justify-center text-white font-serif font-bold">e</div>
            <span className="font-serif font-semibold text-lg tracking-tight">Ebb</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isPaused ? 'bg-slate-100 text-slate-400' : 'bg-ebb-sage/10 text-ebb-sage'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-slate-300' : 'bg-ebb-sage animate-pulse'}`}></span>
              {isPaused ? 'Paused' : 'Syncing'}
            </div>
            <button onClick={() => setView('settings')} className="text-slate-400 hover:text-ebb-slate transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-24 space-y-12">
        {/* Reset Score Section */}
        <section className="text-center pt-4">
          <div className="relative inline-block mb-8 group cursor-pointer" onClick={() => setView('proposal')}>
            <svg className="w-56 h-56 transform -rotate-90">
              <circle cx="112" cy="112" r="102" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-ebb-sage/10" />
              <motion.circle 
                cx="112" cy="112" r="102" stroke="currentColor" strokeWidth="6" fill="transparent" 
                strokeDasharray={640.88}
                initial={{ strokeDashoffset: 640.88 }}
                animate={{ strokeDashoffset: 640.88 - (640.88 * score) / 100 }}
                transition={{ duration: 1.8, ease: "circOut" }}
                className="text-ebb-sage" 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-7xl font-serif font-semibold tracking-tighter"
              >
                {score}
              </motion.span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Reset Score</span>
            </div>
          </div>
          <h2 className="text-3xl font-serif font-semibold leading-tight italic">Intentional Flow</h2>
          <p className="text-slate-500 mt-3 text-base leading-relaxed max-w-xs mx-auto">
            {plan?.score_explanation || "Analyzing your life design integrity..."}
          </p>
        </section>

        {/* Weekly Goals Section */}
        <section className="space-y-5">
          <h3 className="font-serif font-semibold text-xl pl-1">Weekly Goals</h3>
          <div className="grid grid-cols-1 gap-4">
            {weeklyGoals.map((goal, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-ebb-sage/10 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-lg">{goal.title}</h4>
                  <p className="text-sm text-slate-500">{goal.desc}</p>
                </div>
                <div className="text-right">
                   <div className="text-xs font-bold text-ebb-sage mb-1 uppercase tracking-widest">{goal.progress}%</div>
                   <div className="w-16 h-1.5 bg-ebb-sage/10 rounded-full overflow-hidden">
                     <div className="h-full bg-ebb-sage" style={{ width: `${goal.progress}%` }}></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar Reset Toggle */}
        <section className="bg-ebb-slate p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ebb-sage/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-xl font-serif font-semibold mb-1 italic">Reset Plan</h3>
              <p className="text-ebb-sage/80 text-sm">Active on Google Calendar</p>
            </div>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className={`w-14 h-8 rounded-full transition-colors relative ${showCalendar ? 'bg-ebb-sage' : 'bg-ebb-sage/20'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg ${showCalendar ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          {showCalendar && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-white/10 space-y-4"
            >
              <p className="text-sm text-slate-300">Ebb is currently syncing <span className="text-white font-medium">{plan?.blocks?.length || 0} blocks</span> to your "Reset Plan" calendar. Your primary work calendar remains untouched.</p>
              <div className="flex gap-3">
                <button onClick={() => setView('proposal')} className="flex-1 py-3 bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all">View Blocks</button>
                <button className="flex-1 py-3 bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all">Export Settings</button>
              </div>
            </motion.div>
          )}
        </section>

        {/* Priority Blocks */}
        <section className="space-y-5 pb-8">
          <div className="flex items-center justify-between pl-1">
            <h3 className="font-serif font-semibold text-xl">Today's Sequence</h3>
            <button onClick={() => setView('proposal')} className="text-xs font-bold text-ebb-sage uppercase tracking-widest hover:underline">Full Plan</button>
          </div>
          <div className="space-y-4">
            {displayBlocks.map((block, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`p-6 rounded-[32px] flex items-center justify-between border shadow-sm group hover:scale-[1.02] transition-all cursor-pointer bg-white border-ebb-sage/10 text-ebb-slate`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 block mb-1.5">{block.category}</span>
                  <h4 className="font-serif font-semibold text-xl">{block.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium opacity-80">{block.start_time} - {block.end_time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-8 left-6 right-6 max-w-xl mx-auto z-50">
        <div className="bg-ebb-slate/90 backdrop-blur-xl text-white p-2.5 rounded-full flex items-center justify-between shadow-2xl border border-white/5">
          <button onClick={() => setView('dashboard')} className={`flex-1 py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-ebb-sage shadow-lg' : 'hover:bg-white/10 opacity-60'}`}>Dash</button>
          <button onClick={() => setView('proposal')} className={`flex-1 py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'proposal' ? 'bg-ebb-sage shadow-lg' : 'hover:bg-white/10 opacity-60'}`}>Plan</button>
          <button onClick={() => setView('settings')} className={`flex-1 py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'settings' ? 'bg-ebb-sage shadow-lg' : 'hover:bg-white/10 opacity-60'}`}>Settings</button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {view === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-ebb-cream p-6 overflow-y-auto"
          >
            <div className="max-w-xl mx-auto space-y-10">
              <div className="flex justify-between items-center">
                <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  Dashboard
                </button>
                <h2 className="text-2xl font-serif font-semibold">Settings</h2>
                <div className="w-10"></div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                   <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Controls</h4>
                   <div className="bg-white rounded-3xl border border-ebb-sage/10 p-2">
                     <button 
                       onClick={() => setIsPaused(!isPaused)}
                       className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${isPaused ? 'bg-ebb-sage text-white' : 'hover:bg-slate-50'}`}
                     >
                       <span className="font-semibold">{isPaused ? 'Resume Assistant' : 'Pause Assistant'}</span>
                       <span>{isPaused ? '▶' : '⏸'}</span>
                     </button>
                     <button 
                        onClick={() => handleGeneratePlan()}
                        className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all border-t border-slate-50 mt-1"
                     >
                       <span className="font-semibold text-ebb-slate">Rerun AI Analysis</span>
                       <span className="opacity-30">🔄</span>
                     </button>
                     <button className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all border-t border-slate-50 mt-1">
                       <span className="font-semibold text-ebb-slate">Edit Priorities</span>
                       <span className="opacity-30">✎</span>
                     </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Integrations</h4>
                   <div className="bg-white rounded-3xl border border-ebb-sage/10 p-6 space-y-6">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                           <img src="https://www.google.com/favicon.ico" className="w-5 h-5 opacity-40" />
                         </div>
                         <div>
                           <p className="font-semibold">Google Calendar</p>
                           <p className="text-xs text-slate-400">Synced: ebb_reset_492</p>
                         </div>
                       </div>
                       <span className="text-[10px] font-bold text-ebb-sage uppercase tracking-widest">Active</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Proposal Section (The Plan) */}
      <AnimatePresence>
        {view === 'proposal' && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-ebb-cream p-6 overflow-y-auto"
          >
            <div className="max-w-xl mx-auto space-y-12 pt-8">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-serif font-semibold italic">The Reset Plan</h2>
                <button onClick={() => setView('dashboard')} className="w-12 h-12 bg-ebb-slate text-white rounded-full flex items-center justify-center shadow-lg">✕</button>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Proposed Adjustments</h3>
                  <div className="space-y-4">
                    {plan?.key_adjustments?.map((adj, i) => (
                      <div key={i} className="bg-white p-8 rounded-[40px] border border-ebb-sage/20 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:opacity-20 transition-all italic font-serif">{String.fromCharCode(65 + i)}</div>
                        <h4 className="font-bold text-ebb-sage text-xs uppercase mb-3 tracking-widest">Strategic Shift</h4>
                        <p className="font-serif text-2xl mb-2">{adj.split(':')[0]}</p>
                        <p className="text-base text-slate-500 leading-relaxed">{adj.split(':')[1] || adj}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Monday Schedule</h3>
                  <div className="space-y-3">
                    {plan?.blocks?.filter(b => b.day === 'Monday').map((block, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="w-20 text-xs font-bold text-slate-400">{block.start_time}</div>
                        <div className="flex-1 bg-white p-4 rounded-2xl border border-ebb-sage/10 text-sm font-medium">
                          {block.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-ebb-slate p-10 rounded-[50px] text-white text-center space-y-6">
                  <p className="font-serif text-xl italic opacity-90 leading-relaxed">"A well-designed week is the foundation of a human-centric life."</p>
                  <div className="pt-4 space-y-4">
                    <button onClick={() => setView('dashboard')} className="w-full py-5 bg-ebb-sage text-white rounded-full font-bold shadow-2xl shadow-ebb-sage/20 hover:scale-[1.02] transition-all">Accept Reset Plan</button>
                    <button className="w-full py-5 border border-white/20 rounded-full font-bold hover:bg-white/5 transition-all">Chat with Assistant</button>
                  </div>
                </div>
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
