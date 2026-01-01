import React, { useState } from 'react';
import { setAdminPin, api } from '../api/client';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Very basic validation by trying a protected endpoint or just assuming correct for now via a verify endpoint
      // We implemented /verify-pin in backend
      setAdminPin(pin);
      await api.post('/verify-pin');

      // If successful, save PIN to memory (already in client.ts defaults) and redirect
      // For better security, we wouldn't store it in plain text or use it this way,
      // but requirements are simple.
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid PIN');
      setAdminPin(''); // clear
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Parent Access</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enter PIN</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-center text-2xl tracking-widest"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded hover:bg-secondary transition"
          >
            Enter
          </button>
        </form>
        <div className="mt-4 text-center">
            <button onClick={() => navigate('/')} className="text-gray-500 text-sm underline">Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
