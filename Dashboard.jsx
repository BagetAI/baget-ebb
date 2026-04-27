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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planStatus, setPlanStatus] = useState('draft'); // draft, synced, modified
  const [logs, setLogs] = useState([]);
  const [score, setScore] = useState(0);
  const [view, setView] = useState('dashboard'); // dashboard, proposal, settings
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sendingRundown, setSendingRundown] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
        const existingPlans = plans.filter(p => p.user_id === userId);
        const latestPlanRow = existingPlans.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        if (latestPlanRow) {
          setPlan(JSON.parse(latestPlanRow.plan_json));
          setPlanStatus(latestPlanRow.status);
          setScore(82); 
        } else {
          handleGeneratePlan(userId);
        }

        // Fetch WhatsApp Logs
        const logResponse = await fetch(`https://baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`);
        const allLogs = await logResponse.json();
        setLogs(allLogs.filter(l => l.user_id === userId).reverse().slice(0, 3));
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
        setScore(Math.floor(Math.random() * 15) + 80);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptPlan = async () => {
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

  const handleModifyPlan = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setIsModifying(true);
    try {
      const userId = localStorage.getItem('ebb_user_id');
      const res = await fetch('/api/plan/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRequest: chatInput })
      });
      const updatedPlan = await res.json();
      if (updatedPlan.blocks) {
        setPlan(updatedPlan);
        setPlanStatus('modified');
        setChatInput('');
        alert('Plan adjusted based on your feedback.');
      }
    } catch (err) {
      alert('Failed to modify plan. Please try again.');
    } finally {
      setIsModifying(false);
    }
  };

  const handleSendTestRundown = async () => {
    setSendingRundown(true);
    try {
      const userId = localStorage.getItem('ebb_user_id');
      const res = await fetch('/api/whatsapp/send-rundown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        fetchData(); // Refresh logs
        alert('Test rundown sent to your WhatsApp number!');
      }
    } catch (err) {
      alert('Failed to send test rundown.');
    } finally {
      setSendingRundown(false);
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

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const groupedBlocks = plan?.blocks?.reduce((acc, block) => {
    if (!acc[block.day]) acc[block.day] = [];
    acc[block.day].push(block);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-ebb-cream text-ebb-slate pb-32">
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
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-24 space-y-12">
        {view === 'dashboard' && (
          <>
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

            {/* WhatsApp Coaching Log */}
            {logs.length > 0 && (
              <section className="space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Recent Coaching</h3>
                 <div className="bg-white rounded-3xl border border-ebb-sage/10 overflow-hidden">
                   {logs.map((log, i) => (
                     <div key={i} className={`p-4 text-sm border-b border-slate-50 last:border-0 ${log.direction === 'outbound' ? 'bg-slate-50/50' : ''}`}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase ${log.direction === 'outbound' ? 'text-ebb-sage' : 'text-ebb-rose'}`}>
                            {log.direction === 'outbound' ? 'Ebb Assistant' : 'You'}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-ebb-slate line-clamp-2">{log.body}</p>
                     </div>
                   ))}
                 </div>
              </section>
            )}

            {/* Calendar Reset Toggle */}
            <section className="bg-ebb-slate p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ebb-sage/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-xl font-serif font-semibold mb-1 italic">Reset Plan</h3>
                  <p className="text-ebb-sage/80 text-sm">{planStatus === 'synced' ? 'Synced to Google Calendar' : 'Pending Sync'}</p>
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
                  <p className="text-sm text-slate-300">Ebb is currently syncing <span className="text-white font-medium">{plan?.blocks?.length || 0} blocks</span> to your "Reset Plan" calendar.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setView('proposal')} className="flex-1 py-3 bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all">View Blocks</button>
                    <button 
                      disabled={sendingRundown}
                      onClick={handleSendTestRundown}
                      className="flex-1 py-3 bg-ebb-sage rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-ebb-sage/80 transition-all disabled:opacity-50"
                    >
                      {sendingRundown ? 'Sending...' : 'Test Rundown'}
                    </button>
                  </div>
                  {planStatus !== 'synced' && (
                    <button 
                      onClick={handleAcceptPlan}
                      disabled={isSyncing}
                      className="w-full py-4 bg-white text-ebb-slate rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-ebb-cream transition-all disabled:opacity-50"
                    >
                      {isSyncing ? 'Syncing to Google...' : 'Accept and Sync Plan'}
                    </button>
                  )}
                </motion.div>
              )}
            </section>

            {/* Today's Blocks */}
            <section className="space-y-5 pb-8">
              <div className="flex items-center justify-between pl-1">
                <h3 className="font-serif font-semibold text-xl">Today's Sequence</h3>
                <button onClick={() => setView('proposal')} className="text-xs font-bold text-ebb-sage uppercase tracking-widest hover:underline">Full Plan</button>
              </div>
              <div className="space-y-4">
                {(plan?.blocks?.filter(b => b.day === 'Monday') || []).slice(0, 3).map((block, i) => (
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

            {/* AI Adjustments Summary */}
            <div className="bg-white p-8 rounded-[40px] border border-ebb-sage/20 shadow-xl shadow-ebb-sage/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ebb-sage mb-4">Proposed Adjustments</h3>
              <ul className="space-y-3 mb-6">
                {plan?.key_adjustments?.map((adj, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600">
                    <span className="text-ebb-sage">●</span>
                    {adj}
                  </li>
                ))}
              </ul>
              {planStatus !== 'synced' ? (
                <button 
                  onClick={handleAcceptPlan}
                  disabled={isSyncing}
                  className="w-full py-5 bg-ebb-sage text-white rounded-3xl font-bold text-sm uppercase tracking-widest hover:bg-ebb-slate transition-all shadow-xl shadow-ebb-sage/20 disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing to Google Calendar...' : 'Accept and Sync Plan'}
                </button>
              ) : (
                <div className="w-full py-4 bg-ebb-sage/10 border border-ebb-sage/20 rounded-3xl text-ebb-sage text-center font-bold text-xs uppercase tracking-widest">
                  Plan Synced to Google Calendar
                </div>
              )}
            </div>

            {/* Chat Modification Interface */}
            <div className="bg-ebb-slate p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-4">
                  <h3 className="text-xl font-serif font-semibold italic">Chat with Ebb</h3>
                  <p className="text-ebb-sage/80 text-sm">Request changes to your blocks. I'll redesign the plan instantly.</p>
                  <form onSubmit={handleModifyPlan} className="relative mt-6">
                     <input 
                        type="text" 
                        placeholder="e.g. 'Shift sleep to 11pm'..."
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ebb-sage"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isModifying}
                     />
                     <button 
                        disabled={isModifying || !chatInput}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-ebb-sage text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ebb-sage/80 transition-all disabled:opacity-50"
                     >
                        {isModifying ? 'Updating...' : 'Adjust'}
                     </button>
                  </form>
               </div>
            </div>

            {/* Daily Blocks Grid */}
            <div className="space-y-10">
              {dayOrder.map(day => (
                <div key={day} className="space-y-4">
                  <h4 className="font-serif font-semibold text-xl pl-1">{day}</h4>
                  <div className="space-y-3">
                    {groupedBlocks[day]?.map((block, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-ebb-sage/10 flex justify-between items-center group">
                        <div className="flex gap-4 items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            block.category === 'Foundation' ? 'bg-ebb-sage' : 
                            block.category === 'Growth' ? 'bg-ebb-rose' : 
                            'bg-ebb-slate/20'
                          }`}></div>
                          <div>
                            <p className="text-sm font-semibold">{block.title}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{block.category}</p>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-400">{block.start_time} - {block.end_time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-semibold text-center italic">Settings</h2>
            <div className="bg-white rounded-[40px] border border-ebb-sage/10 p-2 overflow-hidden shadow-lg">
               <button onClick={() => setIsPaused(!isPaused)} className={`w-full p-6 rounded-[32px] flex items-center justify-between ${isPaused ? 'bg-ebb-sage text-white' : 'hover:bg-slate-50'}`}>
                 <span className="font-semibold text-lg">{isPaused ? 'Assistant Paused' : 'Assistant Active'}</span>
                 <span className="text-sm opacity-60">{isPaused ? 'Click to Resume' : 'Click to Pause'}</span>
               </button>
               <div className="p-6 space-y-6 border-t border-slate-50">
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Biological Anchor</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-serif">{profile?.wake_time} Wake Up</span>
                      <span className="text-lg font-serif">{profile?.sleep_time} Digital Sunset</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleSendTestRundown}
                    className="w-full py-4 bg-ebb-cream rounded-2xl text-ebb-sage font-bold text-xs uppercase tracking-widest hover:bg-ebb-sage/10 transition-all"
                  >
                    Test WhatsApp Rundown
                  </button>
               </div>
            </div>
            <div className="text-center">
              <button 
                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                className="text-red-400 text-sm font-medium hover:underline"
              >
                Sign Out & Disconnect
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
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
