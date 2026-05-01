import React, { useEffect, useState, FC, useMemo, useRef, cloneElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  Lock, CheckCircle, Upload, Send, X, Users, TrendingUp, 
  FileText, ChevronLeft, Star, Shield, AlertCircle, Clock, Zap, Globe,
  Wallet
} from 'lucide-react';
import { api } from '@/services/api';
import { Project, User, Task } from '@/types';
import { formatCurrency } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { useLanguage } from '@/shared/context/LanguageContext';
import { translations } from '@/shared/translations';
import { EscrowGuide } from '@/shared/components/EscrowGuide';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TrustScore } from '@/shared/components/fintech/TrustScore';
import { TransactionLedger } from '@/shared/components/fintech/TransactionLedger';

/* ─── Apple Design Tokens ─── */
const APPLE_SPRINGS = {
  soft: { type: "spring", stiffness: 100, damping: 30 },
  standard: { type: "spring", stiffness: 260, damping: 32 },
  bouncy: { type: "spring", stiffness: 400, damping: 28 },
};

/* ─── Types ─── */
interface MyTask extends Task {
  projectName: string;
  projectId: string;
}

interface MyInvitation {
  id: string;
  projectId: string;
  projectName: string;
  taskName: string;
  budget: number;
  deadline: string;
  sender: string;
  senderRole: string;
  description: string;
  requirements: string[];
  attachments: string[];
}

/* ─── Premium Components ─── */

