import React, { useState } from 'react';
import { Lock, Sparkles, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Incorrect password.');
        return;
      }
      onLoginSuccess();
    } catch (err: any) {
      setError('Could not reach the server. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex items-center justify-center font-sans antialiased p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F27D26]/10 border border-[#F27D26]/30 text-[#F27D26] flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-serif italic text-white tracking-tight">Projects Creative OS</h1>
            <p className="text-xs text-white/50 mt-1">Enter the password to unlock your workspace.</p>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-2.5 text-sm text-white focus:outline-hidden focus:border-[#F27D26]"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !password}
          className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
};
