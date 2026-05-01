import React, { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, FileText, ShieldCheck, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { User } from '@/types';

interface CreateProjectModalProps {
  user: User;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ user, onClose }) => {
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const createMutation = useMutation({
    mutationFn: (data: { title: string; budget: number; ownerId: string }) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('🎉 تم إنشاء الخزنة بنجاح!');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل في إنشاء المشروع. يرجى المحاولة مجدداً.');
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !budget) return;
    createMutation.mutate({
      title,
      budget: Number(budget),
      ownerId: user.id,
    });
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[rgba(13,27,42,0.75)] backdrop-blur-sm"
        aria-hidden="true"
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" dir="rtl">
        <motion.div 
          layoutId="create-project-btn"
          transition={{
            type: 'spring',
            stiffness: 180,
            damping: 25,
            mass: 1,
          }}
          className="bg-[var(--color-kafil-cream)] w-full max-w-2xl rounded-3xl shadow-[var(--shadow-modal)] overflow-hidden pointer-events-auto origin-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <header className="bg-[var(--color-kafil-midnight)] p-6 relative">
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-kafil-gold)]"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
              <h2 id="create-project-title" className="text-2xl font-black text-white mb-2 tracking-tight">فتح خزنة مشروع جديدة</h2>
              <p className="text-[var(--color-kafil-gold)] text-sm font-medium">ابدأ بتأمين ميزانية مشروعك لضمان حقوق الجميع</p>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
              <div className="space-y-3">
              <div className="flex items-center justify-between mt-2">
                <label htmlFor="project-title" className="block text-sm font-black text-[var(--color-kafil-midnight)] flex items-center gap-2">
                  <FileText size={16} className="text-[var(--color-kafil-teal)]"/> اسم المشروع
                </label>
                <button 
                  type="button" 
                  onClick={() => { setTitle('E-commerce Website (Demo)'); setBudget('2000'); }}
                  className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold hover:bg-emerald-200 transition-colors"
                  title="تعبئة تلقائية لبيانات تجريبية (Hackathon Demo)"
                >
                  تعبئة سريعة (Demo)
                </button>
              </div>
              <input 
                id="project-title"
                className="w-full bg-gray-50 border border-[var(--color-kafil-sand)] p-4 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-kafil-gold)] transition-all outline-none font-bold text-lg placeholder-gray-400 text-[var(--color-kafil-midnight)]"
                placeholder="مثال: تطوير متجر إلكتروني متكامل"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={createMutation.isPending}
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="project-budget" className="block text-sm font-black text-[var(--color-kafil-midnight)] flex items-center gap-2">
                  <DollarSign size={16} className="text-[var(--color-status-green)]"/> ميزانية المشروع الإجمالية
                </label>
                <div className="relative">
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xl text-gray-400">$</span>
                   <input 
                    id="project-budget"
                    className="w-full bg-gray-50 border border-[var(--color-kafil-sand)] p-4 pr-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-kafil-gold)] transition-all outline-none font-black text-2xl text-[var(--color-kafil-midnight)]"
                    type="number"
                    min="10"
                    placeholder="500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                    disabled={createMutation.isPending}
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium">سيتم إيداع هذا المبلغ في "خزنة كفيل" (Escrow) من محفظتك ولن يتم تحريكه إلا باعتمادك.</p>
              </div>

              <div className="bg-[var(--color-kafil-teal)]/5 p-4 rounded-2xl border border-[var(--color-kafil-teal)]/20 flex items-start gap-4">
                <div className="bg-white p-2 rounded-xl text-[var(--color-kafil-teal)] shadow-sm shrink-0 mt-0.5">
                   <ShieldCheck size={20}/>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-kafil-midnight)] text-sm mb-1">ضمان كفيل المالي</h4>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">بإنشائك لهذا المشروع، أنت توافق على إيداع الميزانية كضمان. كفيل يضمن حقك في استلام العمل المتفق عليه قبل الإفراج عن أي دولار للمستقل.</p>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || !title || !budget}
                  className="w-full bg-[var(--color-kafil-midnight)] text-white font-black py-4 rounded-xl hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(13,27,42,0.25)] flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[var(--color-kafil-gold)]"
                >
                  {createMutation.isPending ? 'جاري الإيداع...' : 'إيداع في الخزنة (Escrow) وبدء المشروع'} <Plus size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};
