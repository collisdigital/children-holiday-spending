import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAdminPin = (pin: string) => {
  api.defaults.headers.common['X-Admin-PIN'] = pin;
};

// Types
export interface Child {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  child_id: number;
}

export interface ChildWithTotal {
  child_id: number;
  total_amount: number;
}
