import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight, FileText, Gavel, Clock, CheckCircle,
  AlertTriangle, Scale, User, Shield, Info
} from 'lucide-react';

const MOCK_CASES: Record<string, {
  title: string; category: string; amount: number; hoursLeft: number;
  requester: string; respondent: string; filedDate: string;
  aiSummary: string; evidence: string[];
  history: { date: string; event: string }[];
}> = {
  'task_dispute_1': {
    title: 'نزاع تكامل بوابة الدفع — متجر كفيل',
    category: 'Fintech Development',
    amount: 500,
    hoursLeft: 14,
    requester: 'أحمد خالد (عميل)',
    respondent: 'عمر العلي (مصمم)',
    filedDate: '1 مايو 2026',
    aiSummary: `فُتح هذا النزاع بواسطة "أحمد خالد" مدّعياً أن الربط مع بوابة الدفع "Stripe" لا يعمل في بيئة الإنتاج رغم عمله في بيئة الاختبار.
    
    يرد "عمر العلي" بأن المشكلة تكمن في مفاتيح API الخاصة بالعميل وليس في الكود البرمجي المسلم، حيث تم اختبار الكود بمفاتيح تجريبية وعمل بنجاح 100%. 
    
    تحليل النظام يُظهر أن الكود يحتوي على منطق الربط الصحيح، ولكن هناك خطأ في إعدادات ملف البيئة (.env) على خادم العميل.`,
    evidence: ['payment_logs.txt', 'env_config_screenshot.png', 'chat_history.pdf'],
    history: [
      { date: '25 أبريل 2026', event: 'بدء العمل على المهمة' },
      { date: '29 أبريل 2026', event: 'عمر العلي قام بتسليم الكود' },
      { date: '30 أبريل 2026', event: 'أحمد خالد أبلغ عن فشل الدفع في الإنتاج' },
      { date: '1 مايو 2026', event: 'فُتح النزاع للتحكيم اللامركزي' },
    ],
  },
  'KF-2847': {
    title: 'نزاع تصميم واجهات — مشروع E-commerce',
    category: 'UI/UX Design',
    amount: 600,
    hoursLeft: 38,
    requester: 'Layla M. (عميل)',
    respondent: 'Sara A. (مصممة)',
    filedDate: '13 يونيو 2026',
    aiSummary: `رفعت المشتكية "Layla M." هذا النزاع في 13 يونيو 2026 بخصوص المرحلة الثانية من مشروع "E-commerce App". تدّعي المشتكية أن الشاشة الثالثة كانت غائبة من ملف Figma المُسلَّم، رغم أنها مدرجة صراحةً في متطلبات المرحلة.

تؤكد المدعى عليها "Sara A." أن الشاشة الثالثة كانت موجودة في رابط Figma المشارك في 11 يونيو، وتعزو الإشكالية إلى خطأ في صلاحيات رابط المشاركة.

لا يوجد تاريخ مراسلات يُثبت أن العميلة أبلغت المصممة بالمشكلة قبل فتح النزاع. تم تسليم الملفين الآخرين (الشاشة 1 و2) بشكل مقبول وفق التسجيلات.`,
    evidence: ['figma_link.txt', 'screenshot_dispute.png', 'chat_log_export.pdf'],
    history: [
      { date: '1 يونيو 2026', event: 'تم قبول متطلبات المرحلة 2 من الطرفين' },
      { date: '11 يونيو 2026، 14:22', event: 'Sara A. قدّمنت التسليم عبر رابط Figma' },
      { date: '12 يونيو 2026', event: 'العميلة راجعت الملفات' },
      { date: '13 يونيو 2026، 09:10', event: 'فُتح النزاع من قِبَل Layla M.' },
    ],
  },
  'KF-2901': {
    title: 'نزاع تطوير خلفي — مشروع SaaS',
    category: 'Backend Development',
    amount: 1200,
    hoursLeft: 11,
    requester: 'Ahmed K. (عميل)',
    respondent: 'Omar (مطور)',
    filedDate: '30 أبريل 2026',
    aiSummary: `رفع المشتكي "Ahmed K." نزاعاً بشأن المرحلة الأولى من مشروع SaaS، مدّعياً أن الـ API المسلّمة لا تتوافق مع المواصفات المتفق عليها. يؤكد المدعى عليه "Omar T." أنه سلّم وفق المواصفات الأصلية وأن التغييرات طُلبت لاحقاً خارج النطاق المتفق عليه.`,
    evidence: ['api_docs.pdf', 'original_spec.docx'],
    history: [
      { date: '15 أبريل 2026', event: 'تم الاتفاق على مواصفات الـ API' },
      { date: '28 أبريل 2026', event: 'Omar T. سلّم الـ API' },
      { date: '29 أبريل 2026', event: 'Ahmed K. طلب تغييرات إضافية' },
      { date: '30 أبريل 2026', event: 'فُتح النزاع' },
    ],
  },
};

