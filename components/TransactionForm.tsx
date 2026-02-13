
import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction } from '../types';
import { formatCurrencyInput, parseCurrencyString } from '../utils/format';

interface TransactionFormProps {
  onAdd: (description: string, amount: number, type: TransactionType, category: string) => void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, initialData }) => {
  const [description, setDescription] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Geral');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCatName, setCustomCatName] = useState('');

  const presetCategories = ['Geral', 'Alimentação', 'Lazer', 'Fixo', 'Saúde', 'Transporte'];

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setDisplayAmount(formatCurrencyInput((initialData.amount * 100).toString()));
      setType(initialData.type);
      if (presetCategories.includes(initialData.category)) {
        setCategory(initialData.category);
        setIsCustomMode(false);
      } else {
        setCategory('Outros');
        setIsCustomMode(true);
        setCustomCatName(initialData.category);
      }
    } else {
      setDescription('');
      setDisplayAmount('');
      setType('expense');
      setCategory('Geral');
      setIsCustomMode(false);
      setCustomCatName('');
    }
  }, [initialData]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayAmount(formatCurrencyInput(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyString(displayAmount);
    if (!description || amount <= 0) return;
    const finalCategory = isCustomMode ? customCatName : category;
    if (!finalCategory || finalCategory.trim() === '') return;
    onAdd(description, amount, type, finalCategory);
  };

  const inputClasses = "w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300";
  const labelClasses = "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className={labelClasses}>Descrição</label>
          <input
            type="text"
            placeholder="Ex: Supermercado"
            className={inputClasses}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClasses}>Valor (R$)</label>
            <input
              type="text"
              placeholder="0,00"
              className={inputClasses}
              value={displayAmount}
              onChange={handleAmountChange}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClasses}>Tipo</label>
            <div className="relative">
              <select
                className={`${inputClasses} appearance-none cursor-pointer pr-10`}
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
              >
                <option value="expense">📉 Despesa</option>
                <option value="income">📈 Receita</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className={labelClasses}>Categoria</label>
            <button 
              type="button" 
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              {isCustomMode ? 'Ver Padrões' : 'Criar Nova'}
            </button>
          </div>
          
          {isCustomMode ? (
             <div className="relative">
               <input
                 type="text"
                 placeholder="Digite o nome da categoria..."
                 className={inputClasses}
                 value={customCatName}
                 onChange={(e) => setCustomCatName(e.target.value)}
                 autoFocus
               />
               <i className="fa-solid fa-tag absolute right-5 top-1/2 -translate-y-1/2 text-indigo-300 text-sm"></i>
             </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {presetCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-3 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all border ${category === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
      >
        {initialData ? 'Atualizar Registro' : 'Salvar Movimentação'}
      </button>
    </form>
  );
};

export default TransactionForm;
