import { FC, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Send, Gavel, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { AppleCloseButton } from '@/shared/components/ui/AppleCloseButton';
import MoneyFlowBar from '@/features/escrow/MoneyFlowBar';
import { formatCurrency } from '@/shared/utils/format';
import { useAuth } from '@/shared/hooks/useAuth';
import { useLanguage } from '@/shared/context/LanguageContext';
import { translations } from '@/shared/translations';
import { cn } from '@/shared/utils/cn';

import { useProjectDetails } from './hooks/useProjectDetails';
import { TaskRow } from './components/TaskRow';
import { DisputeModal } from './components/DisputeModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { PaymentTimeline } from '@/shared/components/fintech/PaymentTimeline';

const ProjectDetailsView: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, isRtl } = useLanguage();
  const tFull = translations.dashboard[lang];
  const trans = tFull.client.projectDetails;

  const { project, form, modals, stats, actions } = useProjectDetails(id);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!project) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E8DDD0] border-t-[#C9A84C]" />
        <p className="font-bold text-gray-400">{trans.loading}</p>
      </div>
    );
  }

  const userRole = user?.role || 'client';

  return (
    <div className="relative min-h-screen">
      <div className={cn("absolute top-6 z-[60]", isRtl ? "right-6" : "left-6")}>
        <AppleCloseButton onClick={() => navigate(-1)} />
      </div>

      <motion.div
        layoutId={`project-card-${id}`}
        initial={false}
        transition={{ layout: { type: 'spring', stiffness: 150, damping: 26, mass: 1.1 } }}
        className="relative z-50 mx-auto mb-10 max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header Section */}
        <div className="border-b border-[#E8DDD0] bg-white p-8">
          <div className={cn("mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center", isRtl ? "pl-12" : "pr-12")}>
            <div className={isRtl ? "text-right" : "text-left"}>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0D1B2A]">
                  {project.title}
                </h1>
                <span className="flex items-center gap-1 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1.5 text-xs font-black text-[#C9A84C]">
                  <Lock size={12} /> {trans.securedFunds}
                </span>
                {stats.openDisputesCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-600">
                    <Gavel size={12} /> {stats.openDisputesCount} {trans.disputeCount}
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-400">
                {trans.owner}: <span className="text-gray-600">{project.owner}</span>
              </p>
            </div>
            <div className={cn("min-w-[200px] rounded-2xl bg-[#0D1B2A] p-5", isRtl ? "text-right" : "text-left")}>
              <span className="mb-1 block text-xs font-black tracking-widest text-blue-200/60 uppercase">
                {trans.totalBudget}
              </span>
              <span className="block text-4xl font-black tracking-tight text-white text-left" dir="ltr">
                {formatCurrency(project.budget)}
              </span>
            </div>
          </div>
          <MoneyFlowBar
            budget={project.budget}
            paid={stats.totalPaid}
            allocated={stats.totalAllocated}
          />
        </div>

        <div className="p-8">
          {/* Add Task Form */}
          {(userRole === 'client' || userRole === 'admin') && (
            <>
              <form
                onSubmit={actions.addTask}
                className={cn("mb-10 flex flex-col items-end gap-3 rounded-2xl border border-[#E8DDD0] bg-gray-50/50 p-3 lg:flex-row", isRtl ? "flex-row" : "flex-row-reverse")}
              >
                <div className="w-full flex-1">
                  <input
                    className={cn("w-full rounded-xl border-2 border-[#E8DDD0] bg-white p-4 font-medium outline-none focus:border-[#C9A84C]", isRtl ? "text-right" : "text-left")}
                    placeholder={trans.addTask.taskName}
                    value={form.name}
                    onChange={(e) => form.setName(e.target.value)}
                    required
                  />
                </div>
                <div className="relative w-full lg:w-72">
                  <input
                    className={cn("w-full rounded-xl border-2 border-[#E8DDD0] bg-white p-4 font-medium outline-none focus:border-[#C9A84C]", isRtl ? "text-right" : "text-left")}
                    placeholder={trans.addTask.freelancerEmail}
                    value={form.freelancerQuery}
                    onChange={(e) => form.lookupFreelancer(e.target.value)}
                    required
                  />
                  {form.resolvedFreelancer && (
                    <div className={cn("absolute top-1/2 -translate-y-1/2 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700", isRtl ? "left-3" : "right-3")}>
                      <UserIcon size={10} /> {form.resolvedFreelancer.name}
                    </div>
                  )}
                </div>
                <div className="w-full lg:w-40">
                  <input
                    className="w-full rounded-xl border-2 border-[#E8DDD0] bg-white p-4 text-left font-medium outline-none focus:border-[#C9A84C]"
                    dir="ltr"
                    type="number"
                    placeholder={trans.addTask.paymentAmount}
                    value={form.payment}
                    onChange={(e) => form.setPayment(e.target.value)}
                    required
                  />
                </div>
                <button disabled={stats.isLocking} className="flex items-center gap-2 rounded-xl bg-[#0D1B2A] px-6 py-4 font-bold text-white shadow-lg whitespace-nowrap disabled:opacity-75 transition-all focus:scale-95 active:scale-95" title="قفل الأموال (Lock Escrow Funds)">
                  {stats.isLocking ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {trans.addTask.locking}</> : <><Lock size={18} /> {trans.addTask.lockBtn}</>}
                </button>
              </form>
              <div className={cn("mt-[-32px] mb-8 px-2 flex gap-3", isRtl ? "justify-start" : "justify-end")}>
                 <button 
                    type="button"
                    onClick={() => {
                      form.setName('UI/UX Design Phase');
                      form.lookupFreelancer('omar_dev');
                      form.setPayment('500');
                    }}
                    className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-1 shadow-sm"
                  >
                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                     تعبئة سريعة (Omar)
                  </button>
              </div>
            </>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            <h2 className={cn("mb-6 text-2xl font-bold text-[#0D1B2A]", isRtl ? "text-right" : "text-left")}>{trans.addTask.title}</h2>
            {project.tasks.map((task) => (
              <div key={task.id} className="space-y-4">
                <TaskRow
                  t={task}
                  project={project}
                  onApprove={actions.completeTask}
                  onAccept={actions.acceptTask}
                  onDispute={(taskObj) => modals.setDisputeTarget({ project, task: taskObj })}
                  onTaskClick={modals.setSelectedTask}
                  userRole={userRole}
                  currentUserId={user?.id}
                  isReleasing={stats.isReleasing === task.id}
                />
                {(task.paymentStatus || task.timeline) && (
                  <div className="px-4 pb-4">
                    <PaymentTimeline 
                      currentStatus={task.paymentStatus!} 
                      events={task.timeline || []} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Log */}
        <div className="p-8 border-t border-[#E8DDD0] bg-gray-50/30">
          <h2 className={cn("mb-6 text-xl font-bold text-[#0D1B2A] flex items-center justify-between", isRtl ? "flex-row" : "flex-row-reverse")}>
            <span className="flex items-center gap-2"><Lock size={20} className="text-[#C9A84C]" /> {trans.escrowLog.title}</span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{trans.escrowLog.securedMsg}</span>
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
               <div className={cn("absolute top-0 bottom-0 w-1 bg-emerald-500", isRtl ? "right-0" : "left-0")}></div>
               <div className={cn("flex items-center gap-3", !isRtl && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <p className="font-bold text-gray-900">{trans.escrowLog.depositTitle}</p>
                    <p className="text-xs text-gray-400">{lang === 'ar' ? `تم إيداع مبلغ ${formatCurrency(project.budget)} في الخزنة المخصصة للمشروع.` : `Amount of ${formatCurrency(project.budget)} deposited to the project vault.`}</p>
                  </div>
               </div>
               <div className={isRtl ? "text-left" : "text-right"}>
                  <p className="text-sm font-black text-emerald-600">+{formatCurrency(project.budget)}</p>
                  <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}</p>
               </div>
            </div>
            
            {project.tasks.map(task => (
               <div key={`log-${task.id}`} className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8DDD0] shadow-sm relative overflow-hidden">
                 <div className={cn("absolute top-0 bottom-0 w-1", isRtl ? "right-0" : "left-0", task.paid ? 'bg-blue-500' : task.status === 'Disputed' ? 'bg-red-500' : 'bg-[#C9A84C]')}></div>
                 <div className={cn("flex items-center gap-3", !isRtl && "flex-row-reverse")}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${task.paid ? 'bg-blue-50 text-blue-600' : task.status === 'Disputed' ? 'bg-red-50 text-red-600' : 'bg-[#C9A84C]/10 text-[#C9A84C]'}`}>
                      {task.paid ? <Send size={18} /> : task.status === 'Disputed' ? <Gavel size={18} /> : <Lock size={18} />}
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <p className="font-bold text-gray-900">
                         {task.paid ? trans.escrowLog.paymentReleased : task.status === 'Disputed' ? trans.escrowLog.disputeLocked : trans.escrowLog.lockFunds}
                      </p>
                      <p className="text-xs text-gray-400">
                         {task.paid ? (lang === 'ar' ? `تحويل دفعة مهمة "${task.name}" إلى ${task.assignedToName || task.assignedTo}.` : `Transferred task payment "${task.name}" to ${task.assignedToName || task.assignedTo}.`) : (lang === 'ar' ? `تم حجز مبلغ المهمة "${task.name}" بانتظار التسليم.` : `Task amount "${task.name}" locked pending delivery.`)}
                      </p>
                    </div>
                 </div>
                 <div className={isRtl ? "text-left" : "text-right"}>
                    <p className={`text-sm font-black ${task.paid ? 'text-blue-600' : 'text-gray-900'}`}>{formatCurrency(task.payment)}</p>
                    <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'الآن' : 'Now'}</p>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {modals.disputeTarget && (
        <DisputeModal target={modals.disputeTarget} onClose={() => modals.setDisputeTarget(null)} />
      )}
      {modals.selectedTask && (
        <TaskDetailsModal
          task={modals.selectedTask}
          onClose={() => modals.setSelectedTask(null)}
          onApprove={actions.completeTask}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default ProjectDetailsView;
