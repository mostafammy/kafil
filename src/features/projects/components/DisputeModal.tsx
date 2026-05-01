import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, TriangleAlert, Cpu, CheckCircle, Gavel, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Project, Task } from '@/types';
import { cn } from '@/shared/utils/cn';
import { toast } from 'sonner';
import { aiAnalyst } from '@/services/aiAnalyst';

const DISPUTE_REASONS = [
  'جودة التسليم لا تتوافق مع المتطلبات المتفق عليها',
  'تأخر في التسليم دون إبلاغ مسبق',
  'الدفعة لم تُصرف رغم الاعتماد',
  'العمل لم يُسلَّم أصلاً',
  'سبب آخر',
];

interface DisputeModalProps {
  target: { project: Project; task: Task };
  onClose: () => void;
  onAcceptAI?: () => void;
}

// Apple-style spring animation
const springTransition = { type: 'spring', stiffness: 350, damping: 30, mass: 1 };
const fadeTransition = { duration: 0.3, ease: [0.32, 0.72, 0, 1] };

export const DisputeModal: FC<DisputeModalProps> = ({ target, onClose, onAcceptAI }) => {
  const [reason, setReason] = useState('');
  const [caseText, setCaseText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<null | any>(null);
  const queryClient = useQueryClient();

  const openDisputeMutation = useMutation({
    mutationFn: () => api.openDispute(target.project.id, target.task.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const acceptAiMutation = useMutation({
    mutationFn: () => api.completeTask(target.project.id, target.task.id), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    },
  });

  const canSubmit = reason && caseText.length >= 20;

  useEffect(() => {
    if (aiAnalyzing) {
      aiAnalyst.analyzeDispute(target.project, target.task).then(result => {
        setTimeout(() => { // Artificial delay to show beautiful loading
          setAiResult(result);
          setAiAnalyzing(false);
        }, 3000);
      }).catch(() => {
        setTimeout(() => {
          setAiAnalyzing(false);
          setAiResult({
            suggestion: '50/50 Split suggested',
            details: 'Technical error in analysis. Defaulting to safe split recommendation.',
            confidence: 0
          });
        }, 2000);
      });
    }
  }, [aiAnalyzing, target.project, target.task]);

  const renderContent = () => {
    if (aiAnalyzing) {
      return (
        <motion.div
          key="analyzing"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={springTransition}
          className="text-center py-10"
        >
          <motion.div 
            animate={{ 
              boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 0 20px rgba(59, 130, 246, 0.1)', '0 0 0 0 rgba(59, 130, 246, 0)'],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-8 relative"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md" />
            <Cpu size={40} className="text-white relative z-10 animate-pulse" />
          </motion.div>
          <h3 className="text-xl font-bold text-[#0D1B2A] mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#0D1B2A] to-blue-800">
            جاري التحليل المعرفي...
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
            يقوم "مُقيّم العدالة الذكي" بمطابقة المحادثات وسجل التسليمات مع سياسات منصة كفيل.
          </p>
          <div className="flex justify-center space-x-3 space-x-reverse">
             <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-3 h-3 bg-blue-500 rounded-full" />
             <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-3 h-3 bg-indigo-500 rounded-full" />
             <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-3 h-3 bg-purple-500 rounded-full" />
          </div>
        </motion.div>
      );
    }

    if (aiResult) {
      return (
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springTransition}
          className="text-center py-6"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 relative"
          >
            <Scale size={36} className="text-white" />
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
              className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-lg"
            >
               <CheckCircle size={18} className="text-emerald-600" />
            </motion.div>
          </motion.div>
          
          <h3 className="text-xl font-bold text-[#0D1B2A] mb-1 tracking-tight">القرار المقترح</h3>
          <p className="text-gray-500 mb-6 text-sm font-medium">بناءً على المعطيات، هذا هو الحل الأقرب للعدالة.</p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-6 rounded-3xl text-right mb-8 shadow-sm relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Cpu size={14} /> AI Recommendation
             </p>
             <p className="text-lg font-bold text-emerald-700 dir-ltr text-center mb-3">{aiResult.suggestion}</p>
             <div className="h-px bg-emerald-100 w-full mb-4" />
             <p className="text-xs text-emerald-900/80 leading-relaxed">{aiResult.details}</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: '#f3f4f6' }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose} 
              className="py-3 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 transition-colors"
            >
              رفض (طلب محكم بشري)
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                acceptAiMutation.mutate();
                toast.success('تمت الموافقة على اقتراح الذكاء الاصطناعي وتم حل النزاع وتحرير الدفعة');
                if (onAcceptAI) onAcceptAI();
                onClose();
              }} 
              className="py-3 rounded-xl font-semibold text-white bg-[#0D1B2A] shadow-md shadow-black/10 flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle size={20} /> قبول وإنهاء
            </motion.button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={fadeTransition}
        className="flex flex-col h-full"
      >
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                  فتح نزاع تحكيمي
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">{target.task.name}</h2>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors hover:bg-black/40"
            >
              <X size={20}/>
            </motion.button>
          </div>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 bg-amber-50/80 border border-amber-200/50 rounded-2xl p-5 backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <TriangleAlert size={24} className="text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900 mb-1">تجميد المدفوعات</h4>
              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                فتح نزاع يجمّد المدفوعات المعلقة فوراً. سيتم خصم رسوم تقديم بقيمة <span className="font-bold bg-amber-200/50 px-1 rounded">$10</span> تُسترد في حال الفوز.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              <FileText size={16} /> ما سبب النزاع الأساسي؟
            </label>
            <div className="space-y-3">
              {DISPUTE_REASONS.map((r, idx) => (
                <motion.button 
                  key={r} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.05) }}
                  onClick={() => setReason(r)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    'w-full text-right p-4 rounded-xl border-2 text-sm font-medium transition-all relative overflow-hidden',
                    reason === r 
                      ? 'border-red-500 bg-red-50 text-red-900 shadow-sm shadow-red-500/10' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {reason === r && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                  )}
                  {r}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
          >
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
               التفاصيل والأدلة
            </label>
            <textarea 
              value={caseText} 
              onChange={e => setCaseText(e.target.value)}
              placeholder="اشرح قضيتك بالتفصيل... (الحد الأدنى 20 حرف)"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-3xl p-6 text-base min-h-[160px] outline-none focus:border-red-500 focus:bg-white transition-all font-medium resize-none shadow-inner"
            />
            <div className="flex justify-between items-center mt-2 px-2">
              <span className={cn("text-xs font-bold", caseText.length < 20 ? "text-red-500" : "text-emerald-500")}>
                {caseText.length} / 20 حرف
              </span>
            </div>
          </motion.div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl grid grid-cols-2 gap-4 shrink-0">
          <motion.button 
            whileHover={{ backgroundColor: '#e5e7eb' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose} 
            className="py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 text-sm transition-colors"
          >
            إلغاء
          </motion.button>
          <motion.button
            whileHover={canSubmit ? { scale: 1.02, y: -2 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            disabled={!canSubmit || openDisputeMutation.isPending}
            onClick={() => { 
              if (canSubmit) {
                openDisputeMutation.mutate(undefined, {
                  onSuccess: () => {
                    setSubmitted(true); 
                    setAiAnalyzing(true); 
                    toast.success('تم رفع النزاع بنجاح، جاري التحليل'); 
                  }
                });
              }
            }}
            className={cn(
              "py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 text-sm transition-all shadow-md",
              canSubmit 
                ? "bg-gradient-to-r from-red-600 to-red-700 shadow-red-600/30" 
                : "bg-gray-300 shadow-none cursor-not-allowed opacity-70"
            )}
          >
            <Gavel size={22}/> تأكيد وتقديم
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0D1B2A]/60 backdrop-blur-xl pointer-events-auto"
        />
        
        <motion.div 
          layoutId={`dispute-btn-${target.project.id}-${target.task.id}`}
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={springTransition}
          className="bg-white w-full max-w-2xl max-h-full rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto flex flex-col relative z-10 border border-white/20"
          dir="rtl"
        >
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
