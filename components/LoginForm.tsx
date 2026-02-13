
import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AuthView } from '../types';
import AuthLayout from './AuthLayout';
import { motion } from 'framer-motion';

interface LoginFormProps {
  setView: (view: AuthView) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ setView, addToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Por favor, preencha todos os campos", "error");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      try {
        await updateDoc(doc(db, "finances", userCredential.user.uid), {
          lastLogin: serverTimestamp()
        });
      } catch (e) {
        console.warn("Documento de perfil não encontrado.");
      }
      addToast("Bem-vindo de volta!", "success");
    } catch (error: any) {
      addToast("E-mail ou senha incorretos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      addToast("Acesso via Google realizado!", "success");
    } catch (error: any) {
      addToast("Erro ao entrar com Google", "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium";
  const labelClasses = "block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1";

  return (
    <AuthLayout title="Acesso Seguro" subtitle="Gerencie sua vida financeira com sofisticação">
      <div className="space-y-6">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-sm text-sm uppercase tracking-wide group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
          Continuar com Google
        </motion.button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
            <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 dark:text-slate-500">ou e-mail</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className={labelClasses} htmlFor="email">E-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <i className="fa-solid fa-envelope text-sm"></i>
              </span>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className={inputClasses}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className={labelClasses} htmlFor="password">Senha</label>
              <button
                type="button"
                onClick={() => setView(AuthView.FORGOT_PASSWORD)}
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-wider"
              >
                Esqueceu?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <i className="fa-solid fa-lock text-sm"></i>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={inputClasses}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Entrar"
            )}
          </motion.button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-500 dark:text-slate-500 font-bold">
            Novo por aqui?{' '}
            <button
              onClick={() => setView(AuthView.SIGNUP)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-black transition-colors underline underline-offset-4 decoration-2 decoration-indigo-100 dark:decoration-indigo-900"
            >
              Criar Conta
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginForm;
