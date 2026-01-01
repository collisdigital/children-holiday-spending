import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Child } from '../api/client';
import { Link } from 'react-router-dom';

const ChildSelection: React.FC = () => {
  const { data: children, isLoading, error } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: async () => {
      const response = await api.get('/children');
      return response.data;
    },
  });

  if (isLoading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error loading children</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Holiday Spending Tracker</h1>
      <p className="mb-6 text-gray-600">Select your name to view spending:</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {children?.map((child) => (
          <Link
            key={child.id}
            to={`/child/${child.id}`}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center border border-gray-100 flex flex-col items-center"
          >
            <span className="text-xl font-semibold text-gray-800">{child.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Link to="/admin" className="text-gray-400 hover:text-gray-600 underline text-sm">
          Parent Login
        </Link>
      </div>
    </div>
  );
};

export default ChildSelection;
