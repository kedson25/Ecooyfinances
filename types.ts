
export enum AuthView {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD'
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  salary?: number;
  salaryDay?: number;
  fixedExpenses?: number;
  theme?: 'light' | 'dark';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface Notification {
  id: string;
  type: 'payment' | 'goal' | 'tip';
  title: string;
  message: string;
  date: Date;
  isRead: boolean;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  uid: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  timestamp?: any;
}

export interface Goal {
  id: string;
  uid: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  timestamp?: any;
}

export type DashboardTab = 'overview' | 'transactions' | 'goals' | 'profile';