const AppleGlassCard: FC<{ children: React.ReactNode; className?: string; layoutId?: string; onClick?: () => void }> = ({ children, className, layoutId, onClick }) => (
  <motion.div
    layoutId={layoutId}
    onClick={onClick}
    whileHover={onClick ? { scale: 1.01, y: -4 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    transition={APPLE_SPRINGS.standard}
    className={cn(
      "relative group overflow-hidden glass rounded-[2.5rem] p-1 border-white/40 shadow-2xl",
      className
    )}
  >
    {/* Subtle highlight glare */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const RollingNumber: FC<{ value: number; prefix?: string }> = ({ value, prefix = "$" }) => {
  const numberRef = useRef<HTMLSpanElement>(null);
  const currentVal = useRef(0);

  useEffect(() => {
    if (numberRef.current) {
      gsap.to(currentVal, {
        current: value,
        duration: 2,
        ease: "power4.out",
        onUpdate: () => {
          if (numberRef.current) {
            numberRef.current.innerText = `${prefix}${Math.floor(currentVal.current).toLocaleString()}`;
          }
        }
      });
    }
  }, [value, prefix]);

  return <span ref={numberRef} className="tabular-nums">{prefix}0</span>;
};

const StatHeroCard: FC<{ label: string; value: number; icon: React.ReactNode; variant?: 'default' | 'vault' | 'success' }> = ({ label, value, icon, variant = 'default' }) => {
  const isVault = variant === 'vault';
  const isSuccess = variant === 'success';

  return (
    <AppleGlassCard className={cn(
      "h-32 flex flex-col justify-between p-6",
      isVault ? "bg-[#0D1B2A]/90 text-white border-white/10" : "bg-white/40"
    )}>
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-[0.15em]",
          isVault ? "text-blue-300/60" : "text-gray-400"
        )}>{label}</span>
        <div className={cn(
          "p-2 rounded-xl",
          isVault ? "bg-white/5 text-blue-300" : isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-white shadow-sm text-gray-400"
        )}>
          {cloneElement(icon as React.ReactElement, { size: 16 })}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black tracking-tight">
          <RollingNumber value={value} />
        </h3>
      </div>
    </AppleGlassCard>
  );
};

export default function FreelancerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lang, toggleLang, isRtl } = useLanguage();
  const tFull = translations.dashboard[lang];
  const tFreelancer = tFull.freelancer;
  const tCommon = tFull.common;
  const tStatus = tFull.status;

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<MyInvitation | null>(null);

  const { data: user } = useQuery({
    queryKey: ['user', 'current'],
    queryFn: async () => {
      const u = api.getCurrentUser();
      if (!u) return null;
      return api.getUserById(u.id);
    },
  });

  const {
    data: projects = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['projects', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      return api.getProjectsForFreelancer(user!.id);
    },
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ['ledger', user?.id],
    enabled: !!user?.id,
    queryFn: async () => api.getLedgerByUser(user!.id),
  });

  const { myTasks, myInvitations, myEarnings, escrowed } = useMemo(() => {
    let tasks: MyTask[] = [];
    let invites: MyInvitation[] = [];
    let earnings = user?.balance || 0;
    let held = user?.lockedFunds || 0;

    if (!user) return { myTasks: [], myInvitations: [], myEarnings: 0, escrowed: 0 };

    projects.forEach(p => {
      p.tasks.forEach(t => {
        const uId = (user.id || '').toLowerCase();
        const uEmail = (user.email || '').toLowerCase();
        const uName = (user.username || '').toLowerCase();
        
        const assigned = (t.assignedTo || '').toLowerCase();
        const assignedEmail = (t.assignedToEmail || '').toLowerCase();
        
        const isMatch = assigned === uId || assigned === uEmail || assigned === uName || assignedEmail === uEmail;

        if (isMatch) {
          if (t.inviteStatus === 'Pending') {
            invites.push({
              id: t.id, projectId: p.id, projectName: p.title, taskName: t.name,
              budget: t.payment, deadline: t.deadline ?? 'مفتوح', sender: p.owner, senderRole: 'مدير المشروع',
              description: t.description ?? 'لقد تمت دعوتك للعمل على هذه المهمة.',
              requirements: [t.name, 'الالتزام بمواعيد التسليم', 'تسليم العمل بجودة عالية'],
              attachments: []
            });
          } else if (t.inviteStatus !== 'Rejected') {
            tasks.push({ ...t, projectName: p.title, projectId: p.id });
          }
        }
      });
    });

    return { myTasks: tasks, myInvitations: invites, myEarnings: earnings, escrowed: held };
  }, [projects, user]);

  const acceptInviteMutation = useMutation({
    mutationFn: (inv: MyInvitation) => api.updateInviteStatus(inv.projectId, inv.id, 'Accepted', user?.id),
    onSuccess: () => {
      setSelectedInvitation(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    }
  });

  const rejectInviteMutation = useMutation({
    mutationFn: (inv: MyInvitation) => api.updateInviteStatus(inv.projectId, inv.id, 'Rejected'),
    onSuccess: () => {
      setSelectedInvitation(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const handleAcceptInvite = (inv: MyInvitation) => {
    acceptInviteMutation.mutate(inv);
  };

  const handleRejectInvite = (inv: MyInvitation) => {
    rejectInviteMutation.mutate(inv);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 bg-gray-50">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-black text-[#0D1B2A]">
            {lang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must login first'}
          </h2>
          <button onClick={() => navigate('/login')} className="mt-4 bg-[#0D1B2A] text-white px-6 py-2.5 rounded-lg font-bold text-sm">
            {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden premium-bg font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-[#C9A84C]/5 rounded-full blur-[100px]" 
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Apple-Style Navigation Header */}
        <motion.header 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={APPLE_SPRINGS.soft}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#C9A84C] mb-3"
            >
              <Zap size={10} fill="currentColor" /> {lang === 'ar' ? 'مركز التحكم' : 'Control Center'}
            </motion.span>
            <h1 className="text-3xl font-black text-[#0D1B2A] tracking-tight mb-3">
              {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white bg-gray-200 flex items-center justify-center font-black text-xs">
                {user?.name.charAt(0)}
              </div>
              <p className="text-base font-medium text-gray-400">
                {tFreelancer.welcome} <span className="text-[#0D1B2A] font-bold">{user?.name}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              {user && <TrustScore score={user.trustScore} className="w-48" size="sm" />}
              <button 
                onClick={() => setIsGuideOpen(true)}
                className="px-4 py-3 glass rounded-2xl flex items-center gap-2 hover:bg-white/40 transition-all h-14"
              >
                <Shield size={16} className="text-[#C9A84C]" />
                <span className="text-xs font-black text-[#0D1B2A] uppercase">
                  {lang === 'ar' ? 'دليل الأمان' : 'Safety Guide'}
                </span>
              </button>
            </div>
          </div>

          <AppleGlassCard className="px-4 py-2 flex items-center gap-3 bg-white/40 border-white/60">
             <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  {lang === 'ar' ? 'حالة الحساب' : 'Account Status'}
                </p>
                <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                  <Shield size={10} /> {lang === 'ar' ? 'موثق ومؤمن' : 'Verified & Secured'}
                </p>
             </div>
             <div className="w-px h-5 bg-gray-200 mx-0.5" />
             <div className="w-7 h-7 rounded-full bg-[#0D1B2A] flex items-center justify-center text-white shadow-lg">
                <Star size={12} fill="#C9A84C" stroke="#C9A84C" />
             </div>
          </AppleGlassCard>
        </motion.header>

        {loading ? (
          <div className="py-20 text-center">
             <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0D1B2A] rounded-full animate-spin mx-auto mb-4" />
             <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">جاري المزامنة...</p>
          </div>
        ) : (
          <>
            {/* Hero Financials */}
            <div className="grid lg:grid-cols-3 gap-5 mb-12">
              <StatHeroCard label={tFreelancer.stats.totalEarnings} value={myEarnings} icon={<CheckCircle />} variant="success" />
              <StatHeroCard label={lang === 'ar' ? 'الخزنة' : 'Escrow Vault'} value={escrowed} icon={<Lock />} variant="vault" />
              <StatHeroCard label={tFreelancer.stats.activeTasks} value={myTasks.filter(t => !t.paid).length} icon={<TrendingUp />} />
            </div>

            {/* Action Center: Invitations */}
            <AnimatePresence>
              {myInvitations.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <div className="flex items-center justify-between mb-5 px-1">
                    <h2 className="text-xl font-black text-[#0D1B2A] tracking-tight">
                      {lang === 'ar' ? 'دعوات العمل' : 'Work Invitations'}
                    </h2>
                    <div className="px-2.5 py-1 glass rounded-full text-[9px] font-black text-red-500 flex items-center gap-1.5 uppercase">
                       <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> {myInvitations.length} {lang === 'ar' ? 'دعوات' : 'invites'}
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {myInvitations.map(inv => (
                      <AppleGlassCard key={inv.id} className="p-5 border-blue-100/40">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                          <div className="flex-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest mb-2 shadow-lg shadow-blue-500/30">مشروع جديد</span>
                            <h3 className="text-xl font-black text-[#0D1B2A] mb-1 tracking-tight">{inv.projectName}</h3>
                            <p className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                              المهمة: <span className="text-[#0D1B2A] font-bold">{inv.taskName}</span>
                              <span className="opacity-20">|</span>
                              <span className="flex items-center gap-1 text-xs"><Users size={12} /> {inv.sender}</span>
                            </p>
                            <div className="flex gap-8">
                              <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">الميزانية</p>
                                <p className="text-lg font-black text-[#1A7F74]">{formatCurrency(inv.budget)}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">الموعد</p>
                                <p className="text-lg font-black text-[#0D1B2A]">{inv.deadline}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            <motion.button 
                              disabled={acceptInviteMutation.isPending}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAcceptInvite(inv)}
                              className="w-full bg-[#0D1B2A] text-white font-black py-2.5 rounded-lg shadow-xl shadow-[#0D1B2A]/20 text-sm transition-all"
                            >
                              {lang === 'ar' ? 'قبول وبدء' : 'Accept & Start'}
                            </motion.button>
                            <button  
                              onClick={() => setSelectedInvitation(inv)}
                              className="w-full bg-white/60 border border-gray-200 text-gray-900 font-bold py-2 rounded-lg hover:bg-white transition-colors text-xs"
                            >
                              {tCommon.viewDetails}
                            </button>
                          </div>
                        </div>
                      </AppleGlassCard>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Main Feed: Current Projects */}
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-xl font-black text-[#0D1B2A] tracking-tight">
                  {tFreelancer.currentTasks}
                </h2>
              </div>

              {myTasks.length === 0 ? (
                <AppleGlassCard className="py-16 text-center border-dashed border-2 border-gray-200 bg-transparent shadow-none rounded-[1.5rem]">
                  <p className="text-lg font-black text-gray-300 tracking-tight">
                    {lang === 'ar' ? 'لا توجد مشاريع حالية' : 'No active projects'}
                  </p>
                </AppleGlassCard>
              ) : (
                <div className="grid gap-4">
                  {myTasks.map(t => (
                    <AppleGlassCard 
                      key={t.id}
                      layoutId={`project-card-${t.projectId}`}
                      onClick={() => navigate(`/projects/${t.projectId}`)}
                      className="hover:border-[#C9A84C]/40 rounded-[1.5rem]"
                    >
                      <div className="flex flex-col lg:flex-row items-stretch">
                        <div className="p-5 flex-1 flex flex-col md:flex-row items-center gap-6">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                            t.paid ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                          )}>
                            {t.paid ? <CheckCircle size={24} /> : <Lock size={24} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                               <h3 className="text-lg font-black text-[#0D1B2A] tracking-tight group-hover:text-blue-600 transition-colors">{t.name}</h3>
                               {t.status === 'Disputed' && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest">نزاع</span>}
                            </div>
                            <p className="text-sm font-bold text-gray-400 mb-2">{t.projectName}</p>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest",
                                t.paid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                              )}>
                                {t.paid ? 'مكتمل' : 'قيد التنفيذ'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#0D1B2A]/5 md:w-64 p-5 flex items-center justify-between border-t lg:border-t-0 lg:border-r border-white/40">
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">المستحقات</p>
                            <p className="text-xl font-black text-[#0D1B2A] tracking-tight">{formatCurrency(t.payment)}</p>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-300 group-hover:text-[#0D1B2A] group-hover:bg-[#C9A84C] transition-all shadow-md">
                            <ChevronLeft size={18} />
                          </div>
                        </div>
                      </div>
                    </AppleGlassCard>
                  ))}
                </div>
              )}
            </section>
            <section className="mt-20">
               <TransactionLedger transactions={ledger} />
            </section>
          </>
        )}
      </div>

      {/* Invitation Modal */}
      <AnimatePresence>
        {isGuideOpen && (
          <EscrowGuide onClose={() => setIsGuideOpen(false)} />
        )}
        {selectedInvitation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedInvitation(null)}
              className="absolute inset-0 bg-[#0D1B2A]/60 backdrop-blur-2xl" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={APPLE_SPRINGS.standard}
              className="bg-[#F9F4EE] w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-white/20" 
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#E8DDD0] bg-[#F9F4EE]/90 backdrop-blur-xl">
                <div>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">تفاصيل الدعوة</p>
                  <h2 className="text-xl font-black text-[#0D1B2A] tracking-tight">{selectedInvitation.projectName}</h2>
                </div>
                <button onClick={() => setSelectedInvitation(null)} className="w-8 h-8 rounded-lg bg-white border border-[#E8DDD0] flex items-center justify-center hover:bg-red-50 hover:border-red-100 transition-all">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-[#E8DDD0] p-5 rounded-xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">المهمة</p>
                    <p className="text-base font-black text-[#0D1B2A] tracking-tight">{selectedInvitation.taskName}</p>
                  </div>
                  <div className="bg-[#0D1B2A] p-5 rounded-xl shadow-lg">
                    <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest mb-1">الميزانية</p>
                    <p className="text-xl font-black text-white tracking-tight">{formatCurrency(selectedInvitation.budget)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                   <h3 className="text-sm font-black text-[#0D1B2A] flex items-center gap-2">
                     <FileText size={16} className="text-[#C9A84C]" /> نبذة عن المشروع
                   </h3>
                   <div className="bg-white/50 border border-[#E8DDD0] p-5 rounded-xl text-sm text-gray-600 leading-relaxed">
                      {selectedInvitation.description}
                   </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-black text-[#0D1B2A] flex items-center gap-2">
                     <CheckCircle size={16} className="text-emerald-500" /> المتطلبات
                  </h3>
                  <div className="grid gap-2">
                    {selectedInvitation.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white border border-[#E8DDD0] p-3 rounded-lg">
                         <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
                         <span className="font-bold text-gray-700 text-xs">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl p-6 border-t border-[#E8DDD0] flex gap-4">
                <motion.button 
                  disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAcceptInvite(selectedInvitation)}
                  className="flex-[2] bg-[#1A7F74] text-white font-black py-3 rounded-xl shadow-xl shadow-emerald-900/30 text-base"
                >
                  {acceptInviteMutation.isPending ? 'جاري القبول...' : 'قبول المهمة'}
                </motion.button>
                <button 
                   disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                  onClick={() => handleRejectInvite(selectedInvitation)}
                  className="flex-1 bg-white border border-red-100 text-red-600 font-black rounded-xl hover:bg-red-50 transition-colors text-sm"
                >
                  رفض
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
