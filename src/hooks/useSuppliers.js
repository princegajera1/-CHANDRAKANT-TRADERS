import { useState, useEffect } from 'react';
import { getSuppliers } from '../firebase/suppliers';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getSuppliers((data) => {
      setSuppliers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { suppliers, loading };
};
