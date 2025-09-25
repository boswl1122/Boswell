import { useState, useEffect, ReactNode } from 'react';

interface AccessGateProps {
  children: ReactNode;
}

export default function AccessGate({ children }: AccessGateProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/check-auth');
      if (res.ok) {
        setIsAuthorized(true);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputCode }),
        credentials: 'same-origin'
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAuthorized(true);
        setError('');
      } else {
        setError('Invalid access code');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Authentication failed');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <p className="text-stone-400">Loading...</p>
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center p-4">
      <div className="bg-stone-900/90 backdrop-blur-sm border border-stone-700/50 shadow-xl p-8 rounded-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-stone-100 mb-6" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          Boswell Run Console
        </h1>
        <p className="text-stone-400 mb-6">Enter access code to continue</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="w-full p-4 rounded-lg bg-stone-800/90 border border-stone-600/50 text-stone-100 placeholder:text-stone-400"
            placeholder="Access code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            autoFocus
          />
          
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
          
          <button
            type="submit"
            className="w-full mt-4 px-6 py-3 rounded-lg text-white font-semibold transition-all"
            style={{ backgroundColor: 'hsl(35, 70%, 45%)' }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}