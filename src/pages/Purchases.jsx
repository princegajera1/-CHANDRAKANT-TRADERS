import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useAuthContext } from '../context/AuthContext';
import { getSuppliers, getPurchases, addPurchase } from '../firebase/suppliers';
import { useTheme } from '../context/ThemeContext';
import { Plus, Search, Trash2, Calendar, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatSimpleDate } from '../utils/formatters';

const Purchases = () => {
  const { products } = useProducts();
  const { user } = useAuthContext();
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [purchaseData, setPurchaseData] = useState({
    supplierId: '',
    supplierName: '',
    invoiceNo: '',
    items: [],
    totalAmount: 0
  });

  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const unsubSuppliers = getSuppliers(setSuppliers);
    const unsubPurchases = getPurchases(setPurchases);
    return () => { unsubSuppliers(); unsubPurchases(); };
  }, []);

  const handleProductSearch = (val) => {
    setProductSearch(val);
    if (val) {
      setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(val.toLowerCase())));
    } else {
      setFilteredProducts([]);
    }
  };

  const addItem = (product) => {
    setPurchaseData(prev => ({
      ...prev,
      items: [...prev.items, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        purchasePrice: product.purchasePrice 
      }]
    }));
    setProductSearch('');
    setFilteredProducts([]);
  };

  const removeItem = (idx) => {
    setPurchaseData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItem = (idx, field, val) => {
    const newItems = [...purchaseData.items];
    newItems[idx][field] = Number(val);
    setPurchaseData(prev => ({ ...prev, items: newItems }));
  };

  const total = purchaseData.items.reduce((acc, i) => acc + (i.quantity * i.purchasePrice), 0);

  const handleSubmit = async () => {
    if (!purchaseData.supplierId || purchaseData.items.length === 0) return toast.error('Fill all mandatory fields');
    try {
      await addPurchase({
        ...purchaseData,
        totalAmount: total,
        createdBy: user.uid
      });
      toast.success('Procurement recorded & stock synchronized');
      setIsModalOpen(false);
      setPurchaseData({ supplierId: '', supplierName: '', invoiceNo: '', items: [], totalAmount: 0 });
    } catch (error) {
      toast.error('Failed to record procurement');
    }
  };

  return (
    <div className="space-y-10 animate-page-entrance pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Procurement Registry</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">
            Audit and track inbound inventory acquisitions
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="h-[46px] px-8 rounded-xl bg-[#FF6A00] text-white font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all flex items-center gap-3 admin-btn-hover">
          <Plus size={18} /> Record New Purchase
        </button>
      </div>

      <div className="rounded-[32px] bg-[#0D1220] border border-white/[0.05] overflow-hidden animate-page-entrance" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Source Invoice</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Registry Date</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Strategic Supplier</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em] text-right">Procurement Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {purchases.map(p => (
                <tr key={p.id} className="group transition-all hover:bg-white/[0.02]">
                  <td className="p-8 font-heading font-[700] text-[1rem] text-white tracking-tighter uppercase">#{p.invoiceNo}</td>
                  <td className="p-8">
                    <div className="font-body font-[400] text-[0.78rem] text-white/60 flex items-center gap-2">
                      <Calendar size={14} className="text-[#FF6A00]" /> {formatSimpleDate(p.createdAt)}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="font-heading font-[700] text-[1rem] text-white uppercase group-hover:text-[#FF6A00] transition-colors">{p.supplierName}</div>
                  </td>
                  <td className="p-8 text-right font-heading font-[700] text-[#FF6A00] text-[1.4rem]">{formatCurrency(p.totalAmount)}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-24 text-center">
                    <div className="space-y-4 opacity-10">
                      <ShoppingCart size={48} className="mx-auto" />
                      <p className="text-[0.8rem] font-black uppercase tracking-[0.2em]">No procurement history found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Inbound Procurement Entry"
        footer={
          <div className="flex gap-4 w-full">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">CANCEL</Button>
            <Button onClick={handleSubmit} className="flex-1">RECORD ENTRY</Button>
          </div>
        }
      >
        <div className="space-y-6 p-2">
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Supplier Entity</label>
            <select 
              className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus appearance-none"
              onChange={(e) => {
                const s = suppliers.find(sup => sup.id === e.target.value);
                if (s) setPurchaseData({...purchaseData, supplierId: s.id, supplierName: s.name});
              }}
            >
              <option value="">Choose Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Supplier Invoice Registry No</label>
            <input 
              value={purchaseData.invoiceNo} 
              onChange={e => setPurchaseData({...purchaseData, invoiceNo: e.target.value})} 
              className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
            />
          </div>
          
          <div className="pt-6 border-t border-white/5">
            <h4 className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] mb-4 ml-1">Stock Acquisition List</h4>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                placeholder="Search inventory to add..." 
                className="w-full pl-12 pr-4 h-[52px] rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                value={productSearch} 
                onChange={e => handleProductSearch(e.target.value)} 
              />
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-50 border bg-[#0D1220] border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} className="w-full text-left p-4 hover:bg-white/5 font-body font-[400] text-[0.875rem] text-white transition-colors border-b last:border-none border-white/5" onClick={() => addItem(p)}>{p.name}</button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
              {purchaseData.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center p-4 rounded-2xl border bg-[#0D1220] border-white/5">
                  <span className="flex-1 font-heading font-[700] text-white text-[1rem] uppercase">{item.productName}</span>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-16 h-[42px] text-center rounded-xl font-body font-[400] text-[0.875rem] text-white outline-none bg-[#080C14] border border-white/10 focus:border-[#FF6A00] transition-all admin-input-focus" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    <input type="number" className="w-24 h-[42px] text-right px-3 rounded-xl font-body font-[400] text-[0.875rem] text-white outline-none bg-[#080C14] border border-white/10 focus:border-[#FF6A00] transition-all admin-input-focus" value={item.purchasePrice} onChange={e => updateItem(idx, 'purchasePrice', e.target.value)} />
                    <button onClick={() => removeItem(idx)} className="w-[42px] h-[42px] flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center py-6 border-t border-white/5 mt-6">
              <span className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em]">Acquisition Aggregate</span>
              <span className="text-2xl font-heading font-[800] text-[#FF6A00]">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Purchases;
