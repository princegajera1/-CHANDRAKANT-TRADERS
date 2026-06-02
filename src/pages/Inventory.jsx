import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useAuthContext } from '../context/AuthContext';
import { Search, Plus, Eye, Edit2, Trash2, Package, X, AlertTriangle, Lock } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { addProduct, updateProduct } from '../firebase/products';
import { moveToTrash } from '../firebase/trash';
import { toast } from 'react-hot-toast';
import gsap from 'gsap';

const Inventory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { isReadOnly } = useAuthContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [statModal, setStatModal] = useState(null);
  const [formData, setFormData] = useState({
    name: '', brand: 'MRF', size: '', category: 'Tyre',
    currentQty: 0, minQty: 5, purchasePrice: 0, sellingPrice: 0,
    hsnCode: '4011', gstPercent: 5
  });

  const pageRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('filter') === 'low-stock') {
      setCategoryFilter('Low Stock');
    }
    const editId = params.get('edit');
    if (editId && products.length > 0 && !isModalOpen) {
      const p = products.find(prod => prod.id === editId);
      if (p) {
        setEditingProduct(p);
        setFormData(p);
        setIsModalOpen(true);
        // Cleanup the URL so it doesn't trigger again on refresh
        navigate('/inventory', { replace: true });
      }
    }
  }, [location.search, products, navigate, isModalOpen]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.page-header-block', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 }
      );

      tl.fromTo('.stat-card-item', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.6 },
        '-=0.4'
      );

      tl.fromTo('.controls-block',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.3'
      );

      tl.fromTo('.table-block',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      );
    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  // GSAP Row Stagger on filter/search change
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (categoryFilter === 'Low Stock') {
      return matchesSearch && p.currentQty <= p.minQty;
    }
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.row-item-stagger', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, stagger: 0.02, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [loading, filteredProducts.length, searchTerm, categoryFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    try {
      const finalData = { ...formData };
      
      // Process custom inputs
      if (finalData.brand === 'Other' && finalData.customBrand) {
        finalData.brand = finalData.customBrand.trim();
      }
      if (finalData.category === 'Other' && finalData.customCategory) {
        finalData.category = finalData.customCategory.trim();
      }
      
      // Remove temporary custom fields before sending to db
      delete finalData.customBrand;
      delete finalData.customCategory;

      if (editingProduct) {
        await updateProduct(editingProduct.id, finalData);
        toast.success('Asset updated successfully');
      } else {
        await addProduct(finalData);
        toast.success('Asset initialized successfully');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to commit asset data');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', brand: 'MRF', size: '', category: 'Tyre',
      currentQty: 0, minQty: 5, purchasePrice: 0, sellingPrice: 0,
      hsnCode: '4011', gstPercent: 5
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setIsSpecsOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) {
      try {
        await moveToTrash('products', isDeleting);
        toast.success('Asset moved to Recycle Bin');
        setIsDeleting(null);
      } catch (error) {
        toast.error('Failed to purge asset');
      }
    }
  };

  const stats = [
    { label: 'Total Assets', val: products.length, icon: Package, color: '#00D4FF', glow: 'shadow-glow' },
    { label: 'Inventory Valuation', val: products.reduce((acc, p) => acc + (p.sellingPrice * p.currentQty), 0), icon: Package, color: '#00E676', isCurrency: true, glow: 'shadow-glow-green' },
    { label: 'Critical Alerts', val: products.filter(p => p.currentQty <= p.minQty).length, icon: Package, color: '#FF3D57', glow: 'shadow-glow-red' }
  ];

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Syncing Inventory Protocols...</div>;

  return (
    <div ref={pageRef} className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="page-header-block flex flex-col md:flex-row md:items-center justify-between gap-6 opacity-0">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase tracking-wider">Inventory Management</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-[#8899A6] mt-1 sentence-case first-letter:uppercase">Stock management and asset tracking</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); resetForm(); setIsModalOpen(true); }}
          disabled={isReadOnly}
          className="h-[52px] px-8 rounded-2xl bg-accent text-primary font-body font-[700] text-[0.8rem] uppercase tracking-[0.14em] shadow-glow hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isReadOnly ? "Read-Only Mode - Upgrade to add assets" : ""}
        >
          <Plus size={20} /> <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => setStatModal(stat.label)}
            className={`stat-card-item p-8 rounded-[24px] bg-secondary/80 border border-border flex items-center gap-6 cursor-pointer hover:border-white/20 transition-all duration-300 backdrop-blur-md opacity-0 ${stat.glow}`}
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center relative" 
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ backgroundColor: stat.color }}></div>
              <stat.icon size={28} className="relative z-10" />
            </div>
            <div>
              <p className="text-[0.65rem] font-black text-white/40 uppercase tracking-[0.2em]">{stat.label}</p>
              <h4 className="text-[1.4rem] font-heading font-bold text-white mt-1 uppercase tracking-tighter">
                <AnimatedNumber value={stat.val} prefix={stat.isCurrency ? "₹" : ""} />
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="controls-block p-8 rounded-[24px] bg-secondary/80 border border-border flex flex-col md:flex-row gap-6 backdrop-blur-md opacity-0">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8899A6] group-focus-within:text-accent transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search assets by name or brand identity..."
            className="w-full bg-primary/60 border border-border rounded-xl py-4 pl-14 pr-6 text-[0.875rem] font-[400] font-body text-white placeholder:text-white/[0.25] outline-none focus:border-accent focus:shadow-glow transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-primary/60 border border-border rounded-xl px-8 py-4 text-[0.68rem] font-[700] font-body text-white uppercase tracking-[0.12em] outline-none focus:border-accent transition-all cursor-pointer"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All" className="bg-secondary text-white">ALL PROTOCOLS</option>
          <option value="Low Stock" className="bg-secondary text-white">CRITICAL ALERTS</option>
          <option value="Tyre" className="bg-secondary text-white">TYRE ASSETS</option>
          <option value="Tube" className="bg-secondary text-white">TUBE ASSETS</option>
          <option value="Flap" className="bg-secondary text-white">FLAP ASSETS</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-block rounded-[32px] bg-secondary/80 border border-border overflow-hidden backdrop-blur-md opacity-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-white/[0.01]">
                <th className="p-8 font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em]">Product Identity</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em]">Inventory Status</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] text-right">Valuation</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="row-item-stagger group hover:bg-[#00D4FF]/[0.02] transition-all opacity-0">
                  <td className="p-8">
                    <p className="font-body font-[600] text-[0.875rem] text-white group-hover:text-accent transition-colors">{p.name}</p>
                    <p className="mt-1 flex items-center gap-2">
                      <span className="font-body font-[700] text-[0.62rem] text-accent uppercase tracking-[0.08em]">{p.brand}</span>
                      <span className="text-white/20">·</span>
                      <span className="font-body font-[400] text-[0.68rem] text-[#8899A6] uppercase tracking-[0.1em]">{p.category}</span>
                      {p.size && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="font-body font-[400] text-[0.75rem] text-white/50">{p.size}</span>
                        </>
                      )}
                    </p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.currentQty <= p.minQty ? 'bg-[#FF3D57] shadow-glow-red' : 'bg-[#00E676] shadow-glow-green'}`}></div>
                      <span className={`font-body font-[700] text-[0.875rem] ${p.currentQty <= p.minQty ? 'text-[#FF3D57]' : 'text-white'}`}>{p.currentQty}</span>
                      <span className="font-body font-[500] text-[0.62rem] text-[#8899A6] tracking-[0.1em] uppercase">UNITS</span>
                      {p.currentQty <= p.minQty && (
                        <span className="ml-2 font-body font-[700] text-[0.65rem] text-[#FF3D57] tracking-[0.06em] uppercase border border-[#FF3D57]/20 bg-[#FF3D57]/10 px-2 py-0.5 rounded-[4px]">LOW STOCK</span>
                      )}
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <p className="font-heading font-[700] text-[1rem] text-[#00E676]">₹{p.sellingPrice.toLocaleString()}</p>
                    <p className="font-body font-[400] text-[0.62rem] text-[#8899A6] uppercase tracking-[0.08em] mt-1">MRP INCL GST</p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleView(p)} className="p-3 rounded-xl bg-white/5 text-white/30 hover:text-primary hover:bg-accent transition-all duration-200" title="View details"><Eye size={18} /></button>
                      <button onClick={() => handleEdit(p)} className="p-3 rounded-xl bg-white/5 text-white/30 hover:text-primary hover:bg-[#00E676] transition-all duration-200" title="Edit item"><Edit2 size={18} /></button>
                      <button onClick={() => setIsDeleting(p.id)} className="p-3 rounded-xl bg-white/5 text-white/30 hover:text-white hover:bg-[#FF3D57] transition-all duration-200" title="Delete item"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-[#8899A6] font-body text-[0.95rem] italic">
                    No matching assets found in the inventory registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product View Modal */}
      <Modal isOpen={isSpecsOpen} onClose={() => setIsSpecsOpen(false)} title="View Product" footer={
        <div className="flex justify-end w-full">
          <button onClick={() => setIsSpecsOpen(false)} className="py-3 px-8 rounded-xl bg-white/5 text-[0.75rem] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">Close</button>
        </div>
      }>
        {selectedProduct && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-white/5">
              <h4 className="text-[1.8rem] font-heading font-black text-white uppercase tracking-tighter leading-none mb-4">{selectedProduct.name}</h4>
              <div className="flex items-center justify-center gap-3">
                <span className="px-3 py-1 rounded-lg font-body font-[700] text-[0.6rem] uppercase tracking-[0.14em] bg-accent/10 text-accent border border-accent/20">{selectedProduct.brand}</span>
                <span className="px-3 py-1 rounded-lg font-body font-[700] text-[0.6rem] uppercase tracking-[0.14em] bg-blue-500/10 text-blue-400 border border-blue-500/20">{selectedProduct.category}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[0.65rem] font-black text-[#8899A6] uppercase tracking-widest mb-1">Size</p>
                <p className="text-[0.95rem] font-[600] text-white">{selectedProduct.size || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[0.65rem] font-black text-[#8899A6] uppercase tracking-widest mb-1">GST Percent</p>
                <p className="text-[0.95rem] font-[600] text-white">{selectedProduct.gstPercent}%</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[0.65rem] font-black text-[#8899A6] uppercase tracking-widest mb-1">Stock Quantity</p>
                <p className={`text-[0.95rem] font-[600] ${selectedProduct.currentQty <= selectedProduct.minQty ? 'text-[#FF3D57]' : 'text-white'}`}>{selectedProduct.currentQty} Units</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[0.65rem] font-black text-[#8899A6] uppercase tracking-widest mb-1">Min Stock Limit</p>
                <p className="text-[0.95rem] font-[600] text-white">{selectedProduct.minQty} Units</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[0.65rem] font-black text-[#8899A6] uppercase tracking-widest mb-1">Purchase Price</p>
                <p className="text-[0.95rem] font-[600] text-[#00E676]">₹{selectedProduct.purchasePrice.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[0.65rem] font-black text-[#8899A6] uppercase tracking-widest mb-1">Selling Price</p>
                <p className="text-[0.95rem] font-[600] text-accent">₹{selectedProduct.sellingPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!isDeleting} onClose={() => setIsDeleting(null)} title="Move to Recycle Bin?">
        <div className="p-4 text-center space-y-6">
          <p className="text-white/60 text-[0.9rem] font-medium leading-relaxed">This item will be moved to the recycle bin. You can restore it later.</p>
          <div className="flex gap-4 pt-2">
            <button onClick={() => setIsDeleting(null)} className="flex-1 py-4 rounded-xl bg-transparent border border-white/20 text-[0.75rem] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={handleDeleteConfirm} className="flex-1 py-4 rounded-xl bg-[#FF3D57] text-[0.75rem] font-black uppercase tracking-widest text-white shadow-glow-red hover:bg-[#FF3D57]/80 transition-all">Confirm</button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "Add New Product"} maxWidth="720px">
        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          <div className="space-y-2">
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Product Name *</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Manufacturer *</label>
              <select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent transition-all cursor-pointer">
                <option value="MRF" className="bg-secondary text-white">MRF</option>
                <option value="CEAT" className="bg-secondary text-white">CEAT</option>
                <option value="Apollo" className="bg-secondary text-white">Apollo</option>
                <option value="JK Tyre" className="bg-secondary text-white">JK Tyre</option>
                <option value="Michelin" className="bg-secondary text-white">Michelin</option>
                <option value="TVS" className="bg-secondary text-white">TVS</option>
                {products.map(p => p.brand).filter((v, i, a) => a.indexOf(v) === i && !['MRF','CEAT','Apollo','JK Tyre','Michelin','TVS','Other'].includes(v)).map(brand => (
                  <option key={brand} value={brand} className="bg-secondary text-white">{brand}</option>
                ))}
                <option value="Other" className="bg-secondary text-accent">✚ Add Custom...</option>
              </select>
              {formData.brand === 'Other' && (
                <input type="text" placeholder="Enter custom manufacturer..." autoFocus required value={formData.customBrand || ''} onChange={e => setFormData({...formData, customBrand: e.target.value})} className="w-full h-[48px] px-5 mt-2 rounded-xl bg-primary border border-accent text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Classification *</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent transition-all cursor-pointer">
                <option value="Tyre" className="bg-secondary text-white">Tyre</option>
                <option value="Tube" className="bg-secondary text-white">Tube</option>
                <option value="Flap" className="bg-secondary text-white">Flap</option>
                <option value="Battery" className="bg-secondary text-white">Battery</option>
                <option value="Accessory" className="bg-secondary text-white">Accessory</option>
                {products.map(p => p.category).filter((v, i, a) => a.indexOf(v) === i && !['Tyre','Tube','Flap','Battery','Accessory','Other'].includes(v)).map(cat => (
                  <option key={cat} value={cat} className="bg-secondary text-white">{cat}</option>
                ))}
                <option value="Other" className="bg-secondary text-accent">✚ Add Custom...</option>
              </select>
              {formData.category === 'Other' && (
                <input type="text" placeholder="Enter custom classification..." autoFocus required value={formData.customCategory || ''} onChange={e => setFormData({...formData, customCategory: e.target.value})} className="w-full h-[48px] px-5 mt-2 rounded-xl bg-primary border border-accent text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Tyre Size (e.g. 155/70 R13) *</label>
              <input type="text" required value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">GST Tax (%) *</label>
              <input type="number" required min="0" max="100" value={formData.gstPercent} onChange={e => setFormData({...formData, gstPercent: Number(e.target.value)})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Stock Quantity (Units) *</label>
              <input type="number" required min="0" value={formData.currentQty} onChange={e => setFormData({...formData, currentQty: Number(e.target.value)})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Critical Limit *</label>
              <input type="number" required min="0" value={formData.minQty} onChange={e => setFormData({...formData, minQty: Number(e.target.value)})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Procurement Value (₹) *</label>
              <input type="number" required min="0" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-white text-[0.85rem] font-bold outline-none focus:border-accent focus:shadow-glow transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#8899A6] ml-1">Terminal Value (₹) *</label>
              <input type="number" required min="0" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} className="w-full h-[48px] px-5 rounded-xl bg-primary border border-border text-accent text-[0.85rem] font-black outline-none focus:border-accent focus:shadow-glow transition-all" />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-[56px] rounded-xl bg-transparent border border-white/20 text-[0.75rem] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" disabled={isReadOnly} className="flex-1 h-[56px] rounded-xl bg-accent text-primary font-body font-bold text-[0.75rem] uppercase tracking-widest shadow-glow hover:shadow-[0_0_25px_rgba(0,212,255,0.45)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isReadOnly ? <><Lock size={14} className="inline mr-2" /> Read Only Mode</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stat Detail Modal */}
      <Modal isOpen={!!statModal} onClose={() => setStatModal(null)} title={statModal}>
        <div className="space-y-4">
          <p className="text-accent text-[0.65rem] font-black uppercase tracking-[0.2em] mb-4">Detailed View - {statModal}</p>
          <div className="overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
            {statModal === 'Total Assets' && products.map(p => (
              <div key={p.id} className="p-4 bg-primary border border-border rounded-xl mb-2 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <p className="text-[#8899A6] text-xs">{p.brand} &middot; {p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">₹{p.sellingPrice}</p>
                  <p className="text-[#8899A6] text-xs">{p.currentQty} Units</p>
                </div>
              </div>
            ))}
            {statModal === 'Inventory Valuation' && products.map(p => (
              <div key={p.id} className="p-4 bg-primary border border-border rounded-xl mb-2 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <p className="text-[#8899A6] text-xs">{p.currentQty} Units @ ₹{p.sellingPrice}</p>
                </div>
                <p className="font-bold text-[#00E676]">₹{(p.currentQty * p.sellingPrice).toLocaleString()}</p>
              </div>
            ))}
            {statModal === 'Critical Alerts' && products.filter(p => p.currentQty <= p.minQty).map(p => (
              <div key={p.id} className="p-4 bg-[#FF3D57]/5 border border-[#FF3D57]/20 rounded-xl mb-2 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-[#FF3D57]" size={16} />
                  <div>
                    <h4 className="font-bold text-white text-sm">{p.name}</h4>
                    <p className="text-[#FF3D57]/70 text-xs">Stock: {p.currentQty} (Min: {p.minQty})</p>
                  </div>
                </div>
                <button onClick={() => { setStatModal(null); handleEdit(p); }} className="px-3 py-1 bg-[#FF3D57]/10 text-[#FF3D57] rounded text-xs font-bold uppercase hover:bg-[#FF3D57]/20">Update</button>
              </div>
            ))}
            {statModal === 'Critical Alerts' && products.filter(p => p.currentQty <= p.minQty).length === 0 && (
               <p className="text-[#8899A6] text-sm text-center py-8">No critical alerts at this time.</p>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Inventory;
