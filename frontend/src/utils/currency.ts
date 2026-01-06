export const formatCurrency = (amount: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
