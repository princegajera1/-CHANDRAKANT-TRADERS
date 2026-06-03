import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBills } from '../hooks/useBills';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { StatCard, Badge } from '../components/ui/StatCard';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { isToday } from '../utils/formatters';
import { TrendingUp, FileText, AlertTriangle, ArrowRight, Package, ShieldCheck, BarChart3, History, Shield, Eye, Users, Download, RefreshCw, BadgeInfo, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import gsap from 'gsap';

const formatLogTime = (timestamp) => {
  if (!timestamp) return 'Now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  
  // Reset hours to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = format(date, 'hh:mm a');
  
  if (compareDate.getTime() === today.getTime()) {
    return `Today, ${timeStr}`;
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  } else {
    return `${format(date, 'dd MMM')}, ${timeStr}`;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { bills } = useBills();
  const { products } = useProducts();
  const { customers } = useCustomers();

  const [stats, setStats] = useState({ 
    todaySales: 0, 
    todayBills: 0, 
    lowStock: 0, 
    pendingUdhaar: 0, 
    visitorCount: 0,
    lastMonthSales: 0,
    cashPercent: 100
  });

  const [reportStart, setReportStart] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [reportEnd, setReportEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState('sales');

  const [chartData, setChartData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  const pageRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snap) => {
      setActivityLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Get total demo visitors
    const qVisitors = query(collection(db, 'activityLogs'), where('role', '==', 'demo'));
    const unsubVisitors = onSnapshot(qVisitors, (snap) => {
      setStats(prev => ({ ...prev, visitorCount: snap.size }));
    });

    return () => {
      unsubscribe();
      unsubVisitors();
    };
  }, []);

  useEffect(() => {
    const todayBills = bills.filter(b => {
      if (!b.createdAt) return false;
      const billDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return b.status === 'active' && isToday(billDate);
    });
    const todaySales = todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    
    const now = new Date();
    const currentMonthBills = bills.filter(b => {
      if (!b.createdAt) return false;
      const billDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return b.status === 'active' && billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
    });
    const thisMonthSales = currentMonthBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);

    const lowStock = products.filter(p => p.currentQty <= (p.minQty || 5)).length;
    const pendingUdhaar = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

    // Calculate last month sales for growth comparison
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthBills = bills.filter(b => {
      if (!b.createdAt) return false;
      const billDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return b.status === 'active' && billDate.getMonth() === lastMonthDate.getMonth() && billDate.getFullYear() === lastMonthDate.getFullYear();
    });
    const lastMonthSales = lastMonthBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);

    // Calculate billing cash flows
    const creditTotal = currentMonthBills.filter(b => b.paymentMode === 'Credit').reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    const cashTotal = currentMonthBills.filter(b => b.paymentMode !== 'Credit').reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    const totalMonth = creditTotal + cashTotal;
    const cashPercent = totalMonth > 0 ? Math.round((cashTotal / totalMonth) * 100) : 100;

    setStats(prev => ({ 
      ...prev, 
      todaySales, 
      todayBills: todayBills.length, 
      thisMonthSales,
      thisMonthBills: currentMonthBills.length,
      lowStock, 
      pendingUdhaar,
      lastMonthSales,
      cashPercent
    }));

    // Generate last 6 months comparative sales
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const fullMonthStr = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const monthTotal = bills
         .filter(b => {
           if (!b.createdAt) return false;
           const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
           return b.status === 'active' && bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
         })
         .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
      return { name: monthStr, fullDate: fullMonthStr, revenue: monthTotal };
    }).reverse();

    setChartData(last6Months);
  }, [bills, products, customers]);

  // GSAP Entrance Timeline Stagger
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Stagger stats cards
      tl.fromTo('.stat-card-item', 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.7 }
      );

      // Slide up chart
      tl.fromTo('.analytics-block',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      );

      // Stagger tables and sync lists
      tl.fromTo('.grid-item-block',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6 },
        '-=0.3'
      );

      // Stagger table row rows
      tl.fromTo('.row-item-stagger',
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.5 },
        '-=0.2'
      );
    }, pageRef);

    return () => ctx.revert();
  }, [bills, products, customers]);

  const handleExportReport = () => {
    try {
      const start = new Date(reportStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(reportEnd);
      end.setHours(23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        toast.error('Please enter valid dates');
        return;
      }

      if (reportType === 'sales') {
        const filteredBills = bills.filter(b => {
          const date = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return b.status === 'active' && date >= start && date <= end;
        });

        if (filteredBills.length === 0) {
          toast.error('No sales data found for this date range');
          return;
        }

        const headers = ['Bill No', 'Date', 'Customer Name', 'Contact', 'Payment Mode', 'Subtotal', 'Tax GST', 'Grand Total', 'Discount'];
        const csvRows = filteredBills.map(b => {
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return [
            b.billNo,
            bDate.toLocaleDateString(),
            b.customerName,
            b.customerPhone || 'N/A',
            b.paymentMode,
            b.subtotal || 0,
            b.gstTotal || 0,
            b.grandTotal || 0,
            b.discount || 0
          ];
        });

        exportCSV(headers, csvRows, `Sales_Report_${reportStart}_to_${reportEnd}`);
      } else if (reportType === 'products') {
        const headers = ['Product ID', 'Name', 'Brand', 'Category', 'Size', 'Purchase Price', 'Selling Price', 'Current Qty', 'Min Qty', 'HSN Code', 'GST Percent', 'Total Valuation'];
        const csvRows = products.map(p => [
          p.id,
          p.name,
          p.brand || 'N/A',
          p.category || 'N/A',
          p.size || 'N/A',
          p.purchasePrice || 0,
          p.sellingPrice || 0,
          p.currentQty || 0,
          p.minQty || 0,
          p.hsnCode || 'N/A',
          p.gstPercent || 0,
          (p.sellingPrice || 0) * (p.currentQty || 0)
        ]);

        exportCSV(headers, csvRows, `Inventory_Valuation_Report_${reportEnd}`);
      } else if (reportType === 'liabilities') {
        const indebtedCustomers = customers.filter(c => (c.balance || 0) > 0);
        if (indebtedCustomers.length === 0) {
          toast.error('No outstanding customer accounts found');
          return;
        }

        const headers = ['Customer ID', 'Name', 'Phone', 'Vehicle', 'GSTIN', 'PAN', 'Transporter', 'Outstanding Balance'];
        const csvRows = indebtedCustomers.map(c => [
          c.id,
          c.name,
          c.phone || 'N/A',
          c.vehicle || 'N/A',
          c.gstin || 'N/A',
          c.pan || 'N/A',
          c.transporter || 'N/A',
          c.balance || 0
        ]);

        exportCSV(headers, csvRows, `Customer_Liabilities_Report_${reportEnd}`);
      }
    } catch (e) {
      toast.error('Report compilation failed');
      console.error(e);
    }
  };

  const exportCSV = (headers, rows, filename) => {
    const content = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Executive report exported to CSV successfully');
  };

  return (
    <div ref={pageRef} className="space-y-[1.5rem] pb-12 opacity-1">
      
      {/* SECTION 4 - EXECUTIVE FISCAL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[1.2rem]">
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="TODAY'S CAPTURE" 
            value={stats.todaySales} 
            isCurrency={true}
            icon={TrendingUp} 
            color="orange"
            subValue={`${stats.todayBills || 0} Invoice Logs Today`}
            onClick={() => navigate('/bills')}
          />
        </div>
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="MONTHLY SECURED" 
            value={stats.thisMonthSales || 0} 
            isCurrency={true}
            icon={BarChart3} 
            color="green"
            subValue={`${stats.thisMonthBills || 0} Invoice Logs This Month`}
            onClick={() => navigate('/reports')}
          />
        </div>
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="OUTSTANDING EXPOSURE" 
            value={stats.pendingUdhaar} 
            isCurrency={true}
            icon={Users} 
            color="gold"
            subValue="Active Credit Liabilities"
            onClick={() => navigate('/customers')}
          />
        </div>
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="ASSET INVENTORY" 
            value={products.length} 
            icon={Package} 
            color="orange"
            subValue={`${stats.lowStock || 0} Low Stock Alert Items`}
            onClick={() => navigate('/inventory')}
          />
        </div>
      </div>

      {/* SECTION 4.5 - BUSINESS INTELLIGENCE INSIGHTS & REPORT EXPORTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[1.2rem] pt-2">
        
        {/* Business Insights Panel */}
        <div className="xl:col-span-2 p-[1.6rem] rounded-[16px] bg-[#0D1B2A]/90 border border-[#1E2D3D] flex flex-col gap-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-accent/10 text-accent"><BadgeInfo size={20} /></div>
              <div>
                <h3 className="font-heading font-[700] text-[0.95rem] uppercase text-white tracking-wider">BUSINESS INSIGHTS & THRESHOLDS</h3>
                <p className="font-body italic font-[400] text-[0.68rem] text-[#8899A6] mt-0.5">REAL-TIME ANOMALIES & AUDITS</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Insight 1: Outstanding Exposure vs Monthly Sales */}
            <div className={`p-4 rounded-xl border ${stats.pendingUdhaar > stats.thisMonthSales ? 'bg-[#FF3D57]/5 border-[#FF3D57]/20' : 'bg-[#00E676]/5 border-[#00E676]/20'} flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className={stats.pendingUdhaar > stats.thisMonthSales ? 'text-[#FF3D57]' : 'text-[#00E676]'} />
                <span className="font-body font-[700] text-[0.7rem] uppercase tracking-wider text-white">Credit Exposure Risk</span>
              </div>
              <p className="font-body text-[0.75rem] text-[#8899A6] leading-relaxed">
                {stats.pendingUdhaar > stats.thisMonthSales ? (
                  <>Outstanding customer liabilities (<span className="text-[#FF3D57] font-bold">₹{stats.pendingUdhaar.toLocaleString()}</span>) exceed this month's revenue (₹{stats.thisMonthSales.toLocaleString()}). Limit new credit accounts.</>
                ) : (
                  <>Outstanding customer liabilities (₹{stats.pendingUdhaar.toLocaleString()}) are well within safe thresholds compared to this month's revenue (₹{stats.thisMonthSales.toLocaleString()}). Status is secure.</>
                )}
              </p>
            </div>

            {/* Insight 2: Low Stock Alert */}
            <div className={`p-4 rounded-xl border ${stats.lowStock > 0 ? 'bg-[#FFB800]/5 border-[#FFB800]/20' : 'bg-[#00E676]/5 border-[#00E676]/20'} flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <Package size={16} className={stats.lowStock > 0 ? 'text-[#FFB800]' : 'text-[#00E676]'} />
                <span className="font-body font-[700] text-[0.7rem] uppercase tracking-wider text-white">Inventory Restock Audit</span>
              </div>
              <p className="font-body text-[0.75rem] text-[#8899A6] leading-relaxed">
                {stats.lowStock > 0 ? (
                  <>There are <span className="text-[#FFB800] font-bold">{stats.lowStock}</span> items running below safety thresholds in the inventory registry. Stock replenishment is advised.</>
                ) : (
                  <>All inventory products are stocked above the safety limits. Stock availability is optimal.</>
                )}
              </p>
            </div>

            {/* Insight 3: Revenue Growth (Current Month vs Last Month) */}
            <div className={`p-4 rounded-xl border ${stats.thisMonthSales >= stats.lastMonthSales ? 'bg-[#00E676]/5 border-[#00E676]/20' : 'bg-[#FF3D57]/5 border-[#FF3D57]/20'} flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                {stats.thisMonthSales >= stats.lastMonthSales ? (
                  <CheckCircle2 size={16} className="text-[#00E676]" />
                ) : (
                  <TrendingUp size={16} className="text-[#FF3D57] rotate-180" />
                )}
                <span className="font-body font-[700] text-[0.7rem] uppercase tracking-wider text-white">Sales Trajectory</span>
              </div>
              <p className="font-body text-[0.75rem] text-[#8899A6] leading-relaxed">
                {stats.thisMonthSales >= stats.lastMonthSales ? (
                  <>Current month's revenue (<span className="text-[#00E676] font-bold">₹{stats.thisMonthSales.toLocaleString()}</span>) has outperformed last month's final total (₹{stats.lastMonthSales.toLocaleString()}). Growth trajectory is positive.</>
                ) : (
                  <>Current month's sales (₹{stats.thisMonthSales.toLocaleString()}) are below last month's final total of <span className="text-[#FF3D57] font-bold">₹{stats.lastMonthSales.toLocaleString()}</span>. Monitor sales closely.</>
                )}
              </p>
            </div>

            {/* Insight 4: Liquidity Ratio */}
            <div className="p-4 rounded-xl border bg-white/[0.02] border-[#1E2D3D] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" />
                <span className="font-body font-[700] text-[0.7rem] uppercase tracking-wider text-white">Liquidity & Cash Flow</span>
              </div>
              <p className="font-body text-[0.75rem] text-[#8899A6] leading-relaxed">
                UPI & Cash payments account for <span className="text-accent font-bold">{stats.cashPercent}%</span> of this month's transactions. This keeps liquid capital stable and reserves optimized.
              </p>
            </div>

          </div>
        </div>

        {/* Executive Report Generator */}
        <div className="p-[1.6rem] rounded-[16px] bg-[#0D1B2A]/90 border border-[#1E2D3D] flex flex-col gap-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-accent/10 text-accent"><Download size={20} /></div>
            <div>
              <h3 className="font-heading font-[700] text-[0.95rem] uppercase text-white tracking-wider">EXECUTIVE EXPORT</h3>
              <p className="font-body italic font-[400] text-[0.68rem] text-[#8899A6] mt-0.5">CSV REPORT COMPILES</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6rem] font-bold uppercase tracking-widest text-[#8899A6]">Report Protocol</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="bg-[#080C14] border border-[#1E2D3D] rounded-xl px-4 py-3 text-[0.7rem] font-[700] font-body text-white uppercase tracking-[0.1em] outline-none focus:border-accent transition-all cursor-pointer w-full"
              >
                <option value="sales" className="bg-secondary text-white">Sales & Revenue Ledger</option>
                <option value="products" className="bg-secondary text-white">Product Inventory Appraisal</option>
                <option value="liabilities" className="bg-secondary text-white">Customer Accounts Ledger</option>
              </select>
            </div>

            {reportType === 'sales' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-bold uppercase tracking-widest text-[#8899A6]">Start Date</label>
                  <input 
                    type="date" 
                    value={reportStart} 
                    onChange={(e) => setReportStart(e.target.value)}
                    className="bg-[#080C14] border border-[#1E2D3D] rounded-xl px-3 py-2 text-[0.75rem] font-mono text-white outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-bold uppercase tracking-widest text-[#8899A6]">End Date</label>
                  <input 
                    type="date" 
                    value={reportEnd} 
                    onChange={(e) => setReportEnd(e.target.value)}
                    className="bg-[#080C14] border border-[#1E2D3D] rounded-xl px-3 py-2 text-[0.75rem] font-mono text-white outline-none focus:border-accent transition-all"
                  />
                </div>
              </div>
            )}

            <button 
              onClick={handleExportReport}
              className="w-full h-[46px] rounded-xl bg-accent text-primary font-body font-[700] text-[0.7rem] uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Download size={16} /> Compile & Export CSV
            </button>
          </div>
        </div>

      </div>

      {/* Analytics Section */}
      <div className="analytics-block opacity-0 grid grid-cols-1 xl:grid-cols-3 gap-[1.2rem] pt-2">
        <div className="xl:col-span-3 p-[1.6rem] rounded-[16px] bg-[#0D1B2A]/90 border border-[#1E2D3D] flex flex-col gap-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-accent/10 text-accent"><BarChart3 size={20} /></div>
              <div>
                <h3 className="font-heading font-[700] text-[0.95rem] uppercase text-white tracking-wider">REVENUE INTELLIGENCE</h3>
                <p className="font-body italic font-[400] text-[0.68rem] text-[#8899A6] mt-0.5">GROWTH TRAJECTORIES</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-dot-ripple absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent animate-dot-pulse"></span>
              </span>
              <span className="font-body font-[600] text-[0.65rem] uppercase tracking-[0.1em] text-accent">LIVE DATA SYNC</span>
            </div>
          </div>
          
          <div className="h-[320px] w-full font-mono text-[0.65rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#ff6b00" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontFamily: 'DM Sans', fontSize: '0.65rem', fontWeight: 500, fill: '#8899A6' }} 
                  dy={6}
                  interval={1}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val/1000}k`} 
                  tick={{ fontFamily: 'DM Sans', fontSize: '0.65rem', fontWeight: 500, fill: '#8899A6' }} 
                  dx={-10} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                  contentStyle={{ 
                    backgroundColor: '#0D1B2A', 
                    borderRadius: '12px', 
                    border: '1px solid #1E2D3D', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Space Grotesk', textTransform: 'uppercase', color: '#ff6b00' }}
                  labelStyle={{ fontSize: '10px', fontWeight: '700', color: '#8899A6', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullDate : label}
                />
                <Bar dataKey="revenue" fill="url(#colorRevBar)" activeBar={{ fill: '#ff8f1f' }} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.2rem] pt-2">
        <div className="grid-item-block opacity-0 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="admin-heading text-white">Recent Ledger Logs</h3>
            <button onClick={() => navigate('/bills')} className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent hover:text-white transition-colors flex items-center gap-2 group">
              Terminal Archives <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="rounded-[16px] bg-[#0D1B2A]/90 border border-[#1E2D3D] overflow-hidden backdrop-blur-md">
            <div className="w-full overflow-x-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] rounded-tl-[10px]">BILL NO</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem]">CUSTOMER</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-center">DATE</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-right">AMOUNT</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-center rounded-tr-[10px]">MODE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {bills.slice(0, 5).map((bill, i) => {
                    const billDate = bill.createdAt?.toDate ? bill.createdAt.toDate() : new Date(bill.createdAt);
                    const formattedDate = isNaN(billDate.getTime()) ? '-' : billDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    return (
                      <tr key={bill.id} className="row-item-stagger opacity-0 hover:bg-white/[0.02] transition-colors duration-200">
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D]">
                           <span className="font-mono font-[700] text-[0.875rem] text-white whitespace-nowrap">#{bill.billNo}</span>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D]">
                          <div className="font-body font-[600] text-[0.875rem] text-white uppercase truncate max-w-[150px]">{bill.customerName}</div>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D] text-center">
                          <span className="font-mono font-[400] text-[0.8rem] text-white/60">{formattedDate}</span>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D] text-right">
                          <span className="font-mono font-[700] text-[0.95rem] text-accent whitespace-nowrap">
                            ₹{bill.grandTotal.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D] text-center">
                          <span className={`px-2.5 py-1 rounded text-[0.6rem] font-bold uppercase tracking-wider ${bill.paymentMode === 'Credit' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                            {bill.paymentMode}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid-item-block opacity-0 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="admin-heading text-white">Recent Access Sync</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
              <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">Live Audit</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {activityLogs.map((log, i) => {
              const isAdmin = log.role === 'admin' || log.role === 'superadmin';
              return (
                <div 
                  key={log.id} 
                  className={`row-item-stagger opacity-0 p-4 rounded-xl bg-[#0D1B2A]/90 border ${log.action === 'LOGIN' ? 'border-[#00E676]/10' : 'border-[#FF3D57]/10'} hover:border-accent/30 transition-all flex items-center justify-between group backdrop-blur-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-blue-400/10 text-blue-400' : 'bg-accent/10 text-accent'}`}>
                      {isAdmin ? <Shield size={16} /> : <Eye size={16} />}
                    </div>
                    <div>
                      <p className="text-[0.8rem] font-bold text-white uppercase leading-none mb-1">{log.userName}</p>
                      <p className="text-[0.65rem] text-[#8899A6] uppercase tracking-widest font-black">{log.role} · {log.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.7rem] font-bold text-[#8899A6]">{formatLogTime(log.timestamp)}</p>
                    <p className="text-[0.6rem] text-white/20 uppercase tracking-tighter">Authorized</p>
                  </div>
                </div>
              );
            })}
            <button 
              onClick={() => navigate('/settings')}
              className="row-item-stagger opacity-0 w-full py-3 border border-dashed border-[#1E2D3D] rounded-xl text-[0.65rem] font-bold uppercase tracking-widest text-[#8899A6]/40 hover:text-accent hover:border-accent/30 transition-all"
            >
              View All Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
