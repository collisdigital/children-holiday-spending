import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Expense, type ChildWithTotal } from '../api/client';
import { formatCurrency, convertToGBP } from '../utils/currency';
import { format } from 'date-fns';

const ChildDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [filters, setFilters] = useState<{ cash: boolean; card: boolean }>({
    cash: false,
    card: false,
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses', id],
    queryFn: async () => {
      const response = await api.get(`/children/${id}/expenses`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: totalData, isLoading: loadingTotal } = useQuery<ChildWithTotal>({
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

  // Toggle Filter Logic
  const toggleFilter = (type: 'cash' | 'card') => {
    setFilters((prev) => ({
        ...prev,
        [type]: !prev[type]
    }));
  };

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    // If no filters are selected, show all (default behavior)
    // If filters are selected, show only expenses matching the SELECTED filters
    const isAnyFilterActive = filters.cash || filters.card;
    if (!isAnyFilterActive) return expenses;

    return expenses.filter(ex => {
        if (ex.category === 'cash' && filters.cash) return true;
        if (ex.category === 'card' && filters.card) return true;
        return false;
    });
  }, [expenses, filters]);


  if (loadingExpenses || loadingTotal) return <div className="text-center mt-10">Loading...</div>;

  const totalMAD = totalData?.total_amount || 0;
  const totalGBP = convertToGBP(totalMAD);

  const cashMAD = totalData?.total_cash || 0;
  const cashGBP = convertToGBP(cashMAD);

  const cardMAD = totalData?.total_card || 0;
  const cardGBP = convertToGBP(cardMAD);

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

          <div className="grid grid-cols-2 gap-4 mt-6 border-t pt-4">
             <div className="flex flex-col">
                <span className="text-sm text-gray-500 uppercase tracking-wide">Cash Total</span>
                <span className="text-xl font-bold text-gray-800">{formatCurrency(cashMAD, 'MAD')}</span>
                <span className="text-xs text-gray-400">≈ {formatCurrency(cashGBP, 'GBP')}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-sm text-gray-500 uppercase tracking-wide">Card Total</span>
                <span className="text-xl font-bold text-gray-800">{formatCurrency(cardMAD, 'MAD')}</span>
                <span className="text-xs text-gray-400">≈ {formatCurrency(cardGBP, 'GBP')}</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Expense History</h2>
            <div className="flex gap-2">
                <button
                    onClick={() => toggleFilter('cash')}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                        filters.cash
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Cash
                </button>
                <button
                    onClick={() => toggleFilter('card')}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                        filters.card
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Card
                </button>
            </div>
          </div>
          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
                {expenses?.length === 0 ? "No expenses recorded yet." : "No expenses match your filters."}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => (
                <li key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{expense.description}</p>
                          <span className={`text-[10px] px-1.5 rounded border uppercase ${
                              expense.category === 'card' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-green-50 text-green-600 border-green-100'
                          }`}>
                              {expense.category || 'cash'}
                          </span>
                      </div>
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
