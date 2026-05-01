import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Gavel, ArrowRight, CheckCircle, AlertTriangle, Users, Banknote, RefreshCcw, HandCoins, ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export default function DisputeFlow() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  // State: 'idle' -> 'review' -> 'voting' -> 'verdict_eval' -> 'resolved_fair' | 'resolved_false'
  const [stage, setStage] = useState<string>('idle');
  const [mockSelected, setMockSelected] = useState<'fair' | 'false' | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null') || { role: 'client' };

  // Hardcoded values for demo
  const disputedAmount = 1500;
  const platformFeePercent = 5;

  useEffect(() => {
    if (user.role === 'client') {
      const hash = (taskId || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const statuses = ['open', 'open', 'resolved_won', 'resolved_lost', 'open'];
      const mockStatus = statuses[hash % statuses.length];
      
      if (mockStatus === 'resolved_won') {
        setStage('resolved_fair');
      } else if (mockStatus === 'resolved_lost') {
        setStage('resolved_false');
      } else {
        setStage('voting');
      }
    }
  }, [user.role, taskId]);

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

  const spring = { type: 'spring', stiffness: 300, damping: 30 };

  const renderActiveStateIcon = () => {
    if (stage === 'review') return <Gavel size={40} className="text-blue-500 animate-bounce" />;
    if (stage === 'voting') return <Users size={40} className="text-purple-500 animate-pulse" />;
    if (stage === 'verdict_eval') return <RefreshCcw size={40} className="text-amber-500 animate-spin" />;
    return <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-8"
      dir="rtl"
    >
      <motion.button 
        whileHover={{ x: 5 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-[#0D1B2A] mb-8 font-bold transition-colors"
      >
        <ChevronRight size={20} /> العودة للوحة التحكم
      </motion.button>

      {/* Header Card */}
      <motion.div 
        layout
        className="bg-white border border-[#E8DDD0] rounded-[2.5rem] p-10 mb-10 shadow-sm relative overflow-hidden"
      >
         <div className="absolute top-0 left-0 w-64 h-64 bg-red-50 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 opacity-50" />
         <div className="relative z-10 text-center">
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}
             className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20 rotate-3"
           >
              <ShieldAlert size={36} />
           </motion.div>
           <h1 className="text-2xl font-bold text-[#0D1B2A] mb-3 tracking-tight">نظام التحكيم المتقدم</h1>
           <div className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 font-semibold px-5 py-2.5 rounded-full text-xs border border-emerald-100 shadow-sm backdrop-blur-sm">
             <HandCoins size={20} className="text-emerald-600" />
             لا يوجد رسوم فتح شكوى — الدفع حسب النتيجة فقط
           </div>
         </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="bg-white border border-[#E8DDD0] rounded-[2.5rem] p-10 mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Dynamic Timeline */}
        <div className="relative mb-20 px-4">
          <div className="absolute top-1/2 left-4 right-4 h-2 bg-gray-100 -z-10 rounded-full transform -translate-y-1/2 overflow-hidden">
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
                  className="flex flex-col items-center gap-3 cursor-pointer group"
                  onClick={() => setStage(step.stage)}
                >
                  <motion.div 
                    animate={current ? { scale: [1, 1.1, 1], boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.2)' } : {}}
                    transition={{ repeat: current ? Infinity : 0, duration: 2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-all duration-300",
                      active ? "bg-[#0D1B2A] text-white shadow-xl shadow-black/20" : "bg-gray-100 text-gray-400 border-2 border-white group-hover:bg-gray-200 group-hover:text-gray-500"
                    )}
                  >
                    <Icon size={24} />
                  </motion.div>
                  <span className={cn("text-xs font-black transition-colors", active ? "text-[#0D1B2A]" : "text-gray-400 group-hover:text-gray-600")}>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 py-8"
            >
              <div>
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">محاكاة قرارات التحكيم</h3>
                <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
                  نظام كفيل يعتمد على 3 مُحكّمين مستقلين. يتم خصم نسبة {platformFeePercent}% من <span className="font-bold text-red-500">الطرف الخاسر فقط</span> لضمان العدالة.
                </p>
              </div>
              
              {(user.role === 'arbitrator' || user.role === 'admin') ? (
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-10">
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => runSimulation('fair')} 
                    className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-8 rounded-[2rem] shadow-xl shadow-emerald-600/20 flex flex-col items-center gap-4 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                      <CheckCircle size={32}/>
                    </div>
                    <div className="text-center">
                      <span className="block text-base font-bold mb-1">المشتكي على حق</span>
                      <span className="text-xs text-emerald-100">الطرف الآخر يتحمل الرسوم وتُسترد حقوقك بالكامل</span>
                    </div>
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => runSimulation('false')} 
                    className="bg-gradient-to-br from-red-500 to-red-700 text-white p-8 rounded-[2rem] shadow-xl shadow-red-600/20 flex flex-col items-center gap-4 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                      <AlertTriangle size={32}/>
                    </div>
                    <div className="text-center">
                      <span className="block text-base font-bold mb-1">ادعاء باطل (كيدي)</span>
                      <span className="text-xs text-red-100">تُفرض غرامة على المشتكي لتغطية تكاليف النظام</span>
                    </div>
                  </motion.button>
                </div>
              ) : (
                <div className="mt-12 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center gap-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-gray-200/50 rounded-full flex items-center justify-center">
                     <Gavel className="text-gray-400" size={32} />
                  </div>
                  <span className="text-sm font-bold text-gray-500 text-center leading-relaxed">
                     التصويت وإصدار الأحكام متاح فقط للمحكمين المستقلين المعينين لهذه القضية. يرجى الانتظار حتى صدور قرار التحكيم النهائي.
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
              className="text-center py-20 relative"
            >
               <motion.div 
                 className="w-32 h-32 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-8 shadow-inner relative"
               >
                 <motion.div 
                   animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 border-[6px] border-transparent border-t-[#0D1B2A] border-l-[#C9A84C] rounded-full opacity-30"
                 />
                 {renderActiveStateIcon()}
               </motion.div>
               <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">
                 {stage === 'review' && 'جاري تحليل الأدلة والمستندات...'}
                 {stage === 'voting' && 'المحكمون المستقلون يتشاورون الآن...'}
                 {stage === 'verdict_eval' && 'جاري صياغة الحكم النهائي...'}
               </h3>
               <p className="text-gray-400 text-sm">نضمن لك الشفافية التامة والحيادية في كل خطوة.</p>
            </motion.div>
          )}

          {stage === 'resolved_fair' && (
            <motion.div 
              key="resolved_fair"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 rounded-[2.5rem] p-10 text-center relative overflow-hidden"
            >
               <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-[2rem] rotate-3 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/30">
                 <CheckCircle size={48} />
               </div>
               <h3 className="text-xl font-bold text-emerald-900 mb-3 tracking-tight">حكم عادل: المشتكي على حق</h3>
               <p className="text-emerald-800/80 mb-8 text-sm max-w-2xl mx-auto">
                 تم إثبات مصداقية الشكوى. تم تحميل <span className="text-emerald-900 font-bold bg-emerald-200/50 px-2 rounded">الطرف الخاسر</span> كافة تكاليف التحكيم.
               </p>
               
               <div className="grid md:grid-cols-3 gap-6 relative z-10 w-full">
                  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-emerald-900/5 text-center border border-emerald-100">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">استرداد المشتكي</p>
                     <p className="text-xl font-bold text-emerald-600">${disputedAmount}</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-emerald-900/5 text-center border border-emerald-100">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">خسارة الطرف الآخر</p>
                     <p className="text-xl font-bold text-red-600">-${disputedAmount + (disputedAmount * platformFeePercent / 100)}</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-emerald-900/5 text-center border border-emerald-100">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">رسوم المنصة</p>
                     <p className="text-xl font-bold text-blue-600">${disputedAmount * platformFeePercent / 100}</p>
                  </motion.div>
               </div>
               
               <div className="mt-10">
                 <button onClick={() => setStage('idle')} className="px-5 py-2.5 text-sm bg-white text-emerald-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all">إعادة محاكاة النظام</button>
               </div>
            </motion.div>
          )}

          {stage === 'resolved_false' && (
            <motion.div 
              key="resolved_false"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-[2.5rem] p-10 text-center relative overflow-hidden"
            >
               <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-[2rem] -rotate-3 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/30">
                 <AlertTriangle size={48} />
               </div>
               <h3 className="text-xl font-bold text-red-900 mb-3 tracking-tight">غرامة ادعاء باطل</h3>
               <p className="text-red-800/80 mb-8 text-sm max-w-2xl mx-auto">
                 تم رفض الشكوى. لحماية المستقلين من الاستغلال، يتم تغريم <span className="text-red-900 font-bold bg-red-200/50 px-2 rounded">المشتكي</span> لتغطية رسوم النظام.
               </p>
               
               <div className="grid md:grid-cols-3 gap-6 relative z-10 w-full">
                  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-red-900/5 text-center border-2 border-red-200">
                     <p className="text-xs text-red-500 font-bold uppercase tracking-widest mb-2">غرامة على المشتكي</p>
                     <p className="text-xl font-bold text-red-600">-${disputedAmount * platformFeePercent / 100}</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-red-900/5 text-center border border-red-100">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">استلام المدعى عليه</p>
                     <p className="text-xl font-bold text-emerald-600">${disputedAmount}</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-red-900/5 text-center border border-red-100">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">رسوم المنصة</p>
                     <p className="text-xl font-bold text-blue-600">${disputedAmount * platformFeePercent / 100}</p>
                  </motion.div>
               </div>

               <div className="mt-10">
                 <button onClick={() => setStage('idle')} className="px-5 py-2.5 text-sm bg-white text-red-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all border border-red-100">إعادة محاكاة النظام</button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
