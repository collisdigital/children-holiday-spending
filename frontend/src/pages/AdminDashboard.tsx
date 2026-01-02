import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Child } from '../api/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DebugConsole from '../components/DebugConsole';
import { useDebugConsole } from '../hooks/useDebugConsole';

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logs, addLog } = useDebugConsole();

  // State for form
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChild, setSelectedChild] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Children
  const { data: children } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: async () => {
      addLog('Fetching children...');
      try {
        const response = await api.get('/children');
        addLog(`Children loaded: ${response.data?.length}`);
        return response.data;
      } catch (err: any) {
        addLog(`Error loading children: ${err.message}`);
        throw err;
      }
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (newExpense: any) => {
      addLog(`Adding expense: ${JSON.stringify(newExpense)}`);
      try {
        const res = await api.post('/expenses', newExpense);
        addLog('Expense added successfully');
        return res;
      } catch (err: any) {
        addLog(`Failed to add expense: ${err.message}`);
        if (err.response) {
          addLog(`Status: ${err.response.status}`);
          addLog(`Response: ${JSON.stringify(err.response.data)}`);
        }
        throw err;
      }
    },
    onSuccess: () => {
      setSuccessMsg('Expense added successfully!');
      setAmount('');
      setDescription('');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['total'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: () => {
      setError('Failed to add expense. Check PIN or connection.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedChild || !amount || !description) {
        setError("All fields required");
        return;
    }

    addExpenseMutation.mutate({
      child_id: Number(selectedChild),
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString(), // Auto-filled with "now"
    });
  };

  const handleLogout = () => {
      // Clear pin logic if stored locally (it's in memory)
      navigate('/');
      window.location.reload(); // Hard reset to clear memory
  };

  const envInfo = {
      VITE_API_URL: import.meta.env.VITE_API_URL || 'undefined',
      'X-Admin-PIN': api.defaults.headers.common['X-Admin-PIN'] ? '***SET***' : 'MISSING'
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <DebugConsole logs={logs} envInfo={envInfo} />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Parent Dashboard</h1>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 underline">Logout</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Expense</h2>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Child</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedChild}
                onChange={(e) => setSelectedChild(Number(e.target.value))}
              >
                <option value="">Select Child...</option>
                {children?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Amount (MAD)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Description</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Ice Cream"
              />
            </div>

            <div className="md:col-span-2">
               <button
                 type="submit"
                 disabled={addExpenseMutation.isPending}
                 className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary transition w-full md:w-auto"
               >
                 {addExpenseMutation.isPending ? 'Saving...' : 'Add Expense'}
               </button>
            </div>
          </form>
        </div>

        {/* View/Edit Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {children?.map(child => (
                <ChildExpenseSummary key={child.id} child={child} />
            ))}
        </div>
      </div>
    </div>
  );
};

const ChildExpenseSummary: React.FC<{ child: Child }> = ({ child }) => {
    // We fetch expenses for each child to allow editing
    // This isn't efficient for many children, but for 4 it's fine.
    const { data: expenses } = useQuery({
        queryKey: ['expenses', child.id.toString()],
        queryFn: async () => (await api.get(`/children/${child.id}/expenses`)).data
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <div className="bg-white p-4 rounded-lg shadow h-96 overflow-y-auto">
            <h3 className="font-bold text-lg mb-2 text-primary sticky top-0 bg-white pb-2 border-b">{child.name}</h3>
            <ul className="space-y-3">
                {expenses?.map((ex: any) => (
                    <li key={ex.id} className="text-sm border-b pb-2">
                        {editingId === ex.id ? (
                            <EditForm expense={ex} onCancel={() => setEditingId(null)} onSuccess={() => setEditingId(null)} />
                        ) : (
                            <div onClick={() => setEditingId(ex.id)} className="cursor-pointer hover:bg-gray-50 p-1 rounded group">
                                <div className="flex justify-between font-medium">
                                    <span>{ex.description}</span>
                                    <span>{ex.amount} MAD</span>
                                </div>
                                <div className="text-gray-400 text-xs flex justify-between">
                                    <span>{format(new Date(ex.date), 'dd/MM')}</span>
                                    <span className="hidden group-hover:inline text-blue-500">Edit</span>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const EditForm: React.FC<{ expense: any, onCancel: () => void, onSuccess: () => void }> = ({ expense, onCancel, onSuccess }) => {
    const [amount, setAmount] = useState(expense.amount);
    const [description, setDescription] = useState(expense.description);
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.put(`/expenses/${expense.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['total'] });
            onSuccess();
        }
    });

    return (
        <div className="bg-gray-50 p-2 rounded">
            <input
                className="w-full mb-1 border rounded px-1"
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
            <input
                type="number"
                className="w-full mb-1 border rounded px-1"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
            />
            <div className="flex gap-2 justify-end">
                <button onClick={onCancel} className="text-gray-500 text-xs">Cancel</button>
                <button
                    onClick={() => updateMutation.mutate({ amount, description })}
                    className="text-blue-600 text-xs font-bold"
                >
                    Save
                </button>
            </div>
        </div>
    )
}

export default AdminDashboard;
