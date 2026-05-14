import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Package, ShoppingBag, MessageSquare, User as UserIcon, Bell, 
  Search, Filter, CheckCircle, XCircle, Clock, ChevronRight, Eye, Send, Lock,
  FileText, Plus, LogOut, Menu, X, ArrowRight
} from 'lucide-react';

// --- DUMMY DATA FOR DEMO ---
const MOCK_ORDERS = [
  { id: 'ORD-2026-891', date: '14 May 2026', items: 12, total: 45000, status: 'Active' },
  { id: 'ORD-2026-890', date: '12 May 2026', items: 3, total: 12500, status: 'Delivered' },
  { id: 'ORD-2026-889', date: '05 May 2026', items: 8, total: 32000, status: 'Cancelled' },
];

const MOCK_CATALOGUE = [
  { id: 'P01', name: 'High-Performance Brake Pads', price: 2500, stock: 'In Stock', img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400' },
  { id: 'P02', name: 'Synthetic Engine Oil 5W-40', price: 3200, stock: 'Low Stock', img: 'https://images.unsplash.com/photo-1615887023516-9dcafadcefa1?auto=format&fit=crop&q=80&w=400' },
  { id: 'P03', name: 'Premium Oil Filter', price: 850, stock: 'In Stock', img: 'https://images.unsplash.com/photo-1635766291689-18330756a1b6?auto=format&fit=crop&q=80&w=400' },
  { id: 'P04', name: 'Ceramic Spark Plugs (Set of 4)', price: 1800, stock: 'Out of Stock', img: 'https://images.unsplash.com/photo-1600705723000-84a1e959cebf?auto=format&fit=crop&q=80&w=400' },
];

const MOCK_INQUIRIES = [
  { id: 'INQ-101', date: '13 May 2026', subject: 'Bulk Order Pricing for Brake Pads', status: 'Pending' },
  { id: 'INQ-100', date: '10 May 2026', subject: 'Compatibility of Engine Oil', status: 'Responded' },
];

// --- SHARED UI COMPONENTS ---
const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-[#0E1119] border border-[#FF6B00]/12 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#FF6B00]/40 hover:shadow-[0_0_15px_rgba(255,107,0,0.2)] ${onClick ? 'cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "font-heading font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#FF6B00] text-white hover:bg-[#ff8020] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,0,0.4)] px-6 py-3",
    secondary: "bg-[#080A0F] border border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/10 px-6 py-3",
    ghost: "text-[#6A7080] hover:text-[#FF6B00] hover:bg-[#FF6B00]/10 px-4 py-2"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const StatusBadge = ({ status }) => {
  const colors = {
    Active: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
    Cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
    Pending: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    Responded: 'text-green-400 bg-green-400/10 border-green-400/20',
    Closed: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${colors[status] || colors.Pending}`}>
      {status}
    </span>
  );
};

// --- MODAL ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0E1119] border border-[#FF6B00]/20 rounded-2xl w-full max-w-lg overflow-hidden animate-[scaleIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <h2 className="font-heading font-bold text-xl text-[#F0F0F0] uppercase tracking-wider">{title}</h2>
          <button onClick={onClose} className="text-[#6A7080] hover:text-[#FF6B00]"><X size={24} /></button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

// --- PAGES ---

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#FF6B00]/20 to-transparent p-6 rounded-2xl border border-[#FF6B00]/20 flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white uppercase tracking-wider">Welcome Back, Alex</h1>
          <p className="text-[#6A7080] text-sm mt-1">Last login: Today, 10:23 AM</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Orders', val: '24', icon: ShoppingBag, path: '/orders' },
          { title: 'Pending Orders', val: '2', icon: Clock, path: '/orders?filter=Active' },
          { title: 'Total Spent', val: '₹1.2M', icon: FileText, path: '/orders' },
          { title: 'Loyalty Points', val: '450', icon: CheckCircle, path: '/profile' }
        ].map((s, i) => (
          <Card key={i} onClick={() => navigate(s.path)}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-[#FF6B00]/10 rounded-xl text-[#FF6B00]"><s.icon size={20} /></div>
            </div>
            <p className="text-[#6A7080] text-[0.65rem] font-bold uppercase tracking-widest mb-1">{s.title}</p>
            <h3 className="text-[#F0F0F0] font-heading font-bold text-2xl">{s.val}</h3>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-lg uppercase text-white">Recent Orders</h2>
            <Button variant="ghost" onClick={() => navigate('/orders')}>View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#6A7080] text-[0.65rem] uppercase tracking-widest border-b border-white/5">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Items</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ORDERS.map(o => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="py-4 text-sm font-semibold text-white">{o.id}</td>
                    <td className="py-4 text-sm text-[#6A7080]">{o.items}</td>
                    <td className="py-4 text-sm font-bold text-[#FF6B00]">₹{o.total.toLocaleString()}</td>
                    <td className="py-4"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="lg:w-80 space-y-4">
          <Button onClick={() => navigate('/catalogue')} className="w-full h-16"><Search size={20}/> View Catalogue</Button>
          <Button onClick={() => navigate('/inquiries')} variant="secondary" className="w-full h-16"><MessageSquare size={20}/> New Inquiry</Button>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const filtered = filter === 'All' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl text-white uppercase tracking-wider">My Orders</h1>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Active', 'Delivered', 'Cancelled'].map(f => (
          <button 
            key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-[#FF6B00] text-white' : 'bg-[#0E1119] text-[#6A7080] hover:text-white border border-white/5'}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-4">
        {filtered.map(o => (
          <Card key={o.id} onClick={() => setSelectedOrder(o)} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-heading font-bold text-lg text-white">{o.id}</h3>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-[#6A7080] text-xs font-semibold">{o.date} &middot; {o.items} Items</p>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-heading font-bold text-xl text-[#FF6B00]">₹{o.total.toLocaleString()}</span>
              <ChevronRight className="text-[#6A7080]" />
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.id}`}>
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#6A7080] text-xs uppercase tracking-widest mb-1">Status</p>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="text-right">
                <p className="text-[#6A7080] text-xs uppercase tracking-widest mb-1">Total</p>
                <p className="font-heading font-bold text-2xl text-[#FF6B00]">₹{selectedOrder.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4">
              <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Items List</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-[#6A7080]"><p>Brake Pads x4</p><p>₹10,000</p></div>
                <div className="flex justify-between text-sm text-[#6A7080]"><p>Engine Oil x8</p><p>₹25,600</p></div>
              </div>
            </div>
            <Button className="w-full"><FileText size={18}/> Download Invoice</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

const Catalogue = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="font-heading font-bold text-2xl text-white uppercase tracking-wider">Product Catalogue</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A7080]" size={18}/>
            <input type="text" placeholder="Search parts..." className="w-full bg-[#0E1119] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#FF6B00] outline-none transition-colors" />
          </div>
          <Button variant="secondary" className="px-3 py-2"><Filter size={18}/></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_CATALOGUE.map(p => (
          <div key={p.id} onClick={() => setSelectedProduct(p)} className="group relative bg-[#0E1119] border border-[#FF6B00]/12 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-[#FF6B00]/50 hover:shadow-[0_10px_30px_rgba(255,107,0,0.2)]">
            <div className="h-40 w-full overflow-hidden relative">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-[#080A0F]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <span className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg font-heading font-bold uppercase tracking-widest text-sm flex items-center gap-2"><Eye size={16}/> View Details</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold text-sm line-clamp-1 mb-2">{p.name}</h3>
              <div className="flex justify-between items-center">
                <span className="font-heading font-bold text-lg text-[#FF6B00]">₹{p.price.toLocaleString()}</span>
                <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-1 rounded border ${p.stock.includes('In') ? 'text-green-400 border-green-400/20 bg-green-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}>{p.stock}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Product Intelligence">
        {selectedProduct && (
          <div className="space-y-6">
            <img src={selectedProduct.img} className="w-full h-48 object-cover rounded-xl border border-white/10" alt="product"/>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedProduct.name}</h3>
              <p className="text-[#6A7080] text-sm">High-performance automotive component designed for extreme durability and precision. Authorized part for certified vehicles.</p>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#080A0F] rounded-xl border border-white/5">
              <div>
                <p className="text-[#6A7080] text-xs uppercase tracking-widest mb-1">Unit Price</p>
                <p className="font-heading font-bold text-2xl text-[#FF6B00]">₹{selectedProduct.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[#6A7080] text-xs uppercase tracking-widest mb-1">Availability</p>
                <p className="font-bold text-white">{selectedProduct.stock}</p>
              </div>
            </div>
            <Button className="w-full"><MessageSquare size={18}/> Add to Inquiry</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

const Inquiries = () => {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-heading font-bold text-2xl text-white uppercase tracking-wider">My Inquiries</h1>
        <Button onClick={() => setShowNew(true)} className="px-4 py-2 text-xs"><Plus size={16}/> New Inquiry</Button>
      </div>

      <div className="grid gap-4">
        {MOCK_INQUIRIES.map(i => (
          <Card key={i.id} className="flex justify-between items-center gap-4">
            <div>
              <h3 className="font-semibold text-white mb-1">{i.subject}</h3>
              <p className="text-[#6A7080] text-xs">{i.id} &middot; {i.date}</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={i.status} />
              <ChevronRight className="text-[#6A7080]" />
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Transmit New Inquiry">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowNew(false); }}>
          <div>
            <label className="block text-[#6A7080] text-xs font-bold uppercase tracking-widest mb-2">Subject</label>
            <input required type="text" className="w-full bg-[#080A0F] border border-white/10 rounded-xl p-3 text-white focus:border-[#FF6B00] outline-none" placeholder="Enter subject" />
          </div>
          <div>
            <label className="block text-[#6A7080] text-xs font-bold uppercase tracking-widest mb-2">Message Payload</label>
            <textarea required rows="4" className="w-full bg-[#080A0F] border border-white/10 rounded-xl p-3 text-white focus:border-[#FF6B00] outline-none" placeholder="Describe your request..."></textarea>
          </div>
          <Button type="submit" className="w-full"><Send size={18}/> Transmit Request</Button>
        </form>
      </Modal>
    </div>
  );
};

const Profile = () => (
  <div className="space-y-6 max-w-2xl mx-auto">
    <h1 className="font-heading font-bold text-2xl text-white uppercase tracking-wider mb-8">Identity Protocol</h1>
    
    <Card className="flex items-center gap-6 mb-6">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center text-3xl font-heading font-black text-white shadow-[0_0_20px_rgba(255,107,0,0.3)]">
        AP
      </div>
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Alex Patron</h2>
        <p className="text-[#6A7080] text-sm">Authorized Client Level 4</p>
      </div>
    </Card>

    <Card className="space-y-4">
      <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Profile Data</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#6A7080] text-xs font-bold uppercase tracking-widest mb-2">Full Name</label>
          <input type="text" defaultValue="Alex Patron" className="w-full bg-[#080A0F] border border-white/10 rounded-xl p-3 text-white focus:border-[#FF6B00] outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-[#6A7080] text-xs font-bold uppercase tracking-widest mb-2">Email Address</label>
          <input type="email" defaultValue="alex@network.com" className="w-full bg-[#080A0F] border border-white/10 rounded-xl p-3 text-white focus:border-[#FF6B00] outline-none transition-colors" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[#6A7080] text-xs font-bold uppercase tracking-widest mb-2">Operating Address</label>
          <input type="text" defaultValue="Sector 7G, Industrial Area" className="w-full bg-[#080A0F] border border-white/10 rounded-xl p-3 text-white focus:border-[#FF6B00] outline-none transition-colors" />
        </div>
      </div>
      <Button className="mt-4"><CheckCircle size={18}/> Update Identity</Button>
    </Card>
  </div>
);

const AuthLayout = ({ children }) => {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div className="min-h-screen bg-[#080A0F] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80')] bg-cover opacity-20"></div>
      <div className="w-full max-w-md relative z-10 bg-[#0E1119]/90 backdrop-blur-xl border border-[#FF6B00]/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-[#FF6B00] rounded-xl flex items-center justify-center text-white font-heading font-black text-2xl shadow-[0_0_20px_rgba(255,107,0,0.4)]">CT</div>
        </div>
        <div className="flex gap-2 bg-[#080A0F] p-1 rounded-xl mb-8 border border-white/5">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${isLogin ? 'bg-[#FF6B00] text-white shadow-lg' : 'text-[#6A7080] hover:text-white'}`}>Login</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${!isLogin ? 'bg-[#FF6B00] text-white shadow-lg' : 'text-[#6A7080] hover:text-white'}`}>Register</button>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = '/customer'; }}>
          {!isLogin && (
             <div className="relative">
               <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6A7080]" size={18}/>
               <input required type="text" placeholder="Full Name" className="w-full bg-white/5 border border-transparent rounded-xl p-3 pl-12 text-white focus:border-[#FF6B00] focus:bg-[#FF6B00]/5 outline-none transition-all" />
             </div>
          )}
          <div className="relative">
             <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6A7080]" size={18}/>
             <input required type="email" placeholder="Email Address" className="w-full bg-white/5 border border-transparent rounded-xl p-3 pl-12 text-white focus:border-[#FF6B00] focus:bg-[#FF6B00]/5 outline-none transition-all" />
          </div>
          <div className="relative">
             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6A7080]" size={18}/>
             <input required type="password" placeholder="Security Key" className="w-full bg-white/5 border border-transparent rounded-xl p-3 pl-12 text-white focus:border-[#FF6B00] focus:bg-[#FF6B00]/5 outline-none transition-all" />
          </div>
          <Button type="submit" className="w-full h-14 mt-4 text-lg">{isLogin ? 'Initialize Access' : 'Establish Identity'}</Button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---
const CustomerLayout = ({ children }) => {
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/customer', icon: Home },
    { name: 'My Orders', path: '/customer/orders', icon: ShoppingBag },
    { name: 'Catalogue', path: '/customer/catalogue', icon: Package },
    { name: 'Inquiries', path: '/customer/inquiries', icon: MessageSquare },
    { name: 'Profile', path: '/customer/profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#080A0F] font-[Exo\ 2] text-white flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#0E1119] sticky top-0 h-screen p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center font-heading font-black text-xl shadow-[0_0_15px_rgba(255,107,0,0.4)]">CT</div>
          <div>
            <h2 className="font-heading font-bold uppercase tracking-widest text-sm leading-none">Chandrakant</h2>
            <p className="text-[#FF6B00] text-[0.6rem] font-bold uppercase tracking-[0.2em] mt-1">Client Portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map(item => {
            const active = location.pathname === item.path || (item.path !== '/customer' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-[#FF6B00] text-white shadow-[0_0_15px_rgba(255,107,0,0.3)]' : 'text-[#6A7080] hover:text-white hover:bg-white/5'}`}>
                <item.icon size={18} className={active ? '' : 'opacity-70'} />
                <span className="text-sm font-bold uppercase tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <Link to="/customer/login" className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold uppercase tracking-widest text-sm">
          <LogOut size={18} /> Logout
        </Link>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 bg-[#0E1119]/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-[#FF6B00] rounded-lg flex items-center justify-center font-heading font-black text-sm">CT</div>
            <span className="font-heading font-bold uppercase tracking-widest text-xs">Client Portal</span>
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#6A7080] hover:text-[#FF6B00] transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B00] rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center font-heading font-black text-sm">AP</div>
              <span className="hidden sm:block text-sm font-bold uppercase tracking-widest">Alex Patron</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E1119] border-t border-white/5 flex justify-around p-3 z-50 safe-area-bottom">
        {[navItems[0], navItems[1], navItems[2], navItems[4]].map(item => {
          const active = location.pathname === item.path || (item.path !== '/customer' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.name} to={item.path} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-[#FF6B00]' : 'text-[#6A7080]'}`}>
              <item.icon size={20} className={active ? 'scale-110' : ''} />
              <span className="text-[0.6rem] font-bold uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export const CustomerApp = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout />} />
      <Route path="/*" element={
        <CustomerLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </CustomerLayout>
      } />
    </Routes>
  );
};

export default CustomerApp;
