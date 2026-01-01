import React from 'react';
import { api } from '../api/client';

interface DebugConsoleProps {
  logs: string[];
  envInfo: Record<string, string>;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ logs, envInfo }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-green-400 p-4 border-t border-gray-700 font-mono text-xs z-50 max-h-64 overflow-auto opacity-90">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Console</h3>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white bg-gray-700 px-2 py-1 rounded">
          {isOpen ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="mb-4">
            <h4 className="text-white mb-1">Environment</h4>
            <pre>{JSON.stringify(envInfo, null, 2)}</pre>
          </div>
          <div>
            <h4 className="text-white mb-1">Logs</h4>
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="border-b border-gray-800 py-1">{log}</div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DebugConsole;
