
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="px-8 pt-10 pb-4 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none rotate-3 hover:rotate-0 transition-transform duration-300">
            <i className="fa-solid fa-leaf text-white text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">{subtitle}</p>
        </div>
        <div className="px-8 pb-10 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
