import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lock,
  CheckCircle,
  Briefcase,
  Wallet,
  Clock,
  AlertTriangle,
  Plus,
  Shield,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/services/api';
import { Project, Task, User } from '@/types';
import { formatCurrency } from '@/shared/utils/format';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLanguage } from '@/shared/context/LanguageContext';
import { translations } from '@/shared/translations';
import { TransactionLedger } from '@/shared/components/fintech/TransactionLedger';
import { TrustScore } from '@/shared/components/fintech/TrustScore';

// Components
import { EscrowGuide } from '@/shared/components/EscrowGuide';
import { DisputeModal } from './components/ClientDashboard/DisputeModal';
import { ApproveModal } from './components/ClientDashboard/ApproveModal';
import { ProjectCard } from './components/ClientDashboard/ProjectCard';
import { CreateProjectModal } from './components/ClientDashboard/CreateProjectModal';

// Mock data should be moved to API/Server in production. Keeping here for demo parity.
const MOCK_MILESTONES: Record<string, { name: string; status: 'done' | 'review' | 'upcoming' }[]> =
  {
    proj_1: [
      { name: 'تصميم الواجهات', status: 'done' },
      { name: 'تطوير الواجهة', status: 'review' },
      { name: 'الخادم والـ API', status: 'upcoming' },
      { name: 'الاختبار والإطلاق', status: 'upcoming' },
    ],
    proj_2: [
      { name: 'رسوم هيكلية', status: 'done' },
      { name: 'التطوير الكامل', status: 'review' },
      { name: 'الاختبار', status: 'upcoming' },
    ],
  };

const MOCK_SUBMISSION: Record<
  string,
  { by: string; milestone: string; files: string[]; date: string }
> = {
  proj_1: {
    by: 'Omar',
    milestone: 'تطوير الواجهة',
    files: ['frontend_build.zip', 'docs.pdf'],
    date: '12 يونيو 2026',
  },
};

