import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Expense } from '../api/client';
import { formatCurrency, convertToGBP } from '../utils/currency';
import { format } from 'date-fns';

const ChildDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: expenses, isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses', id],
    queryFn: async () => {
      const response = await api.get(`/children/${id}/expenses`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: totalData, isLoading: loadingTotal } = useQuery({
    queryKey: ['total', id],
    queryFn: async () => {
      const response = await api.get(`/children/${id}/total`);
      return response.data;
    },
    enabled: !!id,
  });

  // Get child name (could be optimized by passing state or fetching child details)
  const { data: children } = useQuery({
      queryKey: ['children'],
      queryFn: async () => (await api.get('/children')).data
  });
  const childName = children?.find((c: any) => c.id === Number(id))?.name || 'Child';

  if (loadingExpenses || loadingTotal) return <div className="text-center mt-10">Loading...</div>;

  const totalMAD = totalData?.total_amount || 0;
  const totalGBP = convertToGBP(totalMAD);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-blue-500 mb-4 inline-block">&larr; Back</Link>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{childName}'s Spending</h1>
          <div className="flex flex-col items-center justify-center gap-2 mt-4">
             <div className="text-4xl font-extrabold text-primary">
                {formatCurrency(totalMAD, 'MAD')}
             </div>
             <div className="text-lg text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                ≈ {formatCurrency(totalGBP, 'GBP')}
             </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Expense History</h2>
          </div>
          {expenses?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No expenses recorded yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expenses?.map((expense) => (
                <li key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{expense.description}</p>
                      <p className="text-sm text-gray-500">{format(new Date(expense.date), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <span className="font-bold text-gray-700">
                      {formatCurrency(expense.amount, 'MAD')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;
