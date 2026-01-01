import axios from 'axios';

// Use relative URL to leverage Render Rewrites (or Vite proxy in dev)
const API_URL = '';

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
