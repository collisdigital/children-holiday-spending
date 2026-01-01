export const formatCurrency = (amount: number, currency: 'MAD' | 'GBP' = 'MAD') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const MAD_TO_GBP_RATE = 0.08;

export const convertToGBP = (amountMAD: number) => {
  return amountMAD * MAD_TO_GBP_RATE;
};
