import { useState, useEffect } from 'react';
import { getBills } from '../firebase/bills';

export const useBills = (filters = {}) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getBills((data) => {
      setBills(data);
      setLoading(false);
    }, filters);
    return () => unsubscribe();
  }, [JSON.stringify(filters)]);

  return { bills, loading };
};
