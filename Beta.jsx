const { useState, useEffect } = React;
const { motion } = window.Motion;

const Beta = () => {
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const testUserId = 'user_founder_test';

  const setupTestAccount = async () => {
    setLoading(true);
    setStatus('Initializing test data...');
    try {
      const res = await fetch('/api/beta/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ebb_user_id', testUserId);
        setStatus('Test Account Ready: user_founder_test');
      } else {
        setStatus('Setup failed.');
      }
    } catch (err) {
      setStatus('Error calling setup API.');
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold text-ebb-slate italic">Beta Sandbox</h1>
          <p className="text-slate-500">Staging environment for Ebb Life Assistant testing.</p>
        </div>
        <div className="px-4 py-2 bg-ebb-sage/10 text-ebb-sage rounded-full font-bold text-sm">
          Status: {status}
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Step 1: Identity */}
        <section className="ebb-card space-y-4">
          <h2 className="text-xl font-bold font-serif italic">1. Setup Environment</h2>
          <p className="text-sm text-slate-500">Initialize the databases with a pre-configured test account that bypasses Stripe.</p>
          <button 
            onClick={setupTestAccount}
            disabled={loading}
            className="w-full py-4 bg-ebb-slate text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            Setup Test Environment
          </button>
          <div className="flex gap-4">
            <a href="/onboarding.html" className="flex-1 text-center py-3 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50">Onboarding Flow</a>
            <a href="/dashboard.html" className="flex-1 text-center py-3 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50">User Dashboard</a>
          </div>
        </section>

        {/* Step 2: AI Logic Testing */}
        <section className="ebb-card space-y-4">
          <h2 className="text-xl font-bold font-serif italic">2. AI Life Audit</h2>
          <p className="text-sm text-slate-500">Run the Preference Matching engine to categorize events and identify 'Stolen Time'.</p>
          <button 
            onClick={triggerMatchPreferences}
            disabled={loading}
            className="w-full py-4 bg-ebb-sage text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            Run Preference Matching
          </button>
          
          {matchResult && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm space-y-2 max-h-60 overflow-y-auto">
              <p className="font-bold text-ebb-rose">Stolen Time: {matchResult.stolen_time_minutes} mins</p>
              <div className="space-y-1">
                {matchResult.conflicts.map((c, i) => (
                  <div key={i} className="p-2 bg-white rounded border border-ebb-rose/20">
                    <span className="font-bold">{c.event_title}</span>: {c.preference_violated}
                    <p className="text-xs text-slate-400 mt-1">{c.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 3: Outbound Testing */}
        <section className="ebb-card space-y-4">
          <h2 className="text-xl font-bold font-serif italic">3. Outbound WhatsApp</h2>
          <p className="text-sm text-slate-500">Manually trigger automated messages that the AI normally sends based on the Reset Plan.</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={triggerRundown} className="p-4 bg-ebb-sage/10 text-ebb-sage rounded-xl font-bold border border-ebb-sage/20 hover:bg-ebb-sage/20 transition-all">Send Rundown</button>
            <button onClick={triggerConflict} className="p-4 bg-ebb-sage/10 text-ebb-sage rounded-xl font-bold border border-ebb-sage/20 hover:bg-ebb-sage/20 transition-all">Send Conflict</button>
          </div>
        </section>

        {/* Step 4: Interaction Testing */}
        <section className="ebb-card space-y-4 md:col-span-2">
          <h2 className="text-xl font-bold font-serif italic">4. Conversational Handshake</h2>
          <p className="text-sm text-slate-500">Simulate incoming replies from the user to test the webhook and Google Calendar sync logic.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={() => simulateReply('1')} className="p-4 border rounded-xl hover:bg-slate-50 transition-all font-bold">Reply "1" (Accept)</button>
            <button onClick={() => simulateReply('2')} className="p-4 border rounded-xl hover:bg-slate-50 transition-all font-bold">Reply "2" (Adjust)</button>
            <button onClick={() => simulateReply("i'm running 30 mins late")} className="p-4 border rounded-xl hover:bg-slate-50 transition-all font-bold">Reply "I'm running late"</button>
          </div>
        </section>
      </div>

      <footer className="text-center text-slate-400 text-xs py-12">
        Ebb Staging / May 2, 2026 / Internal Use Only
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Beta />);
