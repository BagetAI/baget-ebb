const { useState } = React;
const { motion } = window.Motion || {
  motion: {
    div: ({children, ...props}) => <div {...props}>{children}</div>,
    h1: ({children, ...props}) => <h1 {...props}>{children}</h1>,
    p: ({children, ...props}) => <p {...props}>{children}</p>,
    button: ({children, ...props}) => <button {...props}>{children}</button>
  }
};

const Login = () => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() })
      });

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response (Status ${response.status})`);
      }

      if (response.ok && data.success) {
        localStorage.setItem('ebb_beta_authorized', 'true');
        // Redirect to onboarding or dashboard
        window.location.href = '/onboarding.html';
      } else {
        setError(data.error || 'Access denied. Please check your code.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(`Connection error: ${err.message}. Please check your internet or contact support.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-['Inter'] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8DA399]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#D9B8A9]/10 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white p-10 md:p-12 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-white/20 text-center">
          <div className="mb-10">
            <img 
              src="images/minimalist-professional-logo-for-ebb-ab.png" 
              alt="Ebb Logo" 
              className="h-10 mx-auto mb-6 opacity-90"
            />
            <h1 className="text-3xl font-serif font-bold text-[#2C3333] mb-3 italic">Private Access</h1>
            <p className="text-slate-500 leading-relaxed">
              Welcome to the Ebb Private Beta. Please enter your unique access code for Batch 13.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Enter Access Code" 
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-8 py-5 rounded-full border border-slate-100 bg-[#F9F7F2]/50 text-lg text-center focus:outline-none focus:ring-2 focus:ring-[#8DA399] transition-all placeholder:text-slate-300"
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-500 text-sm font-medium bg-rose-50 p-4 rounded-2xl"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C3333] text-white py-5 rounded-full font-bold text-lg hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                'Unlock My Reset'
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50">
            <p className="text-xs text-slate-300 uppercase tracking-widest font-bold">
              Founding Member Cohort / 2026
            </p>
          </div>
        </div>

        {/* Side Image Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-12 hidden md:block"
        >
          <div className="bg-white/50 backdrop-blur-md p-4 rounded-[40px] border border-white shadow-sm overflow-hidden">
             <img 
               src="images/a-serene-and-premium-login-screen-backgr.png" 
               alt="App Preview" 
               className="rounded-[32px] w-full h-auto object-cover opacity-80"
             />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

window.Login = Login;
