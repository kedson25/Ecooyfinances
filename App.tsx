
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { AuthView, UserProfile, ToastMessage } from './types';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import Dashboard from './components/Dashboard';
import Toast from './components/Toast';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AuthView>(AuthView.LOGIN);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ecooy-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('ecooy-theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast("Até breve!", "success");
    } catch (error: any) {
      addToast(error.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Ecooy Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {user ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          addToast={addToast} 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
      ) : (
        <>
          {currentView === AuthView.LOGIN && (
            <LoginForm 
              setView={setCurrentView} 
              addToast={addToast}
            />
          )}
          {currentView === AuthView.SIGNUP && (
            <SignUpForm 
              setView={setCurrentView} 
              addToast={addToast}
            />
          )}
          {currentView === AuthView.FORGOT_PASSWORD && (
            <div className="min-h-screen flex items-center justify-center p-4">
               <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
                  <h2 className="text-2xl font-bold mb-4 dark:text-white">Recuperar Senha</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Enviaremos um link de recuperação para o seu e-mail.</p>
                  <input 
                    type="email" 
                    id="reset-email"
                    placeholder="Seu e-mail"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                  />
                  <button 
                    onClick={async () => {
                      const email = (document.getElementById('reset-email') as HTMLInputElement).value;
                      if (!email) return addToast("E-mail é obrigatório", "error");
                      try {
                        await sendPasswordResetEmail(auth, email);
                        addToast("E-mail de recuperação enviado!", "success");
                        setCurrentView(AuthView.LOGIN);
                      } catch(e: any) { addToast(e.message, "error"); }
                    }}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    Enviar Link
                  </button>
                  <button 
                    onClick={() => setCurrentView(AuthView.LOGIN)}
                    className="w-full mt-4 text-slate-500 dark:text-slate-400 font-medium hover:text-indigo-600 transition-colors"
                  >
                    Voltar para Login
                  </button>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
