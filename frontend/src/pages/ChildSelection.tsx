import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Child } from '../api/client';
import { Link } from 'react-router-dom';
import DebugConsole from '../components/DebugConsole';
import { useDebugConsole } from '../hooks/useDebugConsole';

const ChildSelection: React.FC = () => {
  const { logs, addLog } = useDebugConsole();

  const { data: children, isLoading, error, isError } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: async () => {
      addLog('Fetching children...');
      try {
          const response = await api.get('/children');
          addLog(`Success: Got ${response.data?.length} children`);
          return response.data;
      } catch (err: any) {
          addLog(`Error fetching: ${err.message}`);
          if (err.response) {
              addLog(`Status: ${err.response.status}`);
              addLog(`Data: ${JSON.stringify(err.response.data)}`);
          }
          throw err;
      }
    },
  });

  // Capture generic loading/error states for display
  useEffect(() => {
      if (isLoading) addLog('Status: Loading...');
      if (isError) addLog('Status: Error');
  }, [isLoading, isError]);

  const envInfo = {
      VITE_API_URL: import.meta.env.VITE_API_URL || 'undefined',
      BASE_URL: api.defaults.baseURL || 'undefined'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <DebugConsole logs={logs} envInfo={envInfo} />

      {isLoading && <div className="text-center mt-10">Loading...</div>}
      {error && <div className="text-center mt-10 text-red-500">Error loading children</div>}

      {!isLoading && !error && (
        <>
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
      </>
      )}
    </div>
  );
};

export default ChildSelection;
