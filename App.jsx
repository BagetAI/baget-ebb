const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || {
  motion: {
    div: ({children, ...props}) => <div {...props}>{children}</div>,
    span: ({children, ...props}) => <span {...props}>{children}</span>,
    button: ({children, ...props}) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({children}) => <>{children}</>
};

const EBB_SAGE = '#8DA399';
const EBB_CREAM = '#F9F7F2';
const EBB_SLATE = '#2C3333';
const EBB_ROSE = '#D9B8A9';

const ResetCalculator = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    sleep: 5,
    work: 5,
    interests: 5,
    screen: 5,
    reactive: 5
  });
  const [showResult, setShowResult] = useState(false);
  const [email, setEmail] = useState('');

  const questions = [
    { key: 'sleep', label: 'How many hours of deep sleep are you actually getting?', min: 4, max: 9, unit: 'hrs' },
    { key: 'work', label: 'How many hours a week does work "bleed" into your life?', min: 0, max: 20, unit: 'hrs' },
    { key: 'interests', label: 'How many hours did you spend on personal interests last week?', min: 0, max: 10, unit: 'hrs' },
    { key: 'screen', label: 'Daily average of "junk" screen time (scrolling)?', min: 0, max: 6, unit: 'hrs' },
    { key: 'reactive', label: 'Percentage of your day spent reacting to others?', min: 0, max: 100, unit: '%' }
  ];

  const calculateScore = () => {
    const s = (answers.sleep / 9) * 40;
    const w = (1 - (answers.work / 20)) * 25;
    const i = (answers.interests / 10) * 20;
    const sc = (1 - (answers.screen / 6)) * 10;
    const r = (1 - (answers.reactive / 100)) * 5;
    return Math.round(s + w + i + sc + r);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Logic to save to Waitlist Signups (60ddf56f-99da-4c0e-9667-5a61d524747e)
    window.location.href = 'https://buy.stripe.com/test_4gM3cu0UU3jk3XedAn1ZS2s';
  };

  return (
    <div id="calculator" className="max-w-2xl mx-auto bg-white p-8 rounded-[32px] shadow-2xl border border-gray-100">
      {!showResult ? (
        <div>
          <div className="mb-8">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#8DA399]"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#2C3333] mb-6">{questions[step].label}</h3>
          <div className="flex flex-col gap-6">
            <input 
              type="range" 
              min={questions[step].min} 
              max={questions[step].max} 
              value={answers[questions[step].key]}
              onChange={(e) => setAnswers({...answers, [questions[step].key]: parseInt(e.target.value)})}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#8DA399]"
            />
            <div className="text-4xl font-light text-[#8DA399] self-center">
              {answers[questions[step].key]} {questions[step].unit}
            </div>
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="px-6 py-2 text-gray-400 font-medium disabled:opacity-0"
              >
                Back
              </button>
              {step < questions.length - 1 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="bg-[#2C3333] text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-all"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={() => setShowResult(true)}
                  className="bg-[#8DA399] text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all"
                >
                  Calculate Score
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mb-6 inline-block p-6 rounded-full bg-red-50 text-red-600 font-black text-6xl">
            {calculateScore()}
          </div>
          <h2 className="text-3xl font-bold text-[#2C3333] mb-4">Your Reset Score is Critical</h2>
          <p className="text-gray-600 mb-8 text-lg">
            You are losing approximately <strong>11.4 hours per week</strong> to reactive schedule creep and digital leakage. This is unsustainable.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="Enter your email to unlock your Reset Plan" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-6 py-4 rounded-full border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-[#8DA399]"
            />
            <button 
              type="submit"
              className="bg-[#2C3333] text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-black shadow-lg hover:shadow-xl transition-all"
            >
              Take Back Control — $9/mo
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-400">Join 100+ senior professionals in the Batch 7 Reset.</p>
        </motion.div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-[#F9F7F2] font-['Inter'] selection:bg-[#8DA399] selection:text-white">
      {/* High-Impact Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-[#D9B8A9] text-[#2C3333] text-sm font-bold tracking-widest uppercase">
              Urgency: 11 Hours Lost Weekly
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-[#2C3333] leading-[1.05] mb-8">
              Stop Reacting to <span className="text-[#8DA399]">Life.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-lg">
              Ebb is the AI assistant that reclaims your time from "Calendar Creep." We redesign your week around sleep, recovery, and what actually matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#calculator" className="bg-[#2C3333] text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-black transition-all shadow-xl text-center">
                Start My Reset
              </a>
              <div className="flex items-center gap-3 px-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-[#F9F7F2] bg-gray-300" />)}
                </div>
                <span className="text-sm font-medium text-gray-500">Trusted by 450+ Tech Leaders</span>
              </div>
            </div>
          </motion.div>
          <div className="relative">
             <img src="images/high-contrast-editorial-photography-of-a.png" alt="Chaos vs Calm" className="rounded-[40px] shadow-2xl" />
             <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[32px] shadow-xl max-w-xs hidden md:block border border-gray-100">
                <p className="text-[#2C3333] font-bold text-lg mb-1 italic">"Ebb recovered 14 hours of my week that I didn't even know I'd lost."</p>
                <span className="text-[#8DA399] font-bold">— VP Eng, Batch 6</span>
             </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="bg-white py-32 px-4 border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#2C3333] mb-6">Quantify the Leakage.</h2>
          <p className="text-xl text-gray-500">Take the 60-second audit to calculate your Reset Score and identify your Time Thieves.</p>
        </div>
        <ResetCalculator />
      </section>

      {/* The 3-Step Reclaim */}
      <section className="py-32 px-4 max-w-6xl mx-auto">
        <h2 className="text-center text-4xl md:text-5xl font-serif font-bold text-[#2C3333] mb-20">How We Take It Back.</h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { step: '01', title: 'Foundation Lock', desc: 'We anchor your week in an 8-hour sleep window. No work blocks permitted. No exceptions.' },
            { step: '02', title: 'Stolen Time Audit', desc: 'AI identifies doom-scrolling and reactive load, reallocating those hours to your interests.' },
            { step: '03', title: 'WhatsApp Coaching', desc: 'No dashboards. Just daily canned morning plans and conflict alerts in your pocket.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-soft hover:shadow-xl transition-all">
              <span className="text-5xl font-serif font-bold text-[#D9B8A9] opacity-30 block mb-6">{item.step}</span>
              <h3 className="text-2xl font-bold text-[#2C3333] mb-4">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed text-lg">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value Prop with Image */}
      <section className="py-32 px-4 bg-[#F9F7F2]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <img src="images/close-up-shot-of-a-premium-smartphone-he.png" alt="Reset Score UI" className="rounded-[40px] shadow-2xl" />
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#2C3333] mb-8 leading-tight">Your life isn't a task list. Stop treating it like one.</h2>
            <p className="text-xl text-gray-600 mb-8">Ebb is the "Anti-App." We don't want you in a dashboard. We want you living your life. We send your plan via WhatsApp, you reply with a number to accept or adjust. That's it.</p>
            <ul className="space-y-4">
              {['8-Hour Sleep Foundation Locked', 'Domestic Chores Batched', 'Growth Interests Protected'].map(t => (
                <li key={t} className="flex items-center gap-3 text-lg font-bold text-[#2C3333]">
                  <div className="w-6 h-6 rounded-full bg-[#8DA399] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#2C3333] py-32 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-white mb-8">Reclaim Your Monday.</h2>
          <p className="text-xl text-gray-400 mb-12">Join the next cohort. Batch 7 closes in 48 hours.</p>
          <button onClick={() => window.location.href='#calculator'} className="bg-[#8DA399] text-white px-12 py-6 rounded-full font-bold text-2xl hover:scale-105 transition-all shadow-2xl">
            Join Founding Members — $9/mo
          </button>
          <div className="mt-12 flex justify-center gap-12 text-gray-500 font-medium">
            <span>Google Login</span>
            <span>WhatsApp Sync</span>
            <span>Cancel Anytime</span>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 text-center text-gray-400 text-sm border-t border-gray-100">
        &copy; 2026 Ebb Life Assistant. Built for Human Sustainability.
      </footer>
    </div>
  );
};

window.App = App;
