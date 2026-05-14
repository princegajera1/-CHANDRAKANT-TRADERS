import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ShoppingCart, CheckCircle, Printer, Share2, Users, Wallet, Minus } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { createBill } from '../firebase/bills';
import { addCustomer } from '../firebase/customers';
import { useAuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import { generateBillPDF } from '../utils/generatePDF';
import { shareOnWhatsApp } from '../utils/whatsapp';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PrintInvoice } from '../components/ui/PrintInvoice';

const NewBill = () => {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { user, profile, isReadOnly } = useAuthContext();
  
  const [billItems, setBillItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductResults, setShowProductResults] = useState(false);
  
  const [customerMode, setCustomerMode] = useState('existing'); 
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', address: '' });
  
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'shop'));
      if (snap.exists()) setShopSettings(snap.data());
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (productSearch.trim()) {
      const results = products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.brand.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(results);
      setShowProductResults(true);
    } else {
      setShowProductResults(false);
    }
  }, [productSearch, products]);

  const addItem = (product) => {
    if (product.currentQty <= 0) {
      toast.error(`Stock Depleted: ${product.name}`);
      return;
    }

    const existing = billItems.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.currentQty) {
        toast.error(`Critical Stock: ${product.currentQty} available`);
        return;
      }
      setBillItems(billItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, itemTotal: (item.quantity + 1) * item.unitPrice } 
          : item
      ));
    } else {
      setBillItems([...billItems, {
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        quantity: 1,
        unitPrice: product.sellingPrice,
        gstPercent: product.gstPercent || 5,
        itemTotal: product.sellingPrice
      }]);
    }
    setProductSearch('');
    setShowProductResults(false);
  };

  const removeItem = (id) => setBillItems(billItems.filter(i => i.productId !== id));

  const updateItemQty = (id, newQty) => {
    if (newQty < 1) {
      removeItem(id);
      return;
    }
    const product = products.find(p => p.id === id);
    if (product && newQty > product.currentQty) {
      toast.error(`Critical Stock: ${product.currentQty} available`);
      return;
    }

    setBillItems(billItems.map(item => 
      item.productId === id ? { ...item, quantity: newQty, itemTotal: newQty * item.unitPrice } : item
    ));
  };

  const subtotal = billItems.reduce((acc, item) => acc + item.itemTotal, 0);
  const gstAmount = subtotal * 0.05;
  const grandTotal = subtotal + gstAmount - discount;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const handleSaveBill = async () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    if (billItems.length === 0) return toast.error('Empty Cart Protocol: Add assets to initialize');
    if (customerMode !== 'walk-in' && !selectedCustomer && !newCustomerData.name) return toast.error('Identify Recipient Profile');

    setIsSaving(true);
    try {
      let finalCustomerId = selectedCustomer?.id || null;
      let finalCustomerName = customerMode === 'new' ? newCustomerData.name : (selectedCustomer?.name || 'Walk-in Customer');
      let finalCustomerPhone = customerMode === 'new' ? newCustomerData.phone : (selectedCustomer?.phone || '');

      if (customerMode === 'new' && newCustomerData.name) {
        const res = await addCustomer(newCustomerData);
        finalCustomerId = res.id;
      }

      const billData = {
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        items: billItems,
        subtotal,
        gstAmount,
        discountAmount: Number(discount),
        grandTotal,
        amountPaid: paymentMode === 'Credit' ? 0 : (amountPaid || grandTotal),
        balanceDue: paymentMode === 'Credit' ? grandTotal : balanceDue,
        paymentMode,
        createdBy: user.uid,
        createdByName: profile?.name || 'Staff'
      };

      const result = await createBill(billData);
      toast.success('Invoice Synchronized Successfully');
      setSavedBill({ ...billData, billNo: result.billNo });
    } catch (error) {
      toast.error('Synchronization Fault');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setBillItems([]);
    setSavedBill(null);
    setAmountPaid(0);
    setDiscount(0);
    setSelectedCustomer(null);
    setCustomerMode('existing');
  };

  const safeFormatDate = (timestamp) => {
    if (!timestamp) return new Date().toLocaleDateString('en-IN');
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const numberToWords = (num) => {
    if (!num) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
    return str;
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (savedBill) {
    return (
      <div className="max-w-2xl mx-auto py-20 animate-page-entrance">
        <div className="bg-[#0D1220] p-12 rounded-[40px] border border-white/[0.05] text-center space-y-8 no-print">
          <div className="w-24 h-24 bg-[#10B981]/10 text-[#10B981] rounded-3xl mx-auto flex items-center justify-center">
            <CheckCircle size={48} />
          </div>
          <div>
            <h2 className="admin-heading">Log Synchronized</h2>
            <p className="text-white/40 mt-2 uppercase tracking-widest text-[0.8rem] font-black">Invoice Serial: <span className="text-[#FF6A00]">#{savedBill.billNo}</span></p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <button onClick={handlePrint} className="h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-3">
              <Printer size={20} className="text-[#FF6A00]" /> Print Log
            </button>
            <button onClick={() => shareOnWhatsApp(savedBill, shopSettings)} className="h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-3">
              <Share2 size={20} className="text-[#10B981]" /> WhatsApp
            </button>
            <button onClick={handleReset} className="h-16 rounded-2xl bg-[#FF6A00] text-white font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-[#FF6A0033]">
              <Plus size={20} /> New Protocol
            </button>
          </div>
        </div>

        <PrintInvoice bill={savedBill} shopSettings={shopSettings} safeFormatDate={safeFormatDate} numberToWords={numberToWords} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-page-entrance pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">New Terminal Invoice</h2>
          <p className="font-body italic font-[400] text-[0.72rem] text-white/[0.38] uppercase mt-1">Point of Sale System</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: Items & Search */}
        <div className="flex-1 space-y-10">
        <div className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-8">
          <div className="relative group z-20">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search assets by identity or manufacturer..."
              className="w-full pl-14 pr-6 h-[56px] rounded-xl outline-none font-body font-[400] italic text-[0.82rem] bg-[#080C14] border border-white/10 text-white placeholder:text-white/[0.22] focus:border-[#FF6A00] transition-all admin-input-focus"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onFocus={() => setShowProductResults(true)}
            />
            {showProductResults && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl bg-[#080C14] border border-white/10 shadow-2xl max-h-[400px] overflow-y-auto z-50 custom-scrollbar p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      className="w-full p-5 flex flex-col justify-between text-left rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-[#FF6A00]/10 hover:border-[#FF6A00]/30 transition-all group"
                      onClick={() => addItem(p)}
                    >
                      <div className="mb-4">
                        <p className="font-body font-[600] text-white text-[0.82rem] leading-tight group-hover:text-[#FF6A00] transition-colors">{p.name}</p>
                        <p className="font-body font-[400] text-[0.65rem] uppercase text-white/40 mt-1">{p.brand} {p.size ? `· ${p.size}` : ''}</p>
                      </div>
                      <div className="w-full flex items-end justify-between mt-auto pt-2 border-t border-white/5">
                        <p className={`font-body font-[700] text-[0.62rem] uppercase ${p.currentQty <= p.minQty ? 'text-red-500' : 'text-white/20'}`}>{p.currentQty} Units</p>
                        <p className="font-heading font-[700] text-[#FF6A00] text-[0.9rem] leading-none">₹{p.sellingPrice.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">ACTIVE CART ITEMS</h3>
              <span className="px-3 py-1 bg-[#FF6A00]/10 text-[#FF6A00] rounded-lg font-body font-[700] text-[0.62rem] uppercase">{billItems.length} UNITS</span>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {billItems.map((item, i) => (
                <div key={item.productId} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-row-entrance" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex-1">
                    <p className="font-body font-[600] text-white text-[0.82rem]">{item.productName}</p>
                    <p className="font-body font-[400] text-[0.65rem] text-white/40 uppercase mt-1">{item.brand}</p>
                  </div>
                  
                  <div className="flex items-center gap-10">
                    <div className="flex items-center bg-[#080C14] border border-white/10 rounded-xl overflow-hidden p-1">
                      <button onClick={() => updateItemQty(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Minus size={14} /></button>
                      <div className="w-10 text-center text-[0.85rem] font-black text-white">{item.quantity}</div>
                      <button onClick={() => updateItemQty(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Plus size={14} /></button>
                    </div>

                    <div className="w-32 text-right">
                      <p className="font-black text-[#FF6A00] text-[1.2rem]">₹{item.itemTotal.toLocaleString()}</p>
                      <p className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mt-1">₹{item.unitPrice} / Unit</p>
                    </div>

                    <button onClick={() => removeItem(item.productId)} className="w-10 h-10 flex items-center justify-center text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
              
              {billItems.length === 0 && (
                <div className="py-24 text-center rounded-3xl bg-white/[0.02] border border-white/5 border-dashed">
                  <ShoppingCart size={48} className="mx-auto text-white/5 mb-6" />
                  <p className="text-[0.8rem] font-black uppercase tracking-[0.2em] text-white/10">Initialize Selection Buffer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Summary & Recipient */}
      <div className="w-full lg:w-[420px] space-y-8">
        <div className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-8">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[#FF6A00]" />
            <h3 className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/30">Recipient Profile</h3>
          </div>
          
          <div className="flex p-1.5 bg-[#080C14] rounded-xl border border-white/5">
            {['existing', 'new', 'walk-in'].map(mode => (
              <button
                key={mode}
                onClick={() => { setCustomerMode(mode); setSelectedCustomer(null); }}
                className={`flex-1 py-2.5 font-body font-[700] text-[0.65rem] uppercase tracking-[0.12em] rounded-lg transition-all ${
                  customerMode === mode ? 'bg-[#FF6A00] text-white shadow-lg' : 'text-white/20 hover:text-white/40'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {customerMode === 'existing' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  placeholder="Identify by name or phone..."
                  className="w-full pl-11 pr-4 h-[48px] rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.85rem] outline-none focus:border-[#FF6A00] transition-all"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              {customerSearch && (
                <div className="rounded-xl max-h-48 overflow-y-auto bg-[#080C14] border border-white/10 p-2 space-y-1 custom-scrollbar">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                    .map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left p-4 rounded-lg hover:bg-white/5 transition-all border-b border-white/[0.03] last:border-none"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      >
                        <p className="font-black text-[0.8rem] text-white uppercase">{c.name}</p>
                        <p className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mt-1">{c.phone}</p>
                      </button>
                    ))}
                </div>
              )}
              {selectedCustomer && (
                <div className="p-6 bg-[#FF6A00]/5 border border-[#FF6A00]/10 rounded-2xl flex justify-between items-center group">
                  <div>
                    <p className="font-black text-[0.9rem] text-white uppercase">{selectedCustomer.name}</p>
                    <p className="text-[0.65rem] font-black text-[#FF6A00] uppercase tracking-widest mt-1">Outstanding: ₹{selectedCustomer.balance}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {customerMode === 'new' && (
            <div className="space-y-4">
              <input 
                placeholder="CUSTOMER NAME" 
                className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.85rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-body placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]"
                value={newCustomerData.name} 
                onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} 
              />
              <input 
                placeholder="PHONE NUMBER" 
                className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.85rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-body placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]"
                value={newCustomerData.phone} 
                onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} 
              />
            </div>
          )}
        </div>

        <div className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10">
          <div className="space-y-6">
            <h3 className="font-body font-[700] text-[0.72rem] text-white uppercase tracking-[0.12em]">BILL SUMMARY</h3>
            <div className="flex justify-between items-center mt-4">
              <span className="font-body font-[400] text-[0.78rem] text-white/50 lowercase first-letter:uppercase">Protocol subtotal</span>
              <span className="font-body font-[600] text-[0.82rem] text-white">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body font-[400] text-[0.78rem] text-white/50 lowercase first-letter:uppercase">Standard GST (5%)</span>
              <span className="font-body font-[600] text-[0.82rem] text-white">₹{gstAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-6 border-y border-white/[0.05]">
              <span className="font-body font-[400] text-[0.78rem] text-[#FF6A00] lowercase first-letter:uppercase">Discount override</span>
              <input
                type="number"
                className="w-24 h-[36px] px-3 text-right rounded-lg bg-[#080C14] border border-white/10 text-[#FF6A00] text-[0.82rem] font-[600] outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body font-[700] text-[0.8rem] text-white/[0.70] uppercase">GRAND TOTAL</span>
              <span className="font-heading font-[700] text-[1.2rem] text-[#FF6A00]">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex p-1.5 bg-[#080C14] rounded-xl border border-white/5">
              {['Cash', 'Online', 'Credit'].map(mode => (
                <button
                  key={mode}
                  onClick={() => { setPaymentMode(mode); if (mode !== 'Credit') setAmountPaid(grandTotal); else setAmountPaid(0); }}
                  className={`flex-1 py-2.5 font-body font-[700] text-[0.65rem] uppercase tracking-[0.12em] rounded-lg transition-all ${
                    paymentMode === mode ? 'bg-[#FF6A00] text-white shadow-lg' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {paymentMode !== 'Credit' && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/30">Settlement Amount</span>
                  <span className={`text-[0.6rem] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${balanceDue > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {balanceDue > 0 ? `Due: ₹${balanceDue.toLocaleString()}` : 'Settled'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder={grandTotal.toString()}
                    className="w-full h-[56px] pl-5 pr-14 rounded-xl bg-[#080C14] border border-white/10 text-white text-[1.2rem] font-black outline-none focus:border-[#FF6A00] transition-all"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  />
                  <Wallet className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10" size={20} />
                </div>
              </div>
            )}

            <button 
              className="w-full h-[64px] rounded-2xl bg-[#FF6A00] text-white font-black text-[0.8rem] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:translate-y-[-2px] shadow-lg shadow-[#FF6A0033] transition-all disabled:opacity-50 admin-btn-hover"
              disabled={isSaving || billItems.length === 0 || isReadOnly}
              onClick={handleSaveBill}
            >
              {isSaving ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isReadOnly ? (
                <><Lock size={16} /> Read Only Mode</>
              ) : (
                <>EXECUTE LOG PROTOCOL <Printer size={20} /></>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default NewBill;
