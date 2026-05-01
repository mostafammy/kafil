import { useEffect, useState, FC, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Send, Gavel, X, FileText, Upload, TriangleAlert,
  Scale, CheckCircle2, ShieldCheck, User, ArrowLeft
} from 'lucide-react';
import MoneyFlowBar from '@/features/escrow/MoneyFlowBar';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Project, Task, User as UserType } from '@/types';
import { formatCurrency } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

/* ─── Dispute Modal (same spec §5.6) ─── */
const DISPUTE_REASONS = [
  'جودة التسليم لا تتوافق مع المتطلبات المتفق عليها',
  'تأخر في التسليم دون إبلاغ مسبق',
  'الدفعة لم تُصرف رغم الاعتماد',
  'العمل لم يُسلَّم أصلاً',
  'سبب آخر',
];

interface DisputeTarget { project: Project; task: Task; }

const DisputeModal: FC<{ target: DisputeTarget; onClose: () => void }> = ({ target, onClose }) => {
  const [reason, setReason] = useState('');
  const [caseText, setCaseText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const canSubmit = reason && caseText.length >= 20;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,27,42,0.8)', backdropFilter: 'blur(6px)' }}>
        <motion.div 
          layoutId={`dispute-btn-${target.project.id}-${target.task.id}`}
          className="bg-[#F9F4EE] w-full max-w-md rounded-3xl shadow-2xl p-8 text-center" dir="rtl"
        >
          <div className="w-16 h-16 rounded-full bg-[#0D1B2A] flex items-center justify-center mx-auto mb-5">
            <Scale size={30} className="text-[#C9A84C]" />
          </div>
          <h3 className="text-2xl font-black text-[#0D1B2A] mb-2">تم فتح النزاع</h3>
          <p className="text-gray-500 text-sm mb-2">سيتم اختيار 3 محكمين مستقلين خلال دقائق.</p>
          <p className="text-xs text-gray-400 mb-6">جميع المدفوعات المعلقة في هذه المهمة مجمّدة حتى صدور الحكم.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-right">
            <p className="text-xs font-black text-amber-700 mb-1">رسوم تقديم النزاع: $10</p>
            <p className="text-xs text-amber-600">تُستردّ كاملاً إذا صدر الحكم لصالحك.</p>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-black text-white" style={{ background: '#0D1B2A' }}>
            حسناً، فهمت
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,27,42,0.8)', backdropFilter: 'blur(6px)' }}>
      <motion.div 
        layoutId={`dispute-btn-${target.project.id}-${target.task.id}`}
        className="bg-[#F9F4EE] w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl" dir="rtl"
      >

        <div className="bg-red-600 p-6 rounded-t-3xl flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-1">فتح نزاع تحكيمي</p>
            <h2 className="text-xl font-black text-white">{target.task.name}</h2>
            <p className="text-red-200/70 text-sm">{target.project.title} · {target.task.assignedTo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <TriangleAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-700 mb-0.5">فتح نزاع يجمّد المدفوعات المعلقة فوراً.</p>
              <p className="text-xs text-amber-600">رسوم تقديم: <strong>$10</strong> · تُستردّ إذا صدر الحكم لصالحك.</p>
            </div>
          </div>

          {/* Task info */}
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">المهمة المتنازع عليها</p>
              <p className="font-black text-[#0D1B2A]">{target.task.name}</p>
              <p className="text-xs text-gray-400">مسند إلى: {target.task.assignedTo}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">المبلغ</p>
              <p className="text-2xl font-black text-[#0D1B2A]">{formatCurrency(target.task.payment)}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-sm font-black text-[#0D1B2A] mb-3">ما سبب النزاع؟</p>
            <div className="space-y-2">
              {DISPUTE_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={cn(
                    'w-full text-right p-3 rounded-xl border-2 text-sm font-medium transition-all',
                    reason === r ? 'border-red-400 bg-red-50 text-red-800 font-bold' : 'border-[#E8DDD0] bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  <span className={cn('inline-block w-4 h-4 rounded-full border-2 mr-2 align-middle', reason === r ? 'border-red-500 bg-red-500' : 'border-gray-300')} />
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Case text */}
          <div>
            <p className="text-sm font-black text-[#0D1B2A] mb-2">اشرح قضيتك <span className="text-gray-400 font-normal">(بحد أدنى 20 حرف)</span></p>
            <textarea value={caseText} onChange={e => setCaseText(e.target.value)}
              placeholder="اشرح بالتفصيل ما حدث، ومتى، وما الأدلة التي لديك..."
              className="w-full bg-white border-2 border-[#E8DDD0] rounded-2xl p-4 text-sm focus:outline-none focus:border-red-300 transition-colors min-h-[100px] resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-left">{caseText.length} / 500</p>
          </div>

          {/* Evidence */}
          <div>
            <p className="text-sm font-black text-[#0D1B2A] mb-2">أدلة داعمة <span className="text-gray-400 font-normal">(اختياري)</span></p>
            <label className={cn(
              'flex items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-colors',
              evidenceFile ? 'border-emerald-400 bg-emerald-50' : 'border-[#E8DDD0] hover:border-red-300'
            )}>
              <input type="file" className="hidden" onChange={e => setEvidenceFile(e.target.files?.[0]?.name || '')} />
              {evidenceFile
                ? <><FileText size={18} className="text-emerald-600" /><span className="text-sm font-bold text-emerald-700">{evidenceFile}</span></>
                : <><Upload size={18} className="text-gray-300" /><span className="text-sm text-gray-400">رفع صورة، ملف، أو تصدير محادثة</span></>}
            </label>
          </div>

          {/* AI notice */}
          <div className="bg-[#0D1B2A]/5 border border-[#0D1B2A]/10 rounded-2xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-black text-[#0D1B2A]">ملاحظة: </span>
              سيقوم الذكاء الاصطناعي بإنشاء ملخص محايد للقضية دون أن تطّلع عليه مسبقاً — وذلك لضمان نزاهة التحكيم.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-3.5 rounded-xl border border-[#E8DDD0] text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
              إلغاء
            </button>
            <button
              disabled={!canSubmit}
              onClick={() => { if (canSubmit) { setSubmitted(true); toast.error('⚠️ تم فتح النزاع — المدفوعات مجمّدة'); } }}
              className="py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#DC2626' }}
            >
              <Gavel size={16} /> تقديم النزاع · $10
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Task Row ─── */
const TaskRow: FC<{
  t: Task; project: Project;
  onApprove: (id: string) => void;
  onDispute: (t: Task) => void;
  userRole: string;
}> = ({ t, project, onApprove, onDispute, userRole }) => {
  const isPaid = t.paid;
  const isDisputed = t.status === 'Disputed';
  const isProgress = t.status === 'In Progress';

  const statusLabel = isPaid ? 'مكتمل' : isDisputed ? 'نزاع مفتوح' : isProgress ? 'قيد التنفيذ' : 'انتظار الاعتماد';
  const statusColor = isPaid ? 'text-emerald-600' : isDisputed ? 'text-red-600' : 'text-amber-600';

  return (
    <div className={cn(
      'group relative bg-white border-2 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-lg',
      isPaid ? 'border-emerald-100 bg-emerald-50/20' :
      isDisputed ? 'border-red-100 bg-red-50/10' : 'border-[#E8DDD0] hover:border-[#C9A84C]/30'
    )}>
      {isPaid && (
        <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
          تم الدفع بنجاح
        </div>
      )}
      {isDisputed && (
        <div className="absolute top-0 right-8 -translate-y-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
          نزاع مفتوح
        </div>
      )}

      <div className="flex items-start gap-4 flex-1">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
          isPaid ? 'bg-emerald-100 text-emerald-600' :
          isDisputed ? 'bg-red-100 text-red-600' : 'bg-[#C9A84C]/10 text-[#C9A84C]'
        )}>
          {isPaid ? <CheckCircle2 size={24} /> : isDisputed ? <Gavel size={24} /> : <ShieldCheck size={24} />}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">{t.name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <User size={14} className="text-gray-300" /> {t.assignedTo}
            </span>
            <span className={cn('flex items-center gap-1.5 font-bold', statusColor)}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto border-t-2 md:border-t-0 border-[#E8DDD0] pt-4 md:pt-0">
        <div className="text-left">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">مبلغ المهمة</span>
          <span className="text-xl font-black text-[#0D1B2A] leading-none">{formatCurrency(t.payment)}</span>
        </div>

        <div className="flex gap-2 mr-auto md:mr-0 flex-wrap">
          {/* Client: approve */}
          {!isPaid && (userRole === 'client' || userRole === 'admin') && (
            <button
              onClick={() => onApprove(t.id)}
              className="flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 shadow-lg whitespace-nowrap"
              style={{ background: '#1A7F74', boxShadow: '0 2px 12px rgba(26,127,116,0.3)' }}
            >
              <CheckCircle2 size={15} /> اعتماد وصرف
            </button>
          )}

          {/* Client: open dispute */}
          {!isPaid && !isDisputed && (userRole === 'client' || userRole === 'admin') && (
            <motion.button
              layoutId={`dispute-btn-${project.id}-${t.id}`}
              onClick={() => onDispute(t)}
              className="flex items-center gap-2 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm border-2 border-red-100 bg-white hover:bg-red-50 hover:border-red-300 transition-all whitespace-nowrap"
            >
              <Gavel size={15} /> فتح نزاع
            </motion.button>
          )}

          {/* Freelancer: open dispute */}
          {!isPaid && !isDisputed && userRole === 'freelancer' && (
            <motion.button
              layoutId={`dispute-btn-${project.id}-${t.id}`}
              onClick={() => onDispute(t)}
              className="flex items-center gap-2 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm border-2 border-red-100 bg-white hover:bg-red-50 hover:border-red-300 transition-all whitespace-nowrap"
            >
              <Gavel size={15} /> فتح نزاع
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const ProjectDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [payment, setPayment] = useState('');
  const [disputeTarget, setDisputeTarget] = useState<DisputeTarget | null>(null);

  const userStr = localStorage.getItem('user');
  const user: UserType = userStr ? JSON.parse(userStr) : { role: 'client', name: 'Guest', username: 'guest', id: '0' };

  const loadProject = () => {
    if (id) api.getProject(id).then(setProject).catch(console.error);
  };

  useEffect(() => { loadProject(); }, [id]);

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (id) {
      try {
        await api.addTask(id, { name, assignedTo, payment: Number(payment) });
        toast.success('تمت إضافة المهمة بنجاح');
        setName(''); setAssignedTo(''); setPayment('');
        loadProject();
      } catch { toast.error('فشل إضافة المهمة'); }
    }
  };

  const completeTask = async (taskId: string) => {
    if (!window.confirm('الإفراج عن الدفعة نهائي. تأكيد؟')) return;
    if (id) {
      try {
        await api.completeTask(id, taskId);
        toast.success('تم صرف الدفعة وتحويلها للمستقل بنجاح');
        loadProject();
      } catch { toast.error('فشل صرف الدفعة'); }
    }
  };

  const openDispute = (t: Task) => {
    if (!project) return;
    setDisputeTarget({ project, task: t });
  };

  if (!project) return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 border-4 border-[#E8DDD0] border-t-[#C9A84C] rounded-full animate-spin mx-auto mb-4" />
      <p className="font-bold text-gray-400">جاري تحميل الخزنة...</p>
    </div>
  );

  const totalPaid = project.tasks.filter(t => t.paid).reduce((s, t) => s + t.payment, 0);
  const totalAllocated = project.tasks.reduce((s, t) => s + t.payment, 0);
  const remainingBudget = project.budget - totalAllocated;
  const openDisputes = project.tasks.filter(t => t.status === 'Disputed').length;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto" dir="rtl">

      {/* Project Header */}
      <div className="bg-white border border-[#E8DDD0] rounded-3xl p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-extrabold text-[#0D1B2A] tracking-tight">{project.title}</h1>
              <span className="bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                <Lock size={12} /> الأموال محفوظة في كفيل
              </span>
              {openDisputes > 0 && (
                <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1">
                  <Gavel size={12} /> {openDisputes} نزاع مفتوح
                </span>
              )}
            </div>
            <p className="text-gray-400 font-medium">المدير: <span className="text-gray-600">{project.owner}</span></p>
          </div>
          <div className="text-right bg-[#0D1B2A] p-5 rounded-2xl min-w-[200px]">
            <span className="block text-xs font-black text-blue-200/60 mb-1 uppercase">الميزانية الإجمالية</span>
            <span className="block text-4xl font-black text-white tracking-tight">{formatCurrency(project.budget)}</span>
          </div>
        </div>
        <MoneyFlowBar budget={project.budget} paid={totalPaid} allocated={totalAllocated} />
      </div>

      {/* Add Task Form (client/admin only) */}
      {(user.role === 'client' || user.role === 'admin') && (
        <form onSubmit={addTask} className="flex flex-col lg:flex-row gap-3 mb-6 bg-white border border-[#E8DDD0] p-3 rounded-2xl items-end shadow-sm focus-within:ring-2 focus-within:ring-[#C9A84C]/20 transition-all">
          <div className="flex-1 w-full">
            <input className="border-0 bg-gray-50 p-4 w-full rounded-xl focus:bg-[#C9A84C]/5 focus:ring-0 outline-none font-medium placeholder-gray-400"
              placeholder="وصف المهمة (مثال: برمجة الواجهة)" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="w-full lg:w-64">
            <input className="border-0 bg-gray-50 p-4 w-full rounded-xl focus:bg-[#C9A84C]/5 focus:ring-0 outline-none font-medium placeholder-gray-400"
              placeholder="اسم المستقل" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required />
          </div>
          <div className="w-full lg:w-40">
            <input className="border-0 bg-gray-50 p-4 w-full rounded-xl focus:bg-[#C9A84C]/5 focus:ring-0 outline-none font-medium text-left placeholder-gray-400"
              dir="ltr" type="number" min="1" max={remainingBudget} placeholder="المبلغ $" value={payment} onChange={e => setPayment(e.target.value)} required />
          </div>
          <button className="font-bold px-6 py-4 rounded-xl w-full lg:w-auto transition-all flex justify-center items-center gap-2 shadow-lg whitespace-nowrap text-white hover:-translate-y-0.5"
            style={{ background: '#0D1B2A' }}>
            <Send size={18} /> أضف للسجل
          </button>
        </form>
      )}

      {/* Tasks Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-[#0D1B2A]">
          المهام التعاقدية
          <span className="text-base font-medium text-gray-400 mr-2">({project.tasks.length})</span>
        </h2>
        {project.tasks.filter(t => !t.paid).length > 0 && (user.role === 'client' || user.role === 'admin') && (
          <p className="text-xs text-gray-400 font-medium">
            اضغط على <span className="font-black text-red-500">فتح نزاع</span> لبدء التحكيم ضد أي مستقل
          </p>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {project.tasks.map(t => (
          <TaskRow
            key={t.id}
            t={t}
            project={project}
            onApprove={completeTask}
            onDispute={openDispute}
            userRole={user.role}
          />
        ))}
        {project.tasks.length === 0 && (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-[#E8DDD0] rounded-3xl bg-white font-medium shadow-sm">
            الخزنة جاهزة. ابدأ بإضافة المهام والمدفوعات بالأعلى.
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {disputeTarget && (
        <DisputeModal
          target={disputeTarget}
          onClose={() => setDisputeTarget(null)}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
