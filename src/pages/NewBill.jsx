import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, ShoppingCart, CheckCircle, Printer, Share2, Users, Wallet, Minus, ArrowRight, Edit2, ChevronDown, ChevronUp, Lock, RefreshCw, UserPlus } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { createBill, getNextInvoiceNumber, resetInvoiceCounter } from '../firebase/bills';
import { addCustomer } from '../firebase/customers';
import { useAuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { queueWhatsAppBill } from '../utils/whatsapp';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PrintInvoice } from '../components/ui/PrintInvoice';
import { PasswordModal } from '../components/ui/PasswordModal';
import { Modal } from '../components/ui/Modal';
import { validateGSTIN, validatePAN, extractPANFromGSTIN } from '../utils/gstValidation';
import { amountToWords } from '../utils/amountToWords';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNextSerialNumber } from '../utils/serialNumber';
import gsap from 'gsap';

const NewBill = () => {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { user, profile, isReadOnly } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [billItems, setBillItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductResults, setShowProductResults] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  
  const [newCustomerData, setNewCustomerData] = useState({ 
    name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', transporter: '', balance: 0, bankName: '', accountNumber: '', ifscCode: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);

  // Additional Details (Optional)
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [ackNo, setAckNo] = useState('');
  const [billNo, setBillNo] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [overrideGrandTotal, setOverrideGrandTotal] = useState(null);
  const [loadingCounter, setLoadingCounter] = useState(true);
  const [isResetCounterModalOpen, setIsResetCounterModalOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const pageRef = useRef(null);

  // Fetch next bill number on mount to pre-fill the serial number
  useEffect(() => {
    const fetchNextBillNo = async () => {
      setLoadingCounter(true);
      try {
        const nextNo = await getNextInvoiceNumber();
        setBillNo(nextNo);
      } catch (err) {
        console.error("Failed to load next bill number", err);
      } finally {
        setLoadingCounter(false);
      }
    };
    fetchNextBillNo();
  }, []);

  useEffect(() => {
    // Read shopSettings from localStorage
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
    if (location.state?.duplicateBill && customers.length > 0) {
      const dup = location.state.duplicateBill;
      
      // Prefill customer
      if (dup.customerId) {
        const cust = customers.find(c => c.id === dup.customerId);
        if (cust) {
          setSelectedCustomer(cust);
        } else {
          setSelectedCustomer({
            id: dup.customerId,
            name: dup.customerName,
            phone: dup.customerPhone,
            address: dup.customerAddress,
            gstin: dup.customerGstin,
            pan: dup.customerPan,
            vehicleNo: dup.vehicleNo,
            transporter: dup.transporter,
            bankName: dup.customerBankName,
            accountNumber: dup.customerBankAccount,
            ifscCode: dup.customerIfsc
          });
        }
      } else if (dup.customerName) {
        setSelectedCustomer({
          id: null,
          name: dup.customerName || 'CASH CUSTOMER',
          phone: dup.customerPhone || '',
          address: dup.customerAddress || '',
          gstin: dup.customerGstin || '',
          pan: dup.customerPan || '',
          vehicleNo: dup.vehicleNo || '',
          transporter: dup.transporter || '',
          bankName: dup.customerBankName || '',
          accountNumber: dup.customerBankAccount || '',
          ifscCode: dup.customerIfsc || ''
        });
      } else {
        setSelectedCustomer(null);
      }

      // Prefill items
      const prefilledItems = dup.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        brand: item.brand || '',
        size: item.size || item.tyreSize || '',
        hsnCode: item.hsnCode || '4011',
        serialNo: getNextSerialNumber(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        baseGstPercent: item.gstPercent || 5,
        itemTotal: item.itemTotal
      }));
      setBillItems(prefilledItems);

      // Prefill extra details
      setPaymentMode(dup.paymentMode || 'Cash');
      setEwayBillNo(dup.ewayBillNo || '');
      setSerialNo(dup.serialNo || '');
      
      const dupSubtotal = dup.items ? dup.items.reduce((acc, item) => acc + item.itemTotal, 0) : 0;
      const dupIsGst = dup.customerGstin && dup.customerGstin !== '';
      const dupCalculatedGT = Math.round(dupIsGst ? dupSubtotal * 0.82 : dupSubtotal);
      if (dup.grandTotal && dup.grandTotal !== dupCalculatedGT) {
        setOverrideGrandTotal(dup.grandTotal);
      } else {
        setOverrideGrandTotal(null);
      }

      // Reset location state so refreshing does not prefill again
      window.history.replaceState({}, document.title);

      toast.success('Prefilled bill from template');
    }
  }, [location.state, customers]);

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

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.page-header', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 }
      );

      tl.fromTo('.animate-section', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6 },
        '-=0.4'
      );
    }, pageRef);

    return () => ctx.revert();
  }, [savedBill]);

  const isGstRegistered = !!selectedCustomer?.gstin;

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
        productName: product.size ? `${product.name} ${product.size}`.trim() : product.name,
        brand: product.brand,
        size: product.size || '',
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
  const calculatedDiscount = isGstRegistered ? subtotal * 0.18 : 0;
  const calculatedGrandTotal = Math.round(subtotal - calculatedDiscount);
  const grandTotal = overrideGrandTotal !== null ? (parseFloat(overrideGrandTotal) || 0) : calculatedGrandTotal;
  const discountAmount = overrideGrandTotal !== null ? (subtotal - grandTotal) : calculatedDiscount;
  const gstAmount = isGstRegistered ? subtotal * 0.18 : 0;
  const roundOff = overrideGrandTotal !== null ? 0 : (calculatedGrandTotal - (subtotal - calculatedDiscount));
  const balanceDue = Math.max(0, grandTotal - (parseFloat(amountPaid) || 0));

  const prevGrandTotalRef = useRef(grandTotal);
  useEffect(() => {
    if (paymentMode !== 'Credit') {
      if (amountPaid === prevGrandTotalRef.current) {
        setAmountPaid(grandTotal);
      }
    }
    prevGrandTotalRef.current = grandTotal;
  }, [grandTotal, paymentMode, amountPaid]);

  const handleGSTINChange = (e) => {
    const val = e.target.value.toUpperCase();
    const newFormData = { ...newCustomerData, gstin: val };
    if (val.length >= 15) {
      newFormData.pan = extractPANFromGSTIN(val);
    }
    setNewCustomerData(newFormData);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }

    const errors = {};
    if (newCustomerData.gstin) {
      const gstVal = validateGSTIN(newCustomerData.gstin);
      if (!gstVal.valid) errors.gstin = gstVal.error;
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

    try {
      const customerName = newCustomerData.name.trim() || 'CASH CUSTOMER';
      const customerToSave = {
        ...newCustomerData,
        name: customerName,
        totalBillsCount: 0,
        lastBillDate: null
      };

      const res = await addCustomer(customerToSave);
      const savedCustomer = {
        id: res.id,
        ...customerToSave
      };

      setSelectedCustomer(savedCustomer);
      setIsAddCustomerModalOpen(false);
      setNewCustomerData({
        name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', transporter: '', balance: 0, bankName: '', accountNumber: '', ifscCode: ''
      });
      setFormErrors({});
      toast.success('Customer created and selected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create customer');
    }
  };

  const handleSaveBill = async () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    if (billItems.length === 0) return toast.error('Empty Cart Protocol: Add assets to initialize');

    setIsSaving(true);

    const finalCustomerId = selectedCustomer?.id || null;
    const finalCustomerName = selectedCustomer?.name || 'CASH CUSTOMER';
    const finalCustomerPhone = selectedCustomer?.phone || '';
    const finalCustomerAddress = selectedCustomer?.address || '';
    const finalVehicleNo = selectedCustomer?.vehicleNo || '';
    const finalTransporter = selectedCustomer?.transporter || '';
    const finalGSTIN = selectedCustomer?.gstin || '';
    const finalPAN = selectedCustomer?.pan || '';
    const finalBankName = selectedCustomer?.bankName || '';
    const finalBankAccount = selectedCustomer?.accountNumber || '';
    const finalIfsc = selectedCustomer?.ifscCode || '';

    try {
      // Map bill items to have gstPercent = 0 if customer is GST registered
      const finalItems = billItems.map(item => ({
        ...item,
        gstPercent: isGstRegistered ? 0 : item.baseGstPercent
      }));

      const billData = {
        billNo: billNo ? billNo.trim() : undefined,
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerAddress: finalCustomerAddress,
        vehicleNo: finalVehicleNo,
        transporter: finalTransporter,
        customerGstin: finalGSTIN,
        customerPan: finalPAN,
        customerBankName: finalBankName,
        customerBankAccount: finalBankAccount,
        customerIfsc: finalIfsc,
        items: finalItems,
        subtotal,
        gstAmount,
        discountAmount: Number(discountAmount),
        roundOff: Number(roundOff),
        grandTotal,
        amountPaid: paymentMode === 'Credit' ? 0 : (amountPaid === '' ? grandTotal : (parseFloat(amountPaid) || 0)),
        balanceDue: paymentMode === 'Credit' ? grandTotal : balanceDue,
        paymentMode,
        ewayBillNo,
        ackDate,
        ackNo,
        serialNo: serialNo.trim(),
        createdBy: user.uid,
        createdByName: profile?.name || 'Staff'
      };

      const result = await createBill(billData);
      toast.success('Invoice Synchronized Successfully');
      const finalBill = { ...billData, billNo: result.billNo };
      
      if (shopSettings?.whatsappAutoSend !== false) {
        await queueWhatsAppBill(finalBill, shopSettings);
      }
      
      setSavedBill(finalBill);
    } catch (error) {
      toast.error('Synchronization Fault');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setBillItems([]);
    setSavedBill(null);
    setAmountPaid(0);
    setNewCustomerData({ name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', transporter: '', balance: 0, bankName: '', accountNumber: '', ifscCode: '' });
    setFormErrors({});
    setSelectedCustomer(null);
    setEwayBillNo('');
    setAckDate('');
    setAckNo('');
    setSerialNo('');
    setOverrideGrandTotal(null);
    setLoadingCounter(true);
    try {
      const nextNo = await getNextInvoiceNumber();
      setBillNo(nextNo);
    } catch (err) {
      console.error("Failed to load next bill number", err);
    } finally {
      setLoadingCounter(false);
    }
  };

  const handleResetCounterConfirm = async () => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    setLoadingCounter(true);
    try {
      await resetInvoiceCounter();
      setBillNo('0001');
      toast.success('Invoice counter reset to 0001');
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset invoice counter');
    } finally {
      setLoadingCounter(false);
    }
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
      <>
        <div ref={pageRef} className="max-w-2xl mx-auto py-20 no-print">
          <div className="bg-secondary/80 backdrop-blur-md p-12 rounded-[40px] border border-border/50 text-center space-y-8 shadow-glow">
            <div className="w-24 h-24 bg-accent-green/10 text-accent-green rounded-3xl mx-auto flex items-center justify-center border border-accent-green/20 shadow-glow-green">
              <CheckCircle size={48} />
            </div>
            <div>
              <h2 className="font-heading font-[800] text-[1.8rem] text-white uppercase tracking-wider">Log Synchronized</h2>
              <p className="font-mono text-white/40 mt-2 uppercase tracking-widest text-[0.8rem] font-black">Invoice Serial: <span className="text-accent font-bold">{savedBill.billNo}</span></p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <button onClick={handlePrint} className="h-16 rounded-2xl bg-white/5 border border-border/50 hover:bg-white/10 transition-all text-white font-heading font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-3">
                <Printer size={20} className="text-accent" /> Print Log
              </button>
              <button onClick={() => setShowResetModal(true)} className="h-16 rounded-2xl bg-accent text-primary font-heading font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-3 shadow-glow hover:bg-accent/85 transition-all">
                <Plus size={20} /> New Protocol
              </button>
            </div>
          </div>
        </div>

        <PrintInvoice bill={savedBill} shopSettings={shopSettings} safeFormatDate={safeFormatDate} amountToWords={amountToWords} />

        <PasswordModal 
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={handleReset}
        />
      </>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col gap-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 page-header">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase tracking-wider">New Terminal Invoice</h2>
          <p className="font-body italic font-[400] text-[0.72rem] text-text-muted uppercase mt-1">Point of Sale System</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: Items & Search */}
        <div className="flex-1 space-y-10 animate-section">
          <div className="p-8 rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 space-y-8">
            <div className="relative group z-20">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search assets by identity or manufacturer..."
                className="w-full pl-14 pr-6 h-[56px] rounded-xl outline-none font-body font-[400] italic text-[0.82rem] bg-primary/40 border border-border/50 text-white placeholder:text-text-muted/60 focus:border-accent focus:shadow-glow transition-all"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setShowProductResults(true)}
              />
              {showProductResults && filteredProducts.length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-border shadow-glow max-h-[400px] overflow-y-auto z-50 custom-scrollbar p-4"
                  style={{ backgroundColor: '#0D1B2A', opacity: 1 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        className="w-full p-5 flex flex-col justify-between text-left rounded-xl border border-border bg-[#080C14] hover:bg-[#FF6B00]/10 hover:border-[#FF6B00]/40 transition-all group"
                        onClick={() => addItem(p)}
                      >
                        <div className="mb-4">
                          <p className="font-heading font-[600] text-white text-[0.82rem] leading-tight group-hover:text-accent transition-colors">{p.name}</p>
                          <p className="font-body font-[400] text-[0.65rem] uppercase text-text-muted mt-1">{p.brand} {p.size ? `· ${p.size}` : ''}</p>
                        </div>
                        <div className="w-full flex items-end justify-between mt-auto pt-2 border-t border-border">
                          <p className={`font-mono font-[700] text-[0.62rem] uppercase ${p.currentQty <= p.minQty ? 'text-accent-red' : 'text-text-muted'}`}>{p.currentQty} Units</p>
                          <p className="font-mono font-[700] text-accent text-[0.9rem] leading-none">₹{p.sellingPrice.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-[600] text-[0.62rem] text-text-muted uppercase tracking-[0.16em]">ACTIVE CART ITEMS</h3>
                <span className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-lg font-mono font-[700] text-[0.62rem] uppercase">{billItems.length} ITEMS</span>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {billItems.map((item, i) => (
                  <div key={item.productId} className="flex items-center justify-between p-6 rounded-2xl bg-primary/20 border border-border/50 animate-row-entrance" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex-1">
                      <p className="font-heading font-[600] text-white text-[0.82rem]">{item.productName}</p>
                      <p className="font-body font-[400] text-[0.65rem] text-text-muted uppercase mt-1">
                        {item.brand} &nbsp;&middot;&nbsp; <span className="text-accent-gold font-[700] font-mono">Serial No: {item.serialNo}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-10">
                      <div className="flex items-center bg-primary/50 border border-border/50 rounded-xl overflow-hidden p-1">
                        <button onClick={() => updateItemQty(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"><Minus size={14} /></button>
                        <div className="w-10 text-center text-[0.85rem] font-mono font-black text-white">{item.quantity}</div>
                        <button onClick={() => updateItemQty(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"><Plus size={14} /></button>
                      </div>

                      <div className="w-32 text-right">
                        <p className="font-mono font-black text-accent text-[1.2rem]">₹{item.itemTotal.toLocaleString()}</p>
                        <p className="text-[0.6rem] font-mono font-black text-text-muted uppercase tracking-widest mt-1">₹{item.unitPrice} / Unit</p>
                      </div>

                      <button onClick={() => removeItem(item.productId)} className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                
                {billItems.length === 0 && (
                  <div className="py-24 text-center rounded-3xl bg-primary/10 border border-border border-dashed">
                    <ShoppingCart size={48} className="mx-auto text-text-muted/20 mb-6" />
                    <p className="text-[0.8rem] font-heading font-black uppercase tracking-[0.2em] text-text-muted">Initialize Selection Buffer</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50">
            <button 
              onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              className="w-full flex items-center justify-between font-heading font-[700] text-[0.72rem] text-white uppercase tracking-[0.12em]"
            >
              <span>Additional Details (Optional) - E-Way Bill</span>
              {showAdditionalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showAdditionalDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-dropdown-entrance">
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="text-[0.65rem] text-text-muted uppercase tracking-widest font-black">E-Way Bill No.</label>
                  <input 
                    className="w-full h-[48px] px-5 rounded-xl bg-primary/40 border border-border/50 text-white font-mono font-[700] text-[0.8rem] outline-none focus:border-accent focus:shadow-glow transition-all"
                    value={ewayBillNo}
                    onChange={e => setEwayBillNo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Summary & Recipient */}
        <div className="w-full lg:w-[420px] space-y-8 animate-section">
          <div className="p-8 rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 space-y-8">
            {/* Serial Number (Manual Input) Field */}
            <div className="space-y-2 pb-4">
              <label className="text-[0.62rem] font-heading font-black uppercase tracking-[0.16em] text-text-muted">Serial No.</label>
              <input
                type="text"
                placeholder="Enter Serial No..."
                className="w-full px-5 h-[48px] rounded-xl outline-none font-mono font-[700] text-[0.8rem] bg-primary/40 border border-border/50 text-white placeholder:font-[600] placeholder:text-[0.68rem] placeholder:text-text-muted placeholder:uppercase placeholder:tracking-[0.14em] focus:border-accent focus:shadow-glow transition-all"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
              />
            </div>

            {/* Invoice Number Field */}
            <div className="space-y-2 pb-4 border-b border-border/30">
              <div className="flex justify-between items-center">
                <label className="text-[0.62rem] font-heading font-black uppercase tracking-[0.16em] text-text-muted">Invoice Number</label>
                <button
                  type="button"
                  onClick={() => setIsResetCounterModalOpen(true)}
                  className="text-[0.65rem] font-heading font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  <RefreshCw size={10} /> Reset Counter
                </button>
              </div>
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={loadingCounter ? 'Fetching...' : billNo}
                  className="w-full px-5 h-[48px] rounded-xl outline-none font-mono font-[700] text-[0.82rem] bg-primary/20 border border-border/30 text-white/50 cursor-not-allowed select-none"
                />
                {!loadingCounter && (
                  <span className="absolute right-4 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[0.55rem] font-heading font-black text-accent tracking-wider uppercase">
                    AUTO
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-accent" />
                <h3 className="text-[0.7rem] font-heading font-black uppercase tracking-[0.2em] text-text-muted">Recipient Profile</h3>
              </div>
              {isGstRegistered && (
                <span className="px-2 py-1 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded text-[0.55rem] font-mono font-black uppercase tracking-widest">GST Registered</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  placeholder="Identify by name or phone..."
                  className="w-full pl-11 pr-4 h-[48px] rounded-xl bg-primary/40 border border-border/50 text-white font-body font-[700] text-[0.85rem] outline-none focus:border-accent focus:shadow-glow transition-all"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => { 
                  setNewCustomerData({
                    name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', transporter: '', balance: 0, bankName: '', accountNumber: '', ifscCode: ''
                  });
                  setFormErrors({});
                  setIsAddCustomerModalOpen(true);
                }}
                className="px-4 h-[48px] rounded-xl bg-accent text-primary font-heading font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-glow"
              >
                <UserPlus size={16} /> New
              </button>
            </div>

            {customerSearch && (
              <div 
                className="rounded-xl max-h-48 overflow-y-auto border border-border shadow-glow p-2 space-y-1 custom-scrollbar z-20 relative"
                style={{ backgroundColor: '#0A0F1E', opacity: 1 }}
              >
                {customers
                  .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                  .map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left p-4 rounded-lg hover:bg-accent/10 transition-all border-b border-border/20 last:border-none"
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                    >
                      <p className="font-heading font-black text-[0.8rem] text-white uppercase">{c.name}</p>
                      <p className="text-[0.6rem] font-mono font-black text-text-muted uppercase tracking-widest mt-1">{c.phone}</p>
                    </button>
                  ))}
              </div>
            )}

            {selectedCustomer ? (
              <div className="p-6 bg-primary/10 border border-border/30 rounded-2xl space-y-4 group relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-heading font-black text-[1rem] text-white uppercase">{selectedCustomer.name}</p>
                    <p className="text-[0.7rem] font-mono font-bold text-text-muted mt-1">{selectedCustomer.phone || 'No Phone'}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-text-muted hover:text-accent-red transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="pt-4 border-t border-border/30 space-y-2">
                  <p className="text-[0.7rem] font-body text-text-muted"><span className="font-bold text-white/60">Address:</span> {selectedCustomer.address || '-'}</p>
                  <p className="text-[0.7rem] font-body text-text-muted"><span className="font-bold text-white/60">Vehicle:</span> {selectedCustomer.vehicleNo || '-'}</p>
                  <p className="text-[0.7rem] font-body text-text-muted"><span className="font-bold text-white/60">Transporter:</span> {selectedCustomer.transporter || '-'}</p>
                  {selectedCustomer.gstin && (
                    <p className="text-[0.7rem] font-body text-text-muted"><span className="font-bold text-accent-green">GSTIN:</span> {selectedCustomer.gstin}</p>
                  )}
                </div>
                {selectedCustomer.id && (
                  <button 
                    onClick={() => window.open(`/customers/${selectedCustomer.id}`, '_blank')} 
                    className="w-full mt-2 py-2 border border-border/50 rounded-lg text-text-muted text-[0.65rem] font-heading font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent/10 hover:text-white hover:border-accent/30 transition-all"
                  >
                    Edit Customer <Edit2 size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 bg-primary/5 border border-border/20 border-dashed rounded-2xl text-center">
                <p className="text-[0.72rem] font-heading font-black uppercase tracking-wider text-text-muted">CASH CUSTOMER</p>
                <p className="text-[0.6rem] font-body text-text-muted/60 mt-1">Default guest transaction mode. All receipt parameters optional.</p>
              </div>
            )}
          </div>

          <div className="p-8 rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 space-y-10">
            <div className="space-y-6">
              <h3 className="font-heading font-[700] text-[0.72rem] text-white uppercase tracking-[0.12em]">BILL SUMMARY</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="font-body font-[400] text-[0.78rem] text-text-muted lowercase first-letter:uppercase">Protocol subtotal</span>
                <span className="font-mono font-[600] text-[0.82rem] text-white">₹{subtotal.toLocaleString()}</span>
              </div>
              {isGstRegistered ? (
                <>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-body font-[400] text-[0.78rem] text-text-muted lowercase first-letter:uppercase">CGST (9%)</span>
                    <span className="font-mono font-[600] text-[0.82rem] text-white">₹{(subtotal * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-body font-[400] text-[0.78rem] text-text-muted lowercase first-letter:uppercase">SGST (9%)</span>
                    <span className="font-mono font-[600] text-[0.82rem] text-white">₹{(subtotal * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-y border-border/30">
                    <span className="font-body font-[400] text-[0.78rem] text-accent-gold lowercase first-letter:uppercase">Discount (18% absorption)</span>
                    <span className="font-mono font-[600] text-[0.82rem] text-accent-gold">₹{discountAmount.toLocaleString()}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between items-center mt-2 pb-4 border-b border-border/30">
                <span className="font-body font-[400] text-[0.78rem] text-text-muted lowercase first-letter:uppercase">Round Off</span>
                <span className="font-mono font-[600] text-[0.82rem] text-white">
                  {roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-heading font-[700] text-[0.8rem] text-white/[0.70] uppercase">GRAND TOTAL</span>
                <div className="flex flex-col items-end gap-1">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-mono font-[700] text-[1.2rem] text-accent">₹</span>
                    <input
                      type="number"
                      placeholder={calculatedGrandTotal.toString()}
                      className="w-36 h-[40px] pl-8 pr-3 text-right rounded-lg bg-primary/40 border border-border/50 text-accent font-mono font-[700] text-[1.2rem] outline-none focus:border-accent focus:shadow-glow transition-all drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]"
                      value={overrideGrandTotal !== null ? overrideGrandTotal : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setOverrideGrandTotal(null);
                        } else {
                          setOverrideGrandTotal(val);
                        }
                      }}
                    />
                  </div>
                  {overrideGrandTotal !== null && (
                    <button
                      type="button"
                      onClick={() => setOverrideGrandTotal(null)}
                      className="text-[0.6rem] font-heading font-bold text-accent hover:text-accent/80 transition-colors bg-transparent border-none outline-none cursor-pointer uppercase tracking-wider mt-1"
                    >
                      Reset to Auto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex p-1 bg-primary/50 rounded-xl border border-border/50">
                {['Cash', 'Online', 'Credit', 'Cheque'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setPaymentMode(mode); if (mode !== 'Credit') setAmountPaid(grandTotal); else setAmountPaid(0); }}
                    className={`flex-1 py-2.5 font-heading font-[700] text-[0.65rem] uppercase tracking-[0.12em] rounded-lg transition-all ${
                      paymentMode === mode ? 'bg-accent text-primary shadow-glow font-black' : 'text-text-muted hover:text-white/45'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {paymentMode !== 'Credit' && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted">Settlement Amount</span>
                    <span className={`text-[0.6rem] font-mono font-black uppercase tracking-widest px-2 py-1 rounded-lg ${balanceDue > 0 ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' : 'bg-accent-green/10 text-accent-green border border-accent-green/20'}`}>
                      {balanceDue > 0 ? `Due: ₹${balanceDue.toLocaleString()}` : 'Settled'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={grandTotal.toString()}
                      className="w-full h-[56px] pl-5 pr-14 rounded-xl bg-primary/40 border border-border/50 text-white text-[1.2rem] font-black font-mono outline-none focus:border-accent focus:shadow-glow transition-all"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                    <Wallet className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  </div>
                </div>
              )}

              <button 
                className="w-full h-[64px] rounded-2xl bg-accent text-primary font-heading font-black text-[0.8rem] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:translate-y-[-2px] shadow-glow hover:shadow-glow-cyan transition-all disabled:opacity-50"
                disabled={isSaving || billItems.length === 0 || isReadOnly}
                onClick={handleSaveBill}
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
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
      <PasswordModal
        isOpen={isResetCounterModalOpen}
        onClose={() => setIsResetCounterModalOpen(false)}
        onConfirm={handleResetCounterConfirm}
        title="Reset Invoice Counter"
        subtitle="This will reset invoice numbering back to 0001. Next bill will be #0001."
        confirmLabel="Reset"
      />

      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Add New Customer"
        maxWidth="800px"
      >
        <form className="space-y-6 p-2" onSubmit={handleCreateCustomer}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Customer Full Name (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. John Doe"
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border ${formErrors.name ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={newCustomerData.name} 
                onChange={e => { setNewCustomerData({...newCustomerData, name: e.target.value}); setFormErrors({...formErrors, name: null}); }} 
              />
              {formErrors.name && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Phone Number (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. 9876543210"
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border ${formErrors.phone ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={newCustomerData.phone} 
                onChange={e => { setNewCustomerData({...newCustomerData, phone: e.target.value}); setFormErrors({...formErrors, phone: null}); }} 
              />
              {formErrors.phone && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Email Address (Optional)</label>
              <input 
                type="email"
                placeholder="e.g. john@example.com"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={newCustomerData.email} 
                onChange={e => setNewCustomerData({...newCustomerData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Vehicle Number (Optional)</label>
              <input 
                type="text"
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.vehicleNo ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6B00] transition-all admin-input-focus`}
                value={newCustomerData.vehicleNo} 
                onChange={e => { setNewCustomerData({...newCustomerData, vehicleNo: e.target.value}); setFormErrors({...formErrors, vehicleNo: null}); }} 
                placeholder="e.g. GJ-18-AB-1234"
              />
              {formErrors.vehicleNo && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.vehicleNo}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Address (Optional)</label>
            <textarea 
              className={`w-full h-[80px] p-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border ${formErrors.address ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus resize-none`}
              value={newCustomerData.address} 
              onChange={e => { setNewCustomerData({...newCustomerData, address: e.target.value}); setFormErrors({...formErrors, address: null}); }} 
              placeholder="Enter full address..."
            />
            {formErrors.address && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">GSTIN / GST Number (Optional)</label>
              <input 
                type="text"
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.gstin ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={newCustomerData.gstin} 
                onChange={handleGSTINChange} 
                placeholder="e.g. 24ABCDE1234F1Z5"
              />
              {formErrors.gstin ? (
                <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.gstin}</p>
              ) : (
                <p className="text-white/30 text-[0.65rem] ml-1 italic">Leave blank if customer does not have GST</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">PAN Number (Optional)</label>
              <input 
                type="text"
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.pan ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={newCustomerData.pan} 
                onChange={e => { setNewCustomerData({...newCustomerData, pan: e.target.value.toUpperCase()}); setFormErrors({...formErrors, pan: null}); }} 
                placeholder="e.g. ABCDE1234F"
              />
              {formErrors.pan && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.pan}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Opening Balance (₹) (Optional)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">₹</span>
                <input 
                  type="number"
                  className="w-full h-[52px] pl-9 pr-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                  value={newCustomerData.balance} 
                  onChange={e => setNewCustomerData({...newCustomerData, balance: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Transporter (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. VRL Logistics"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={newCustomerData.transporter} 
                onChange={e => setNewCustomerData({...newCustomerData, transporter: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Bank Name (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. SBI"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={newCustomerData.bankName} 
                onChange={e => setNewCustomerData({...newCustomerData, bankName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Account Number (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. 1234567890"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={newCustomerData.accountNumber} 
                onChange={e => setNewCustomerData({...newCustomerData, accountNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">IFSC Code (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. SBIN0001234"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={newCustomerData.ifscCode} 
                onChange={e => setNewCustomerData({...newCustomerData, ifscCode: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button" 
              onClick={() => setIsAddCustomerModalOpen(false)} 
              className="flex-1 h-[56px] rounded-xl bg-transparent border border-white/20 text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 h-[56px] rounded-xl bg-[#FF6A00] text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all admin-btn-hover"
            >
              Create and Select
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NewBill;
