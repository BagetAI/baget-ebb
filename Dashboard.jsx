
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
  const [score, setScore] = useState(88);
  const [view, setView] = useState('dashboard'); 
  const [isPaused, setIsPaused] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  // Screen-Time State
  const [stolenTime, setStolenTime] = useState(11.4);

  const fetchData = async () => {
    const userId = localStorage.getItem('ebb_user_id') || 'user_demo_777';
    localStorage.setItem('ebb_user_id', userId);

    try {
      // Integration check
      const intResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
      const intJson = await intResponse.json();
      const integrations = intJson.rows || [];
      const userIntegration = integrations.find(r => r.user_id === userId);
      const paid = userIntegration?.sync_status === 'active';
      setIsPaid(paid || false); 

      // Profile Fetch
      const profileResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
      const profJson = await profileResponse.json();
      const profiles = profJson.rows || [];
      const userProfile = profiles.find(r => r.user_id === userId);
      
      if (userProfile) {
        setProfile(userProfile);
        
        // Plan Fetch
        const planResponse = await fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`);
        const planJson = await planResponse.json();
        const plans = planJson.rows || [];
        const existingPlans = plans.filter(p => p.user_id === userId);
        const latestPlanRow = existingPlans.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (latestPlanRow) {
          setPlan(JSON.parse(latestPlanRow.plan_json));
          setPlanStatus(latestPlanRow.status);
        } else {
          handleGeneratePlan(userId);
        }
      } else {
        setProfile({ interests: 'Guitar, Reading', wake_time: '07:00', sleep_time: '23:00' });
        handleGeneratePlan(userId);
      }
      setLoading(false);
    } catch (err) {
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
      }
    } catch (err) {
      console.error('Plan generation failed');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading || analyzing) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-2 border-[#8DA399]/20 border-t-[#8DA399] rounded-full animate-spin mb-8"></div>
        <h1 className="text-3xl font-serif text-[#2C3333] mb-3 italic">
          {analyzing ? 'AI Analyzing Your Week...' : 'Syncing your life...'}
        </h1>
        <p className="text-slate-500 max-w-xs leading-relaxed">Designing a week around your biological foundations.</p>
      </div>
    );
  }

  const weeklyGoals = [
    { title: 'Sleep Anchor', progress: 85, target: '8h Daily' },
    { title: 'Growth Sessions', progress: 66, target: '3x Weekly' },
    { title: 'Domestic Flow', progress: 100, target: 'Batched Wed' }
  ];

  const todayBlocks = (plan?.blocks?.filter(b => b.day === 'Monday') || [
    { category: 'Foundation', title: 'Sleep Anchor', start_time: '23:00' },
    { category: 'Focus', title: 'Deep Work', start_time: '09:00' },
    { category: 'Growth', title: 'Guitar Practice', start_time: '18:00' }
  ]).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#2C3333] pb-32">
      {/* Premium Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-[#F9F7F2]/80 backdrop-blur-xl z-50 border-b border-[#8DA399]/10">
        <div className="max-w-xl mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#8DA399] flex items-center justify-center text-white font-serif font-bold">e</div>
            <span className="font-serif font-semibold text-lg tracking-tight">Ebb</span>
          </div>
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
            <div className="w-5 h-0.5 bg-[#2C3333] mb-1"></div>
            <div className="w-3 h-0.5 bg-[#2C3333] ml-auto mr-2.5"></div>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-24 space-y-10">
        {view === 'dashboard' && (
          <div className="space-y-10 animate-fade-in">
            {/* Score Component */}
            <section className="text-center pt-4">
              <div className="relative inline-block mb-6">
                <svg className="w-52 h-52 transform -rotate-90">
                  <circle cx="104" cy="104" r="94" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#8DA399]/10" />
                  <motion.circle 
                    cx="104" cy="104" r="94" stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={590.6}
                    initial={{ strokeDashoffset: 590.6 }}
                    animate={{ strokeDashoffset: 590.6 - (590.6 * score) / 100 }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className="text-[#8DA399]"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-6xl font-serif font-bold">{score}</motion.span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reset Score</span>
                </div>
              </div>
              <h2 className="text-2xl font-serif font-semibold italic">Intentional Balance</h2>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                You protected your sleep 6/7 nights. Guitar sessions are at 100% adherence.
              </p>
            </section>

            {/* Stolen Time Tracker */}
            <section className="bg-[#D9B8A9]/10 p-6 rounded-[32px] border border-[#D9B8A9]/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-[#D9B8A9]">Stolen Time</h3>
                <span className="text-2xl font-serif font-bold">{stolenTime}h</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-[#D9B8A9]" />
              </div>
              <p className="text-xs text-[#D9B8A9] font-medium mt-3 italic">Primarily lost to evening social feeds during your Digital Sunset window.</p>
            </section>

            {/* Upcoming Sequence */}
            <section className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <h3 className="text-xl font-serif font-semibold italic">Today's Sequence</h3>
                <button onClick={() => setView('proposal')} className="text-[10px] font-bold uppercase tracking-widest text-[#8DA399]">View Full Plan</button>
              </div>
              <div className="space-y-3">
                {todayBlocks.map((block, i) => (
                  <div key={i} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex items-center justify-between group hover:border-[#8DA399]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${block.category === 'Foundation' ? 'bg-[#8DA399]/10 text-[#8DA399]' : 'bg-gray-50 text-gray-400'}`}>
                         <div className="w-2 h-2 rounded-full bg-current"></div>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">{block.category}</span>
                        <h4 className="font-bold text-base">{block.title}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-500">{block.start_time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Weekly Goals */}
            <section className="space-y-4">
               <h3 className="text-xl font-serif font-semibold italic px-1">Weekly Integrity</h3>
               <div className="grid grid-cols-2 gap-4">
                  {weeklyGoals.map((goal, i) => (
                    <div key={i} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex flex-col gap-4">
                      <div>
                        <h4 className="font-bold text-sm mb-1">{goal.title}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{goal.target}</span>
                      </div>
                      <div className="flex items-end justify-between">
                         <span className="text-xl font-serif font-bold text-[#8DA399]">{goal.progress}%</span>
                         <div className="w-12 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                           <div className="h-full bg-[#8DA399]" style={{ width: `${goal.progress}%` }}></div>
                         </div>
                      </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        )}

        {view === 'proposal' && (
          <div className="relative animate-fade-in min-h-[600px]">
            {/* Blurred Plan Peeking State */}
            <div className="absolute inset-0 z-10 backdrop-blur-md bg-[#F9F7F2]/40 rounded-[40px] flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-white max-w-sm">
                <div className="w-16 h-16 bg-[#8DA399]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[#8DA399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-2xl font-serif font-bold mb-3">Unlock Your 11 Hours</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">Your custom Reset Plan is ready. Become a Founding Member to sync your non-negotiables.</p>
                <a href="https://buy.stripe.com/test_4gM3cu0UU3jk3XedAn1ZS2s" className="block w-full py-4 bg-[#2C3333] text-white rounded-full font-bold shadow-xl hover:bg-black transition-all">
                  Join Batch 11
                </a>
              </div>
            </div>

            {/* Background Content (Visible but blurred) */}
            <div className="opacity-40 pointer-events-none">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold italic">Your Next 7 Days</h2>
                <p className="text-slate-400">Redesigned for Sustainability</p>
              </div>
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-24 bg-white rounded-[32px] border border-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-8 left-6 right-6 max-w-xl mx-auto z-50">
        <div className="bg-[#2C3333]/90 backdrop-blur-2xl p-2.5 rounded-full flex items-center justify-between shadow-2xl border border-white/5">
          <button onClick={() => setView('dashboard')} className={`flex-1 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-[#8DA399] text-white' : 'text-slate-400 hover:text-white'}`}>Dash</button>
          <button onClick={() => setView('proposal')} className={`flex-1 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'proposal' ? 'bg-[#8DA399] text-white' : 'text-slate-400 hover:text-white'}`}>Plan</button>
          <button className="flex-1 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all">Setup</button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
