import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Render injects the hostname without protocol via 'host' property
if (API_URL && !API_URL.startsWith('http')) {
  API_URL = `https://${API_URL}`;
}

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
