import { format } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return format(d, 'dd/MM/yyyy hh:mm a');
};

export const formatSimpleDate = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return format(d, 'dd MMM yyyy');
};
export const isToday = (date) => {
  if (!date) return false;
  const d = date.toDate ? date.toDate() : new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};
