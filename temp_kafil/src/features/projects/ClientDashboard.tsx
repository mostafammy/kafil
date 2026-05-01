import { motion, AnimatePresence } from 'framer-motion';
// ... (rest of imports will be handled by the tool if I provide enough context)
import { Link } from 'react-router-dom';
import {
  Lock, CheckCircle, Briefcase, ChevronLeft, Wallet,
  Users, Clock, AlertTriangle, X, FileText, ThumbsUp,
  ShieldCheck, TrendingUp, Plus, Eye, Gavel, Upload, TriangleAlert, Scale
} from 'lucide-react';
import { api } from '@/services/api';
import { Project, Task, User } from '@/types';
import { formatCurrency } from '@/shared/utils/format';
import { toast } from 'sonner';

// Mock milestone data per project
const MOCK_MILESTONES: Record<string, { name: string; status: 'done' | 'review' | 'upcoming' }[]> = {
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

// Mock pending submission
const MOCK_SUBMISSION: Record<string, { by: string; milestone: string; files: string[]; date: string }> = {
  proj_1: { by: 'Omar', milestone: 'تطوير الواجهة', files: ['frontend_build.zip', 'docs.pdf'], date: '12 يونيو 2026' },
};

interface DisputeTarget {
  project: Project;
  task: Task;
}

interface ProjectCardProps {
  p: Project;
  onApprove: (projectId: string, taskId: string) => void;
  onDispute: (project: Project, task: Task) => void;
}

/* ── Dispute Filing Modal ── */
const DISPUTE_REASONS = [
  'جودة التسليم لا تتوافق مع المتطلبات المتفق عليها',
  'تأخر في التسليم دون إبلاغ مسبق',
  'الدفعة لم تُصرف رغم الاعتماد',
  'العمل لم يُسلَّم أصلاً',
  'سبب آخر',
];

const DisputeModal = ({
  target, onClose,
}: { target: DisputeTarget; onClose: () => void }) => {
  const [reason, setReason] = useState('');
  const [caseText, setCaseText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = reason && caseText.length >= 20;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,27,42,0.75)', backdropFilter: 'blur(6px)' }}>
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
          <button onClick={onClose} className="w-full py-3 rounded-xl font-black text-white" style={{ background: '#0D1B2A' }}>حسناً، فهمت</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,27,42,0.75)', backdropFilter: 'blur(6px)' }}>
      <motion.div 
        layoutId={`dispute-btn-${target.project.id}-${target.task.id}`}
        className="bg-[#F9F4EE] w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl" dir="rtl"
      >

        {/* Header */}
        <div className="bg-red-600 p-6 rounded-t-3xl flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-1">فتح نزاع تحكيمي</p>
            <h2 className="text-xl font-black text-white">{target.task.name}</h2>
            <p className="text-red-200/70 text-sm">{target.project.title} · {target.task.assignedTo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Warning Banner */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <TriangleAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-700 mb-0.5">فتح نزاع يجمّد المدفوعات المعلقة فوراً.</p>
              <p className="text-xs text-amber-600">رسوم تقديم: <strong>$10</strong> · تُستردّ إذا صدر الحكم لصالحك.</p>
            </div>
          </div>

          {/* Disputed Task Info */}
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
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-right p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    reason === r ? 'border-red-400 bg-red-50 text-red-800 font-bold' : 'border-[#E8DDD0] bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 rounded-full border-2 mr-2 align-middle ${reason === r ? 'border-red-500 bg-red-500' : 'border-gray-300'}`} />
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Case Text */}
          <div>
            <p className="text-sm font-black text-[#0D1B2A] mb-2">اشرح قضيتك <span className="text-gray-400 font-normal">(بحد أدنى 20 حرف)</span></p>
            <textarea
              value={caseText}
              onChange={e => setCaseText(e.target.value)}
              placeholder="اشرح بالتفصيل ما حدث، ومتى، وما الأدلة التي لديك..."
              className="w-full bg-white border-2 border-[#E8DDD0] rounded-2xl p-4 text-sm focus:outline-none focus:border-red-300 transition-colors min-h-[100px] resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-left">{caseText.length} / 500</p>
          </div>

          {/* Evidence Upload */}
          <div>
            <p className="text-sm font-black text-[#0D1B2A] mb-2">أدلة داعمة <span className="text-gray-400 font-normal">(اختياري)</span></p>
            <label className={`flex items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-colors ${
              evidenceFile ? 'border-emerald-400 bg-emerald-50' : 'border-[#E8DDD0] hover:border-red-300'
            }`}>
              <input type="file" className="hidden" onChange={e => setEvidenceFile(e.target.files?.[0]?.name || '')} />
              {evidenceFile
                ? <><FileText size={18} className="text-emerald-600" /><span className="text-sm font-bold text-emerald-700">{evidenceFile}</span></>
                : <><Upload size={18} className="text-gray-300" /><span className="text-sm text-gray-400">رفع صورة، ملف، أو تصدير محادثة</span></>}
            </label>
          </div>

          {/* AI Notice */}
          <div className="bg-[#0D1B2A]/5 border border-[#0D1B2A]/10 rounded-2xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-black text-[#0D1B2A]">ملاحظة: </span>
              سيقوم الذكاء الاصطناعي بإنشاء ملخص محايد للقضية دون أن تطّلع عليه مسبقاً — وذلك لضمان نزاهة التحكيم.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-3.5 rounded-xl border border-[#E8DDD0] text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
              إلغاء
            </button>
            <button
              disabled={!canSubmit}
              onClick={() => { if (canSubmit) setSubmitted(true); toast.error('⚠️ تم فتح النزاع — المدفوعات مجمّدة'); }}
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

const MilestoneStepper = ({ milestones }: { milestones: { name: string; status: 'done' | 'review' | 'upcoming' }[] }) => (
  <div className="flex items-center gap-0 overflow-x-auto pb-1">
    {milestones.map((m, i) => (
      <div key={i} className="flex items-center shrink-0">
        <div className="flex flex-col items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
            m.status === 'done' ? 'bg-[#C9A84C] border-[#C9A84C] text-white' :
            m.status === 'review' ? 'bg-[#1A7F74] border-[#1A7F74] text-white animate-pulse' :
            'bg-white border-gray-200 text-gray-300'
          }`}>
            {m.status === 'done' ? '✓' : i + 1}
          </div>
          <p className={`text-[9px] font-bold mt-1 whitespace-nowrap max-w-[60px] text-center leading-tight ${
            m.status === 'done' ? 'text-[#C9A84C]' :
            m.status === 'review' ? 'text-[#1A7F74]' : 'text-gray-300'
          }`}>{m.name}</p>
        </div>
        {i < milestones.length - 1 && (
          <div className={`h-0.5 w-8 mb-4 mx-0.5 ${m.status === 'done' ? 'bg-[#C9A84C]' : 'bg-gray-100'}`} />
        )}
      </div>
    ))}
  </div>
);

const ApproveModal = ({
  project, task, onClose, onConfirm
}: {
  project: Project; task: Task; onClose: () => void; onConfirm: () => void;
}) => {
  const sub = MOCK_SUBMISSION[project.id];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,27,42,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-[#F9F4EE] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" dir="rtl">
        <div className="bg-[#0D1B2A] p-6 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-[#C9A84C] uppercase tracking-widest mb-1">طلب اعتماد وصرف</p>
            <h2 className="text-xl font-black text-white">{task.name}</h2>
            <p className="text-blue-200/60 text-sm">{project.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount to release */}
          <div className="bg-white border-2 border-[#C9A84C] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-[#C9A84C] uppercase mb-1">سيتم إفراجه من الضمان</p>
              <p className="text-4xl font-black text-[#0D1B2A]">{formatCurrency(task.payment)}</p>
            </div>
            <div className="bg-[#C9A84C]/10 p-4 rounded-xl">
              <Lock size={28} className="text-[#C9A84C]" />
            </div>
          </div>

          {/* Submitted Files */}
          {sub && (
            <div className="bg-white border border-[#E8DDD0] rounded-2xl p-5 space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase">الملفات المقدمة من {sub.by}</p>
              <p className="text-xs text-gray-400">تاريخ التقديم: {sub.date}</p>
              <div className="flex flex-wrap gap-2">
                {sub.files.map(f => (
                  <div key={f} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-gray-700">
                    <FileText size={14} className="text-[#C9A84C]" /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium">الاعتماد نهائي ولا يمكن التراجع عنه. الأموال ستُحوّل مباشرة للمستقل.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              style={{ background: '#1A7F74', boxShadow: '0 4px 16px rgba(26,127,116,0.4)' }}
            >
              <ThumbsUp size={16} /> اعتماد وصرف الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ p, onApprove, onDispute }: ProjectCardProps) => {
  const milestones = MOCK_MILESTONES[p.id] || [];
  const sub = MOCK_SUBMISSION[p.id];
  const pendingTask = p.tasks.find(t => !t.paid && t.status === 'In Progress');
  const totalPaid = p.tasks.reduce((s, t) => t.paid ? s + t.payment : s, 0);
  const totalAllocated = p.tasks.reduce((s, t) => s + t.payment, 0);
  const paidPct = p.budget ? (totalPaid / p.budget) * 100 : 0;
  const lockedPct = p.budget ? ((totalAllocated - totalPaid) / p.budget) * 100 : 0;

  return (
    <div className="bg-white border border-[#E8DDD0] rounded-[28px] overflow-hidden hover:shadow-xl hover:border-[#C9A84C]/30 transition-all duration-300 group">

      {/* Card Header */}
      <div className="p-6 border-b border-[#E8DDD0]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-black text-xl text-[#0D1B2A] group-hover:text-[#C9A84C] transition-colors">{p.title}</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">المدير: {p.owner}</p>
          </div>
          <span className="flex items-center gap-1.5 bg-[#0D1B2A] text-[#C9A84C] px-3 py-1.5 rounded-full text-[10px] font-black shrink-0">
            <Lock size={10} /> الأموال محجوزة
          </span>
        </div>

        {/* Milestone Stepper */}
        {milestones.length > 0 && <MilestoneStepper milestones={milestones} />}
      </div>

      {/* Money Flow */}
      <div className="px-6 py-4 bg-gray-50/50 border-b border-[#E8DDD0]">
        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase mb-2">
          <span>التدفق المالي</span>
          <span>الميزانية: <span className="text-[#0D1B2A]">{formatCurrency(p.budget)}</span></span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${paidPct}%` }} title={`مُصرف: ${formatCurrency(totalPaid)}`} />
          <div className="h-full bg-[#C9A84C] opacity-80 transition-all duration-700" style={{ width: `${lockedPct}%` }} title={`محجوز: ${formatCurrency(totalAllocated - totalPaid)}`} />
        </div>
        <div className="flex gap-4 mt-2 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />مُصرف {formatCurrency(totalPaid)}</span>
          <span className="flex items-center gap-1 text-[#C9A84C]"><span className="w-2 h-2 rounded-sm bg-[#C9A84C] inline-block" />محجوز {formatCurrency(totalAllocated - totalPaid)}</span>
          <span className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded-sm bg-gray-200 inline-block" />متاح {formatCurrency(p.budget - totalAllocated)}</span>
        </div>
      </div>

      {/* Team Allocation */}
      <div className="px-6 py-4 border-b border-[#E8DDD0] space-y-3">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">توزيع الفريق</p>
        {p.tasks.map(t => (
          <div key={t.id} className="group/task">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-500 shrink-0">
                {t.assignedTo.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs font-bold text-[#0D1B2A] mb-1">
                  <span className="truncate">{t.assignedTo} · {t.name}</span>
                  <span className="text-gray-500 shrink-0 mr-2">{formatCurrency(t.payment)}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${t.paid ? 'bg-emerald-500' : 'bg-[#C9A84C] opacity-60'}`}
                    style={{ width: t.paid ? '100%' : t.status === 'In Progress' ? '60%' : '10%' }}
                  />
                </div>
              </div>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                t.paid ? 'bg-emerald-50 text-emerald-700' :
                t.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'
              }`}>
                {t.paid ? '✔ مدفوع' : t.status === 'In Progress' ? '⏳ جاري' : '⏱ انتظار'}
              </span>
            </div>
            {!t.paid && (
              <div className="flex justify-end opacity-0 group-hover/task:opacity-100 transition-opacity duration-200">
                <motion.button
                  layoutId={`dispute-btn-${p.id}-${t.id}`}
                  onClick={() => onDispute(p, t)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-100 hover:border-red-200 transition-all"
                >
                  <Gavel size={11} /> فتح نزاع ضد {t.assignedTo}
                </motion.button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions Footer */}
      <div className="p-5 flex flex-wrap gap-3 items-center">
        {sub && pendingTask && (
          <button
            onClick={() => onApprove(p.id, pendingTask.id)}
            className="flex-1 py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: '#1A7F74', boxShadow: '0 2px 12px rgba(26,127,116,0.3)' }}
          >
            <ThumbsUp size={16} /> اعتماد تسليم {sub.milestone}
          </button>
        )}
        <Link
          to={`/projects/${p.id}`}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E8DDD0] text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Eye size={16} /> عرض التفاصيل
        </Link>
      </div>
    </div>
  );
};

export default function ClientDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [approveTarget, setApproveTarget] = useState<{ project: Project; task: Task } | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<DisputeTarget | null>(null);

  const user: User = JSON.parse(localStorage.getItem('user') || 'null') || {
    role: 'client', username: 'ahmed_k', name: 'Ahmed Khaled', id: '1'
  };

  const loadProjects = () => {
    api.getProjects().then(data => {
      setProjects(data.filter(p => !p.ownerUsername || p.ownerUsername === user.username || p.owner === user.name));
    });
  };

  useEffect(() => {
    loadProjects();
  }, [user.username, user.name]);

  const handleApproveClick = (projectId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    if (project && task) setApproveTarget({ project, task });
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await api.completeTask(approveTarget.project.id, approveTarget.task.id);
      toast.success(`✅ تم صرف ${formatCurrency(approveTarget.task.payment)} لـ ${approveTarget.task.assignedTo} بنجاح!`);
      setApproveTarget(null);
      loadProjects();
    } catch {
      toast.error('فشل في صرف الدفعة');
    }
  };

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalPaid = projects.reduce((s, p) => s + p.tasks.filter(t => t.paid).reduce((a, t) => a + t.payment, 0), 0);
  const totalLocked = projects.reduce((s, p) => s + p.tasks.filter(t => !t.paid).reduce((a, t) => a + t.payment, 0), 0);
  const pendingApprovals = projects.filter(p => MOCK_SUBMISSION[p.id]).length;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-10" dir="rtl">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0D1B2A] tracking-tight mb-1">الخزنة المركزية</h1>
          <p className="text-gray-500 font-medium">أهلاً {user.name}! جميع أموالك محمية تحت نظام الضمان.</p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-2 font-black px-6 py-3.5 rounded-2xl text-white transition-all hover:-translate-y-0.5 hover:shadow-xl shrink-0"
          style={{ background: '#0D1B2A', boxShadow: '0 4px 20px rgba(13,27,42,0.25)' }}
        >
          <Plus size={18} /> إطلاق مشروع جديد
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDD0] p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="bg-gray-50 p-3 rounded-xl border border-[#E8DDD0]">
            <Briefcase size={22} className="text-[#0D1B2A]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">إجمالي الميزانيات</p>
            <p className="text-2xl font-black text-[#0D1B2A]">{formatCurrency(totalBudget)}</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl flex items-center gap-4 shadow-lg" style={{ background: '#0D1B2A' }}>
          <div className="bg-white/10 p-3 rounded-xl">
            <Lock size={22} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-200/60 uppercase">في الضمان (Escrow)</p>
            <p className="text-2xl font-black text-white">{formatCurrency(totalLocked)}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8DDD0] p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <CheckCircle size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">المدفوعات المحررة</p>
            <p className="text-2xl font-black text-[#0D1B2A]">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        <div className={`p-6 rounded-3xl flex items-center gap-4 shadow-sm border ${pendingApprovals > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#E8DDD0]'}`}>
          <div className={`p-3 rounded-xl ${pendingApprovals > 0 ? 'bg-amber-100' : 'bg-gray-50'}`}>
            <Clock size={22} className={pendingApprovals > 0 ? 'text-amber-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">تسليمات بانتظار الاعتماد</p>
            <p className={`text-2xl font-black ${pendingApprovals > 0 ? 'text-amber-700' : 'text-[#0D1B2A]'}`}>{pendingApprovals}</p>
          </div>
        </div>
      </div>

      {/* Budget Flow Visualizer */}
      <div className="bg-white border border-[#E8DDD0] p-7 rounded-3xl shadow-sm">
        <h2 className="text-base font-black text-[#0D1B2A] mb-5 flex items-center gap-2">
          <Wallet size={18} className="text-[#C9A84C]" /> مسار ميزانيتك
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
          <div className="text-center bg-gray-50 border border-[#E8DDD0] px-8 py-5 rounded-2xl min-w-[130px]">
            <p className="text-xs font-bold text-gray-400 mb-1">رأس المال</p>
            <p className="text-2xl font-black text-[#0D1B2A]">{formatCurrency(totalBudget)}</p>
          </div>
          <TrendingUp size={20} className="text-gray-200 hidden md:block rotate-180" />
          <div className="text-center border-2 border-[#C9A84C] bg-[#C9A84C]/5 px-8 py-5 rounded-2xl scale-105 min-w-[150px]">
            <p className="text-xs font-bold text-[#C9A84C] mb-1 flex items-center gap-1 justify-center"><Lock size={10} /> في الضمان</p>
            <p className="text-2xl font-black text-[#0D1B2A]">{formatCurrency(totalLocked)}</p>
          </div>
          <TrendingUp size={20} className="text-gray-200 hidden md:block rotate-180" />
          <div className="text-center bg-emerald-50 border border-emerald-200 px-8 py-5 rounded-2xl min-w-[130px]">
            <p className="text-xs font-bold text-emerald-600 mb-1">صُرف للمستقلين</p>
            <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0D1B2A]">مشاريعك قيد التنفيذ ({projects.length})</h2>
          {pendingApprovals > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <AlertTriangle size={12} /> {pendingApprovals} تسليم يحتاج اعتمادك
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#E8DDD0] rounded-3xl p-16 text-center">
            <ShieldCheck size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold text-lg mb-2">لا توجد مشاريع بعد.</p>
            <Link to="/create" className="text-[#C9A84C] font-bold hover:underline">ابدأ بإنشاء مشروعك الأول</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {projects.map(p => (
              <ProjectCard key={p.id} p={p} onApprove={handleApproveClick} onDispute={(proj, task) => setDisputeTarget({ project: proj, task })} />
            ))}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approveTarget && (
        <ApproveModal
          project={approveTarget.project}
          task={approveTarget.task}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleConfirmApprove}
        />
      )}

      {/* Dispute Modal */}
      {disputeTarget && (
        <DisputeModal
          target={disputeTarget}
          onClose={() => setDisputeTarget(null)}
        />
      )}
    </div>
  );
}
