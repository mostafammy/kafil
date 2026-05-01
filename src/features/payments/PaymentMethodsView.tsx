import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Plus, Trash2, ShieldCheck, Lock, 
  ChevronRight, ArrowLeft, Landmark, Wallet 
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface Card {
  id: string;
  type: 'visa' | 'mastercard';
  last4: string;
  expiry: string;
  holder: string;
  isDefault: boolean;
  color: string;
}

const PaymentMethodsView: FC = () => {
  const [cards, setCards] = useState<Card[]>([
    { 
      id: '1', 
      type: 'visa', 
      last4: '4242', 
      expiry: '12/26', 
      holder: 'Ahmed Yacine', 
      isDefault: true,
      color: 'bg-gradient-to-br from-blue-600 to-indigo-900'
    },
    { 
      id: '2', 
      type: 'mastercard', 
      last4: '8812', 
      expiry: '09/25', 
      holder: 'Ahmed Yacine', 
      isDefault: false,
      color: 'bg-gradient-to-br from-gray-800 to-black'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  // Stagger variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-10" 
      dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0D1B2A] tracking-tight mb-2">وسائل الدفع</h1>
          <p className="text-gray-500 font-medium">إدارة البطاقات البنكية والحسابات المرتبطة بخزنة كفيل.</p>
        </div>
        <motion.button 
          layoutId="add-card-btn"
          transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#C9A84C] text-[#0D1B2A] font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-[#C9A84C]/20"
        >
          <Plus size={20} /> إضافة بطاقة جديدة
        </motion.button>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left: Cards List */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h2 className="text-xl font-bold text-[#0D1B2A] flex items-center gap-2 px-1">
            <CreditCard size={20} className="text-[#C9A84C]" /> البطاقات المسجلة
          </h2>
          
          <div className="space-y-4">
            {cards.map((card) => (
              <motion.div 
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={cn(
                  "relative h-56 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden group cursor-pointer",
                  card.color
                )}
              >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Chip & Type */}
                <div className="flex justify-between items-start mb-10">
                  <div className="w-12 h-9 bg-yellow-400/20 rounded-md backdrop-blur-sm border border-yellow-400/30" />
                  <span className="text-2xl font-black italic opacity-90 uppercase">{card.type}</span>
                </div>

                {/* Card Number */}
                <div className="text-2xl font-mono tracking-[0.25em] mb-8 opacity-90">
                  •••• •••• •••• {card.last4}
                </div>

                {/* Bottom Info */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">صاحب البطاقة</p>
                    <p className="font-bold tracking-wide">{card.holder}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">الصلاحية</p>
                    <p className="font-bold">{card.expiry}</p>
                  </div>
                </div>

                {card.isDefault && (
                  <div className="absolute top-6 left-8 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-white/10">
                    الافتراضية
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Bank Accounts & Security */}
        <motion.div variants={itemVariants} className="space-y-8">
          {/* Bank Account Section */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#E8DDD0] shadow-sm">
            <h3 className="text-lg font-black text-[#0D1B2A] mb-6 flex items-center gap-2">
              <Landmark size={20} className="text-[#C9A84C]" /> التحويل البنكي (Payouts)
            </h3>
            <div className="p-5 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                <Plus size={24} />
              </div>
              <div>
                <p className="font-bold text-[#0D1B2A]">لم يتم ربط حساب بنكي</p>
                <p className="text-xs text-gray-400">اربط حسابك لتلقي الأرباح مباشرة من الضمان.</p>
              </div>
              <button className="text-sm font-black text-blue-600 hover:underline">إضافة IBAN</button>
            </div>
          </div>

          {/* Security Banner */}
          <div className="bg-[#0D1B2A] rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#C9A84C] rounded-full blur-[80px] opacity-10" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#C9A84C] p-2.5 rounded-xl">
                  <ShieldCheck size={20} className="text-[#0D1B2A]" />
                </div>
                <h4 className="font-black text-lg">أمان من المستوى البنكي</h4>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                يتم تشفير بيانات بطاقتك باستخدام معايير PCI-DSS. كفيل لا يخزن أرقام بطاقتك الكاملة أبداً؛ يتم التعامل معها عبر بوابات دفع مرخصة عالمياً.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <Lock size={12} /> SSL Secured
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <ShieldCheck size={12} /> Anti-Fraud
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction History Preview */}
      <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 border border-[#E8DDD0] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-[#0D1B2A] flex items-center gap-2">
            <Wallet size={20} className="text-[#C9A84C]" /> العمليات الأخيرة
          </h3>
          <button className="text-sm font-bold text-gray-400 hover:text-[#C9A84C]">عرض الكل</button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'شحن رصيد الخزنة', amount: '+ $1,200', date: 'منذ ساعتين', status: 'Succeeded' },
            { label: 'دفع دفعة مشروع #PRJ-882', amount: '- $450', date: 'أمس', status: 'Succeeded' }
          ].map((t, i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-[#0D1B2A]">
                  {t.amount.startsWith('+') ? <Landmark size={18} /> : <CreditCard size={18} />}
                </div>
                <div>
                  <p className="font-bold text-[#0D1B2A]">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.date}</p>
                </div>
              </div>
              <div className="text-left">
                <p className={cn("font-black", t.amount.startsWith('+') ? "text-emerald-600" : "text-[#0D1B2A]")}>{t.amount}</p>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">تم بنجاح</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 z-40 bg-[#0D1B2A]/80 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                layoutId="add-card-btn"
                transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
                role="dialog"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                >
                  <header className="bg-[#0D1B2A] p-10 text-white relative">
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowAddModal(false)}
                      className="absolute top-8 left-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors hover:bg-white/20"
                    >
                      <Plus className="rotate-45" size={20} />
                    </motion.button>
                    <h2 className="text-3xl font-black mb-1">إضافة بطاقة بنكية</h2>
                    <p className="text-gray-400 text-sm font-medium">بياناتك محمية بتشفير من المستوى البنكي.</p>
                  </header>
                  
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">رقم البطاقة</label>
                      <input 
                        className="w-full bg-gray-50 border border-[#E8DDD0] p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#C9A84C] transition-all outline-none font-bold text-lg"
                        placeholder="0000 0000 0000 0000"
                        dir="ltr"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">تاريخ الانتهاء</label>
                        <input 
                          className="w-full bg-gray-50 border border-[#E8DDD0] p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#C9A84C] transition-all outline-none font-bold"
                          placeholder="MM/YY"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">رمز الأمان (CVC)</label>
                        <input 
                          className="w-full bg-gray-50 border border-[#E8DDD0] p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#C9A84C] transition-all outline-none font-bold"
                          placeholder="•••"
                          type="password"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.01, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-[#0D1B2A] text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-lg"
                    >
                      <ShieldCheck size={22} className="text-[#C9A84C]" /> تأمين وحفظ البطاقة
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


export default PaymentMethodsView;
