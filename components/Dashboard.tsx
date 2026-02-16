
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Transaction, TransactionType, DashboardTab, Goal, Notification as AppNotification } from '../types';
import { formatCurrencyInput, parseCurrencyString } from '../utils/format';
import { notificationService } from '../services/notificationService';
import TransactionForm from './TransactionForm';
import Modal from './Modal';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, addToast, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [fullUserData, setFullUserData] = useState<UserProfile | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [goalCategoryType, setGoalCategoryType] = useState<'preset' | 'custom'>('preset');
  const [customGoalCategory, setCustomGoalCategory] = useState('');
  const [presetGoalChoice, setPresetGoalChoice] = useState('Geral');

  useEffect(() => {
    const timer = setTimeout(() => setIsSummaryLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const billingCycleStart = useMemo(() => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    if (now.getDate() < 30) { month -= 1; if (month < 0) { month = 11; year -= 1; } }
    return new Date(year, month, 30);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, "finances", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setFullUserData(userSnap.data() as UserProfile);
    };
    fetchUserData();
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        txs.push({ id: doc.id, ...data } as Transaction);
      });
      setTransactions(txs.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)));
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, "goals"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gs: Goal[] = [];
      snapshot.forEach((doc) => gs.push({ id: doc.id, ...doc.data() } as Goal));
      setGoals(gs);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const summary = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      const amt = Number(curr.amount) || 0;
      if (curr.type === 'income') { acc.income += amt; acc.balance += amt; }
      else { acc.expenses += amt; acc.balance -= amt; }
      return acc;
    }, { balance: 0, income: 0, expenses: 0 });
  }, [transactions]);

  const handleTransactionDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const confirmDelete = window.confirm("Deseja realmente excluir este registro permanentemente?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "transactions", id));
      addToast("Registro excluído com sucesso!", "success");
      if (isTxModalOpen) {
        setIsTxModalOpen(false);
        setEditingTransaction(null);
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
      addToast("Erro ao excluir registro no banco de dados.", "error");
    }
  };

  const handleTransactionSubmit = async (description: string, amount: number, type: TransactionType, category: string) => {
    try {
      if (editingTransaction) {
        await updateDoc(doc(db, "transactions", editingTransaction.id), {
          description, amount, type, category,
          date: new Date().toLocaleDateString('pt-BR'),
        });
        addToast("Transação atualizada!", "success");
      } else {
        await addDoc(collection(db, "transactions"), {
          uid: user.uid,
          description, amount, type, category,
          date: new Date().toLocaleDateString('pt-BR'),
          timestamp: serverTimestamp(),
        });
        addToast("Nova transação registrada!", "success");
      }
      setIsTxModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      addToast("Erro ao salvar transação.", "error");
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('goalName') as string;
    const targetAmount = parseCurrencyString(formData.get('goalTarget_display') as string);
    const deadline = formData.get('goalDeadline') as string;
    const finalCategory = goalCategoryType === 'custom' ? customGoalCategory : presetGoalChoice;
    try {
      if (editingGoal) {
        await updateDoc(doc(db, "goals", editingGoal.id), { name, category: finalCategory, targetAmount, deadline });
        addToast("Meta atualizada!", "success");
      } else {
        await addDoc(collection(db, "goals"), { uid: user.uid, name, category: finalCategory, targetAmount, deadline, currentAmount: 0, timestamp: serverTimestamp() });
        addToast("Nova meta criada!", "success");
      }
      setIsGoalModalOpen(false); setEditingGoal(null);
    } catch (error) { addToast("Erro ao salvar meta.", "error"); }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDeposit) return;
    const amount = parseCurrencyString(depositAmount);
    try {
      await updateDoc(doc(db, "goals", selectedGoalForDeposit.id), { currentAmount: Number(selectedGoalForDeposit.currentAmount) + amount });
      addToast("Aporte concluído!", "success");
      setIsDepositModalOpen(false); setDepositAmount('');
    } catch (e) { addToast("Erro no aporte.", "error"); }
  };

  const maskValue = (value: number | string) => {
    if (showBalances) return typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
    return '***';
  };

  const containerVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="min-h-screen flex flex-col pb-32 transition-colors duration-300">
      <header className="glass sticky top-0 z-40 px-4 sm:px-8 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-white"><i className="fa-solid fa-leaf text-xl"></i></div>
          <div>
            <h2 className="font-extrabold text-xl text-slate-800 dark:text-slate-100 leading-none">Ecooy</h2>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user.displayName || 'Bem-vindo'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
           <button onClick={() => setShowBalances(!showBalances)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><i className={`fa-solid ${showBalances ? 'fa-eye' : 'fa-eye-slash'}`}></i></button>
           <button onClick={toggleTheme} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i></button>
           <button onClick={onLogout} className="w-10 h-10 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"><i className="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-8 sm:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Patrimônio Atual</p>
                  <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-10 flex items-baseline gap-2">
                    <span className="text-2xl font-bold opacity-50">R$</span>
                    {isSummaryLoading ? <span className="inline-block h-12 w-48 bg-white/20 animate-pulse rounded-2xl" /> : maskValue(summary.balance)}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Entradas</p><p className="text-xl font-black truncate">R$ {maskValue(summary.income)}</p></div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-[9px] font-black uppercase tracking-widest text-rose-300 mb-1">Saídas</p><p className="text-xl font-black truncate">R$ {maskValue(summary.expenses)}</p></div>
                  </div>
                </div>
              </motion.div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Recentes</h3><button onClick={() => setActiveTab('transactions')} className="text-indigo-600 font-black text-xs uppercase tracking-widest">Ver tudo</button></div>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} onClick={() => { setEditingTransaction(tx); setIsTxModalOpen(true); }} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-slate-100 group">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><i className={`fa-solid ${tx.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-tight">{tx.description}</p>
                            <p className={`font-black text-sm mt-1 mb-0.5 ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>R$ {maskValue(tx.amount)}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{tx.category}</p>
                          </div>
                        </div>
                        <button onClick={(e) => handleTransactionDelete(tx.id, e)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all shrink-0 z-10"><i className="fa-solid fa-trash-can text-sm"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Metas Ativas</h3><button onClick={() => setActiveTab('goals')} className="text-indigo-600 font-black text-xs uppercase tracking-widest">Ver tudo</button></div>
                  <div className="space-y-6">
                    {goals.slice(0, 3).map(goal => {
                      const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                      return (
                        <div key={goal.id} className="space-y-3 cursor-pointer group" onClick={() => { setSelectedGoalForDeposit(goal); setIsDepositModalOpen(true); }}>
                           <div className="flex justify-between items-end"><span className="text-sm font-black text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{goal.name}</span><span className="text-[10px] font-black text-indigo-600">{progress.toFixed(0)}%</span></div>
                           <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, progress)}%` }} className="h-full bg-indigo-600 rounded-full" /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div key="transactions" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 px-4">
                <div><h1 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-slate-100">Fluxo de Caixa</h1><p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Histórico completo de movimentações</p></div>
                <button onClick={() => { setEditingTransaction(null); setIsTxModalOpen(true); }} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-sm shadow-2xl hover:bg-indigo-700 transition-all active:scale-95">+ REGISTRAR</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-0">
                {transactions.map(tx => (
                  <div key={tx.id} onClick={() => { setEditingTransaction(tx); setIsTxModalOpen(true); }} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:border-indigo-200 transition-all group">
                    <div className="flex items-center gap-5 flex-1 overflow-hidden">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}><i className={`fa-solid ${tx.type === 'income' ? 'fa-plus' : 'fa-minus'}`}></i></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-lg leading-tight text-slate-700 dark:text-slate-200 break-words">{tx.description}</p>
                        <p className={`font-black text-xl leading-none mt-2 mb-1.5 ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>R$ {maskValue(tx.amount)}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.category} • {tx.date}</p>
                      </div>
                    </div>
                    <button onClick={(e) => handleTransactionDelete(tx.id, e)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all shrink-0 ml-2 z-10"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div key="goals" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12">
              <div className="px-4"><h1 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-slate-100">Meus Sonhos</h1><p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Construa o seu futuro</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                 {goals.map(goal => {
                    const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                    return (
                      <div key={goal.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                         <div className="flex justify-between items-start">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600"><i className="fa-solid fa-bullseye text-xl"></i></div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-pen text-xs"></i></button>
                              <button onClick={() => { if(window.confirm("Deseja realmente excluir esta meta?")) deleteDoc(doc(db, "goals", goal.id)) }} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
                            </div>
                         </div>
                         <div><h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{goal.name}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{goal.category}</p></div>
                         <div className="space-y-3">
                            <div className="flex justify-between text-[11px] font-black uppercase text-slate-600 dark:text-slate-300"><span>Acumulado: R$ {maskValue(goal.currentAmount)}</span><span className="text-indigo-600">{progress.toFixed(0)}%</span></div>
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, progress)}%` }} className="h-full bg-indigo-600 rounded-full" /></div>
                            <div className="flex justify-between items-center"><p className="text-[10px] font-bold text-slate-400">Meta: R$ {maskValue(goal.targetAmount)}</p>{goal.deadline && <p className="text-[10px] font-bold text-rose-500">Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>}</div>
                         </div>
                         <button onClick={() => { setSelectedGoalForDeposit(goal); setIsDepositModalOpen(true); }} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg hover:bg-indigo-700 transition-all">Aportar Agora</button>
                      </div>
                    )
                 })}
                 <button onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }} className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all"><i className="fa-solid fa-plus text-3xl"></i><span className="font-black text-xs uppercase tracking-widest">Novo Objetivo</span></button>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="max-w-xl mx-auto space-y-12">
               <div className="flex flex-col items-center py-6">
                  <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl shadow-2xl mb-6"><i className="fa-solid fa-user"></i></div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-slate-100">{user.displayName || 'Perfil'}</h1>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">{user.email}</p>
               </div>
               <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const salary = parseCurrencyString(fd.get('salary_display') as string); const salaryDay = parseInt(fd.get('salaryDay') as string); updateDoc(doc(db, "finances", user.uid), { salary, salaryDay }); addToast("Perfil atualizado!", "success"); }} className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salário Estimado</label><input name="salary_display" defaultValue={fullUserData?.salary ? formatCurrencyInput((fullUserData.salary * 100).toString()) : ''} onChange={(e) => e.target.value = formatCurrencyInput(e.target.value)} placeholder="R$ 0,00" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl font-black text-xl dark:text-white outline-none focus:border-indigo-500 transition-all" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia do Recebimento</label><input name="salaryDay" type="number" min="1" max="31" defaultValue={fullUserData?.salaryDay || 5} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl font-black text-xl dark:text-white outline-none focus:border-indigo-500 transition-all" /></div>
                  <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl uppercase tracking-widest text-sm active:scale-95 transition-all">Salvar Configurações</button>
               </form>
               <button onClick={onLogout} className="w-full py-6 bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-rose-100 transition-colors">Sair da Conta</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass w-[94%] max-w-xl rounded-[3rem] p-3 shadow-2xl border border-white/20">
        <div className="flex justify-around items-center">
          {[{ id: 'overview', icon: 'fa-house', label: 'Início' }, { id: 'transactions', icon: 'fa-receipt', label: 'Extrato' }, { id: 'goals', icon: 'fa-bullseye', label: 'Metas' }, { id: 'profile', icon: 'fa-user', label: 'Perfil' }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as DashboardTab)} className={`relative flex flex-col items-center gap-1.5 px-6 py-4 rounded-full transition-all duration-300 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              {activeTab === item.id && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-lg -z-10" />}
              <i className={`fa-solid ${item.icon} text-xl`}></i>
              <span className="text-[9px] font-black uppercase tracking-widest hidden xs:block">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Modal isOpen={isTxModalOpen} onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }} title={editingTransaction ? "Editar Registro" : "Nova Movimentação"}>
        <TransactionForm onAdd={handleTransactionSubmit} initialData={editingTransaction || undefined} />
        {editingTransaction && (
          <button 
            type="button"
            onClick={(e) => handleTransactionDelete(editingTransaction.id, e)} 
            className="w-full mt-4 py-4 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all"
          >
            Excluir Registro Permanente
          </button>
        )}
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }} title={editingGoal ? "Editar Objetivo" : "Novo Sonho"}>
        <form onSubmit={handleGoalSubmit} className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label><input name="goalName" required defaultValue={editingGoal?.name} placeholder="Ex: Viagem de Férias" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta Financeira (R$)</label><input name="goalTarget_display" required defaultValue={editingGoal?.targetAmount ? formatCurrencyInput((editingGoal.targetAmount * 100).toString()) : ''} placeholder="0,00" onChange={(e) => e.target.value = formatCurrencyInput(e.target.value)} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Estimada</label><input name="goalDeadline" type="date" defaultValue={editingGoal?.deadline} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" /></div>
          </div>
          <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl uppercase tracking-widest text-sm shadow-xl hover:bg-indigo-700 transition-all">Salvar Sonho</button>
        </form>
      </Modal>

      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Aportar Valor">
        <form onSubmit={handleDeposit} className="space-y-8">
          <div className="text-center bg-indigo-50 dark:bg-indigo-950/40 p-10 rounded-[3rem]"><p className="text-[10px] font-black text-indigo-600 uppercase mb-3">{selectedGoalForDeposit?.name}</p></div>
          <input autoFocus required type="text" value={depositAmount} placeholder="R$ 0,00" onChange={(e) => setDepositAmount(formatCurrencyInput(e.target.value))} className="w-full px-8 py-10 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 rounded-[2.5rem] font-black text-5xl text-center dark:text-white outline-none focus:border-indigo-500" />
          <button type="submit" className="w-full py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl active:scale-95 transition-all text-xl">Confirmar Depósito</button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
