import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Child } from '../api/client';
import { Link } from 'react-router-dom';

const ChildSelection: React.FC = () => {
  const { data: children, isLoading, error } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: async () => {
      try {
          const response = await api.get('/children');
          return response.data;
      } catch (err: any) {
          console.error(`Error fetching: ${err.message}`);
          throw err;
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Holiday Spending Tracker</h1>

      {isLoading && (
        <>
          <p className="mb-6 text-gray-400 animate-pulse">Loading profiles...</p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-md" role="status" aria-label="Loading profiles">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center h-32 animate-pulse"
              >
                <div className="h-6 w-24 bg-gray-300 rounded mb-2"></div>
              </div>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="text-center mt-4">
          <p className="text-red-500 mb-4">Unable to load profiles.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Try Refreshing
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
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
        </>
      )}
    </div>
  );
};

export default ChildSelection;
