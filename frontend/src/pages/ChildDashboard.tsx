import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Expense, type ChildWithTotal } from '../api/client';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';

const ChildDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [filters, setFilters] = useState<{
      cash: boolean;
      card: boolean;
      GBP: boolean;
      EUR: boolean;
      MAD: boolean;
  }>({
    cash: false,
    card: false,
    GBP: false,
    EUR: false,
    MAD: false,
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

  // Get child name
  const { data: children } = useQuery({
      queryKey: ['children'],
      queryFn: async () => (await api.get('/children')).data
  });
  const childName = children?.find((c: any) => c.id === Number(id))?.name || 'Child';

  const toggleFilter = (type: keyof typeof filters) => {
    setFilters((prev) => ({
        ...prev,
        [type]: !prev[type]
    }));
  };

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];

    // Check if any filter group is active
    const isTypeFilterActive = filters.cash || filters.card;
    const isCurrencyFilterActive = filters.GBP || filters.EUR || filters.MAD;

    if (!isTypeFilterActive && !isCurrencyFilterActive) return expenses;

    return expenses.filter(ex => {
        const typeMatch = !isTypeFilterActive || (ex.category === 'cash' && filters.cash) || (ex.category === 'card' && filters.card);
        const currencyMatch = !isCurrencyFilterActive || (filters[ex.currency as keyof typeof filters]);

        return typeMatch && currencyMatch;
    });
  }, [expenses, filters]);


  if (loadingExpenses || loadingTotal) return <div className="text-center mt-10">Loading...</div>;

  const grandTotalGBP = totalData?.grand_total_gbp || 0;
  const currencyTotals = totalData?.currency_totals || { GBP: { total: 0 }, EUR: { total: 0 }, MAD: { total: 0 } };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-blue-500 mb-4 inline-block">&larr; Back</Link>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{childName}'s Spending</h1>

          <div className="flex flex-col items-center justify-center gap-2 mt-4">
             <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Headline Total</div>
             <div className="text-5xl font-extrabold text-primary">
                {formatCurrency(grandTotalGBP, 'GBP')}
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 border-t pt-4">
             {['GBP', 'EUR', 'MAD'].map(currency => {
                 const total = (currencyTotals as any)[currency]?.total || 0;
                 return (
                     <div key={currency} className="flex flex-col p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{currency} Total</span>
                        <span className="text-lg font-bold text-gray-800">{formatCurrency(total, currency)}</span>
                     </div>
                 );
             })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-3">
            <h2 className="font-semibold text-gray-700">Expense History</h2>
            <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2">
                    {['cash', 'card'].map(type => (
                        <button
                            key={type}
                            onClick={() => toggleFilter(type as any)}
                            className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors capitalize ${
                                filters[type as keyof typeof filters]
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {['GBP', 'EUR', 'MAD'].map(curr => (
                        <button
                            key={curr}
                            onClick={() => toggleFilter(curr as any)}
                            className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                                filters[curr as keyof typeof filters]
                                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {curr}
                        </button>
                    ))}
                </div>
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
                      {formatCurrency(expense.amount, expense.currency || 'EUR')}
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
