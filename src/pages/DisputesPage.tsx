import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, CheckCircle, AlertTriangle, ChevronLeft, Scale, FileText, LayoutGrid, Search } from 'lucide-react';
import { User, Project } from '@/types';
import { api } from '@/services/api';
import { cn } from '@/shared/utils/cn';
import { DisputeTrackingModal } from '@/features/projects/components/DisputeTrackingModal';

const statusConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; border: string; text: string; gradient: string }> = {
  open: {
    label: 'قيد التحكيم',
    icon: <Clock size={14} />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    gradient: 'from-amber-400 to-orange-500'
  },
  resolved_won: {
    label: 'محسوم — فزت',
    icon: <CheckCircle size={14} />,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    gradient: 'from-emerald-400 to-emerald-600'
  },
  resolved_lost: {
    label: 'محسوم — خسرت',
    icon: <AlertTriangle size={14} />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    gradient: 'from-red-500 to-red-700'
  },
};

export default function DisputesPage() {
  const [tab, setTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [trackingTarget, setTrackingTarget] = useState<any | null>(null);
  const user: User = JSON.parse(localStorage.getItem('user') || 'null') || { role: 'client', name: 'Guest', username: 'guest', id: '0' };

  useEffect(() => {
    api.getProjects().then(setProjects);
  }, []);

  const myDisputes = projects.flatMap(p => 
    p.tasks.filter(t => t.status === 'Disputed').map(t => {
        const uId = (user.id || '').toLowerCase();
        const uEmail = (user.email || '').toLowerCase();
        const uName = (user.username || '').toLowerCase();

        let myRole = '';
        let against = '';
        
        const isOwner = p.ownerId === uId || p.ownerId === uEmail || p.ownerId === uName;
        const assigned = (t.assignedTo || '').toLowerCase();
        const assignedEmail = (t.assignedToEmail || '').toLowerCase();
        const isAssigned = assigned === uId || assigned === uEmail || assigned === uName || assignedEmail === uEmail;

        if (isOwner) {
          myRole = 'requester';
          against = t.assignedToName || t.assignedTo;
        } else if (isAssigned) {
          myRole = 'respondent';
          against = p.owner;
        } else if (user.role === 'admin' || user.role === 'arbitrator') {
          myRole = 'admin';
          against = `${p.owner} vs ${t.assignedToName || t.assignedTo}`;
        } else {
          return null;
        }

        const hash = t.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const statuses = ['open', 'open', 'resolved_won', 'resolved_lost', 'open'];
        const mockStatus = statuses[hash % statuses.length];
        const filedTimes = ['منذ ساعتين', 'منذ 5 ساعات', 'أمس', 'منذ يومين', 'منذ 3 أيام', 'منذ أسبوع'];
        const filed = filedTimes[hash % filedTimes.length];

        return {
          id: t.id,
          projectId: p.id,
          title: `نزاع ${t.name}`,
          projectName: p.title,
          against: against || 'مستقل غير معروف',
          amount: t.payment || ((hash % 50) + 10) * 10,
          status: mockStatus,
          role: myRole,
          filed,
          hoursLeft: mockStatus === 'open' ? (hash % 44) + 4 : 0,
        };
    }).filter((d): d is NonNullable<typeof d> => d !== null)
  );

  const filtered = myDisputes.filter(d => {
    if (tab === 'open') return d.status === 'open';
    if (tab === 'resolved') return d.status !== 'open';
    return true;
  });

  const openCount = myDisputes.filter(d => d.status === 'open').length;
  const wonCount  = myDisputes.filter(d => d.status === 'resolved_won').length;
  const lostCount = myDisputes.filter(d => d.status === 'resolved_lost').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-10 py-8" 
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white border border-[#E8DDD0] rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#C9A84C] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#0D1B2A] text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-black/10">
             <Scale size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#0D1B2A] tracking-tight mb-2">مركز النزاعات والتحكيم</h1>
          <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
            تتبع وإدارة جميع نزاعاتك التحكيمية. نحن نضمن لك العدالة والشفافية في كل قرار.
          </p>
        </div>
        
        {user.role === 'arbitrator' && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative z-10">
            <Link
              to="/dashboard/arbitrator"
              className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-white shadow-xl shadow-black/20"
              style={{ background: '#0D1B2A' }}
            >
              <Gavel size={20} className="text-[#C9A84C]" /> 
              <span>لوحة المحكمين</span>
              <ChevronLeft size={16} className="text-gray-400" />
            </Link>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white border border-[#E8DDD0] p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
             <Clock size={24} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">قضايا مفتوحة</p>
          <p className="text-2xl font-bold text-[#0D1B2A]">{openCount}</p>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} className="bg-emerald-50 border border-emerald-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
             <CheckCircle size={24} />
          </div>
          <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-1">محسومة (فوز)</p>
          <p className="text-2xl font-bold text-emerald-700">{wonCount}</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-red-50 border border-red-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
             <AlertTriangle size={24} />
          </div>
          <p className="text-xs font-bold text-red-600/70 uppercase tracking-widest mb-1">محسومة (خسارة)</p>
          <p className="text-2xl font-bold text-red-700">{lostCount}</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-[#E8DDD0]">
          {/* Tabs */}
          <div className="flex gap-2 w-full sm:w-auto">
            {([['all', 'الكل'], ['open', 'مفتوحة'], ['resolved', 'محسومة']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold text-xs transition-all",
                  tab === key ? "bg-[#0D1B2A] text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="w-full sm:w-auto flex items-center gap-2 px-4 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#C9A84C] transition-colors">
             <Search size={18} className="text-gray-400" />
             <input type="text" placeholder="ابحث برقم القضية..." className="bg-transparent py-3 text-sm outline-none w-full sm:w-48 font-medium" />
          </div>
        </div>

        {/* Dispute Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6"
        >
          {filtered.length === 0 && (
            <motion.div variants={itemVariants} className="text-center py-24 border-2 border-dashed border-[#E8DDD0] rounded-[2.5rem] bg-white/50 backdrop-blur-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gavel size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-[#0D1B2A] mb-1">لا توجد نزاعات</h3>
              <p className="text-gray-500 text-sm">سجل النزاعات الخاص بك فارغ في هذه الفئة.</p>
            </motion.div>
          )}

          <AnimatePresence>
            {filtered.map(d => {
              const sc = statusConfig[d.status];
              const pct = Math.max(0, Math.min(100, (d.hoursLeft / 48) * 100));

              return (
                <motion.div 
                  key={d.id}
                  layout
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className={cn(
                    "bg-white border-2 rounded-[2rem] p-8 transition-all shadow-sm hover:shadow-xl relative overflow-hidden group",
                    d.status === 'open' ? 'border-[#E8DDD0] hover:border-[#0D1B2A]/20' : sc.border
                  )}
                >
                  {/* Status Gradient Line */}
                  <div className={cn("absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b", sc.gradient)} />

                  <div className="flex flex-col md:flex-row justify-between gap-8 pl-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className="text-xs font-black text-[#0D1B2A] bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                           <LayoutGrid size={12}/> {d.id}
                        </span>
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg border", sc.bg, sc.border, sc.text)}>
                          {sc.icon} {sc.label}
                        </span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                          {d.role === 'requester' ? 'أنت المشتكي' : 'أنت المدعى عليه'}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-[#0D1B2A] mb-1">{d.title}</h3>
                      <p className="text-gray-500 text-xs mb-5 flex items-center gap-2">
                        <span>المشروع: <strong className="text-[#0D1B2A]">{d.projectName}</strong></span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>ضد: <strong className="text-[#0D1B2A]">{d.against}</strong></span>
                      </p>

                      {d.status === 'open' && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <div className="flex justify-between items-end mb-3">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                               <Clock size={14} className="text-[#C9A84C]" /> الوقت المتبقي لاتخاذ قرار
                            </span>
                            <span className="text-sm font-bold text-[#0D1B2A]">{d.hoursLeft} ساعة</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={cn("h-full rounded-full", d.hoursLeft <= 12 ? 'bg-red-500' : 'bg-[#C9A84C]')}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-6 md:min-w-[180px] md:border-r border-gray-100 md:pr-8">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">المبلغ المتنازع عليه</p>
                        <p className="text-xl font-bold text-[#0D1B2A]">${d.amount}</p>
                      </div>

                      {d.status === 'open' ? (
                        <motion.button
                          layoutId={`track-case-${d.id}`}
                          onClick={() => setTrackingTarget(d)}
                          className={cn(
                            "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-xs transition-all shadow-md",
                            "bg-[#0D1B2A] text-white hover:bg-black shadow-black/20"
                          )}
                        >
                          <FileText size={18} className="text-[#C9A84C]" /> 
                          تتبع القضية
                        </motion.button>
                      ) : (
                        <Link
                          to={`/arbitrate/${d.id}`}
                          className={cn(
                            "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-xs transition-all shadow-md",
                            "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300 shadow-none hover:bg-gray-50"
                          )}
                        >
                          <FileText size={18} /> 
                          عرض التفاصيل
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {trackingTarget && (
          <DisputeTrackingModal 
            target={trackingTarget} 
            onClose={() => setTrackingTarget(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
