const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || { motion: { div: ({children, ...props}) => <div {...props}>{children}</div>, section: ({children, ...props}) => <section {...props}>{children}</section>, h1: ({children, ...props}) => <h1 {...props}>{children}</h1>, p: ({children, ...props}) => <p {...props}>{children}</p>, span: ({children, ...props}) => <span {...props}>{children}</span> }, AnimatePresence: ({children}) => <>{children}</> };

const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';
const WAITLIST_DB = '60ddf56f-99da-4c0e-9667-5a61d524747e';

const STRIPE_MONTHLY = 'https://buy.stripe.com/test_5kQ3cu6fecTUgK0aob1ZS1Y';
const STRIPE_LIFETIME = 'https://buy.stripe.com/test_14AbJ0avug66alCeEr1ZS1Z';

const Navbar = () => (
  <nav className="flex items-center justify-between py-6 px-6 max-w-7xl mx-auto">
    <div className="flex items-center gap-3">
      <img src="images/minimalist-professional-logo-for-ebb-ab.png" alt="Ebb Logo" className="h-10 w-auto" />
      <span className="text-2xl font-semibold font-serif tracking-tight text-ebb-slate">Ebb</span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
      <a href="#calculator" className="hover:text-ebb-sage transition-colors">Reset Score</a>
      <a href="#how-it-works" className="hover:text-ebb-sage transition-colors">How it works</a>
      <a href="#privacy" className="hover:text-ebb-sage transition-colors">Privacy</a>
      <a href="/onboarding.html" className="px-5 py-2 rounded-full border border-ebb-sage text-ebb-sage hover:bg-ebb-sage hover:text-white transition-all">Sign In</a>
    </div>
  </nav>
);

