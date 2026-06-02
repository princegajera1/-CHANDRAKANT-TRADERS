import React, { useState, useEffect } from 'react';
import { useBills } from '../hooks/useBills';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { isToday } from 'date-fns';
import { TrendingUp, DollarSign, Users, Package, BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { CountUp } from '../components/ui/StatCard';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-hot-toast';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const { bills, loading: billsLoading } = useBills();
  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();
  
  const [monthlyData, setMonthlyData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [topCustomersData, setTopCustomersData] = useState([]);
  const [yearlySummary, setYearlySummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const calculateReports = () => {
      setLoading(true);

      // 1. Last 12 months aggregation
      const last12Months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // Avoid end-of-month bugs
        d.setMonth(d.getMonth() - i);
        last12Months.push({
          monthName: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          shortName: d.toLocaleDateString('en-IN', { month: 'short' }),
          year: d.getFullYear(),
          monthNum: d.getMonth(),
          revenue: 0,
          billCount: 0
        });
      }

      // 2. Yearly summary
      const currentYear = new Date().getFullYear();
      const prevYear = currentYear - 1;
      const yearly = {
        currentYear,
        currentYearRevenue: 0,
        currentYearBillCount: 0,
        prevYear,
        prevYearRevenue: 0,
        prevYearBillCount: 0
      };

      const productMap = {};
      const customerMap = {};

      bills.forEach(b => {
        if (b.status !== 'active' || !b.createdAt) return;
        
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        const bYear = bDate.getFullYear();
        const bMonth = bDate.getMonth();
        const bTotal = b.grandTotal || 0;

        // Aggregate last 12 months
        last12Months.forEach(m => {
          if (m.year === bYear && m.monthNum === bMonth) {
            m.revenue += bTotal;
            m.billCount += 1;
          }
        });

        // Yearly summary details
        if (bYear === currentYear) {
          yearly.currentYearRevenue += bTotal;
          yearly.currentYearBillCount += 1;
        } else if (bYear === prevYear) {
          yearly.prevYearRevenue += bTotal;
          yearly.prevYearBillCount += 1;
        }

        // Customer lifetime spends
        if (b.customerName) {
          const key = b.customerId || b.customerName;
          if (!customerMap[key]) {
            customerMap[key] = {
              name: b.customerName,
              phone: b.customerPhone || 'N/A',
              totalSpent: 0,
              billCount: 0
            };
          }
          customerMap[key].totalSpent += bTotal;
          customerMap[key].billCount += 1;
        }

        // Product dispatched quantities and revenues
        if (b.items) {
          b.items.forEach(item => {
            const prodName = item.productName;
            if (!productMap[prodName]) {
              productMap[prodName] = {
                name: prodName,
                qty: 0,
                revenue: 0
              };
            }
            productMap[prodName].qty += item.quantity || 0;
            productMap[prodName].revenue += item.itemTotal || 0;
          });
        }
      });
      
      setMonthlyData(last12Months);
      setYearlySummary(yearly);

      const sortedProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
      setTopProductsData(sortedProducts);

      const sortedCustomers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
      setTopCustomersData(sortedCustomers);

      setLoading(false);
    };

    if (bills && bills.length >= 0) calculateReports();
  }, [bills]);

  const handleTabChange = (tab) => {
    setIsChanging(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsChanging(false);
    }, 150);
  };

  // CSV Export utility
  const exportToCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel-compatible CSV downloaded successfully');
  };

  // PDF Export utility
  const exportToPDF = (headers, rows, title, filename) => {
    const doc = new jsPDF();
    
    // Styled Title Frame
    doc.setFillColor(13, 18, 32); 
    doc.rect(0, 0, 210, 42, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text("CHANDRAKANT TRADERS", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${title.toUpperCase()} — INTEL AUDIT LOG`, 14, 30);
    
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Run Time: ${dateStr}`, 135, 30);
    
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [255, 106, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, font: 'Helvetica' },
      margin: { top: 45 }
    });
    
    doc.save(`${filename}.pdf`);
    toast.success('Professional PDF generated successfully');
  };

  // 1. Monthly Report Export handlers
  const handleExportMonthlyCSV = () => {
    const data = monthlyData.map(m => ({
      'Month/Year': m.monthName,
      'Total Bills Created': m.billCount,
      'Gross Revenue (INR)': m.revenue,
      'Average Bill Value': m.billCount > 0 ? Math.round(m.revenue / m.billCount) : 0
    }));
    exportToCSV(data, 'Monthly_Sales_Report');
  };

  const handleExportMonthlyPDF = () => {
    const headers = ['Month/Year', 'Total Invoices', 'Gross Revenue', 'Average Order Value'];
    const rows = monthlyData.map(m => [
      m.monthName,
      m.billCount,
      `INR ${m.revenue.toLocaleString('en-IN')}`,
      `INR ${m.billCount > 0 ? Math.round(m.revenue / m.billCount).toLocaleString('en-IN') : 0}`
    ]);
    exportToPDF(headers, rows, 'Monthly Sales Report', 'Monthly_Sales_Report');
  };

  // 2. Product Report Export handlers
  const handleExportProductsCSV = () => {
    const data = topProductsData.map((p, idx) => ({
      'Rank': idx + 1,
      'Tyre Brand & Specifications': p.name,
      'Total Units Dispatched': p.qty,
      'Gross Revenue (INR)': p.revenue
    }));
    exportToCSV(data, 'Tyre_Inventory_Sales_Performance');
  };

  const handleExportProductsPDF = () => {
    const headers = ['Rank', 'Tyre Brand & Specifications', 'Total Units Dispatched', 'Gross Revenue (INR)'];
    const rows = topProductsData.map((p, idx) => [
      idx + 1,
      p.name,
      p.qty,
      `INR ${p.revenue.toLocaleString('en-IN')}`
    ]);
    exportToPDF(headers, rows, 'Tyre Performance Report', 'Tyre_Inventory_Sales_Performance');
  };

  // 3. Customer Report Export handlers
  const handleExportCustomersCSV = () => {
    const data = topCustomersData.map((c, idx) => ({
      'Rank': idx + 1,
      'Customer Name': c.name,
      'Mobile Phone': c.phone,
      'Lifetime Bills Settled': c.billCount,
      'Gross Lifetime Spend (INR)': c.totalSpent
    }));
    exportToCSV(data, 'Top_Customer_Spend_Ledger');
  };

  const handleExportCustomersPDF = () => {
    const headers = ['Rank', 'Customer Name', 'Mobile Phone', 'Lifetime Invoices', 'Gross Lifetime Spend'];
    const rows = topCustomersData.map((c, idx) => [
      idx + 1,
      c.name,
      c.phone,
      c.billCount,
      `INR ${c.totalSpent.toLocaleString('en-IN')}`
    ]);
    exportToPDF(headers, rows, 'Customer Spend Ledger', 'Top_Customer_Spend_Ledger');
  };

  const summaryStats = [
    { label: 'Cumulative Revenue', value: bills.reduce((acc, b) => acc + (b.status === 'active' ? b.grandTotal : 0), 0), isCurrency: true, icon: DollarSign, color: '#FF6A00' },
    { label: 'Daily Capture', value: bills.filter(b => b.status === 'active' && isToday(b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt))).reduce((acc, b) => acc + b.grandTotal, 0), isCurrency: true, icon: TrendingUp, color: '#10B981' },
    { label: 'Outstanding Exposure', value: customers.reduce((acc, c) => acc + (c.balance || 0), 0), isCurrency: true, icon: Users, color: '#3b82f6' },
    { label: 'Asset Inventory', value: products.length, isCurrency: false, icon: Package, color: '#8b5cf6' },
  ];

  if (billsLoading || productsLoading || customersLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-text-muted font-mono uppercase tracking-[0.2em] text-[0.75rem]">Syncing Financial Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-page-entrance">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase tracking-wider">Financial Intelligence</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-text-muted mt-1 uppercase">Analytical shop performance and database audit metrics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-secondary/80 border border-border/50 rounded-2xl w-fit animate-dropdown-entrance">
        {['summary', 'sales', 'products', 'customers'].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-8 py-3 rounded-xl font-body font-[700] text-[0.75rem] uppercase tracking-[0.12em] transition-all duration-300 ${
              activeTab === tab ? 'bg-accent text-primary shadow-glow font-black' : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={`transition-all duration-250 ${isChanging ? 'opacity-0 translate-y-2' : 'animate-tab-in opacity-100 translate-y-0'}`}>
        
        {/* Tab 1: Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {summaryStats.map((stat, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] flex items-center gap-6 animate-card-entrance" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">{stat.label}</p>
                    <h4 className="font-heading font-[700] text-[1.5rem] text-white mt-1 leading-none">
                      <CountUp end={stat.value} prefix={stat.isCurrency ? '₹' : ''} />
                    </h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Last 12 Months Graph */}
              <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] animate-card-entrance" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3 mb-10">
                  <BarChart3 className="text-accent" size={20} />
                  <h3 className="text-[0.9rem] font-black text-white uppercase tracking-[0.15em]">12-Month Revenue Graph</h3>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <defs>
                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00D4FF" stopOpacity={1} />
                          <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{fontFamily: 'Barlow Condensed', fontSize: '0.7rem', fontWeight: 700, fill: 'rgba(255, 255, 255, 0.4)'}} dy={6} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'Barlow Condensed', fontSize: '0.7rem', fontWeight: 700, fill: 'rgba(255, 255, 255, 0.4)'}} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                        contentStyle={{ backgroundColor: '#0D1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' }}
                        itemStyle={{ color: '#00D4FF', fontWeight: 900, fontSize: '14px', fontFamily: 'Barlow Condensed', textTransform: 'uppercase' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="url(#revGradient)" activeBar={{ fill: '#4DF4FF' }} radius={[6, 6, 0, 0]} barSize={14} isAnimationActive={true} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick High Performers */}
              <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] animate-card-entrance" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-3 mb-10">
                  <Package className="text-accent" size={20} />
                  <h3 className="text-[0.9rem] font-black text-white uppercase tracking-[0.15em]">High Performance Tyres</h3>
                </div>
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {topProductsData.slice(0, 5).map((prod, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center gap-4">
                        <span className="text-[1.1rem] font-heading font-black text-white/10 group-hover:text-accent/20 transition-colors">0{i+1}</span>
                        <div>
                          <p className="font-bold text-white text-[0.8rem] uppercase group-hover:text-accent transition-colors leading-snug">{prod.name}</p>
                          <p className="text-[0.62rem] font-black text-text-muted uppercase tracking-widest mt-0.5">{prod.qty} Units Dispatched</p>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-white text-[0.85rem] shrink-0">₹{prod.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                  {topProductsData.length === 0 && (
                    <p className="text-center text-text-muted py-8 font-mono text-[0.7rem] uppercase tracking-widest">No stock movements recorded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sales Monthly Log */}
        {activeTab === 'sales' && (
          <div className="space-y-10">
            {/* Control Panel / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-[24px] bg-secondary/80 backdrop-blur-md border border-border/50 gap-4">
              <div>
                <h3 className="font-heading font-black text-white text-[0.9rem] uppercase tracking-widest">Monthly Sales Breakdown</h3>
                <p className="font-body text-text-muted text-[0.65rem] uppercase tracking-wider mt-0.5">Aggregate logs grouped by billing cycles</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportMonthlyCSV}
                  className="px-4 py-2.5 rounded-xl bg-primary/40 border border-border/50 text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-accent-green hover:bg-accent-green/5 transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} /> Excel Export
                </button>
                <button
                  onClick={handleExportMonthlyPDF}
                  className="px-4 py-2.5 rounded-xl bg-primary/40 border border-border/50 text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-accent hover:bg-accent/5 transition-all flex items-center gap-2"
                >
                  <FileText size={16} /> PDF Audit
                </button>
              </div>
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Detailed Months Table */}
              <div className="lg:col-span-8 rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 overflow-hidden shadow-lg">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/25 border-b border-border/50">
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em]">Billing Cycle</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] text-center">Invoice Count</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] text-right">Gross Capture</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] text-right">Avg Order Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-mono text-[0.8rem]">
                      {monthlyData.map((m, idx) => (
                        <tr key={idx} className="hover:bg-primary/10 transition-colors">
                          <td className="p-6 font-heading font-bold text-white text-[0.85rem] uppercase">{m.monthName}</td>
                          <td className="p-6 text-center font-bold text-white/70">{m.billCount}</td>
                          <td className="p-6 text-right font-bold text-accent">₹{m.revenue.toLocaleString('en-IN')}</td>
                          <td className="p-6 text-right font-bold text-text-muted">
                            ₹{m.billCount > 0 ? Math.round(m.revenue / m.billCount).toLocaleString('en-IN') : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side Year comparative card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-8">
                  <h4 className="font-heading font-black text-[0.8rem] text-white uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-accent" /> Yearly Comparative Revenue
                  </h4>
                  
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <p className="text-[0.55rem] font-heading font-black text-text-muted uppercase tracking-widest">Active Year ({yearlySummary.currentYear})</p>
                    <p className="font-mono font-black text-[1.4rem] text-white">₹{(yearlySummary.currentYearRevenue || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[0.62rem] font-mono text-white/50 uppercase tracking-widest">{yearlySummary.currentYearBillCount} Bills Cataloged</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 opacity-60">
                    <p className="text-[0.55rem] font-heading font-black text-text-muted uppercase tracking-widest">Previous Year ({yearlySummary.prevYear})</p>
                    <p className="font-mono font-black text-[1.2rem] text-white">₹{(yearlySummary.prevYearRevenue || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[0.62rem] font-mono text-white/50 uppercase tracking-widest">{yearlySummary.prevYearBillCount} Bills Cataloged</p>
                  </div>

                  {yearlySummary.prevYearRevenue > 0 ? (
                    <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20">
                      <p className="text-[0.62rem] font-heading font-black text-accent uppercase tracking-widest">Year-on-Year Growth</p>
                      <p className={`font-mono font-black text-[1.3rem] mt-1 ${yearlySummary.currentYearRevenue >= yearlySummary.prevYearRevenue ? 'text-accent-green' : 'text-accent-red'}`}>
                        {((yearlySummary.currentYearRevenue - yearlySummary.prevYearRevenue) / yearlySummary.prevYearRevenue * 100).toFixed(1)}%
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-text-muted text-[0.65rem] uppercase tracking-widest">
                      Awaiting previous year benchmarks
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Asset Performance Report */}
        {activeTab === 'products' && (
          <div className="space-y-10">
            {/* Control Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-[24px] bg-secondary/80 backdrop-blur-md border border-border/50 gap-4">
              <div>
                <h3 className="font-heading font-black text-white text-[0.9rem] uppercase tracking-widest">Asset Sales Ledger</h3>
                <p className="font-body text-text-muted text-[0.65rem] uppercase tracking-wider mt-0.5">Tyre brand performance and quantity dispatches</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportProductsCSV}
                  className="px-4 py-2.5 rounded-xl bg-primary/40 border border-border/50 text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-accent-green hover:bg-accent-green/5 transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} /> Excel Export
                </button>
                <button
                  onClick={handleExportProductsPDF}
                  className="px-4 py-2.5 rounded-xl bg-primary/40 border border-border/50 text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-accent hover:bg-accent/5 transition-all flex items-center gap-2"
                >
                  <FileText size={16} /> PDF Audit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Product Sells Table */}
              <div className="lg:col-span-12 rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 overflow-hidden shadow-lg">
                <div className="w-full overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/25 border-b border-border/50 sticky top-0 backdrop-blur-md">
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] w-16">Rank</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em]">Tyre Details</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] text-center w-36">Units Dispatched</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] text-right w-44">Gross Sales Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-mono text-[0.8rem]">
                      {topProductsData.map((p, idx) => (
                        <tr key={idx} className="hover:bg-primary/10 transition-colors">
                          <td className="p-6 font-bold text-white/30 text-[0.95rem]">#{idx + 1}</td>
                          <td className="p-6 font-heading font-black text-white text-[0.85rem] uppercase">{p.name}</td>
                          <td className="p-6 text-center font-bold text-white/70">{p.qty}</td>
                          <td className="p-6 text-right font-bold text-accent">₹{p.revenue.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      {topProductsData.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-16 text-center text-text-muted font-heading uppercase tracking-[0.16em]">
                            No inventory dispatches registered yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Client Spending Ledger */}
        {activeTab === 'customers' && (
          <div className="space-y-10">
            {/* Control Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-[24px] bg-secondary/80 backdrop-blur-md border border-border/50 gap-4">
              <div>
                <h3 className="font-heading font-black text-white text-[0.9rem] uppercase tracking-widest">Client Value Matrix</h3>
                <p className="font-body text-text-muted text-[0.65rem] uppercase tracking-wider mt-0.5">Top purchasing client entities sorted by net revenue</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportCustomersCSV}
                  className="px-4 py-2.5 rounded-xl bg-primary/40 border border-border/50 text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-accent-green hover:bg-accent-green/5 transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} /> Excel Export
                </button>
                <button
                  onClick={handleExportCustomersPDF}
                  className="px-4 py-2.5 rounded-xl bg-primary/40 border border-border/50 text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-accent hover:bg-accent/5 transition-all flex items-center gap-2"
                >
                  <FileText size={16} /> PDF Audit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Customer table */}
              <div className="lg:col-span-12 rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 overflow-hidden shadow-lg">
                <div className="w-full overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/25 border-b border-border/50 sticky top-0 backdrop-blur-md">
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] w-16">Rank</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em]">Patron Identity</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] text-center w-36">Invoices Settled</th>
                        <th className="p-6 font-heading font-black text-[0.62rem] text-text-muted uppercase tracking-[0.14em] text-right w-44">Lifetime Invested</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-mono text-[0.8rem]">
                      {topCustomersData.map((c, idx) => (
                        <tr key={idx} className="hover:bg-primary/10 transition-colors">
                          <td className="p-6 font-bold text-white/30 text-[0.95rem]">#{idx + 1}</td>
                          <td className="p-6">
                            <div className="font-heading font-black text-white text-[0.85rem] uppercase">{c.name}</div>
                            <div className="text-[0.65rem] text-text-muted mt-0.5 tracking-wider">{c.phone}</div>
                          </td>
                          <td className="p-6 text-center font-bold text-white/70">{c.billCount}</td>
                          <td className="p-6 text-right font-bold text-accent">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      {topCustomersData.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-16 text-center text-text-muted font-heading uppercase tracking-[0.16em]">
                            No customer purchase histories recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
