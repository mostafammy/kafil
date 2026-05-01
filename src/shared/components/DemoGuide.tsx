import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronUp, ChevronDown, Rocket } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const STEPS = [
  { path: '/dashboard/client', label: '1. إنشاء مشروع وإيداع الميزانية (Client)' },
  { path: '/projects/', label: '2. قفل الأموال في الضمان لكل مهمة (Client)' },
  { path: '/dashboard/freelancer', label: '3. قبول المهمة وتسليم العمل (Freelancer)' },
  { path: '/projects/', label: '4. اعتماد وتحرير الدفعة (Client)' },
  { path: '/dashboard/freelancer', label: '5. استلام الأرباح المحررة (Freelancer)' }
];

export const DemoGuide = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  if (location.pathname === '/' || location.pathname === '/login') return null;

  return (
    <div className="fixed bottom-32 left-10 z-[100] font-sans" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-5 mb-4 w-80"
          >
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-[#0D1B2A] flex items-center gap-2">
                 <Rocket size={18} className="text-blue-500" /> مسار العرض (Demo Guide)
               </h3>
               <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <ChevronDown size={18} />
               </button>
            </div>
            
            <div className="space-y-3">
              {STEPS.map((step, index) => {
                 const isActive = location.pathname.includes(step.path) || (location.pathname.startsWith('/projects') && step.path === '/projects/');
                 return (
                   <div key={index} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-50 border border-blue-100' : ''}`}>
                     <div className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                       <CheckCircle2 size={14} />
                     </div>
                     <span className={`text-xs font-bold leading-5 ${isActive ? 'text-blue-900' : 'text-gray-500'}`}>
                       {step.label}
                     </span>
                   </div>
                 );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
               <p className="text-[10px] text-gray-400 font-black mb-3 text-center uppercase tracking-wider">التبديل السريع بين الأدوار (Switch Role)</p>
               <div className="flex gap-2">
                 <button 
                   onClick={() => {
                     const user = { id: 'user_client_1', role: 'client', name: 'أحمد خالد', username: 'ahmed_k' };
                     localStorage.setItem('user', JSON.stringify(user));
                     window.location.href = '/dashboard/client';
                   }}
                   className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-xl text-[10px] font-black border border-blue-100 hover:bg-blue-100 transition-all"
                 >
                   أحمد (Client)
                 </button>
                 <button 
                   onClick={() => {
                     const user = { id: 'user_freelancer_1', role: 'freelancer', name: 'عمر العلي', username: 'omar_dev' };
                     localStorage.setItem('user', JSON.stringify(user));
                     window.location.href = '/dashboard/freelancer';
                   }}
                   className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-xl text-[10px] font-black border border-purple-100 hover:bg-purple-100 transition-all"
                 >
                   عمر (Freelancer)
                 </button>
               </div>
               <p className="text-[9px] text-gray-400 mt-2 text-center">البيانات ستبقى محفوظة محلياً عند التبديل</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="فتح مسار العرض"
        >
          <Rocket size={24} />
        </motion.button>
      )}
    </div>
  );
};