const ResetCalculator = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    sleep: 7,
    work: 50,
    interests: 4,
    screen: 240,
    reactive: 70
  });
  const [score, setScore] = useState(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, calculated, paying, success

  const questions = [
    {
      id: 'sleep',
      label: 'How many hours of sleep do you get on average?',
      min: 4,
      max: 12,
      suffix: 'hours',
      desc: 'Foundational recovery begins with biological consistency.'
    },
    {
      id: 'work',
      label: 'How many hours a week do you work?',
      min: 20,
      max: 80,
      suffix: 'hours',
      desc: 'Tech and Legal leaders often drift into 60+ hour cycles.'
    },
    {
      id: 'interests',
      label: 'Weekly hours for personal interests?',
      min: 0,
      max: 20,
      suffix: 'hours',
      desc: 'Guitar, reading, or slow hobbies often become "Stolen Time".'
    },
    {
      id: 'screen',
      label: 'Daily phone screen time?',
      min: 30,
      max: 600,
      suffix: 'min',
      desc: 'Doom-scrolling is a primary thief of recovery.'
    },
    {
      id: 'reactive',
      label: 'What % of your day feels "reactive"?',
      min: 0,
      max: 100,
      suffix: '%',
      desc: 'The feeling of being a passenger in your own calendar.'
    }
  ];

  const calculateScore = () => {
    let s = 100;
    // Sleep Penalty (8 is target)
    s -= Math.abs(8 - answers.sleep) * 7;
    // Work Penalty (40 is standard)
    if (answers.work > 45) s -= (answers.work - 45) * 2;
    // Interests Bonus/Penalty (10 is target)
    if (answers.interests < 8) s -= (8 - answers.interests) * 4;
    // Screen Time Penalty (120 is max healthy)
    if (answers.screen > 150) s -= (answers.screen - 150) / 8;
    // Reactive Penalty
    s -= (answers.reactive / 1.5);

    const final = Math.max(0, Math.min(100, Math.round(s)));
    setScore(final);
    setStep(questions.length);
    setStatus('calculated');
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      calculateScore();
    }
  };

  const handleUnlock = async (tier) => {
    if (!email) {
      alert("Please provide an email to save your audit results.");
      return;
    }
    
    setStatus('paying');
    try {
      // Save lead first
      await fetch(`https://baget.ai/api/public/databases/${WAITLIST_DB}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            email,
            source: 'reset_calculator_paid',
            name: `Score: ${score} | Tier: ${tier}`
          }
        })
      });
      
      // Redirect to Stripe
      window.location.href = tier === 'monthly' ? STRIPE_MONTHLY : STRIPE_LIFETIME;
    } catch (err) {
      setStatus('calculated');
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <section id="calculator" className="py-24 px-6 bg-[#FAF9F6] overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ebb-sage mb-4 block">Behavioral Audit</span>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6 text-ebb-slate">What is your Reset Score?</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Quantify the "Stolen Time" in your week and see if your schedule is humanly sustainable.
          </p>
        </div>

        <div className="bg-white rounded-[48px] p-8 md:p-16 border border-ebb-cream shadow-2xl shadow-ebb-sage/5 relative">
          <AnimatePresence mode="wait">
            {step < questions.length ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="h-px w-8 bg-ebb-sage"></span>
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-ebb-sage">Audit Step {step + 1} of 5</span>
                  </div>
                  <h3 className="text-3xl font-serif font-semibold text-ebb-slate leading-tight">
                    {questions[step].label}
                  </h3>
                  <p className="text-slate-500 italic text-lg">{questions[step].desc}</p>
                </div>

                <div className="space-y-10">
                  <div className="flex items-center justify-center py-8">
                    <span className="text-7xl md:text-8xl font-serif font-semibold text-ebb-slate">
                      {answers[questions[step].id]}
                      <span className="text-2xl ml-3 text-ebb-sage font-sans font-bold">{questions[step].suffix}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={questions[step].min}
                    max={questions[step].max}
                    value={answers[questions[step].id]}
                    onChange={(e) => setAnswers({ ...answers, [questions[step].id]: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-ebb-sage"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                    <span>{questions[step].min}{questions[step].suffix}</span>
                    <span>{questions[step].max}{questions[step].suffix}</span>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button
                    onClick={handleNext}
                    className="px-16 py-6 bg-ebb-slate text-white rounded-full font-bold text-lg hover:bg-ebb-sage transition-all shadow-xl shadow-ebb-slate/20 hover:scale-105 active:scale-95"
                  >
                    {step === questions.length - 1 ? 'Calculate My Score' : 'Next Step'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-12"
              >
                <div className="relative inline-block">
                  <svg className="w-72 h-72 transform -rotate-90">
                    <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-ebb-sage/5" />
                    <motion.circle 
                      cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="6" fill="transparent" 
                      strokeDasharray={816.8}
                      initial={{ strokeDashoffset: 816.8 }}
                      animate={{ strokeDashoffset: 816.8 - (816.8 * score) / 100 }}
                      transition={{ duration: 2.5, ease: "circOut" }}
                      className="text-ebb-sage" 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-9xl font-serif font-semibold tracking-tighter text-ebb-slate">{score}</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-400">Final Score</span>
                  </div>
                </div>

                <div className="space-y-6 max-w-lg mx-auto">
                  <h3 className="text-3xl font-serif font-semibold text-ebb-slate italic">
                    {score > 80 ? "Your life design is strong." : score > 50 ? "You are drifting toward burnout." : "Your schedule is critical."}
                  </h3>
                  <p className="text-lg text-slate-500 leading-relaxed">
                    {score > 80 
                      ? "You've protected your sleep foundations, but we identified 4 hours of 'Stolen Time' every week during your recovery windows." 
                      : "Calendar creep has consumed your week. You are losing an average of 11 hours to reactive noise and 'digital leakage'."}
                  </p>
                </div>

                <div className="bg-[#FAF9F6] p-8 md:p-12 rounded-[40px] border border-ebb-cream space-y-10">
                   <div className="space-y-4">
                      <h4 className="text-xl font-serif font-semibold text-ebb-slate">Apply your Reset Button</h4>
                      <p className="text-slate-500">Become a Founding Member to unlock your full audit and trigger the AI Life Design engine to redesign your upcoming week.</p>
                   </div>
                   
                   <div className="space-y-4 max-w-md mx-auto">
                      <input
                        type="email"
                        placeholder="Your professional email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-8 py-5 bg-white rounded-full border border-slate-100 shadow-sm focus:ring-2 focus:ring-ebb-sage outline-none text-lg transition-all"
                      />
                   </div>

                   <div className="grid md:grid-cols-2 gap-6 pt-4">
                      <button 
                        onClick={() => handleUnlock('monthly')}
                        disabled={status === 'paying'}
                        className="p-8 bg-white border border-ebb-sage/20 rounded-[32px] hover:border-ebb-sage transition-all text-left group shadow-lg shadow-ebb-sage/5"
                      >
                         <span className="text-[10px] font-bold uppercase tracking-widest text-ebb-sage mb-2 block">Monthly Reset</span>
                         <h5 className="text-2xl font-serif font-semibold mb-2">$9<span className="text-sm font-sans text-slate-400">/mo</span></h5>
                         <p className="text-xs text-slate-400 mb-6 group-hover:text-ebb-slate transition-colors">Locked-in early adopter rate. Full AI Reset Plan + WhatsApp Coaching.</p>
                         <div className="flex items-center gap-2 text-ebb-sage font-bold text-xs uppercase tracking-widest">
                            <span>Get Started</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleUnlock('lifetime')}
                        disabled={status === 'paying'}
                        className="p-8 bg-ebb-slate rounded-[32px] hover:bg-ebb-sage transition-all text-left group shadow-xl shadow-ebb-slate/20"
                      >
                         <span className="text-[10px] font-bold uppercase tracking-widest text-ebb-sage/60 mb-2 block">Lifetime Peace</span>
                         <h5 className="text-2xl font-serif font-semibold mb-2 text-white">$299</h5>
                         <p className="text-xs text-white/60 mb-6 group-hover:text-white transition-colors">One-time payment. Never pay again. Founding Member status + Priority feedback.</p>
                         <div className="flex items-center gap-2 text-ebb-sage font-bold text-xs uppercase tracking-widest">
                            <span>Join Lifetime</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                         </div>
                      </button>
                   </div>
                   
                   <p className="text-[10px] text-slate-300 uppercase tracking-widest">Secure checkout via Stripe. Cancel anytime.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="z-10">
          <div className="inline-block px-4 py-2 bg-ebb-sage/10 rounded-full text-ebb-sage text-xs font-bold uppercase tracking-widest mb-8">
            Cohort 1 Open: April 2026
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold leading-[1.05] mb-8 text-ebb-slate">
            Take back control of <br />
            <span className="italic text-ebb-sage">your Sunday nights.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-lg leading-relaxed">
            Stop reacting to your schedule and start living your week. Ebb is the AI life assistant that redesigns your calendar around sleep, recovery, and intentions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="#calculator" 
              className="px-12 py-6 bg-ebb-slate text-white rounded-full font-bold text-lg hover:bg-ebb-sage transition-all shadow-2xl shadow-ebb-slate/20 text-center"
            >
              Start My Reset
            </a>
            <a 
              href="#how-it-works" 
              className="px-12 py-6 bg-white border border-ebb-sage/20 text-ebb-slate rounded-full font-bold text-lg hover:border-ebb-sage transition-all text-center"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-8 text-sm text-slate-400 italic">Trusted by senior professionals in Tech, Law, and Finance.</p>
        </div>
        
        <div className="relative">
          <div className="absolute -inset-10 bg-ebb-sage/10 blur-3xl rounded-full animate-pulse"></div>
          <img 
            src="images/a-person-in-a-serene-sunlit-minimalist-l.png" 
            alt="Serene morning light" 
            className="relative w-full rounded-[48px] shadow-2xl z-10 object-cover aspect-[4/5] md:aspect-auto border-[12px] border-white"
          />
          <div className="absolute -bottom-6 -left-6 bg-white p-8 rounded-[32px] shadow-2xl z-20 border border-ebb-cream hidden md:block max-w-[240px]">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-ebb-sage animate-ping"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Optimization</span>
             </div>
             <p className="text-sm font-serif font-semibold text-ebb-slate leading-snug">"Digital Sunset at 21:30 to resolve Monday fatigue."</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Problem = () => (
  <section className="bg-ebb-slate py-32 px-6 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-96 h-96 bg-ebb-sage/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="grid md:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <span className="text-ebb-sage text-xs font-bold uppercase tracking-[0.4em]">The Friction</span>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-white leading-tight">Your calendar is built for others. Ebb is built for you.</h2>
          <p className="text-xl text-white/60 leading-relaxed">
            Traditional calendars treat your time as a resource for meeting requests. Ebb treats your sleep, chores, and interests as the primary anchors of a sustainable life.
          </p>
          <div className="space-y-6 pt-4">
            {[
              { label: "11 Hours", desc: "Average time stolen weekly from recovery to reactive noise." },
              { label: "40%", desc: "Of professionals report burnout due to schedule creep." }
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-6 group">
                <div className="text-3xl font-serif font-semibold text-ebb-sage group-hover:scale-110 transition-transform">{stat.label}</div>
                <p className="text-sm text-white/40 max-w-[200px]">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[
            { title: "The Manager's Schedule", desc: "Back-to-back meetings that force 'deep work' into your sleep window.", role: "Tech Leaders" },
            { title: "The Billable Anchor", desc: "Every chore feels like a loss of potential. Domestic labor becomes a burden.", role: "Legal Elite" },
            { title: "The Always-On Culture", desc: "Global markets never sleep, but your biological foundations must.", role: "Finance Core" }
          ].map((card, i) => (
            <div key={i} className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ebb-sage/60 mb-2 block">{card.role}</span>
              <h3 className="text-2xl font-serif font-semibold mb-4 text-white italic">{card.title}</h3>
              <p className="text-white/60 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-32 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-24">
         <span className="text-ebb-sage text-xs font-bold uppercase tracking-[0.4em] mb-4 block">The Methodology</span>
         <h2 className="text-4xl font-serif font-semibold text-ebb-slate">Redesign your week in 15 minutes.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-16">
        {[
          { 
            step: "01", 
            title: "Audit", 
            desc: "Calculate your Reset Score to identify where time is being stolen from your biological foundations." 
          },
          { 
            step: "02", 
            title: "Design", 
            desc: "The AI Life Design engine builds a weekly calendar that locks sleep, batches chores, and protects recovery." 
          },
          { 
            step: "03", 
            title: "Protect", 
            desc: "Sync to your 'Reset Plan' calendar and receive daily rundown nudges via WhatsApp to stay in flow." 
          }
        ].map((item, i) => (
          <div key={i} className="relative space-y-8 text-center group">
            <div className="text-8xl font-serif text-ebb-sage/10 absolute -top-16 left-1/2 -translate-x-1/2 font-bold group-hover:text-ebb-sage/20 transition-all">{item.step}</div>
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl border border-ebb-cream relative z-10">
               <div className="h-12 w-12 bg-ebb-sage/10 rounded-full flex items-center justify-center text-ebb-sage font-bold font-serif">{i + 1}</div>
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-serif font-semibold text-ebb-slate">{item.title}</h3>
              <p className="text-lg text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Feature = () => (
  <section className="py-32 px-6 bg-[#FAF9F6] border-y border-ebb-sage/10">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
      <div className="order-2 md:order-1 relative">
        <div className="absolute inset-0 bg-ebb-sage/5 blur-3xl rounded-full"></div>
        <img 
          src="images/high-fidelity-mobile-web-app-mockup-of-a.png" 
          alt="WhatsApp AI Assistant" 
          className="relative w-full rounded-[48px] shadow-2xl border-[10px] border-white"
        />
        <div className="absolute top-1/2 -right-8 bg-white p-6 rounded-[32px] shadow-2xl border border-ebb-cream max-w-[200px] -translate-y-1/2 hidden lg:block">
           <p className="text-[10px] font-bold uppercase tracking-widest text-ebb-sage mb-2">WhatsApp Coach</p>
           <p className="text-xs font-medium text-ebb-slate">"I see some stolen time. Put the phone down?"</p>
        </div>
      </div>
      <div className="order-1 md:order-2 space-y-10">
        <div className="space-y-6">
           <span className="text-ebb-sage text-xs font-bold uppercase tracking-[0.4em]">The Interface</span>
           <h2 className="text-4xl md:text-5xl font-serif font-semibold leading-tight text-ebb-slate italic">Zero-Friction Coaching.</h2>
           <p className="text-xl text-slate-600 leading-relaxed">
             No more app fatigue. Ebb lives in your messages, sending morning sequences and resolving conflicts via short multiple-choice texts.
           </p>
        </div>
        <ul className="space-y-6">
          {[
            "Daily Morning Sequence at 07:30",
            "Weekly Reset Score Reflection",
            "Canned Multiple-Choice Conflict Solving",
            "Stolen Time leakage alerts"
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-lg font-medium text-ebb-slate group">
              <div className="h-3 w-3 rounded-full bg-ebb-sage transition-all group-hover:scale-150 shadow-sm shadow-ebb-sage/50"></div>
              {item}
            </li>
          ))}
        </ul>
        <div className="pt-8">
           <a href="#calculator" className="inline-flex items-center gap-3 text-ebb-sage font-bold uppercase tracking-widest hover:gap-5 transition-all">
              Start your Reset Audit
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
           </a>
        </div>
      </div>
    </div>
  </section>
);

const Privacy = () => (
  <section id="privacy" className="py-32 px-6">
    <div className="max-w-4xl mx-auto text-center space-y-10">
      <div className="inline-block p-5 rounded-3xl bg-ebb-sage/10 text-ebb-sage shadow-inner shadow-ebb-sage/5">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
      </div>
      <h2 className="text-4xl font-serif font-semibold text-ebb-slate">Privacy as a Foundational Non-Negotiable.</h2>
      <p className="text-2xl text-slate-500 leading-relaxed font-serif italic max-w-2xl mx-auto">
        "Ebb reads events to understand your context, but only ever writes to your dedicated 'Reset Plan' calendar."
      </p>
      <div className="grid md:grid-cols-3 gap-8 pt-8">
         {[
            { title: "Isolated Data", desc: "Separate calendar for all proposed life blocks." },
            { title: "Explicit Consent", desc: "No auto-overwriting. You approve every shift." },
            { title: "No Selling", desc: "We never monetize your behavioral data." }
         ].map((item, i) => (
            <div key={i} className="p-6 text-left">
               <h4 className="font-bold text-xs uppercase tracking-widest text-ebb-sage mb-2">{item.title}</h4>
               <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
         ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-20 px-6 bg-ebb-cream">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b border-ebb-sage/20 pb-12 mb-12">
        <div className="space-y-6 max-w-xs">
          <div className="flex items-center gap-3">
            <img src="images/minimalist-professional-logo-for-ebb-ab.png" alt="Ebb Logo" className="h-8 grayscale brightness-50" />
            <span className="text-2xl font-serif font-semibold text-ebb-slate">Ebb</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed font-serif italic">Designing for human sustainability through intentional life design.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
          <div className="space-y-4">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</h4>
             <ul className="space-y-2 text-sm text-slate-600 font-medium">
                <li><a href="#calculator" className="hover:text-ebb-sage transition-colors">Reset Score</a></li>
                <li><a href="/onboarding.html" className="hover:text-ebb-sage transition-colors">Onboarding</a></li>
                <li><a href="/dashboard.html" className="hover:text-ebb-sage transition-colors">Dashboard</a></li>
             </ul>
          </div>
          <div className="space-y-4">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Company</h4>
             <ul className="space-y-2 text-sm text-slate-600 font-medium">
                <li><a href="#privacy" className="hover:text-ebb-sage transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-ebb-sage transition-colors">Terms</a></li>
                <li><a href="mailto:asaltzman0@gmail.com" className="hover:text-ebb-sage transition-colors">Contact</a></li>
             </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2026 Ebb Life Design. All Rights Reserved.</p>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Batch 5 Foundational Beta</p>
      </div>
    </div>
  </footer>
);

const App = () => {
  return (
    <div className="min-h-screen selection:bg-ebb-sage/20">
      <Navbar />
      <Hero />
      <ResetCalculator />
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
