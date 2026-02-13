
import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
    <div className="flex gap-2">
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
            <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-20"></div>
          </div>
        </div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
      </div>
    ))}
  </div>
);

export const GoalSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
      <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
    </div>
    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
    <div className="flex justify-between items-center">
      <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded w-1/4"></div>
      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
    </div>
  </div>
);