export default function ClientDashboard() {
  const { lang, isRtl } = useLanguage();
  const tFull = translations.dashboard[lang];
  const tStatus = tFull.status;
  const tClient = tFull.client;
  const tCommon = tFull.common;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ project: Project; task: Task } | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<{ project: Project; task: Task } | null>(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // In production, use a dedicated useAuth() hook.
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
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['projects', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      return api.getProjectsByOwner(user!.id);
    },
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ['ledger', user?.id],
    enabled: !!user?.id,
    queryFn: async () => api.getLedgerByUser(user!.id),
  });

  const approveMutation = useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      api.completeTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      toast.success(`✅ تم صرف الدفعة بنجاح!`);
      setApproveTarget(null);
    },
    onError: () => {
      toast.error('فشل في صرف الدفعة. يرجى المحاولة لاحقاً.');
    },
  });

  useLayoutEffect(() => {
    // Attempt to restore scroll position immediately on mount to prevent visual jumps
    const savedScrollPos = sessionStorage.getItem('clientDashboardScroll');
    if (savedScrollPos) {
      // Must use a tiny delay sometimes to ensure DOM has painted length
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScrollPos, 10), behavior: 'instant' });
      }, 10);
      sessionStorage.removeItem('clientDashboardScroll');
    }
  }, [projects.length]);

  // Memoized derived state to prevent re-calculations on every render
  const { totalBudget, totalPaid, totalLocked, pendingApprovals, projectSubmissions } = useMemo(() => {
    let budget = 0;
    let paid = 0;
    let locked = 0;
    let pending = 0;
    const submissions: Record<string, any> = {};

    projects.forEach((p) => {
      budget += p.budget;
      
      const pendingTask = p.tasks.find(t => t.submittedAt && !t.paid);
      if (pendingTask) {
        pending += 1;
        submissions[p.id] = {
          by: pendingTask.assignedToName || pendingTask.assignedTo,
          milestone: pendingTask.name,
          files: pendingTask.deliverableFile ? [pendingTask.deliverableFile] : [],
          date: pendingTask.submittedAt,
          taskId: pendingTask.id
        };
      }

      p.tasks.forEach((t) => {
        if (t.paid) paid += t.payment;
        else locked += t.payment;
      });
    });

    return { totalBudget: budget, totalPaid: paid, totalLocked: locked, pendingApprovals: pending, projectSubmissions: submissions };
  }, [projects]);

  useGSAP(
    () => {
      if (isLoading) return;

      gsap.fromTo(
        '.stat-card',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.budget-flow',
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: 'expo.out', delay: 0.4 }
      );
    },
    { scope: containerRef, dependencies: [isLoading] }
  );

  const handleApproveClick = (projectId: string, taskId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    if (project && task) setApproveTarget({ project, task });
  };

  const handleOpenProjectDetails = (projectId: string) => {
    // Save scroll position precisely before navigating
    sessionStorage.setItem('clientDashboardScroll', window.scrollY.toString());
    
    // We navigate immediately to allow Framer Motion layoutId to take over
    navigate(`/projects/${projectId}`);
  };

  if (isError) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center text-center"
        role="alert"
      >
        <AlertTriangle size={48} className="mb-4 text-red-500" aria-hidden="true" />
        <h2 className="text-xl font-bold text-[var(--color-kafil-midnight)]">
          {lang === 'ar' ? 'عذراً، حدث خطأ أثناء تحميل البيانات' : 'Sorry, an error occurred while loading data'}
        </h2>
        <p className="mt-2 mb-6 text-gray-500">
          {lang === 'ar' ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.' : 'Please check your internet connection and try again.'}
        </p>
        <button onClick={() => window.location.reload()} className="btn-gold">
          {lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <main
      ref={containerRef}
      className="animate-fade-in mx-auto max-w-6xl space-y-10 focus:outline-none"
      dir={isRtl ? 'rtl' : 'ltr'}
      tabIndex={-1}
    >
      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-kafil-midnight)]">
              {lang === 'ar' ? 'الخزنة المركزية' : 'Central Vault'}
            </h1>
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-2">
               <Wallet size={16} className="text-emerald-600" />
               <span className="text-xs font-bold text-emerald-800">
                 {lang === 'ar' ? 'رصيد المحفظة:' : 'Wallet Balance:'} {formatCurrency(user?.balance || 0)}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <TrustScore score={user.trustScore} className="w-48" size="sm" />
            )}
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="bg-blue-50 border border-blue-200 px-3 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-100 transition-colors h-14"
            >
               <Shield size={16} className="text-blue-600" />
               <span className="text-xs font-black text-blue-800">
                 {lang === 'ar' ? 'دليل الأمان' : 'Safety Guide'}
               </span>
            </button>
            <button 
              onClick={() => {
                api.resetDb();
                window.location.reload();
              }}
              className="bg-emerald-50 border border-emerald-200 px-3 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-100 transition-colors h-14"
              title="إعادة ضبط البيانات إلى الوضع الافتراضي (Hackathon Demo)"
            >
               <TrendingUp size={16} className="text-emerald-600" />
               <span className="text-xs font-black text-emerald-800">
                 {lang === 'ar' ? 'بيانات تجريبية' : 'Demo Data'}
               </span>
            </button>
          </div>
          <p className="font-medium text-gray-500">
            {tClient.welcome} {user?.name}! {lang === 'ar' ? 'جميع أموالك محمية تحت نظام الضمان.' : 'All your funds are protected under the Escrow system.'}
          </p>
        </div>
        <motion.button
          layoutId="create-project-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-[var(--color-kafil-midnight)] px-6 py-3.5 font-black text-white transition-all hover:-translate-y-0.5 hover:shadow-xl focus:ring-4 focus:ring-[var(--color-kafil-gold)] focus:outline-none"
          style={{ boxShadow: '0 4px 20px rgba(13,27,42,0.25)' }}
        >
          <Plus size={18} aria-hidden="true" /> {tClient.createProject}
        </motion.button>
      </header>

      {isLoading ? (
        // Skeleton Loading State
        <div className="space-y-10" aria-busy="true" aria-label="جاري تحميل المشاريع">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-3xl border border-[var(--color-kafil-sand)] bg-white/50"
              />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-3xl border border-[var(--color-kafil-sand)] bg-white/50" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Stats */}
          <section className="grid gap-4 md:grid-cols-4" aria-label="إحصائيات الخزنة">
            <div className="stat-card flex items-center gap-4 rounded-3xl border border-[var(--color-kafil-sand)] bg-white p-6 shadow-sm">
              <div
                className="rounded-xl border border-[var(--color-kafil-sand)] bg-gray-50 p-3"
                aria-hidden="true"
              >
                <Wallet size={22} className="text-[var(--color-kafil-midnight)]" />
              </div>
              <div>
                <h2 className="m-0 text-[10px] font-black text-gray-400 uppercase">
                  {lang === 'ar' ? 'الرصيد المتاح' : 'Available Balance'}
                </h2>
                <p className="text-2xl font-black text-[var(--color-kafil-midnight)]">
                  {formatCurrency(user?.balance || 0)}
                </p>
              </div>
            </div>

            <div className="stat-card flex items-center gap-4 rounded-3xl bg-[var(--color-kafil-midnight)] p-6 shadow-lg">
              <div className="rounded-xl bg-white/10 p-3" aria-hidden="true">
                <Lock size={22} className="text-[var(--color-kafil-gold)]" />
              </div>
              <div>
                <h2 className="m-0 text-[10px] font-black text-blue-200/60 uppercase">
                  {tClient.stats.lockedFunds}
                </h2>
                <p className="text-2xl font-black text-white">{formatCurrency(user?.lockedFunds || 0)}</p>
              </div>
            </div>

            <div className="stat-card flex items-center gap-4 rounded-3xl border border-[var(--color-kafil-sand)] bg-white p-6 shadow-sm">
              <div className="rounded-xl bg-emerald-50 p-3" aria-hidden="true">
                <CheckCircle size={22} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="m-0 text-[10px] font-black text-gray-400 uppercase">
                  {tClient.stats.completedTasks}
                </h2>
                <p className="text-2xl font-black text-[var(--color-kafil-midnight)]">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>

            <div
              className={`stat-card flex items-center gap-4 rounded-3xl border p-6 shadow-sm ${pendingApprovals > 0 ? 'border-amber-200 bg-amber-50' : 'border-[var(--color-kafil-sand)] bg-white'}`}
            >
              <div
                className={`rounded-xl p-3 ${pendingApprovals > 0 ? 'bg-amber-100' : 'bg-gray-50'}`}
                aria-hidden="true"
              >
                <Clock
                  size={22}
                  className={pendingApprovals > 0 ? 'text-amber-600' : 'text-gray-400'}
                />
              </div>
              <div>
                <h2 className="m-0 text-[10px] font-black text-gray-400 uppercase">
                  {tClient.stats.activeTasks}
                </h2>
                <p
                  className={`text-2xl font-black ${pendingApprovals > 0 ? 'text-amber-700' : 'text-[var(--color-kafil-midnight)]'}`}
                >
                  {pendingApprovals}
                </p>
              </div>
            </div>
          </section>

          {/* Budget Flow Visualizer */}
          <section
            className="budget-flow rounded-3xl border border-[var(--color-kafil-sand)] bg-white p-7 shadow-sm"
            aria-labelledby="budget-flow-title"
          >
            <h2
              id="budget-flow-title"
              className="mb-5 flex items-center gap-2 text-base font-black text-[var(--color-kafil-midnight)]"
            >
              <Wallet size={18} className="text-[var(--color-kafil-gold)]" aria-hidden="true" />{' '}
              مسار ميزانيتك
            </h2>
            <div
              className="mx-auto flex max-w-2xl flex-col items-center justify-between gap-4 md:flex-row"
              aria-hidden="true"
            >
              <div className="min-w-[130px] rounded-2xl border border-[var(--color-kafil-sand)] bg-gray-50 px-8 py-5 text-center">
                <p className="mb-1 text-xs font-bold text-gray-400">رأس المال</p>
                <p className="text-2xl font-black text-[var(--color-kafil-midnight)]">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <TrendingUp size={20} className="hidden rotate-180 text-gray-200 md:block" />
              <div className="min-w-[150px] scale-105 rounded-2xl border-2 border-[var(--color-kafil-gold)] bg-[var(--color-kafil-gold)]/5 px-8 py-5 text-center">
                <p className="mb-1 flex items-center justify-center gap-1 text-xs font-bold text-[var(--color-kafil-gold)]">
                  <Lock size={10} /> في الضمان
                </p>
                <p className="text-2xl font-black text-[var(--color-kafil-midnight)]">
                  {formatCurrency(totalLocked)}
                </p>
              </div>
              <TrendingUp size={20} className="hidden rotate-180 text-gray-200 md:block" />
              <div className="min-w-[130px] rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-5 text-center">
                <p className="mb-1 text-xs font-bold text-emerald-600">صُرف للمستقلين</p>
                <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </section>

          {/* Projects */}
          <section className="space-y-5" aria-labelledby="projects-title">
            <div className="flex items-center justify-between">
              <h2
                id="projects-title"
                className="text-xl font-bold text-[var(--color-kafil-midnight)]"
              >
                {tClient.activeProjects} ({projects.length})
              </h2>
              {pendingApprovals > 0 && (
                <div
                  className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700"
                  role="status"
                >
                  <AlertTriangle size={12} aria-hidden="true" /> {pendingApprovals} {lang === 'ar' ? 'تسليم يحتاج اعتمادك' : 'submissions need your approval'}
                </div>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[var(--color-kafil-sand)] bg-white p-16 text-center">
                <ShieldCheck size={48} className="mx-auto mb-4 text-gray-200" aria-hidden="true" />
                <p className="mb-2 text-lg font-bold text-gray-400">
                  {lang === 'ar' ? 'لا توجد مشاريع بعد.' : 'No projects yet.'}
                </p>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="font-bold text-[var(--color-kafil-midnight)] bg-[var(--color-kafil-gold)] px-6 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform"
                  >
                    {lang === 'ar' ? 'ابدأ بإنشاء مشروعك الأول' : 'Start by creating your first project'}
                  </button>
                  <button
                    onClick={() => {
                      api.resetDb();
                      window.location.reload();
                    }}
                    className="text-sm font-bold text-gray-400 hover:text-[var(--color-kafil-midnight)] transition-colors"
                  >
                    {lang === 'ar' ? 'أو قم بتحميل البيانات التجريبية (عمر، طارق...)' : 'Or load demo data (Omar, Tariq...)'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2" role="list">
                {projects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    p={p}
                    milestones={MOCK_MILESTONES[p.id] || []}
                    submission={projectSubmissions[p.id] || null}
                    onApprove={handleApproveClick}
                    onDispute={(proj, task) => setDisputeTarget({ project: proj, task })}
                    onViewDetails={() => handleOpenProjectDetails(p.id)}
                  />
                ))}
              </div>
            )}
          </section>
            
          <section className="mt-20">
             <TransactionLedger transactions={ledger} />
          </section>
        </div>
      )}

      {/* Approve Modal */}

      <AnimatePresence>
        {approveTarget && (
          <ApproveModal
            project={approveTarget.project}
            task={approveTarget.task}
            submission={projectSubmissions[approveTarget.project.id] || null}
            onClose={() => setApproveTarget(null)}
            onConfirm={() =>
              approveMutation.mutate({
                projectId: approveTarget.project.id,
                taskId: approveTarget.task.id,
              })
            }
          />
        )}
      </AnimatePresence>

      {/* Dispute Modal */}
      <AnimatePresence>
        {disputeTarget && (
          <DisputeModal
            target={disputeTarget}
            onClose={() => setDisputeTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isGuideOpen && (
          <EscrowGuide onClose={() => setIsGuideOpen(false)} />
        )}
        {isCreateModalOpen && user && (
          <CreateProjectModal user={user} onClose={() => setIsCreateModalOpen(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
