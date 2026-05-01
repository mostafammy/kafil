import { FC } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Gavel, CheckCircle2, Clock, Lock } from 'lucide-react';
import { Task, Project } from '@/types';
import { formatCurrency } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { useLanguage } from '@/shared/context/LanguageContext';
import { translations } from '@/shared/translations';

interface TaskRowProps {
  t: Task;
  project: Project;
  onApprove: (id: string) => void;
  onAccept?: (id: string) => void;
  onDispute: (t: Task) => void;
  onTaskClick: (t: Task) => void;
  userRole: string;
  currentUserId?: string;
  isReleasing?: boolean;
}

export const TaskRow: FC<TaskRowProps> = ({ t, project, onApprove, onAccept, onDispute, onTaskClick, userRole, currentUserId, isReleasing }) => {
  const { lang, isRtl } = useLanguage();
  const tr = translations.dashboard[lang].client.projectDetails.taskRow;
  
  const isPaid = t.paid;
  const isDisputed = t.status === 'Disputed';
  const isProgress = t.status === 'In Progress';

  const statusLabel = isPaid ? tr.status.Completed : isDisputed ? tr.status.OpenDispute : isProgress ? tr.status.InProgress : tr.status.PendingApproval;
  const statusColor = isPaid ? 'text-emerald-600' : isDisputed ? 'text-red-600' : 'text-amber-600';

  return (
    <div 
      onClick={() => onTaskClick(t)}
      className={cn(
      'group relative bg-white border-2 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-lg cursor-pointer',
      isRtl ? 'text-right' : 'text-left',
      isPaid ? 'border-emerald-100 bg-emerald-50/20' :
      isDisputed ? 'border-red-100 bg-red-50/10' :
      t.inviteStatus === 'Pending' ? 'border-blue-100 bg-blue-50/20 opacity-80' : 'border-[#E8DDD0] hover:border-[#C9A84C]/30'
    )}>
      {isPaid && (
        <div className={cn("absolute top-0 -translate-y-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm", isRtl ? "right-8" : "left-8")}>
          {tr.paidSuccess}
        </div>
      )}
      <div className={cn("flex items-start gap-4 flex-1", !isRtl && "flex-row-reverse")}>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
          isPaid ? 'bg-emerald-100 text-emerald-600' :
          isDisputed ? 'bg-red-100 text-red-600' : 'bg-[#C9A84C]/10 text-[#C9A84C]'
        )}>
          {isPaid ? <CheckCircle2 size={24} /> : isDisputed ? <Gavel size={24} /> : <ShieldCheck size={24} />}
        </div>
        <div className={isRtl ? "text-right" : "text-left"}>
          <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight flex items-center gap-2">
            {t.name}
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">
              <span className="inline-flex items-center gap-1"><Lock size={10} /> {tr.secured}</span>
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <User size={14} className="text-gray-300" /> {t.assignedToName ?? t.assignedTo}
            </span>
            <span className={cn('flex items-center gap-1.5 font-bold', statusColor)}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className={cn("flex items-center gap-4 w-full md:w-auto border-t-2 md:border-t-0 border-[#E8DDD0] pt-4 md:pt-0", !isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-left" : "text-right"}>
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{tr.taskAmount}</span>
          <span className="text-xl font-black text-[#0D1B2A] leading-none" dir="ltr">{formatCurrency(t.payment)}</span>
        </div>

        <div className={cn("flex gap-2 flex-wrap", isRtl ? "mr-auto md:mr-0" : "ml-auto md:ml-0")}>
          {!isPaid && (userRole === 'client' || userRole === 'admin') && (
            <button
              disabled={isReleasing}
              onClick={(e) => { e.stopPropagation(); onApprove(t.id); }}
              className="flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 shadow-lg whitespace-nowrap bg-[#1A7F74] disabled:opacity-75"
            >
              {isReleasing ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"></span> {tr.releasing}</> : <><CheckCircle2 size={15} /> {tr.releaseBtn}</>}
            </button>
          )}
          {!isPaid && t.inviteStatus === 'Pending' && (userRole === 'freelancer' || t.assignedTo === currentUserId) && onAccept && (
            <button
              onClick={(e) => { e.stopPropagation(); onAccept(t.id); }}
              className="flex items-center gap-2 text-white font-black px-4 py-2.5 rounded-xl text-sm transition-all hover:scale-105 shadow-xl bg-blue-600"
            >
              <CheckCircle2 size={15} /> {lang === 'ar' ? 'قبول المهمة' : 'Accept Task'}
            </button>
          )}
          {!isPaid && !isDisputed && (userRole === 'client' || userRole === 'admin' || userRole === 'freelancer') && (
            <motion.button
              layoutId={`dispute-btn-${project.id}-${t.id}`}
              onClick={(e) => { e.stopPropagation(); onDispute(t); }}
              className="flex items-center gap-2 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm border-2 border-red-100 bg-white hover:bg-red-50"
            >
              <Gavel size={15} /> {tr.openDispute}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
