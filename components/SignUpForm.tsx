
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthView } from '../types';
import AuthLayout from './AuthLayout';
import { motion } from 'framer-motion';

interface SignUpFormProps {
  setView: (view: AuthView) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ setView, addToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast("Por favor, preencha todos os campos", "error");
      return;
    }
    if (password !== confirmPassword) {
      addToast("As senhas não coincidem", "error");
      return;
    }
    if (password.length < 6) {
      addToast("A senha deve ter pelo menos 6 caracteres", "error");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "finances", user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        preferences: {
          currency: 'BRL',
          theme: 'light'
        }
      });

      addToast("Conta criada com sucesso!", "success");
    } catch (error: any) {
      addToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600";
  const labelClasses = "block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1";

  return (
    <AuthLayout title="Criar Conta" subtitle="Junte-se à revolução financeira do Ecooy">
      <form onSubmit={handleSignUp} className="space-y-5">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className={labelClasses} htmlFor="name">Nome Completo</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <i className="fa-solid fa-signature text-sm"></i>
            </span>
            <input
              id="name"
              type="text"
              placeholder="Ex: João Silva"
              className={inputClasses}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <label className={labelClasses} htmlFor="email">E-mail Profissional</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <label className={labelClasses} htmlFor="password">Senha</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <i className="fa-solid fa-lock text-sm"></i>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
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
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <label className={labelClasses} htmlFor="confirm">Confirmar</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <i className="fa-solid fa-lock text-sm"></i>
              </span>
              <input
                id="confirm"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••"
                className={inputClasses}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Criar Conta Grátis
              <i className="fa-solid fa-arrow-right-long text-xs"></i>
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-500 font-bold">
          Já faz parte do time?{' '}
          <button
            onClick={() => setView(AuthView.LOGIN)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-black transition-colors underline underline-offset-4 decoration-2 decoration-indigo-200 dark:decoration-indigo-900"
          >
            Entrar Agora
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUpForm;
