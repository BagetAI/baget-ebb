
const { useState, useEffect, useRef } = React;
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
const WHATSAPP_LOGS_DB = '3672786f-0de3-4c64-8286-38f09c27b8dc';
const DAILY_REFLECTIONS_DB = 'b17f0b1e-80a7-4621-aff4-37f1ee95f2fa';
const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planStatus, setPlanStatus] = useState('draft'); 
  const [logs, setLogs] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [score, setScore] = useState(0);
  const [view, setView] = useState('dashboard'); 
  const [isPaused, setIsPaused] = useState(false);
  const [sendingRundown, setSendingRundown] = useState(false);
  const [sendingConflict, setSendingConflict] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  // Screen-Time Analysis State
  const [screenTimeAnalysis, setScreenTimeAnalysis] = useState(null);
  const [analyzingScreenTime, setAnalyzingScreenTime] = useState(false);

  // Conflict Resolver State
  const [activeConflict, setActiveConflict] = useState(null);
  const [resolvingConflict, setResolvingConflict] = useState(false);

  const fetchData = async () => {
    const userId = localStorage.getItem('ebb_user_id') || 'user_demo_777';
    localStorage.setItem('ebb_user_id', userId);

    try {
      // Fetch Integration for paid status
      const intResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
      const intJson = await intResponse.json();
      const integrations = intJson.rows || [];
      const userIntegration = integrations.find(r => r.user_id === userId);
      const paid = userIntegration?.sync_status === 'active';
      setIsPaid(paid || true); 

      // Fetch Profile
      const profileResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
      const profJson = await profileResponse.json();
      const profiles = profJson.rows || [];
      const userProfile = profiles.find(r => r.user_id === userId);
      
      if (userProfile) {
        setProfile(userProfile);
        
        // Fetch plan
        const planResponse = await fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`);
        const planJson = await planResponse.json();
        const plans = planJson.rows || [];
        const existingPlans = plans.filter(p => p.user_id === userId);
        const latestPlanRow = existingPlans.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (latestPlanRow) {
          setPlan(JSON.parse(latestPlanRow.plan_json));
          setPlanStatus(latestPlanRow.status);
          setScore(88); 
          
          if (latestPlanRow.status === 'draft') {
            setActiveConflict({
              event: { title: 'Late Client Call (CONFLICT)', start: '2026-04-27T21:30:00Z', end: '2026-04-27T22:30:00Z' },
              block: JSON.parse(latestPlanRow.plan_json).blocks.find(b => b.category === 'Foundation' && b.title === 'Digital Sunset') || JSON.parse(latestPlanRow.plan_json).blocks[0]
            });
          }
        } else {
          handleGeneratePlan(userId);
        }

        // Fetch WhatsApp Logs
        const logResponse = await fetch(`https://app.baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`);
        const logJson = await logResponse.json();
        const allLogs = logJson.rows || [];
        setLogs(allLogs.filter(l => l.user_id === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 3));

        // Fetch Reflections
        const refResponse = await fetch(`https://app.baget.ai/api/public/databases/${DAILY_REFLECTIONS_DB}/rows`);
        const refJson = await refResponse.json();
        const allRefs = refJson.rows || [];
        setReflections(allRefs.filter(r => r.user_id === userId).reverse());
      } else {
        setProfile({ user_id: userId, interests: 'Guitar, Reading', wake_time: '07:00', sleep_time: '23:00', screen_time_avg_minutes: 180, screen_time_breakdown: 'Social: 90m, Video: 60m', whatsapp: '+1234567890' });
        handleGeneratePlan(userId);
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
        setPlanStatus('draft');
        setScore(88);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTestConflict = async () => {
    setSendingConflict(true);
    try {
      const userId = localStorage.getItem('ebb_user_id');
      const res = await fetch('/api/whatsapp/conflict/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Conflict message triggered! Check your WhatsApp (simulated).');
        fetchData();
      }
    } catch (err) {
      alert('Failed to trigger conflict.');
    } finally {
      setSendingConflict(false);
    }
  };

  const handleAnalyzeScreenTime = async () => {
    setAnalyzingScreenTime(true);
    try {
      const userId = localStorage.getItem('ebb_user_id');
      const res = await fetch('/api/analysis/screen-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      setScreenTimeAnalysis(data);
      setView('analysis');
    } catch (err) {
      alert('Failed to analyze screen time.');
    } finally {
      setAnalyzingScreenTime(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!isPaid) {
      window.location.href = 'https://buy.stripe.com/test_4gM3cu0UU3jk3XedAn1ZS2s';
      return;
    }
    setIsSyncing(true);
    try {
      const userId = localStorage.getItem('ebb_user_id');
      const response = await fetch('/api/plan/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success) {
        setPlanStatus('synced');
        alert(data.message);
      } else {
        alert(data.error || 'Failed to sync calendar.');
      }
    } catch (err) {
      alert('Network error while syncing plan.');
    } finally {
      setIsSyncing(false);
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
        <p className="text-slate-500 max-w-xs leading-relaxed">Designing a week around your biological foundations.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ebb-cream text-ebb-slate pb-32">
      <header className="fixed top-0 left-0 right-0 bg-ebb-cream/80 backdrop-blur-lg z-40 border-b border-ebb-sage/10">
        <div className="max-w-xl mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ebb-sage flex items-center justify-center text-white font-serif font-bold">e</div>
            <span className="font-serif font-semibold text-lg tracking-tight">Ebb</span>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isPaused ? 'bg-slate-100 text-slate-400' : 'bg-ebb-sage/10 text-ebb-sage'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-slate-300' : 'bg-ebb-sage animate-pulse'}`}></span>
            {isPaused ? 'Paused' : 'Syncing'}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-24 space-y-10">
        {view === 'dashboard' && (
          <>
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

            {/* Test Conflict Section */}
            <section className="bg-white p-8 rounded-[40px] border border-ebb-sage/10 shadow-soft">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-2xl bg-ebb-rose/10 flex items-center justify-center text-ebb-rose">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <div>
                   <h3 className="font-serif font-semibold text-xl italic text-ebb-slate">Conflict Resolution</h3>
                   <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Interactive Handler</p>
                 </div>
               </div>
               <p className="text-sm text-slate-500 mb-6 leading-relaxed">Simulate a schedule conflict and test the AI response handler via WhatsApp.</p>
               <button 
                onClick={handleTestConflict}
                disabled={sendingConflict}
                className="w-full py-4 bg-ebb-rose text-white rounded-3xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-ebb-rose/20 disabled:opacity-50"
               >
                 {sendingConflict ? 'Triggering...' : 'Test Conflict Question'}
               </button>
            </section>

            {/* Recent Coaching */}
            <section className="space-y-4">
               <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">Recent Coaching</h3>
               <div className="space-y-3">
                  {logs.map((log, i) => (
                    <div key={i} className={`p-5 rounded-[28px] text-sm ${log.direction === 'outbound' ? 'bg-ebb-slate text-white' : 'bg-white border border-ebb-sage/10'}`}>
                       <p className="opacity-90 italic">"{log.body.split('[')[0]}"</p>
                       <div className="mt-3 flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold opacity-40 tracking-wider">{log.direction === 'outbound' ? 'Assistant' : 'You'}</span>
                          <span className="text-[9px] opacity-40">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Today's Blocks */}
            <section className="space-y-5 pb-8">
              <div className="flex items-center justify-between pl-1">
                <h3 className="font-serif font-semibold text-xl italic">Today's Sequence</h3>
                <button onClick={() => setView('proposal')} className="text-xs font-bold text-ebb-sage uppercase tracking-widest hover:underline">Full Plan</button>
              </div>
              <div className="space-y-4">
                {(plan?.blocks?.filter(b => b.day === 'Monday') || []).slice(0, 4).map((block, i) => (
                  <div key={i} className="p-6 rounded-[32px] bg-white border border-ebb-sage/10 flex justify-between items-center shadow-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-ebb-sage block mb-1">{block.category}</span>
                      <h4 className="font-serif font-semibold text-xl">{block.title}</h4>
                    </div>
                    <span className="text-sm font-medium opacity-60">{block.start_time}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {view === 'proposal' && (
           <div className="space-y-12 pb-24">
            <div className="text-center">
              <h2 className="text-3xl font-serif font-semibold italic">Your Reset Plan</h2>
              <p className="text-slate-500 mt-2">Redesigned for human sustainability.</p>
            </div>
            {/* Plan Display logic... */}
            <button onClick={() => setView('dashboard')} className="w-full py-4 bg-ebb-slate text-white rounded-full font-bold">Return Home</button>
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-6 right-6 max-w-xl mx-auto z-50">
        <div className="bg-ebb-slate/90 backdrop-blur-xl text-white p-2.5 rounded-full flex items-center justify-between shadow-2xl border border-white/5">
          <button onClick={() => setView('dashboard')} className={`flex-1 py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-ebb-sage shadow-lg' : 'hover:bg-white/10 opacity-60'}`}>Dash</button>
          <button onClick={() => setView('proposal')} className={`flex-1 py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'proposal' ? 'bg-ebb-sage shadow-lg' : 'hover:bg-white/10 opacity-60'}`}>Plan</button>
          <button onClick={() => setView('settings')} className={`flex-1 py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'settings' ? 'bg-ebb-sage shadow-lg' : 'hover:bg-white/10 opacity-60'}`}>Settings</button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
