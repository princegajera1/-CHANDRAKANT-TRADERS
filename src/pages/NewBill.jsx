import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ShoppingCart, CheckCircle, Printer, Share2, Users, Wallet, Minus, ArrowRight, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { createBill } from '../firebase/bills';
import { addCustomer } from '../firebase/customers';
import { useAuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { shareOnWhatsApp } from '../utils/whatsapp';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PrintInvoice } from '../components/ui/PrintInvoice';
import { validateGSTIN, validatePAN, extractPANFromGSTIN } from '../utils/gstValidation';
import { amountToWords } from '../utils/amountToWords';
import { useNavigate } from 'react-router-dom';
import { getNextSerialNumber } from '../utils/serialNumber';

const NewBill = () => {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { user, profile, isReadOnly } = useAuthContext();
  const navigate = useNavigate();
  
  const [billItems, setBillItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductResults, setShowProductResults] = useState(false);
  
  const [customerMode, setCustomerMode] = useState('existing'); 
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [newCustomerData, setNewCustomerData] = useState({ 
    name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', transporter: '', balance: 0, bankName: '', accountNumber: '', ifscCode: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);

  // Additional Details (Optional)
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [ackNo, setAckNo] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);

  useEffect(() => {
    // Read shopSettings from localStorage as requested by the prompt
    const fetchSettings = async () => {
      try {
        const localSettings = localStorage.getItem('shopSettings');
        if (localSettings) {
          setShopSettings(JSON.parse(localSettings));
        } else {
          // Fallback to Firestore if local storage is empty initially
          const snap = await getDoc(doc(db, 'settings', 'shop'));
          if (snap.exists()) {
            setShopSettings(snap.data());
            localStorage.setItem('shopSettings', JSON.stringify(snap.data()));
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
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

  const isGstRegistered = customerMode === 'existing' 
    ? !!selectedCustomer?.gstin 
    : !!newCustomerData.gstin;

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
        hsnCode: product.hsnCode || '4011',
        serialNo: getNextSerialNumber(),
        quantity: 1,
        unitPrice: product.sellingPrice,
        baseGstPercent: product.gstPercent || 5,
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
  const gstAmount = isGstRegistered ? 0 : subtotal * 0.05;
  const grandTotal = subtotal + gstAmount - discount;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const handleGSTINChange = (e) => {
    const val = e.target.value.toUpperCase();
    const newFormData = { ...newCustomerData, gstin: val };
    if (val.length >= 15) {
      newFormData.pan = extractPANFromGSTIN(val);
    }
    setNewCustomerData(newFormData);
  };

  const handleSaveBill = async () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    if (billItems.length === 0) return toast.error('Empty Cart Protocol: Add assets to initialize');
    
    if (customerMode === 'existing' && !selectedCustomer) {
      return toast.error('Identify Recipient Profile');
    }

    let finalCustomerId = selectedCustomer?.id || null;
    let finalCustomerName = selectedCustomer?.name || '';
    let finalCustomerPhone = selectedCustomer?.phone || '';
    let finalCustomerAddress = selectedCustomer?.address || '';
    let finalVehicleNo = selectedCustomer?.vehicleNo || '';
    let finalTransporter = selectedCustomer?.transporter || '';
    let finalGSTIN = selectedCustomer?.gstin || '';
    let finalPAN = selectedCustomer?.pan || '';

    if (customerMode === 'new') {
      const errors = {};
      if (!newCustomerData.name) errors.name = 'Customer name is required';
      if (!newCustomerData.phone) errors.phone = 'Phone number is required';
      if (!newCustomerData.address) errors.address = 'Address is required';
      if (!newCustomerData.vehicleNo) errors.vehicleNo = 'Vehicle number is required';
      
      if (newCustomerData.gstin) {
        const gstVal = validateGSTIN(newCustomerData.gstin);
        if (!gstVal.valid) errors.gstin = gstVal.error;
        if (!newCustomerData.pan) errors.pan = 'PAN is required when GSTIN is provided';
      }
      
      if (newCustomerData.pan) {
        const panVal = validatePAN(newCustomerData.pan);
        if (!panVal.valid) errors.pan = panVal.error;
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error('Resolve customer profile errors before proceeding');
        return;
      }

      setIsSaving(true);
      try {
        const res = await addCustomer({ ...newCustomerData, totalBillsCount: 0, lastBillDate: null });
        finalCustomerId = res.id;
        finalCustomerName = newCustomerData.name;
        finalCustomerPhone = newCustomerData.phone;
        finalCustomerAddress = newCustomerData.address;
        finalVehicleNo = newCustomerData.vehicleNo;
        finalTransporter = newCustomerData.transporter;
        finalGSTIN = newCustomerData.gstin;
        finalPAN = newCustomerData.pan;
        
        // Use new customer bank details
        var finalBankName = newCustomerData.bankName;
        var finalBankAccount = newCustomerData.accountNumber;
        var finalIfsc = newCustomerData.ifscCode;

      } catch (err) {
        toast.error('Failed to create new customer profile');
        setIsSaving(false);
        return;
      }
    } else {
      setIsSaving(true);
    }

    try {
      // Map bill items to have gstPercent = 0 if customer is GST registered
      const finalItems = billItems.map(item => ({
        ...item,
        gstPercent: isGstRegistered ? 0 : item.baseGstPercent
      }));

      // Extract bank details for existing customer if applicable
      if (customerMode === 'existing' && selectedCustomer) {
        var finalBankName = selectedCustomer.bankName || '';
        var finalBankAccount = selectedCustomer.accountNumber || '';
        var finalIfsc = selectedCustomer.ifscCode || '';
      }

      const billData = {
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerAddress: finalCustomerAddress,
        vehicleNo: finalVehicleNo,
        transporter: finalTransporter,
        customerGstin: finalGSTIN,
        customerPan: finalPAN,
        customerBankName: finalBankName || '',
        customerBankAccount: finalBankAccount || '',
        customerIfsc: finalIfsc || '',
        items: finalItems,
        subtotal,
        gstAmount,
        discountAmount: Number(discount),
        grandTotal,
        amountPaid: paymentMode === 'Credit' ? 0 : (amountPaid || grandTotal),
        balanceDue: paymentMode === 'Credit' ? grandTotal : balanceDue,
        paymentMode,
        ewayBillNo,
        ackDate,
        ackNo,
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
    setNewCustomerData({ name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', transporter: '', balance: 0, bankName: '', accountNumber: '', ifscCode: '' });
    setFormErrors({});
    setSelectedCustomer(null);
    setCustomerMode('existing');
    setEwayBillNo('');
    setAckDate('');
    setAckNo('');
  };

  const safeFormatDate = (timestamp) => {
    if (!timestamp) return new Date().toLocaleDateString('en-IN');
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

        <PrintInvoice bill={savedBill} shopSettings={shopSettings} safeFormatDate={safeFormatDate} amountToWords={amountToWords} />
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
                      <p className="font-body font-[400] text-[0.65rem] text-white/40 uppercase mt-1">
                        {item.brand} &nbsp;&middot;&nbsp; <span className="text-[#FF6A00]/80 font-[700]">Serial No: {item.serialNo}</span>
                      </p>
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

          <div className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05]">
            <button 
              onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              className="w-full flex items-center justify-between font-body font-[700] text-[0.72rem] text-white uppercase tracking-[0.12em]"
            >
              <span>Additional Details (Optional) - E-Way Bill</span>
              {showAdditionalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showAdditionalDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-dropdown-entrance">
                <div className="space-y-1">
                  <label className="text-[0.65rem] text-white/50 uppercase tracking-widest font-black">E-Way Bill No.</label>
                  <input 
                    className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all"
                    value={ewayBillNo}
                    onChange={e => setEwayBillNo(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.65rem] text-white/50 uppercase tracking-widest font-black">ACK Date</label>
                  <input 
                    type="date"
                    className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all"
                    value={ackDate}
                    onChange={e => setAckDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.65rem] text-white/50 uppercase tracking-widest font-black">ACK No.</label>
                  <input 
                    className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all"
                    value={ackNo}
                    onChange={e => setAckNo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Summary & Recipient */}
        <div className="w-full lg:w-[420px] space-y-8">
          <div className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-[#FF6A00]" />
                <h3 className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/30">Recipient Profile</h3>
              </div>
              {isGstRegistered && (
                <span className="px-2 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded text-[0.55rem] font-black uppercase tracking-widest">GST Registered</span>
              )}
            </div>
            
            <div className="flex p-1.5 bg-[#080C14] rounded-xl border border-white/5">
              {['existing', 'new'].map(mode => (
                <button
                  key={mode}
                  onClick={() => { 
                    setCustomerMode(mode); 
                    if (mode === 'new') setSelectedCustomer(null); 
                    setFormErrors({}); 
                  }}
                  className={`flex-1 py-2.5 font-body font-[700] text-[0.65rem] uppercase tracking-[0.12em] rounded-lg transition-all ${
                    customerMode === mode ? 'bg-[#FF6A00] text-white shadow-lg' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  {mode === 'existing' ? 'Saved Customer' : 'New Customer'}
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
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 group relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-[1rem] text-white uppercase">{selectedCustomer.name}</p>
                        <p className="text-[0.7rem] font-bold text-white/50 mt-1">{selectedCustomer.phone}</p>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-white/20 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <p className="text-[0.7rem] font-body text-white/40"><span className="font-bold text-white/60">Address:</span> {selectedCustomer.address || '-'}</p>
                      <p className="text-[0.7rem] font-body text-white/40"><span className="font-bold text-white/60">Vehicle:</span> {selectedCustomer.vehicleNo || '-'}</p>
                      <p className="text-[0.7rem] font-body text-white/40"><span className="font-bold text-white/60">Transporter:</span> {selectedCustomer.transporter || '-'}</p>
                      {selectedCustomer.gstin && (
                        <p className="text-[0.7rem] font-body text-white/40"><span className="font-bold text-[#10B981]">GSTIN:</span> {selectedCustomer.gstin}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => window.open(`/customers/${selectedCustomer.id}`, '_blank')} 
                      className="w-full mt-2 py-2 border border-white/10 rounded-lg text-white/40 text-[0.65rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-all"
                    >
                      Edit Customer <Edit2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {customerMode === 'new' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <input 
                    placeholder="CUSTOMER FULL NAME *" 
                    className={`w-full h-[48px] px-5 rounded-xl bg-[#080C14] border ${formErrors.name ? 'border-red-500' : 'border-white/10'} text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]`}
                    value={newCustomerData.name} 
                    onChange={e => { setNewCustomerData({...newCustomerData, name: e.target.value}); setFormErrors({...formErrors, name: null}); }} 
                  />
                  {formErrors.name && <p className="text-red-500 text-[0.6rem] ml-2">{formErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <input 
                    placeholder="PHONE NUMBER *" 
                    className={`w-full h-[48px] px-5 rounded-xl bg-[#080C14] border ${formErrors.phone ? 'border-red-500' : 'border-white/10'} text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]`}
                    value={newCustomerData.phone} 
                    onChange={e => { setNewCustomerData({...newCustomerData, phone: e.target.value}); setFormErrors({...formErrors, phone: null}); }} 
                  />
                  {formErrors.phone && <p className="text-red-500 text-[0.6rem] ml-2">{formErrors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <input 
                    placeholder="ADDRESS *" 
                    className={`w-full h-[48px] px-5 rounded-xl bg-[#080C14] border ${formErrors.address ? 'border-red-500' : 'border-white/10'} text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]`}
                    value={newCustomerData.address} 
                    onChange={e => { setNewCustomerData({...newCustomerData, address: e.target.value}); setFormErrors({...formErrors, address: null}); }} 
                  />
                  {formErrors.address && <p className="text-red-500 text-[0.6rem] ml-2">{formErrors.address}</p>}
                </div>

                <div className="space-y-1">
                  <input 
                    placeholder="VEHICLE NUMBER *" 
                    className={`w-full h-[48px] px-5 rounded-xl bg-[#080C14] border ${formErrors.vehicleNo ? 'border-red-500' : 'border-white/10'} text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] uppercase transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]`}
                    value={newCustomerData.vehicleNo} 
                    onChange={e => { setNewCustomerData({...newCustomerData, vehicleNo: e.target.value}); setFormErrors({...formErrors, vehicleNo: null}); }} 
                  />
                  {formErrors.vehicleNo && <p className="text-red-500 text-[0.6rem] ml-2">{formErrors.vehicleNo}</p>}
                </div>

                <div className="space-y-1 pt-4 border-t border-white/5">
                  <input 
                    placeholder="GSTIN (OPTIONAL)" 
                    className={`w-full h-[48px] px-5 rounded-xl bg-[#080C14] border ${formErrors.gstin ? 'border-red-500' : 'border-white/10'} text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] uppercase transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]`}
                    value={newCustomerData.gstin} 
                    onChange={handleGSTINChange} 
                  />
                  {formErrors.gstin && <p className="text-red-500 text-[0.6rem] ml-2">{formErrors.gstin}</p>}
                </div>

                <div className="space-y-1">
                  <input 
                    placeholder={`PAN NUMBER ${newCustomerData.gstin ? '*' : '(OPTIONAL)'}`}
                    className={`w-full h-[48px] px-5 rounded-xl bg-[#080C14] border ${formErrors.pan ? 'border-red-500' : 'border-white/10'} text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] uppercase transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]`}
                    value={newCustomerData.pan} 
                    onChange={e => { setNewCustomerData({...newCustomerData, pan: e.target.value.toUpperCase()}); setFormErrors({...formErrors, pan: null}); }} 
                  />
                  {formErrors.pan && <p className="text-red-500 text-[0.6rem] ml-2">{formErrors.pan}</p>}
                </div>

                <div className="space-y-1">
                  <input 
                    placeholder="TRANSPORTER (OPTIONAL)" 
                    className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]"
                    value={newCustomerData.transporter} 
                    onChange={e => setNewCustomerData({...newCustomerData, transporter: e.target.value})} 
                  />
                </div>

                <div className="space-y-1 pt-4 border-t border-white/5">
                  <input 
                    placeholder="BANK NAME (OPTIONAL)" 
                    className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]"
                    value={newCustomerData.bankName} 
                    onChange={e => setNewCustomerData({...newCustomerData, bankName: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <input 
                    placeholder="ACCOUNT NUMBER (OPTIONAL)" 
                    className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]"
                    value={newCustomerData.accountNumber} 
                    onChange={e => setNewCustomerData({...newCustomerData, accountNumber: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <input 
                    placeholder="IFSC CODE (OPTIONAL)" 
                    className="w-full h-[48px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white font-body font-[700] text-[0.8rem] outline-none focus:border-[#FF6A00] uppercase transition-all placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-white/[0.50] placeholder:uppercase placeholder:tracking-[0.14em]"
                    value={newCustomerData.ifscCode} 
                    onChange={e => setNewCustomerData({...newCustomerData, ifscCode: e.target.value.toUpperCase()})} 
                  />
                </div>
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
              {isGstRegistered ? (
                <div className="flex flex-col py-3">
                  <div className="flex justify-between items-center">
                    <span className="font-body font-[400] text-[0.78rem] text-[#10B981] lowercase first-letter:uppercase">Standard GST (0%)</span>
                    <span className="font-body font-[600] text-[0.82rem] text-[#10B981]">₹0</span>
                  </div>
                  <span className="text-[0.65rem] text-[#10B981]/50 italic mt-1 text-right">Reverse Charge - GST Registered</span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-body font-[400] text-[0.78rem] text-white/50 lowercase first-letter:uppercase">Standard GST (5%)</span>
                  <span className="font-body font-[600] text-[0.82rem] text-white">₹{gstAmount.toLocaleString()}</span>
                </div>
              )}
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
                {['Cash', 'Online', 'Credit', 'Cheque'].map(mode => (
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
