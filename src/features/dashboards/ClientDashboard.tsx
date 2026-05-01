import { useState, useRef, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Lock, CheckCircle, Wallet, ArrowLeft, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DemoButton from '@/shared/components/DemoButton';
import { FC } from 'react';
import { Project } from '@/types';

interface ClientDashboardProps {
  projects: Project[];
  totalBudget: number;
  totalLocked: number;
  totalPaid: number;
}

const ClientDashboard: FC<ClientDashboardProps> = ({
  projects,
  totalBudget,
  totalLocked,
  totalPaid,
}) => {
  const navigate = useNavigate();
  const [animatingProjectId, setAnimatingProjectId] = useState<string | null>(null);

  const handleProjectClick = (e: MouseEvent, projectId: string) => {
    e.preventDefault();
    setAnimatingProjectId(projectId);
    // Add a slightly longer delay for a smoother, more cinematic animation
    setTimeout(() => {
      navigate(`/projects/${projectId}`);
    }, 1200); // 1200ms provides enough time for the slow "grow to center" visual effect
  };

  return (
    <div className="animate-fade-in relative mx-auto max-w-5xl">
      <AnimatePresence>
        {animatingProjectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm"
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 text-3xl font-black tracking-tight text-gray-900">
            الخزنة المركزية (Client)
          </h1>
          <p className="font-medium text-gray-500">
            تابع استثماراتك المالية في مشاريعك بأقصى درجات الأمان.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="hidden w-56 md:block">
            <DemoButton />
          </div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/create"
              className="flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-800"
            >
              إطلاق مشروع جديد <ChevronLeft size={18} />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="mb-12 grid gap-5 md:grid-cols-3">
        <div className="relative flex h-36 flex-col justify-between overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="absolute top-0 left-0 h-full w-1 border-l-4 border-gray-100"></div>
          <p className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase">
            <Briefcase size={16} /> إجمالي الميزانيات المُصدرة
          </p>
          <p className="text-4xl font-black text-gray-900">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="relative z-10 flex h-36 scale-100 transform flex-col justify-between overflow-hidden rounded-3xl bg-blue-900 p-6 shadow-[0_10px_30px_-10px_rgba(30,58,138,0.5)] transition-transform md:scale-105">
          <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-full bg-blue-800 opacity-50 blur-2xl"></div>
          <p className="flex items-center gap-2 text-sm font-bold text-blue-200 uppercase">
            <Lock size={16} /> أموال الخزنة (Escrow)
          </p>
          <p className="text-4xl font-black text-white">${totalLocked.toLocaleString()}</p>
        </div>
        <div className="relative flex h-36 flex-col justify-between overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="absolute top-0 right-0 h-full w-1 bg-emerald-500"></div>
          <p className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase">
            <CheckCircle size={16} className="text-emerald-500" /> المدفوعات المحررة
          </p>
          <p className="text-4xl font-black text-gray-900">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      {/* VISUALIZATION FLOW */}
      <div className="mb-12 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-gray-900">
          <Wallet className="text-blue-600" /> تدفق مسار المدفوعات
        </h2>
        <div className="relative mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="absolute top-1/2 right-8 left-8 -z-10 mt-[-2px] hidden h-1 bg-gray-100 md:block"></div>
          <div className="z-10 w-32 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
            <span className="mb-1 block text-xl font-black text-gray-900">${totalBudget}</span>
            <span className="text-xs font-bold text-gray-500">رأس المال</span>
          </div>
          <ArrowLeft className="hidden text-gray-300 md:block" size={24} />
          <div className="z-10 w-40 scale-105 transform rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-lg shadow-blue-100">
            <span className="mb-1 block text-2xl font-black text-blue-800">${totalLocked}</span>
            <span className="flex items-center justify-center gap-1 text-xs font-bold text-blue-600">
              <Lock size={12} /> قيد الاحتجاز
            </span>
          </div>
          <ArrowLeft className="hidden text-gray-300 md:block" size={24} />
          <div className="z-10 w-32 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <span className="mb-1 block text-xl font-black text-emerald-800">${totalPaid}</span>
            <span className="text-xs font-bold text-emerald-600">مصروفة</span>
          </div>
        </div>
      </div>

      <h2 className="mb-6 px-1 text-xl font-bold text-gray-800">
        مشاريعك قيد التنفيذ ({projects.length})
      </h2>
      {projects.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
          <p className="mb-4 text-lg font-bold text-gray-400">
            لم تقم بإيداع ميزانية لأي مشروع بعد.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/create"
              className="border-b-2 border-blue-200 pb-1 font-bold text-blue-600 transition hover:border-blue-600 hover:text-blue-800"
            >
              ابدأ بتمويل مشروعك الأول
            </Link>
            <div className="mt-4 w-64 md:hidden">
              <DemoButton />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative grid gap-5 lg:grid-cols-2">
          {projects.map((p) => {
            const isAnimating = animatingProjectId === p.id;
            const isOther = animatingProjectId && animatingProjectId !== p.id;

            return (
              <motion.a
                key={p.id}
                href={`/projects/${p.id}`}
                onClick={(e) => handleProjectClick(e, p.id)}
                animate={
                  isAnimating
                    ? {
                        position: 'fixed',
                        top: '20%',
                        left: '50%',
                        x: '-50%',
                        width: '90vw',
                        maxWidth: '800px',
                        zIndex: 60,
                        scale: 1.05,
                        boxShadow: '0 40px 100px -20px rgba(30,58,138,0.4)',
                      }
                    : {
                        position: 'relative',
                        top: 'auto',
                        left: 'auto',
                        x: '0%',
                        width: 'auto',
                        maxWidth: 'none',
                        zIndex: 1,
                        scale: 1,
                        boxShadow: '0 0px 0px 0px rgba(0,0,0,0)',
                      }
                }
                whileHover={animatingProjectId ? {} : { scale: 1.02 }}
                transition={{
                  type: 'spring',
                  stiffness: 80,
                  damping: 15,
                  mass: 1,
                }}
                className={`group block cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 hover:border-blue-200 hover:shadow-xl ${
                  isOther
                    ? 'pointer-events-none scale-[0.9] opacity-0 blur-md transition-all duration-700'
                    : ''
                }`}
              >
                <div className="relative z-10 mb-6 flex items-start justify-between">
                  <h3 className="truncate pl-2 text-xl font-extrabold text-gray-900 transition group-hover:text-blue-900">
                    {p.title}
                  </h3>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                    <Lock size={12} /> كفيل يحمي الدفعات
                  </span>
                </div>

                <div className="relative z-10 mb-6">
                  <div className="mb-2 flex justify-between text-xs font-bold text-gray-400">
                    <span>الميزانية المرصودة</span>
                    <span className="text-emerald-600">
                      أُنجِز {p.tasks.filter((t) => t.paid).length} من {p.tasks.length} مهام
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
                    <div
                      className="h-full w-1/4 bg-emerald-500 transition-all duration-1000"
                      style={{
                        width: `${p.tasks.length ? (p.tasks.filter((t) => t.paid).length / p.tasks.length) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="relative z-10 flex items-end justify-between border-t border-gray-50 pt-2">
                  <div>
                    <span className="mb-1 block text-xs font-bold text-gray-400">الميزانية</span>
                    <p className="text-2xl font-black text-gray-900">
                      ${p.budget.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                    <ArrowLeft
                      size={20}
                      className="transition-transform group-hover:-translate-x-1"
                    />
                  </div>
                </div>

                {/* Animated Expansion Overlay when clicked */}
                {animatingProjectId === p.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 50 }}
                    transition={{ duration: 0.6, ease: 'easeIn' }}
                    className="absolute top-1/2 left-1/2 z-0 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/90"
                  />
                )}
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
