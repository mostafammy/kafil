import { useState, FC, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, ArrowRight, Mail, AlertCircle, Globe, RefreshCcw } from 'lucide-react';
import { UserRole } from '@/types';
import { api } from '@/services/api';
import { cn } from '@/shared/utils/cn';
import { useLanguage } from '@/shared/context/LanguageContext';
import { translations } from '@/shared/translations';

const TRANSLATIONS = {
  en: {
    welcome: "Welcome Back",
    subtitle: "Log in to access your secure financial escrow",
    email: "Email Address",
    password: "Password",
    role: "Role",
    loginBtn: "Login",
    noAccount: "Don't have an account?",
    register: "Create an account now",
    mockDataMsg: "Test Data (Hackathon Simulation)",
    errorInvalidRole: "Selected role does not match user account.",
    errorLoginFailed: "Invalid email or password.",
    admin: "Admin",
    client: "Client",
    freelancer: "Freelancer",
    coordinator: "Coordinator",
    switchLang: "عربي",
    emailPlaceholder: "name@company.com",
    roleAdmin: "Admin",
    roleClient: "Client",
    roleFreelancer: "Freelancer",
    roleCoordinator: "Coordinator",
  },
  ar: {
    welcome: "مرحباً بك مجدداً",
    subtitle: "سجل دخولك للوصول إلى خزنتك المالية الآمنة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    role: "المهنة / الدور",
    loginBtn: "دخول",
    noAccount: "ليس لديك حساب؟",
    register: "أنشئ حساباً الآن",
    mockDataMsg: "بيانات تجريبية لغرض المحاكاة",
    errorInvalidRole: "الدور المحدد لا يتطابق مع حسابك.",
    errorLoginFailed: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    admin: "المدير",
    client: "العميل",
    freelancer: "المستقل",
    coordinator: "المنسق",
    switchLang: "English",
    emailPlaceholder: "name@company.com",
    roleAdmin: "حساب مدير",
    roleClient: "حساب عميل",
    roleFreelancer: "حساب مستقل",
    roleCoordinator: "حساب منسق",
  }
};

const MOCK_USERS = [
  { labelEn: 'Admin', labelAr: 'المدير العام', role: 'admin', email: 'admin@kafeel.com', password: '123456', bg: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { labelEn: 'Ahmed (Client)', labelAr: 'أحمد (العميل)', role: 'client', email: 'client1@kafeel.com', password: '123456', bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { labelEn: 'Omar (Freelancer)', labelAr: 'عمر (المستقل)', role: 'freelancer', email: 'freelancer1@kafeel.com', password: '123456', bg: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { labelEn: 'Tariq (Coordinator)', labelAr: 'طارق (المنسق)', role: 'coordinator', email: 'coordinator1@kafeel.com', password: '123456', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
];

const Login: FC = () => {
  const { lang, toggleLang, isRtl } = useLanguage();
  const tFull = translations.auth[lang];
  const t = tFull.login;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e?: FormEvent, mockEmail?: string) => {
    if (e) e.preventDefault();
    setError(null);
    const loginQuery = mockEmail || email;
    try {
      if (!loginQuery) throw new Error(t.error);
      
      const user = await api.login(loginQuery, password || '123456');
      localStorage.setItem('user', JSON.stringify(user));
      navigate(`/dashboard/${user.role}`);
    } catch (err: any) {
      setError(err.message || t.error);
    }
  };

  const handleMockUserSelect = (mockUser: any) => {
    // Force reset the DB to ensure the user exists (great for demos/hackathons)
    api.resetDb();
    
    setEmail(mockUser.email);
    setPassword(mockUser.password);
    handleLogin(undefined, mockUser.email);
  };

  useEffect(() => {
    // Only reset if explicitly needed, otherwise let localStorage persist
    // api.resetDb(); 
  }, []);

  return (
    <div className={cn("min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans transition-all", isRtl ? 'rtl' : 'ltr')} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-3">
        <button 
          onClick={() => {
            localStorage.clear();
            api.resetDb();
            window.location.reload();
          }}
          className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
        >
          <RefreshCcw size={14} />
          {isRtl ? "إعادة ضبط النظام (Reset)" : "Factory Reset"}
        </button>
        <button 
          onClick={toggleLang}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Globe size={16} />
          {t.switchLang}
        </button>
      </div>

      <div className="max-w-[28rem] w-full bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-8 sm:p-10 relative overflow-hidden">
        <div className={cn("absolute top-0 w-32 h-32 bg-blue-50/50 -z-0", isRtl ? 'right-0 rounded-bl-full' : 'right-0 rounded-bl-full')}></div>
        
        <div className="relative z-10">
          <div className="text-3xl font-black text-blue-900 flex items-center gap-2 mb-8 tracking-tight">
            <ShieldCheck size={36} className="text-green-500" /> كفيل
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">{t.title}</h2>
          <p className="text-gray-400 font-medium mb-8 text-sm">{t.subtitle}</p>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 mx-1">{t.email}</label>
              <div className="relative">
                <Mail className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? 'right-4' : 'left-4')} size={20} />
                <input 
                  type="text" 
                  className={cn(
                    "w-full bg-gray-50/50 border border-gray-200 p-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium text-sm",
                    isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'
                  )}
                  placeholder={isRtl ? "اسم المستخدم أو البريد" : "Username or Email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 mx-1">{t.password}</label>
              <div className="relative">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? 'right-4' : 'left-4')} size={20} />
                <input 
                  type="password" 
                  className={cn(
                    "w-full bg-gray-50/50 border border-gray-200 p-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium text-sm",
                    isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'
                  )}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-all shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 text-[15px] group mt-2">
              {t.btn}
              {isRtl ? (
                 <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              ) : (
                 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider text-center flex items-center gap-2 justify-center before:h-px before:flex-1 before:bg-gray-100 after:h-px after:flex-1 after:bg-gray-100">
              {lang === 'ar' ? 'بيانات تجريبية لغرض المحاكاة' : 'Trial data for simulation purposes'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_USERS.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMockUserSelect(u)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border transition-all text-left",
                    isRtl ? "text-right" : "text-left",
                    u.bg
                  )}
                >
                  <span className="text-xs font-bold mb-0.5">{isRtl ? u.labelAr : u.labelEn}</span>
                  <span className="text-[10px] opacity-80 break-all">{u.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-sm">
            <p className="text-gray-500 font-medium">
              {t.noAccount} &nbsp;
              <Link to="/register" className="text-blue-600 font-bold hover:underline">{t.registerLink}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

