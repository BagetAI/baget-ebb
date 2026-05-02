const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || {
  motion: {
    div: ({children, ...props}) => <div {...props}>{children}</div>,
    span: ({children, ...props}) => <span {...props}>{children}</span>,
    button: ({children, ...props}) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({children}) => <>{children}</>
};

const Beta = () => {
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const testUserId = 'user_founder_test';

  const setupTestAccount = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setStatus('Verifying beta credentials...');
    try {
      const res = await fetch('/api/beta/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, accessCode: accessCode })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ebb_user_id', testUserId);
        setIsAuthorized(true);
        setStatus('Authorized: Private Beta Environment Ready');
      } else {
        setStatus(`Access Denied: ${data.error}`);
      }
    } catch (err) {
      setStatus('Error connecting to beta server.');
    }
    setLoading(false);
  };

  const triggerMatchPreferences = async () => {
    setLoading(true);
    setStatus('Running Preference Matching AI...');
    try {
      const res = await fetch('/api/plan/match-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId })
      });
      const data = await res.json();
      if (data.success) {
        setMatchResult(data.matchResult);
        setStatus('Analysis Complete. Conflicts identified.');
      } else {
        setStatus('Matching failed.');
      }
    } catch (err) {
      setStatus('Error running AI analysis.');
    }
    setLoading(false);
  };

  const triggerRundown = async () => {
    setStatus('Triggering Daily Rundown...');
    await fetch('/api/whatsapp/send-rundown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    setStatus('Daily Rundown Sent (Check Dashboard Logs)');
  };

  const triggerConflict = async () => {
    setStatus('Triggering Conflict Question...');
    await fetch('/api/whatsapp/conflict/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    setStatus('Conflict Message Sent (Check Dashboard Logs)');
  };

  const simulateReply = async (choice) => {
    setStatus(`Simulating reply: ${choice}...`);
    try {
      const res = await fetch('/api/beta/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, body: choice })
      });
      const data = await res.json();
      setStatus(`Assistant Replied: ${data.reply}`);
    } catch (err) {
      setStatus('Reply simulation failed.');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 text-center"
        >
          <div className="w-20 h-20 bg-[#8DA399]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-[#8DA399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2C3333] mb-4 italic">Private Beta Hub</h1>
          <p className="text-slate-500 mb-10 leading-relaxed">Please enter your beta access code to unlock the staging environment and bypass the paywall.</p>
          
          <form onSubmit={setupTestAccount} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Beta Access Code" 
              className="w-full px-6 py-4 rounded-full border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-[#8DA399] text-center"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#2C3333] text-white rounded-full font-bold text-lg hover:bg-black transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Unlock Beta Access'}
            </button>
          </form>
          
          {status !== 'Idle' && !status.includes('Authorized') && (
            <p className="mt-6 text-red-500 font-medium text-sm">{status}</p>
          )}
          
          <footer className="mt-12 text-slate-400 text-xs tracking-widest uppercase">
            Ebb Internal Staging / 2026
          </footer>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-[#2C3333] italic">Private Beta Hub</h1>
          <p className="text-slate-500">Staging environment for Ebb Life Assistant testing.</p>
        </div>
        <div className="px-6 py-2 bg-[#8DA399]/10 text-[#8DA399] rounded-full font-bold text-sm border border-[#8DA399]/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8DA399] animate-pulse"></span>
          {status}
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Environment Control */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <h2 className="text-xl font-bold font-serif italic">1. Environment Tools</h2>
          </div>
          <p className="text-sm text-slate-500">Jump directly to the user-facing interfaces with your test identity.</p>
          <div className="grid grid-cols-2 gap-4">
            <a href="/onboarding.html" className="text-center py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold hover:bg-slate-100 transition-all text-[#2C3333]">Onboarding Flow</a>
            <a href="/dashboard.html" className="text-center py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold hover:bg-slate-100 transition-all text-[#2C3333]">User Dashboard</a>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('ebb_user_id'); window.location.reload(); }}
            className="w-full py-4 text-slate-400 text-sm font-medium hover:text-red-500 transition-all"
          >
            Reset Test Identity
          </button>
        </section>

        {/* AI Analysis Testing */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-[#8DA399]/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#8DA399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h2 className="text-xl font-bold font-serif italic">2. AI Logic Simulation</h2>
          </div>
          <p className="text-sm text-slate-500">Run the Life Audit engine to simulate schedule analysis and stolen time identification.</p>
          <button 
            onClick={triggerMatchPreferences}
            disabled={loading}
            className="w-full py-4 bg-[#8DA399] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#8DA399]/20"
          >
            {loading ? 'Processing...' : 'Run Preference Matching AI'}
          </button>
          
          {matchResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-5 bg-[#D9B8A9]/5 rounded-2xl border border-[#D9B8A9]/20 text-sm space-y-3">
              <p className="font-bold text-[#D9B8A9] flex items-center justify-between">
                <span>Stolen Time Identified</span>
                <span className="text-lg">{matchResult.stolen_time_minutes}m</span>
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {matchResult.conflicts.map((c, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-gray-100">
                    <span className="font-bold block text-[#2C3333]">{c.event_title}</span>
                    <span className="text-[10px] text-[#D9B8A9] font-bold uppercase tracking-wider">{c.preference_violated}</span>
                    <p className="text-xs text-slate-400 mt-1">{c.suggestion}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* WhatsApp Simulation */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 md:col-span-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-[#8DA399]/10 rounded-xl flex items-center justify-center">
               <svg className="w-6 h-6 text-[#8DA399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h2 className="text-xl font-bold font-serif italic">3. Conversational Handshake</h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Assistant Outbound</h3>
              <div className="flex flex-col gap-3">
                <button onClick={triggerRundown} className="text-left p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                  <span className="block font-bold text-sm text-[#2C3333]">Send Morning Rundown</span>
                  <span className="text-[10px] text-slate-400">Summarizes today's blocks</span>
                </button>
                <button onClick={triggerConflict} className="text-left p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                  <span className="block font-bold text-sm text-[#2C3333]">Send Conflict Question</span>
                  <span className="text-[10px] text-slate-400">Simulates schedule overlap</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">User Responses (Simulated)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => simulateReply('1')} className="p-4 border-2 border-slate-100 rounded-2xl hover:border-[#8DA399] transition-all flex flex-col items-center">
                  <span className="text-2xl mb-1">1</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Accept / Reschedule</span>
                </button>
                <button onClick={() => simulateReply('2')} className="p-4 border-2 border-slate-100 rounded-2xl hover:border-[#8DA399] transition-all flex flex-col items-center">
                  <span className="text-2xl mb-1">2</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Chat / Adjust</span>
                </button>
                <button onClick={() => simulateReply("i'm running 30 mins late")} className="p-4 border-2 border-slate-100 rounded-2xl hover:border-[#8DA399] transition-all flex flex-col items-center sm:col-span-2">
                  <span className="text-sm font-bold text-[#2C3333]">"I'm running 30 mins late"</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Natural Language Shift</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="text-center text-slate-400 text-xs py-20 tracking-widest uppercase">
        Ebb Private Beta / May 2, 2026 / Internal Use Only
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Beta />);
