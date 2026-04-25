const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || { motion: { div: ({children, ...props}) => <div {...props}>{children}</div> }, AnimatePresence: ({children}) => <>{children}</> };

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';

const steps = [
  { id: 'whatsapp', title: 'The Connection', subtitle: 'How should Ebb reach out?' },
  { id: 'foundations', title: 'Biological Foundations', subtitle: 'Resetting your sleep and wake cycles.' },
  { id: 'occupation', title: 'Work & Commute', subtitle: 'Defining the boundaries of your career.' },
  { id: 'domestic', title: 'Domestic Life', subtitle: 'Managing chores and errands intentionally.' },
  { id: 'recovery', title: 'Recovery & Social', subtitle: 'Making space for rest and connection.' },
  { id: 'growth', title: 'Interests & Screen Time', subtitle: 'Reclaiming time for what matters.' }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp: '',
    wake_time: '07:00',
    sleep_time: '23:00',
    work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    work_hours: '9-5',
    commute_minutes: 30,
    chore_hours_weekly: 5,
    downtime_hours: 10,
    social_hours: 5,
    interests: '',
    screen_time_avg_minutes: 180,
    screen_time_breakdown: ''
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      submitData();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const submitData = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, we would get the user_id from the session/OAuth state
      const userId = localStorage.getItem('ebb_user_id') || `user_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch(`https://baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            user_id: userId,
            ...formData,
            work_days: JSON.stringify(formData.work_days),
            interests: formData.interests,
            screen_time_breakdown: formData.screen_time_breakdown
          }
        })
      });

      if (response.ok) {
        window.location.href = '/dashboard.html'; // We'll assume dashboard exists or just redirect
      } else {
        alert('Failed to save profile. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-6">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white z-50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-ebb-sage shadow-[0_0_10px_rgba(141,163,153,0.5)]"
        />
      </div>

      <div className="max-w-xl w-full">
        <div className="mb-12 text-center">
          <img src="images/minimalist-professional-logo-for-ebb-ab.png" alt="Ebb" className="h-10 mx-auto mb-8 opacity-80" />
          <h1 className="text-3xl font-serif font-semibold mb-2">{steps[currentStep].title}</h1>
          <p className="text-slate-500">{steps[currentStep].subtitle}</p>
        </div>

        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-ebb-sage/5 border border-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">WhatsApp Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      className="w-full py-4 px-0 text-2xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none transition-all placeholder:text-slate-200"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    />
                    <p className="text-sm text-slate-400 mt-2 italic">Ebb uses WhatsApp for your daily rundowns and conflict resolution.</p>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Wake Up</label>
                      <input 
                        type="time" 
                        className="w-full py-4 text-3xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none"
                        value={formData.wake_time}
                        onChange={(e) => setFormData({...formData, wake_time: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Sleep</label>
                      <input 
                        type="time" 
                        className="w-full py-4 text-3xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none"
                        value={formData.sleep_time}
                        onChange={(e) => setFormData({...formData, sleep_time: e.target.value})}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 italic">Ebb protects these hours first. Everything else flows around your recovery.</p>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Work Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <button 
                          key={day}
                          onClick={() => {
                            const days = formData.work_days.includes(day) 
                              ? formData.work_days.filter(d => d !== day)
                              : [...formData.work_days, day];
                            setFormData({...formData, work_days: days});
                          }}
                          className={`px-4 py-2 rounded-full border transition-all ${formData.work_days.includes(day) ? 'bg-ebb-sage text-white border-ebb-sage' : 'border-slate-200 text-slate-500'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Typical Hours</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 9:00 AM - 5:30 PM"
                      className="w-full py-4 text-xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none transition-all"
                      value={formData.work_hours}
                      onChange={(e) => setFormData({...formData, work_hours: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Commute (Minutes)</label>
                    <input 
                      type="number" 
                      className="w-full py-4 text-xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none transition-all"
                      value={formData.commute_minutes}
                      onChange={(e) => setFormData({...formData, commute_minutes: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Weekly Chore Hours</label>
                    <input 
                      type="number" 
                      className="w-full py-4 text-3xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none"
                      value={formData.chore_hours_weekly}
                      onChange={(e) => setFormData({...formData, chore_hours_weekly: parseInt(e.target.value)})}
                    />
                    <p className="text-sm text-slate-400 mt-2 italic">Cooking, cleaning, laundry, and errands. Ebb will block these out so they don't eat your weekend.</p>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Downtime (Hours/Week)</label>
                      <input 
                        type="number" 
                        className="w-full py-4 text-2xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none"
                        value={formData.downtime_hours}
                        onChange={(e) => setFormData({...formData, downtime_hours: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Social (Hours/Week)</label>
                      <input 
                        type="number" 
                        className="w-full py-4 text-2xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none"
                        value={formData.social_hours}
                        onChange={(e) => setFormData({...formData, social_hours: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Personal Interests</label>
                    <textarea 
                      placeholder="What brings you joy? (e.g. Guitar, Reading, Painting)"
                      className="w-full py-4 text-xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none min-h-[100px] resize-none"
                      value={formData.interests}
                      onChange={(e) => setFormData({...formData, interests: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Daily Screen Time (Minutes)</label>
                    <input 
                      type="number" 
                      className="w-full py-4 text-2xl font-serif border-b-2 border-slate-100 focus:border-ebb-sage outline-none"
                      value={formData.screen_time_avg_minutes}
                      onChange={(e) => setFormData({...formData, screen_time_avg_minutes: parseInt(e.target.value)})}
                    />
                    <p className="text-sm text-slate-400 italic">Be honest. Ebb helps you trade doom-scrolling for depth.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-50">
            <button 
              onClick={handleBack}
              className={`text-slate-400 font-medium hover:text-ebb-slate transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
            >
              Back
            </button>
            <button 
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-10 py-4 bg-ebb-sage text-white rounded-full font-semibold hover:bg-ebb-slate transition-all shadow-xl shadow-ebb-sage/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Designing...' : currentStep === steps.length - 1 ? 'Design My Week' : 'Next Step'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</p>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Onboarding />);
