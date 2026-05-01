import { FC, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import {
  LogOut, LayoutDashboard, PlusCircle,
  Bell, Search, Settings, Gavel, Scale, AlertCircle,
  User as UserIcon, HelpCircle, Languages, CreditCard
} from 'lucide-react';
import KafilLogo from '@/components/KafilLogo';
import { User } from '@/types';
import { cn } from '@/shared/utils/cn';
import { DemoGuide } from '@/shared/components/DemoGuide';
import { DemoStoryRunner } from '@/shared/components/fintech/DemoStoryRunner';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useLanguage } from '@/shared/context/LanguageContext';
import { translations } from '@/shared/translations';
import { BackButton } from '@/shared/components/ui/BackButton';

const MainLayout: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const { lang, toggleLang, isRtl } = useLanguage();
  const t = translations.layout[lang];
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Sidebar state
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const sidebarHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSidebarMouseEnter = () => {
    if (sidebarHoverTimeoutRef.current) clearTimeout(sidebarHoverTimeoutRef.current);
    sidebarHoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(true);
    }, 150); // Intent delay
  };

  const handleSidebarMouseLeave = () => {
    if (sidebarHoverTimeoutRef.current) clearTimeout(sidebarHoverTimeoutRef.current);
    sidebarHoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 150);
  };

  const userStr = localStorage.getItem('user');
  const user: User = userStr ? JSON.parse(userStr) : { role: 'client', name: 'Guest', username: 'guest', id: '0' };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuSections = [
    {
      label: t.sidebar.mainMenu,
      items: [
        {
          name: t.sidebar.home,
          icon: <LayoutDashboard size={20} />,
          path: `/dashboard/${user.role}`,
          roles: null,
        },
        {
          name: t.sidebar.settings,
          icon: <Settings size={20} />,
          path: '/settings',
          roles: null,
        },
        {
          name: t.sidebar.openProject,
          icon: <PlusCircle size={20} />,
          path: '/create',
          roles: ['client'],
        },
        {
          name: t.sidebar.payments,
          icon: <CreditCard size={20} />,
          path: '/payment-methods',
          roles: ['client', 'freelancer', 'coordinator', 'arbitrator'],
        },
      ],
    },
    {
      label: t.sidebar.disputesTitle,
      items: [
        {
          name: t.sidebar.myDisputes,
          icon: <AlertCircle size={20} />,
          path: '/disputes',
          roles: ['client', 'freelancer', 'coordinator'],
          badge: 2,
        },
        {
          name: t.sidebar.arbitrationCenter,
          icon: <Scale size={20} />,
          path: '/arbitration',
          roles: null, // Open to all roles
        },
      ],
    },
  ];

  const roleLabel = t.roles;

  return (
    <div className="min-h-screen flex font-sans text-gray-900" style={{ background: '#F9F4EE' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── SIDEBAR SPACER (Prevents layout shift) ── */}
      <div className="hidden lg:block w-[64px] shrink-0 z-10" />

      {/* ── SIDEBAR ── */}
      <motion.aside 
        className={cn(
          "bg-[#0D1B2A]/95 backdrop-blur-2xl border-white/5 hidden lg:flex flex-col fixed top-0 h-screen z-50 overflow-hidden shadow-2xl",
          isRtl ? "right-0 border-l" : "left-0 border-r"
        )}
        initial={{ width: 64 }}
        animate={{ width: isSidebarHovered ? 288 : 64 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <div className="w-72 h-full flex flex-col">
          {/* Logo */}
          <div className="px-3 py-7 border-b border-white/5 flex items-center h-[90px] shrink-0">
            <Link to="/" className="hover:opacity-80 transition-opacity block overflow-hidden">
              <KafilLogo size="md" variant="dark" className="whitespace-nowrap" />
            </Link>
          </div>

          {/* Nav sections */}
          <nav className="flex-1 px-2 py-6 space-y-8 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {menuSections.map(section => {
              const visibleItems = section.items.filter(
                item => !item.roles || item.roles.includes(user.role)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.label}>
                  <motion.p 
                    animate={{ opacity: isSidebarHovered ? 1 : 0 }}
                    className={cn("text-[10px] font-black text-white/25 uppercase tracking-widest px-4 mb-3 whitespace-nowrap", isRtl ? "text-right" : "text-left")}
                  >
                    {section.label}
                  </motion.p>
                  <div className="space-y-2">
                    {visibleItems.map(item => {
                      const isActive = location.pathname === item.path ||
                        (item.path !== '/create' && location.pathname.startsWith(item.path) && item.path !== `/dashboard/${user.role}`);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            'flex items-center gap-4 px-3 py-3 rounded-2xl font-bold text-sm transition-all relative whitespace-nowrap group mx-1',
                            isActive
                              ? 'bg-[#C9A84C] text-[#0D1B2A] shadow-lg shadow-[#C9A84C]/20'
                              : 'text-white/50 hover:bg-white/10 hover:text-white',
                            isRtl ? "text-right" : "text-left"
                          )}
                          title={!isSidebarHovered ? item.name : undefined}
                        >
                          <span className={cn('flex items-center justify-center shrink-0 w-6 h-6', isActive ? 'text-[#0D1B2A]' : 'text-white/40 group-hover:text-white transition-colors')}>
                            {item.icon}
                          </span>
                          <motion.span 
                            animate={{ opacity: isSidebarHovered ? 1 : 0 }}
                            className="flex-1"
                          >
                            {item.name}
                          </motion.span>
                          {'badge' in item && item.badge && (
                            <motion.span 
                              animate={{ opacity: isSidebarHovered ? 1 : 0 }}
                              className={cn(
                                'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0',
                                isActive ? 'bg-[#0D1B2A] text-[#C9A84C]' : 'bg-red-500 text-white'
                              )}
                            >
                              {item.badge}
                            </motion.span>
                          )}
                          {isActive && (
                            <motion.div 
                              layoutId={`active-nav-indicator-${item.path}`}
                              className={cn("absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0D1B2A] rounded-full", isRtl ? "right-0" : "left-0")} 
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom: escrow card + logout */}
          <div className="p-2 py-4 border-t border-white/5 shrink-0">
            <motion.div 
              animate={{ opacity: isSidebarHovered ? 1 : 0, height: isSidebarHovered ? 'auto' : 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl p-5 mb-4 border border-[#C9A84C]/20 bg-[#C9A84C]/5 whitespace-nowrap mx-1">
                <p className={cn("text-[10px] font-black text-[#C9A84C] uppercase tracking-widest mb-1", isRtl ? "text-right" : "text-left")}>
                  {t.header.escrowSystem}
                </p>
                <p className={cn("text-xs font-bold text-white/70 mb-3", isRtl ? "text-right" : "text-left")}>
                  {t.header.securedMsg}
                </p>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#C9A84C] h-full w-full" />
                </div>
              </div>
            </motion.div>

            <button
              onClick={handleLogout}
              title={!isSidebarHovered ? t.header.logout : undefined}
              className={cn("w-full flex items-center gap-4 px-3 py-3 rounded-2xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all whitespace-nowrap group mx-1")}
            >
              <div className="flex items-center justify-center shrink-0 w-6 h-6">
                <LogOut size={20} className="group-hover:scale-110 transition-transform" /> 
              </div>
              <motion.span animate={{ opacity: isSidebarHovered ? 1 : 0 }} className={cn("flex-1", isRtl ? "text-right" : "text-left")}>
                {t.header.logout}
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOPBAR */}
        <header className="h-18 bg-white/80 backdrop-blur-md border-b border-[#E8DDD0] flex items-center justify-between px-6 md:px-10 sticky top-0 z-10" style={{ minHeight: '72px' }}>
          {/* Back Button */}
          {!location.pathname.includes('/dashboard/') && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register' && (
            <div className="hidden md:block">
              <BackButton />
            </div>
          )}

          <div className="hidden md:flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-[#E8DDD0] w-full max-w-md focus-within:ring-2 focus-within:ring-[#C9A84C]/20 transition-all">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder={t.header.searchPlaceholder} className="bg-transparent border-0 outline-none w-full text-sm font-medium" />
          </div>

          <div className={cn("flex items-center gap-3", isRtl ? "mr-auto lg:mr-0" : "ml-auto lg:ml-0")}>
            {/* Language Switcher */}
            <button 
              onClick={toggleLang}
              className="px-3 py-2 bg-white border border-[#E8DDD0] rounded-xl flex items-center gap-2 text-gray-500 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all font-bold text-xs"
            >
              <Languages size={18} />
              <span className="uppercase">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Disputes quick link — all roles */}
            <Link
              to="/disputes"
              className={cn(
                'hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border',
                location.pathname === '/disputes'
                  ? 'bg-[#C9A84C] text-[#0D1B2A] border-[#C9A84C]'
                  : 'bg-white border-[#E8DDD0] text-gray-500 hover:border-[#C9A84C]/40 hover:text-[#0D1B2A]',
                !isRtl && "flex-row-reverse"
              )}
            >
              <Gavel size={16} />
              {t.header.disputesShortcut}
              <DisputeBadge userId={user.id} />
            </Link>

            <button className="w-11 h-11 bg-white border border-[#E8DDD0] rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <button 
              onClick={() => {
                navigate('/settings');
              }}
              className="w-11 h-11 bg-white border border-[#E8DDD0] rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#C9A84C] transition-all relative"
            >
              <Settings size={20} />
            </button>

            <div className="h-8 w-px bg-[#E8DDD0] mx-1 hidden md:block" />

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={cn("flex items-center gap-3 bg-white border border-[#E8DDD0] py-1.5 rounded-2xl shadow-sm hover:border-[#C9A84C]/40 transition-all outline-none", isRtl ? "pl-4 pr-1.5 flex-row" : "pr-4 pl-1.5 flex-row-reverse")}
              >
                <div className={cn("hidden md:block", isRtl ? "text-right" : "text-left")}>
                  <p className="text-xs font-black text-[#0D1B2A] leading-tight">{user.name}</p>
                  <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest">
                    {roleLabel[user.role] || user.role}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 border-white shadow-sm"
                  style={{ background: '#0D1B2A', color: '#C9A84C' }}>
                  {user.name.charAt(0)}
                </div>
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cn("absolute mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-[#E8DDD0] p-1.5 z-50 overflow-hidden", isRtl ? "left-0" : "right-0")}
                  >
                    <div className={cn("p-3 mb-1 bg-gray-50 rounded-2xl md:hidden", isRtl ? "text-right" : "text-left")}>
                       <p className="text-sm font-black text-[#0D1B2A]">{user.name}</p>
                       <p className="text-[10px] font-bold text-[#C9A84C] uppercase">{roleLabel[user.role]}</p>
                    </div>

                    <button 
                      onClick={() => {
                        navigate('/settings');
                        setIsProfileMenuOpen(false);
                      }}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all", isRtl ? "flex-row" : "flex-row-reverse")}
                    >
                      <Settings size={18} className="text-[#C9A84C]" /> {t.sidebar.settings}
                    </button>

                    <button 
                      onClick={() => {
                        toast.info(t.header.helpCenterComingSoon);
                        setIsProfileMenuOpen(false);
                      }}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all", isRtl ? "flex-row" : "flex-row-reverse")}
                    >
                      <HelpCircle size={18} className="text-[#C9A84C]" /> {t.header.helpCenter}
                    </button>

                    <div className="h-px bg-gray-100 my-1 mx-2" />

                    <button
                      onClick={handleLogout}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all", isRtl ? "flex-row" : "flex-row-reverse")}
                    >
                      <LogOut size={18} /> {t.header.logout}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden bg-[#F9F4EE]">
          <LayoutGroup>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="relative flex-1 h-full p-6 md:p-10 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </main>
      <DemoGuide />
      <DemoStoryRunner />
    </div>
  );
};

const DisputeBadge: FC<{ userId: string }> = ({ userId }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api.getProjects().then(projs => {
      api.getUsers().then(users => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const uId = (user.id || '').toLowerCase();
        const uEmail = (user.email || '').toLowerCase();
        const uName = (user.username || '').toLowerCase();

        const disputes = projs.flatMap(p => 
          p.tasks.filter(t => {
            if (t.status !== 'Disputed') return false;
            const isOwner = p.ownerId === uId;
            const assigned = (t.assignedTo || '').toLowerCase();
            const assignedEmail = (t.assignedToEmail || '').toLowerCase();
            const isAssigned = assigned === uId || assigned === uEmail || assigned === uName || assignedEmail === uEmail;
            return isOwner || isAssigned;
          })
        );
        setCount(disputes.length);
      });
    });
  }, [userId]);

  if (count === 0) return null;
  return (
    <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
      {count}
    </span>
  );
};

export default MainLayout;