type VoteChoice = 'requester' | 'respondent' | 'partial' | null;

export default function ArbitratorCaseView() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [vote, setVote] = useState<VoteChoice>(null);
  const [partialPct, setPartialPct] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : { role: 'guest', name: 'Guest', id: '0' };

  const c = caseId ? MOCK_CASES[caseId] : null;
  if (!c) return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <p className="text-gray-400 font-bold text-xl">قضية غير موجودة</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-[#C9A84C] font-bold underline">العودة</button>
    </div>
  );

  const urgent = c.hoursLeft <= 12;
  const pct = ((48 - c.hoursLeft) / 48) * 100;

  // Conflict of interest check
  const isUserInvolved = c.requester.includes(currentUser.name) || c.respondent.includes(currentUser.name);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in" dir="rtl">
        <div className="w-20 h-20 rounded-full bg-[#0D1B2A] flex items-center justify-center mx-auto mb-6">
          <Gavel size={36} className="text-[#C9A84C]" />
        </div>
        <h2 className="text-3xl font-black text-[#0D1B2A] mb-3">تم تسجيل صوتك</h2>
        <p className="text-gray-500 font-medium mb-2">
          {vote === 'requester' && 'صوّتت لصالح المشتكي — Layla M.'}
          {vote === 'respondent' && 'صوّتت لصالح المدعى عليه — Sara A.'}
          {vote === 'partial' && `صوّتت بتقسيم جزئي: المشتكي ${partialPct}% — المدعى عليه ${100 - partialPct}%`}
        </p>
        <p className="text-sm text-gray-400 mb-8">ستُكشف النتيجة بعد تصويت المحكمين الآخرين أو انتهاء المهلة.</p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 inline-block mb-8">
          <p className="text-sm font-black text-emerald-700">مكافأتك: $3.00 · تُصرف بعد صدور الحكم</p>
        </div>
        <br />
        <button onClick={() => navigate('/dashboard/arbitrator')} className="text-[#C9A84C] font-bold underline">
          العودة إلى لوحة التحكيم
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6" dir="rtl">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-[#0D1B2A] font-bold transition-colors">
        <ArrowRight size={18} /> العودة إلى قائمة القضايا
      </button>

      {/* Case Header */}
      <div className="bg-[#0D1B2A] rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-[#C9A84C] rounded-full blur-[100px] opacity-10 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-3 py-1 rounded-full">⚖️ {caseId}</span>
              <span className="text-[10px] font-black text-blue-300 bg-white/5 px-3 py-1 rounded-full">{c.category}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full ${urgent ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-blue-200'}`}>
              <Clock size={12} /> {c.hoursLeft} ساعة متبقية
            </div>
          </div>

          <h1 className="text-xl font-black text-white mb-4">{c.title}</h1>

          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full ${urgent ? 'bg-red-400' : 'bg-[#C9A84C]'}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 p-3 rounded-xl">
              <p className="text-[10px] font-black text-gray-400 mb-1">المشتكي</p>
              <p className="text-sm font-bold text-white">{c.requester}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl text-center">
              <p className="text-[10px] font-black text-gray-400 mb-1">المبلغ</p>
              <p className="text-lg font-black text-[#C9A84C]">${c.amount}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl text-left">
              <p className="text-[10px] font-black text-gray-400 mb-1">المدعى عليه</p>
              <p className="text-sm font-bold text-white">{c.respondent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white border border-[#E8DDD0] rounded-3xl overflow-hidden">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#C9A84C]" />
            </div>
            <div className="text-right">
              <p className="font-black text-[#0D1B2A]">ملخص الذكاء الاصطناعي — محايد</p>
              <p className="text-xs text-gray-400">تم إنشاؤه في {c.filedDate}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A84C]">{showSummary ? 'إخفاء ▲' : 'عرض ▼'}</span>
        </button>
        {showSummary && (
          <div className="px-6 pb-6 border-t border-[#E8DDD0]">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 mt-4">
              <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">هذا الملخص مُنشأ بالكامل بالذكاء الاصطناعي من بيانات المشروع. راجع الأدلة الأصلية باستقلالية تامة.</p>
            </div>
            <p className="text-sm text-gray-700 leading-loose whitespace-pre-line">{c.aiSummary}</p>
          </div>
        )}
      </div>

      {/* Evidence */}
      <div className="bg-white border border-[#E8DDD0] rounded-3xl p-6">
        <h3 className="font-black text-[#0D1B2A] mb-4 flex items-center gap-2">
          <FileText size={18} className="text-[#C9A84C]" /> الأدلة المُقدَّمة
        </h3>
        <div className="flex flex-wrap gap-3">
          {c.evidence.map(f => (
            <div key={f} className="flex items-center gap-2 bg-gray-50 border border-[#E8DDD0] px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:border-[#C9A84C]/40 transition-colors cursor-pointer">
              <FileText size={14} className="text-[#C9A84C]" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Project History */}
      <div className="bg-white border border-[#E8DDD0] rounded-3xl p-6">
        <h3 className="font-black text-[#0D1B2A] mb-4 flex items-center gap-2">
          <Clock size={18} className="text-[#C9A84C]" /> تاريخ المشروع
        </h3>
        <div className="space-y-3 relative">
          <div className="absolute right-[7px] top-2 bottom-2 w-0.5 bg-[#E8DDD0]" />
          {c.history.map((h, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div className="w-3.5 h-3.5 rounded-full bg-[#C9A84C] border-2 border-white shadow shrink-0 mt-1 relative z-10" />
              <div>
                <p className="text-xs text-gray-400 font-bold">{h.date}</p>
                <p className="text-sm font-medium text-[#0D1B2A]">{h.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vote Interface / Role Block / Conflict of Interest Block */}
      {currentUser.role === 'client' ? (
        <div className="bg-gray-50 border-2 border-[#E8DDD0] rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale size={32} className="text-gray-500" />
          </div>
          <h3 className="font-black text-[#0D1B2A] text-xl mb-2">صلاحية محظورة</h3>
          <p className="text-sm font-bold text-gray-500 leading-relaxed max-w-lg mx-auto">
            وفقاً لسياسة كفيل، العملاء لا يمكنهم المشاركة كأعضاء تحكيم في النزاعات. <br/>
            يقتصر حق التصويت والتحكيم على المستقلين والمنسقين لضمان تقييم تقني ومهني محايد. يمكنك فقط متابعة تفاصيل القضية.
          </p>
        </div>
      ) : isUserInvolved ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h3 className="font-black text-red-900 text-xl mb-2">تضارب مصالح (Conflict of Interest)</h3>
          <p className="text-sm font-bold text-red-700 leading-relaxed max-w-lg mx-auto">
            عذراً، لا يمكنك التحكيم أو التصويت في نزاع أنت طرف فيه (مشتكي أو مدعى عليه). <br/> 
            نظام كفيل يضمن الحيادية التامة من خلال منع أطراف المشروع من التأثير على القرار. يمكنك فقط التحكيم في نزاعات المشاريع الأخرى.
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#0D1B2A] rounded-3xl p-6">
          <h3 className="font-black text-[#0D1B2A] text-lg mb-2 flex items-center gap-2">
            <Scale size={20} className="text-[#C9A84C]" /> تصويتك — سري ومستقل
          </h3>
          <p className="text-xs text-gray-400 font-medium mb-6">لا يمكنك رؤية أصوات المحكمين الآخرين. قرارك نهائي عند الإرسال.</p>

          <div className="space-y-3 mb-6">
            {/* Option 1 */}
            <button
              onClick={() => setVote('requester')}
              className={`w-full p-4 rounded-2xl border-2 text-right transition-all ${vote === 'requester' ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#E8DDD0] hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${vote === 'requester' ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-gray-300'}`}>
                  {vote === 'requester' && <CheckCircle size={12} className="text-white" fill="white" />}
                </div>
                <div>
                  <p className="font-black text-sm text-[#0D1B2A]">الحكم لصالح المشتكي — إفراج كامل ({c.requester.split(' ')[0]})</p>
                  <p className="text-xs text-gray-400">سيحصل المشتكي على المبلغ كاملاً ${c.amount}</p>
                </div>
              </div>
            </button>

            {/* Option 2 */}
            <button
              onClick={() => setVote('respondent')}
              className={`w-full p-4 rounded-2xl border-2 text-right transition-all ${vote === 'respondent' ? 'border-[#1A7F74] bg-[#1A7F74]/5' : 'border-[#E8DDD0] hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${vote === 'respondent' ? 'border-[#1A7F74] bg-[#1A7F74]' : 'border-gray-300'}`}>
                  {vote === 'respondent' && <CheckCircle size={12} className="text-white" fill="white" />}
                </div>
                <div>
                  <p className="font-black text-sm text-[#0D1B2A]">الحكم لصالح المدعى عليه — اعتماد الدفع ({c.respondent.split(' ')[0]})</p>
                  <p className="text-xs text-gray-400">سيُصرف المبلغ للمدعى عليه كاملاً</p>
                </div>
              </div>
            </button>

            {/* Option 3 — Partial */}
            <button
              onClick={() => setVote('partial')}
              className={`w-full p-4 rounded-2xl border-2 text-right transition-all ${vote === 'partial' ? 'border-blue-400 bg-blue-50/50' : 'border-[#E8DDD0] hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${vote === 'partial' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {vote === 'partial' && <CheckCircle size={12} className="text-white" fill="white" />}
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm text-[#0D1B2A]">تقسيم جزئي</p>
                  <p className="text-xs text-gray-400 mb-3">حدد النسبة التي يحصل عليها المشتكي</p>
                  {vote === 'partial' && (
                    <div onClick={e => e.stopPropagation()} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-24">المشتكي: {partialPct}%</span>
                        <input
                          type="range" min={10} max={90} step={5}
                          value={partialPct}
                          onChange={e => setPartialPct(Number(e.target.value))}
                          className="flex-1 accent-[#C9A84C]"
                        />
                        <span className="text-xs font-bold text-gray-500 w-32 text-left">المدعى عليه: {100 - partialPct}%</span>
                      </div>
                      <div className="flex gap-2 text-xs font-black">
                        <span className="bg-[#C9A84C]/10 text-[#C9A84C] px-3 py-1 rounded-full">
                          للمشتكي: ${Math.round(c.amount * partialPct / 100)}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                          للمدعى عليه: ${Math.round(c.amount * (100 - partialPct) / 100)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">قرارك نهائي ولا يمكن التراجع عنه. أصوات المحكمين تُكشف فقط بعد انتهاء التصويت.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(-1)}
              className="py-3.5 rounded-xl border border-[#E8DDD0] text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              حفظ لاحقاً
            </button>
            <button
              disabled={!vote}
              onClick={() => setSubmitted(true)}
              className="py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#0D1B2A', boxShadow: vote ? '0 4px 16px rgba(13,27,42,0.3)' : 'none' }}
            >
              <Gavel size={16} /> إرسال تصويتي
            </button>
          </div>
        </div>
      )}

      {/* Reward note - Only show if not a client and not involved */}
      {currentUser.role !== 'client' && !isUserInvolved && (
        <div className="flex items-center gap-3 bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-2xl p-4">
          <User size={16} className="text-[#C9A84C] shrink-0" />
          <p className="text-xs font-medium text-gray-600">
            مكافأتك: <span className="font-black text-[#0D1B2A]">$3.00</span> · تُصرف تلقائياً بعد صدور حكم الأغلبية
          </p>
        </div>
      )}

    </div>
  );
}
