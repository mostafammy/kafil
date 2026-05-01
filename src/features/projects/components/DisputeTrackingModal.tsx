import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Gavel, CheckCircle, AlertTriangle, 
  Users, Banknote, RefreshCcw, HandCoins, 
  ChevronRight, X, Scale
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface DisputeTrackingModalProps {
  target: any;
  onClose: () => void;
}

const springTransition = { type: 'spring', stiffness: 350, damping: 30, mass: 1 };

export const DisputeTrackingModal: React.FC<DisputeTrackingModalProps> = ({ target, onClose }) => {
  // State: 'idle' -> 'review' -> 'voting' -> 'verdict_eval' -> 'resolved_fair' | 'resolved_false'
  const [stage, setStage] = useState<string>('idle');
  const [mockSelected, setMockSelected] = useState<'fair' | 'false' | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null') || { role: 'client' };

  // Hardcoded values for demo
  const disputedAmount = target.amount || 1500;
  const platformFeePercent = 5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (user.role === 'client' && target) {
      if (target.status === 'resolved_won') {
        setStage('resolved_fair');
      } else if (target.status === 'resolved_lost') {
        setStage('resolved_false');
      } else {
        setStage('voting');
      }
    }
  }, [user.role, target]);

  const runSimulation = (scenario: 'fair' | 'false') => {
    setMockSelected(scenario);
    setStage('review');
    
    setTimeout(() => setStage('voting'), 2500);
    setTimeout(() => setStage('verdict_eval'), 5000);
    setTimeout(() => setStage(scenario === 'fair' ? 'resolved_fair' : 'resolved_false'), 7500);
  };

  const currentStep = () => {
    if (stage === 'idle') return 0;
    if (stage === 'review') return 1;
    if (stage === 'voting') return 2;
    if (stage === 'verdict_eval') return 3;
    return 4;
  };

  const renderActiveStateIcon = () => {
    if (stage === 'review') return <Gavel size={40} className="text-blue-500 animate-bounce" />;
    if (stage === 'voting') return <Users size={40} className="text-purple-500 animate-pulse" />;
    if (stage === 'verdict_eval') return <RefreshCcw size={40} className="text-amber-500 animate-spin" />;
    return <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />;
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-[rgba(13,27,42,0.8)] backdrop-blur-xl"
        aria-hidden="true"
      />
      
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none" dir="rtl">
        <motion.div 
          layoutId={`track-case-${target.id}`}
          transition={springTransition}
          className="bg-[#F9F4EE] w-full max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] pointer-events-auto relative border border-white/20"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-gray-500 hover:bg-black/10 transition-colors z-20"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>

          <div className="p-10">
            {/* Header Card */}
            <motion.div 
              layout
              className="bg-white border border-[#E8DDD0] rounded-[2rem] p-8 mb-10 shadow-sm relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-64 h-64 bg-red-50 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 opacity-50" />
               <div className="relative z-10 text-center">
                 <motion.div 
                   initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springTransition}
                   className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/20 rotate-3"
                 >
                    <ShieldAlert size={28} />
                 </motion.div>
                 <h2 className="text-xl font-bold text-[#0D1B2A] mb-2 tracking-tight">نظام التحكيم المتقدم</h2>
                 <p className="text-sm text-gray-400 mb-3">{target.title} · #{target.id}</p>
                 <div className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 font-semibold px-4 py-2 rounded-full text-[10px] border border-emerald-100 shadow-sm">
                   <HandCoins size={14} className="text-emerald-600" />
                   لا يوجد رسوم فتح شكوى — الدفع حسب النتيجة فقط
                 </div>
               </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="bg-white border border-[#E8DDD0] rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              
              {/* Dynamic Timeline */}
              <div className="relative mb-16 px-4">
                <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-gray-100 -z-10 rounded-full transform -translate-y-1/2 overflow-hidden">
                   <motion.div 
                     className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                     initial={{ width: 0 }}
                     animate={{ width: `${(currentStep() / 4) * 100}%` }}
                     transition={{ duration: 1, ease: 'easeInOut' }}
                   />
                </div>
                
                <div className="flex justify-between relative z-10 w-full">
                  {[ 
                    { icon: ShieldAlert, label: 'الشكوى', stage: 'idle' },
                    { icon: Gavel, label: 'المراجعة', stage: 'review' },
                    { icon: Users, label: 'التصويت', stage: 'voting' },
                    { icon: RefreshCcw, label: 'الحكم', stage: 'verdict_eval' },
                    { icon: Banknote, label: 'التسوية', stage: mockSelected === 'false' ? 'resolved_false' : 'resolved_fair' }
                  ].map((step, idx) => {
                    const active = currentStep() >= idx;
                    const current = currentStep() === idx;
                    const Icon = step.icon;
                    return (
                      <div 
                        key={idx} 
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                        onClick={() => setStage(step.stage)}
                      >
                        <motion.div 
                          animate={current ? { scale: [1, 1.1, 1], boxShadow: '0 0 0 6px rgba(59, 130, 246, 0.15)' } : {}}
                          transition={{ repeat: current ? Infinity : 0, duration: 2 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                            active ? "bg-[#0D1B2A] text-white shadow-lg" : "bg-gray-50 text-gray-300 group-hover:bg-gray-200 group-hover:text-gray-500"
                          )}
                        >
                          <Icon size={20} />
                        </motion.div>
                        <span className={cn("text-[9px] font-black transition-colors", active ? "text-[#0D1B2A]" : "text-gray-300 group-hover:text-gray-500")}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* State Renderer */}
              <AnimatePresence mode="wait">
                {stage === 'idle' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-[#0D1B2A] mb-1">بدء محاكاة التحكيم</h3>
                      <p className="text-gray-400 text-xs leading-relaxed max-w-md mx-auto">
                        نظام كفيل يعتمد على 3 مُحكّمين مستقلين. يتم خصم نسبة {platformFeePercent}% من <span className="font-bold text-red-500">الطرف الخاسر فقط</span> لضمان العدالة.
                      </p>
                    </div>
                    
                    {(user.role === 'arbitrator' || user.role === 'admin') ? (
                      <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
                        <motion.button 
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => runSimulation('fair')} 
                          className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 rounded-3xl shadow-lg flex flex-col items-center gap-3 group relative overflow-hidden"
                        >
                          <CheckCircle size={28}/>
                          <div className="text-center">
                            <span className="block text-sm font-bold mb-0.5">المشتكي على حق</span>
                            <span className="text-[10px] text-emerald-100">تُسترد حقوقك بالكامل</span>
                          </div>
                        </motion.button>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => runSimulation('false')} 
                          className="bg-gradient-to-br from-red-500 to-red-700 text-white p-6 rounded-3xl shadow-lg flex flex-col items-center gap-3 group relative overflow-hidden"
                        >
                          <AlertTriangle size={28}/>
                          <div className="text-center">
                            <span className="block text-sm font-bold mb-0.5">ادعاء باطل (كيدي)</span>
                            <span className="text-[10px] text-red-100">تُفرض غرامة على المشتكي</span>
                          </div>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="mt-8 p-5 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                        <div className="w-12 h-12 bg-gray-200/50 rounded-full flex items-center justify-center">
                           <Gavel className="text-gray-400" size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 text-center leading-relaxed">
                           التصويت وإصدار الأحكام متاح فقط للمحكمين المستقلين المعينين لهذه القضية. جاري انتظار قرار التحكيم.
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {(stage === 'review' || stage === 'voting' || stage === 'verdict_eval') && (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-10"
                  >
                     <motion.div 
                       className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner relative"
                     >
                       <motion.div 
                         animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                         className="absolute inset-0 border-[4px] border-transparent border-t-[#0D1B2A] border-l-[#C9A84C] rounded-full opacity-30"
                       />
                       {renderActiveStateIcon()}
                     </motion.div>
                     <h3 className="text-lg font-bold text-[#0D1B2A] mb-1">
                       {stage === 'review' && 'جاري تحليل الأدلة والمستندات...'}
                       {stage === 'voting' && 'المحكمون المستقلون يتشاورون الآن...'}
                       {stage === 'verdict_eval' && 'جاري صياغة الحكم النهائي...'}
                     </h3>
                     <p className="text-gray-400 text-xs">نضمن لك الشفافية التامة والحيادية في كل خطوة.</p>
                  </motion.div>
                )}

                {stage === 'resolved_fair' && (
                  <motion.div 
                    key="resolved_fair"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-8 text-center"
                  >
                     <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                       <CheckCircle size={32} />
                     </div>
                     <h3 className="text-lg font-bold text-emerald-900 mb-2 tracking-tight">حكم عادل: المشتكي على حق</h3>
                     <p className="text-emerald-800/70 mb-8 text-xs max-w-md mx-auto">
                       تم إثبات مصداقية الشكوى. تم تحميل الطرف الخاسر كافة تكاليف التحكيم.
                     </p>
                     
                     <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                           <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">استردادك</p>
                           <p className="text-lg font-bold text-emerald-600">${disputedAmount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                           <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">خسارة الآخر</p>
                           <p className="text-lg font-bold text-red-600">-${disputedAmount + (disputedAmount * platformFeePercent / 100)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                           <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">رسوم المنصة</p>
                           <p className="text-lg font-bold text-blue-600">${disputedAmount * platformFeePercent / 100}</p>
                        </div>
                     </div>
                     
                     <div className="mt-8">
                       <button onClick={() => setStage('idle')} className="px-4 py-2 text-xs bg-white text-emerald-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all">إعادة المحاكاة</button>
                     </div>
                  </motion.div>
                )}

                {stage === 'resolved_false' && (
                  <motion.div 
                    key="resolved_false"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-[2rem] p-8 text-center"
                  >
                     <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 text-white rounded-2xl -rotate-3 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
                       <AlertTriangle size={32} />
                     </div>
                     <h3 className="text-lg font-bold text-red-900 mb-2 tracking-tight">غرامة ادعاء باطل</h3>
                     <p className="text-red-800/70 mb-8 text-xs max-w-md mx-auto">
                       تم رفض الشكوى. لحماية المستقلين، يتم تغريم المشتكي لتغطية رسوم النظام.
                     </p>
                     
                     <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border-2 border-red-100">
                           <p className="text-[9px] text-red-500 font-bold uppercase mb-1">غرامة عليك</p>
                           <p className="text-lg font-bold text-red-600">-${disputedAmount * platformFeePercent / 100}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-red-100">
                           <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">استلام الآخر</p>
                           <p className="text-lg font-bold text-emerald-600">${disputedAmount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-red-100">
                           <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">رسوم المنصة</p>
                           <p className="text-lg font-bold text-blue-600">${disputedAmount * platformFeePercent / 100}</p>
                        </div>
                     </div>

                     <div className="mt-8">
                       <button onClick={() => setStage('idle')} className="px-4 py-2 text-xs bg-white text-red-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all border border-red-100">إعادة المحاكاة</button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};
