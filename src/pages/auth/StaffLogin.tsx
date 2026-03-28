import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AnimatedBackground } from '../../components/AnimatedBackground';

const StaffLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && (!fullName || !passcode))) return;

    if (!isLogin && passcode !== 'ADMIN123') {
      setError('Invalid admin passcode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate('/staff');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'staff'
            }
          }
        });
        if (signUpError) throw signUpError;
        navigate('/staff');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="glass-panel p-8 border-primary/20">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
              <ShieldAlert size={24} />
            </div>
            <h1 className="text-2xl font-bold mb-1">Staff Portal</h1>
            <p className="text-textMuted text-sm">Authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Admin Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium border-l-2 border-primary pl-2 text-primary/90 mb-1 mt-2">Secret Passcode</label>
                  <input
                    type="password"
                    className="input-field bg-primary/5 focus:ring-primary"
                    placeholder="Ask IT for passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Staff Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2 disabled:opacity-50">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Secure Login' : 'Register Admin'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-textMuted pt-6 border-t border-white/10">
            {isLogin ? "Need a staff account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-primary hover:text-primaryDark font-medium transition-colors"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm">
          <Link to="/login" className="text-white/50 hover:text-white transition-colors flex items-center justify-center gap-2">
            ← Back to Student Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
