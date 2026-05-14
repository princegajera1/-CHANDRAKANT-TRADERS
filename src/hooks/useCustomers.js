import { useState, useEffect } from 'react';
import { getCustomers } from '../firebase/customers';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { customers, loading };
};
