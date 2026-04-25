const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || { motion: { div: ({children, ...props}) => <div {...props}>{children}</div>, section: ({children, ...props}) => <section {...props}>{children}</div>, h1: ({children, ...props}) => <h1 {...props}>{children}</div>, p: ({children, ...props}) => <p {...props}>{children}</div> }, AnimatePresence: ({children}) => <>{children}</> };

// Import simulated service (in production this would be an API call to our backend)
const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

const Navbar = () => (
  <nav className="flex items-center justify-between py-6 px-6 max-w-7xl mx-auto">
    <div className="flex items-center gap-3">
      <img src="images/minimalist-professional-logo-for-ebb-ab.png" alt="Ebb Logo" className="h-10 w-auto" />
      <span className="text-2xl font-semibold font-serif tracking-tight">Ebb</span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
      <a href="#how-it-works" className="hover:text-ebb-sage transition-colors">How it works</a>
      <a href="#privacy" className="hover:text-ebb-sage transition-colors">Privacy</a>
      <a href="#login" className="px-5 py-2 rounded-full border border-ebb-sage text-ebb-sage hover:bg-ebb-sage hover:text-white transition-all">Sign In</a>
    </div>
  </nav>
);

const Hero = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, auth_ready, completed

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('https://baget.ai/api/public/databases/60ddf56f-99da-4c0e-9667-5a61d524747e/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            email: email,
            source: 'landing_page_hero',
            name: ''
          }
        })
      });
      if (response.ok) {
        setStatus('auth_ready');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  const handleConnect = async () => {
    setStatus('loading');
    // Simulated Google OAuth Flow
    setTimeout(async () => {
      const mockData = {
        user_id: `google_${Math.random().toString(36).substr(2, 9)}`,
        email: email,
        access_token: 'ya29.v_mock_access_token',
        refresh_token: '1//mock_refresh_token',
        expiry_date: Date.now() + 3600000,
        reset_calendar_id: `ebb_reset_${Math.random().toString(36).substr(2, 9)}`,
        sync_status: 'active'
      };

      try {
        await fetch(`https://baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: mockData })
        });
        setStatus('completed');
      } catch (e) {
        setStatus('error');
      }
    }, 2000);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="z-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold leading-[1.1] mb-8 text-ebb-slate">
            Stop reacting to your schedule. <br />
            <span className="italic text-ebb-sage">Start living your life.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-lg leading-relaxed">
            Ebb is the AI Life Assistant that resets your calendar around what matters most: sleep, recovery, and your own intentions.
          </p>
          
          <div className="max-w-md">
            {status === 'completed' ? (
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-[32px] border border-ebb-sage shadow-xl shadow-ebb-sage/10 space-y-4">
                <div className="h-12 w-12 bg-ebb-sage/20 rounded-full flex items-center justify-center text-ebb-sage mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-center">Calendar Connected</h3>
                <p className="text-center text-slate-500">We've created your "Reset Plan" calendar. Check your email for the next steps in your Life Design journey.</p>
                <button className="w-full py-4 bg-ebb-slate text-white rounded-full font-semibold hover:bg-black transition-all">Go to Dashboard</button>
              </div>
            ) : status === 'auth_ready' ? (
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[32px] border border-ebb-sage/30 shadow-lg space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-semibold">Step 2: The Connection</h3>
                  <p className="text-slate-500">To design your week, Ebb needs to see your current commitments. We only create events in a new, separate calendar.</p>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={status === 'loading'}
                  className="w-full py-5 bg-white border border-slate-200 rounded-full flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-sm font-medium text-lg disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
                  {status === 'loading' ? 'Initializing...' : 'Connect Google Calendar'}
                </button>
                <p className="text-xs text-center text-slate-400 px-4">Secure OAuth 2.0. No password sharing. Ebb defaults to a read-only view of your primary calendar.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-6 pr-44 py-5 bg-white rounded-full border-none shadow-xl shadow-ebb-sage/5 focus:ring-2 focus:ring-ebb-sage outline-none text-lg transition-all"
                />
                <button
                  disabled={status === 'loading'}
                  className="absolute right-2 top-2 bottom-2 px-8 bg-ebb-sage text-white rounded-full font-semibold text-lg hover:bg-ebb-slate transition-all disabled:opacity-50"
                >
                  {status === 'loading' ? 'Joining...' : 'Reset My Week'}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="mt-4 text-red-500 text-sm px-4">Something went wrong. Please try again.</p>
            )}
            {status === 'idle' && (
              <p className="mt-4 text-slate-400 text-sm px-4">Join 2,400+ professionals designing their recovery.</p>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute -inset-10 bg-ebb-sage/10 blur-3xl rounded-full"></div>
          <img 
            src="images/a-person-in-a-serene-sunlit-minimalist-l.png" 
            alt="Serene morning light" 
            className="relative w-full rounded-3xl shadow-2xl z-10 object-cover aspect-[4/5] md:aspect-auto"
          />
        </div>
      </div>
    </section>
  );
};

const Problem = () => (
  <section className="bg-white py-24 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-serif font-semibold mb-6 text-ebb-slate">The Modern Friction</h2>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">Most calendars are built for meetings, not for humans. Ebb treats your life as the priority.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {[
          {
            title: "The Burnout Epidemic",
            desc: "Knowledge workers spend 40% of their week on low-value reactive tasks. We've lost the ability to design our own time.",
          },
          {
            title: "Stolen Time",
            desc: "We lose hours every week to doom-scrolling and schedule creep. Ebb helps you reclaim 10-15 hours of 'stolen time' weekly.",
          }
        ].map((item, i) => (
          <div key={i} className="p-10 rounded-3xl bg-ebb-cream/50 border border-ebb-cream hover:border-ebb-sage/20 transition-all">
            <h3 className="text-2xl font-serif font-semibold mb-4 text-ebb-slate">{item.title}</h3>
            <p className="text-lg text-slate-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 px-6">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-4xl font-serif font-semibold text-center mb-20 text-ebb-slate">The Calendar Reset</h2>
      <div className="grid md:grid-cols-3 gap-12">
        {[
          { step: "01", title: "Connect", desc: "Connect your Google Calendar. Ebb reads your existing commitments but never overwrites them without explicit confirmation." },
          { step: "02", title: "Design", desc: "Tell Ebb about your non-negotiables: sleep cycles, chores, deep interests, and downtime. AI designs your ideal week from scratch." },
          { step: "03", title: "Flow", desc: "Approve your new schedule. Ebb coaches you through the week via WhatsApp to keep your intentions alive." }
        ].map((item, i) => (
          <div key={i} className="relative">
            <div className="text-8xl font-serif text-ebb-sage/10 absolute -top-12 -left-4 font-bold">{item.step}</div>
            <div className="relative z-10">
              <h3 className="text-2xl font-serif font-semibold mb-4 text-ebb-slate">{item.title}</h3>
              <p className="text-lg text-slate-600">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Feature = () => (
  <section className="py-24 px-6 bg-[#F3F1ED]">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <div className="order-2 md:order-1">
        <img 
          src="images/high-fidelity-mobile-web-app-mockup-of-a.png" 
          alt="WhatsApp AI Assistant" 
          className="w-full rounded-[40px] shadow-xl"
        />
      </div>
      <div className="order-1 md:order-2">
        <h2 className="text-4xl font-serif font-semibold mb-8 text-ebb-slate">WhatsApp-First Coaching</h2>
        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
          No more complex dashboards or notification fatigue. Ebb lives in your messages, sending daily plans and solving schedule conflicts via short, canned multiple-choice texts.
        </p>
        <ul className="space-y-4">
          {["Daily morning rundowns", "Weekly reflection audits", "Conflict resolution via text", "Stolen time alerts"].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-lg font-medium text-ebb-slate">
              <div className="h-2 w-2 rounded-full bg-ebb-sage"></div>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

const Privacy = () => (
  <section id="privacy" className="py-24 px-6 border-t border-ebb-sage/10">
    <div className="max-w-3xl mx-auto text-center">
      <div className="inline-block p-3 rounded-2xl bg-ebb-sage/10 mb-8 text-ebb-sage">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
      </div>
      <h2 className="text-4xl font-serif font-semibold mb-6 text-ebb-slate">Privacy as a Foundation</h2>
      <p className="text-xl text-slate-600 leading-relaxed">
        Your schedule is your life. Ebb reads events to understand your context but defaults to a separate "Reset Plan" calendar. We never overwrite or delete your events without explicit confirmation.
      </p>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 px-6 bg-ebb-cream">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-ebb-sage/20 pt-12">
      <div className="flex items-center gap-3 grayscale opacity-70">
        <img src="images/minimalist-professional-logo-for-ebb-ab.png" alt="Ebb Logo" className="h-8" />
        <span className="text-xl font-serif font-semibold">Ebb</span>
      </div>
      <p className="text-slate-400 text-sm">© 2026 Ebb Life Design. Designed for human sustainability.</p>
      <div className="flex gap-8 text-sm font-medium text-slate-500">
        <a href="#privacy" className="hover:text-ebb-sage">Privacy</a>
        <a href="#" className="hover:text-ebb-sage">Terms</a>
        <a href="mailto:asaltzman0@gmail.com" className="hover:text-ebb-sage">Contact</a>
      </div>
    </div>
  </footer>
);

const App = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Feature />
      <Privacy />
      <Footer />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
