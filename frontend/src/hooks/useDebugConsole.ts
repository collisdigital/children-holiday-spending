import { useState } from 'react';

export const useDebugConsole = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);
  };

  return { logs, addLog };
};
