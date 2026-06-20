import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileCheck2, 
  HelpCircle, 
  Bookmark, 
  ShieldCheck, 
  UserCheck2,
  ArrowRight,
  Flame,
  FileText,
  CheckCircle,
  TrendingUp,
  Cpu,
  Printer,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  MousePointerClick,
  Lock,
  ChevronDown,
  Check
} from 'lucide-react';
import { CareerPortfolio, QuestionId } from './types';
import SidebarStatus from './components/SidebarStatus';
import ConsultingChat from './components/ConsultingChat';
import PortfolioViewer from './components/PortfolioViewer';
import SloganSelector from './components/SloganSelector';
import { validateGeminiKey } from './utils/geminiClient';

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'builder'>('landing');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState<boolean>(() => !!localStorage.getItem('gemini_api_key'));

  // Silently check pre-existing API Key validity on mount
  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      validateGeminiKey(stored)
        .then((isValid) => {
          if (isValid) {
            setIsValidated(true);
            setApiKey(stored.trim());
            setTempApiKey(stored.trim());
          } else {
            setIsValidated(false);
            setApiKey('');
            localStorage.removeItem('gemini_api_key');
          }
        })
        .catch(() => {
          // Fallback to true if network error happens on startup to prevent blocking offline users
          setIsValidated(true);
          setApiKey(stored.trim());
          setTempApiKey(stored.trim());
        });
    }
  }, []);

  // Save or validate API Keys
  const handleSaveAndStart = async () => {
    const trimmed = tempApiKey.trim();
    if (!trimmed) {
      alert("입력값이 비어 있습니다. API 키를 발급받아 입력해주세요.");
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const isValid = await validateGeminiKey(trimmed);
      if (!isValid) {
        throw new Error("유효하지 않은 API Key입니다.");
      }

      setApiKey(trimmed);
      localStorage.setItem('gemini_api_key', trimmed);
      setIsValidated(true);
      setIsValidating(false);
      
      alert("🎉 Gemini API Key 승인 완료!\n유효한 Key로 공식 인증되었습니다. 이제 실시간 빌더 서비스가 전면 활성화됩니다!");
      setViewMode('builder');
    } catch (err: any) {
      setIsValidating(false);
      setIsValidated(false);
      const msg = err.message || "유효성 검사를 통과하지 못했습니다.";
      setValidationError(msg);
      alert(`❌ API Key 승인 실패:\n${msg}`);
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    setTempApiKey('');
    setIsValidated(false);
    setValidationError(null);
    localStorage.removeItem('gemini_api_key');
    alert("저장된 API Key가 안전하게 삭제되었습니다. 이제 빌더 서비스를 이용하려면 새로운 키의 승인이 필요합니다.");
    setViewMode('landing');
  };

  // Switch to builder with active validation guard
  const handleSwitchToBuilder = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!isValidated) {
      alert("🔒 실시간 빌더를 사용하시려면 먼저 화면 하단의 '무료 Gemini API Key'를 등록 및 승인해 주셔야 합니다.");
      const element = document.getElementById("api-key-box");
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // briefly highlight the box
        element.classList.add('ring-4', 'ring-brand-teal', 'scale-[1.01]');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-brand-teal', 'scale-[1.01]');
        }, 1500);
        
        const input = document.getElementById("api-key-input");
        if (input) {
          (input as HTMLInputElement).focus();
        }
      }
      return;
    }
    setViewMode('builder');
  };

  // Primary structured state for career portfolio
  const [portfolio, setPortfolio] = useState<CareerPortfolio>({
    slogan: '',
    name: '이민수', // Default placeholder name matching typical output samples
    totalExperience: '',
    companyName: '',
    jobTitle: '',
    employmentPeriod: '',
    activeFields: [],
    activeFieldsCustom: '',
    cases: [], // Starts with zero cases, created dynamically when Q6/upload occurs
    swot: {
      strength: '',
      weakness: '',
      opportunity: '',
      threat: ''
    },
    certifications: [],
    tools: []
  });

  const [currentQId, setCurrentQId] = useState<QuestionId>('Q1');

  // Callback to update any subfield of the portfolio
  const handleUpdatePortfolio = (updater: (prev: CareerPortfolio) => CareerPortfolio) => {
    setPortfolio(prev => updater(prev));
  };

  const handleSelectSlogan = (slogan: string) => {
    setPortfolio(prev => ({ ...prev, slogan }));
  };

  const handleJumpToQuestion = (qId: QuestionId) => {
    setCurrentQId(qId);
  };

  const startConsulting = () => {
    setViewMode('builder');
  };

  return (
    <div className="min-h-screen bg-brand-beige flex flex-col font-sans text-brand-navy antialiased selection:bg-brand-sky selection:text-brand-navy">
      
      {/* Upper Navigation Bar */}
      <header className="bg-white border-b border-brand-navy/20 py-4 px-4 md:px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-navy rounded-none flex items-center justify-center text-white border border-brand-navy shrink-0">
              <FileCheck2 className="w-5.5 h-5.5 text-brand-sky" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm md:text-base text-brand-navy tracking-tight flex items-center gap-2">
                <span>직업상담사 커리어 포트폴리오 생성기</span>
                <span className="text-[9px] bg-brand-teal text-white font-black px-1.8 py-0.5 rounded-none uppercase tracking-widest border border-brand-teal">
                  HRM PRO v1.0
                </span>
              </h1>
              <p className="text-[10.5px] text-brand-teal/80 font-bold tracking-tight">성과 중심(STAR/GROW) 의 역량 기술식 포트폴리오 메이커</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-brand-beige p-1 rounded-none border border-brand-teal/20">
            <button
              onClick={() => setViewMode('landing')}
              className={`px-4 py-2 text-xs font-bold transition-all rounded-none cursor-pointer ${
                viewMode === 'landing' 
                  ? 'bg-brand-navy text-white font-bold' 
                  : 'text-brand-navy/75 hover:text-brand-navy hover:bg-white/50'
              }`}
            >
              서비스 소개 & 특장점
            </button>
            <button
              onClick={handleSwitchToBuilder}
              className={`px-4 py-2 text-xs font-bold transition-all rounded-none cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'builder' 
                  ? 'bg-brand-navy text-white font-bold' 
                  : 'text-brand-navy/75 hover:text-brand-navy hover:bg-white/50'
              }`}
            >
              <span>실시간 빌더</span>
              <span className="w-2 h-2 rounded-full bg-brand-teal inline-block animate-pulse"></span>
            </button>
          </div>

          {/* Guidelines info bar */}
          <div className="hidden xl:flex items-center gap-5 text-xs text-brand-navy font-bold">
            <div className="flex items-center gap-1.5 bg-brand-sky/40 border border-brand-teal/25 px-2.5 py-1 rounded-none text-[11px]">
              <UserCheck2 className="w-3.5 h-3.5 text-brand-navy" />
              <span>100% 검증 원본대응</span>
            </div>
            <div className="flex items-center gap-1.5 bg-brand-sky/40 border border-brand-teal/25 px-2.5 py-1 rounded-none text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-navy" />
              <span>서버 보안 (No Key leaks)</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area: Landing Page VS Live Builder */}
      {viewMode === 'landing' ? (
        <div className="flex-1 bg-white">
          
          {/* Hero Section */}
          <section className="bg-brand-beige border-b border-brand-navy/15 py-16 md:py-24 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              
              <div className="inline-flex items-center gap-2 bg-brand-navy text-white px-4 py-1.5 rounded-none text-xs font-bold tracking-widest uppercase border border-brand-navy">
                <Flame className="w-4 h-4 text-brand-sky" />
                <span>직업상담사 맞춤형 포트폴리오 메이커</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black text-brand-navy tracking-tight leading-[1.3] md:leading-[1.25]">
                단순한 입사지원서를 입체적으로 시각화해주는 <br />
                <span className="relative inline-block px-3 my-1.5 bg-brand-navy text-white font-extrabold border border-brand-navy">
                  직업상담사 포트폴리오가 완성됩니다.
                </span>
              </h2>
              
              <p className="text-brand-navy/80 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-bold">
                단순한 입사지원서를 넘어, 포트폴리오로 직업상담사로서의 가치를 증명하세요. <br />
                핵심역량과 성과(KPI·KBI)를 기반으로 주요 활동을 체계적으로 정리하여 나만의 커리어맵을 설계해보세요.
              </p>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-5">
                <button
                  onClick={handleSwitchToBuilder}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4.5 text-sm font-bold text-white bg-brand-navy hover:bg-brand-teal rounded-none border border-brand-navy shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>나만의 스마트 포트폴리오 빌드 시작</span>
                  <ArrowRight className="w-4.5 h-4.5 text-brand-sky" />
                </button>
                <button
                  onClick={() => {
                    if (!isValidated) {
                      alert("🔒 데모 예시를 불러오기 전에 화면 하단의 'Gemini API Key'를 등록 및 승인해 주셔야 합니다.");
                      const element = document.getElementById("api-key-box");
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // briefly highlight the box
                        element.classList.add('ring-4', 'ring-brand-teal', 'scale-[1.01]');
                        setTimeout(() => {
                          element.classList.remove('ring-4', 'ring-brand-teal', 'scale-[1.01]');
                        }, 1500);
                        
                        const input = document.getElementById("api-key-input");
                        if (input) (input as HTMLInputElement).focus();
                      }
                      return;
                    }
                    // Pre-fill mock data for trial
                    setPortfolio({
                      slogan: "심층 상담부터 맞춤 매칭까지, 구직자와 함께 성공적인 취업 경로를 만드는 직업상담 전문가",
                      name: "이민수",
                      totalExperience: "3년 6개월",
                      companyName: "마포여성인력개발센터",
                      jobTitle: "선임 취업컨설턴트",
                      employmentPeriod: "2024.01 ~ 2025.12",
                      activeFields: ["이력서·자소서 컨설팅", "면접 컨설팅", "직업선호도검사·강점분석"],
                      cases: [
                        {
                          id: "case-demo",
                          title: "경력 단절 5년차 사무행정직 구직자 실전 이력서 첨삭 및 매칭 사례",
                          period: "2025.04.10 ~ 2025.05.20",
                          target: "만 48세 여성 경력단절 구직자 (이전 은행 창구 행정직 10년 근무)",
                          role: "대상자의 강점을 분해하여 일반 경리 및 회계 보조 직무로 재정립, 맞춤 채용 정보 12건 직접 발굴 및 연계",
                          kpi: "3개사 서류 지원 및 합격 후, 연매출 200억 제조기업 자금회계 부서 채용 최종 완료.",
                          isKpiEstimated: false,
                          kbi: "대상자의 극도 연령 위축 치유 목적 1:1 대인 미팅 4회 진행. 은행 정산 업무 내용을 회계 신뢰도로 서술 유도.",
                          frameworkSelected: 'STAR',
                          narrativeResult: {
                            situationOrGoal: "만 48세 구직자는 경단 5년으로 이력서 자격 미달 선입견이 팽팽했고 전직에 대한 극심한 소외감과 공포를 느끼고 있었습니다.",
                            taskOrReality: "은행 창구 10년 수기 행정력을 발굴하여 일반 중소기업의 장부 신뢰도로 번역하고, 기업 12곳을 직접 개입하여 면접 매칭을 구현하는 데 초점을 맞추었습니다.",
                            actionOrOptions: "이력서 첫째 칸에 나이라는 키워드 대신 '자산 정산 기명 10년 차 공신력'을 표기. 1:1 자존감 미팅을 4회 설계하여 전직 동기부여를 다졌습니다.",
                            resultOrWill: "최종적으로 탄탄한 200억 규모 파트너 기업에 당당히 서류를 합격시켰고 장기근무자로 채용이 조기 안착되는 성과를 거두었습니다.",
                            insight: "강점 재정립은 구직 장벽을 이기는 우수 칼날임을 확인했습니다.",
                            fullText: ""
                          }
                        }
                      ],
                      swot: {
                        strength: "상담 타겟별 이전 직무 특성을 정확히 분석하여 고품질 채용정보를 선별 발굴하고, 1:1로 빈틈없는 이력 매칭을 설계할 수 있는 강점 실무력을 보유하고 있습니다.",
                        weakness: "질적 상담 심취 시 가동 행정이 지연될 수 있었으나, 이를 전격 보완하기 위해 마인드 제어 훈련 및 주기적인 행정 서식 표준화 템플릿 실천으로 극복하고 있습니다.",
                        opportunity: "정부의 중장년 이상 신설 지원 정책 및 기업의 중장년 대체 인력 선호 흐름이 강화되면서, 맞춤 가치관 설계가 우수한 상담사의 실무적 전문성이 한층 더 높게 평가받고 있습니다.",
                        threat: "AI 상담 서비스 툴 보급 및 경쟁 심화가 있으나, 감정적 공감 모니터링을 더한 고차원 1:1 대인 컨설팅과 정량적 피드백 프로세스로 초개인화 서비스를 강화하여 대응합니다."
                      },
                      certifications: ["직업상담사 2급", "사회복지사 2급", "행정실무사"],
                      tools: ["Excel", "PowerPoint", "ChatGPT AI Tool"]
                    });
                    setViewMode('builder');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4.5 text-sm font-bold text-brand-navy bg-white hover:bg-brand-beige border border-brand-navy/30 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <span>3초만에 완벽 예시 체험하기</span>
                  <MousePointerClick className="w-4.5 h-4.5 text-brand-navy" />
                </button>
              </div>

              {/* Gemini API Key Box (Unified sleek corporate brochure style) */}
              <div id="api-key-box" className="max-w-xl mx-auto mt-12 bg-white border border-brand-navy/20 p-6 shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                  <p className="font-bold text-brand-navy text-xs sm:text-sm tracking-tight text-left">
                    무료로 시작하세요. Gemini API 키만 있으면 됩니다.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </span>
                    <input 
                      id="api-key-input"
                      type="password" 
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isValidating) {
                          handleSaveAndStart();
                        }
                      }}
                      disabled={isValidating}
                      placeholder="Gemini API Key 입력"
                      className="w-full pl-9 pr-3 py-3 border border-brand-navy/25 rounded-none font-mono text-xs focus:outline-none focus:ring-1 focus:border-brand-teal bg-white text-brand-navy font-bold placeholder-slate-400 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                  <button 
                    onClick={handleSaveAndStart}
                    disabled={isValidating}
                    className="px-6 py-3 bg-brand-navy hover:bg-brand-teal text-white font-bold text-xs border border-brand-navy shadow-sm hover:shadow-md transition-all cursor-pointer rounded-none active:translate-y-0.5 shrink-0 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {isValidating ? "검증 진행 중..." : "시작하기"}
                  </button>
                </div>

                {validationError && (
                  <div className="mt-3.5 py-2.5 px-3.5 bg-rose-50 border border-rose-200 text-rose-950 font-bold text-xs text-left leading-relaxed shadow-sm">
                    <p className="flex items-start gap-1.5 font-bold">
                      <span className="shrink-0 text-rose-600 font-extrabold">🚨 [인증 실패]</span>
                      <span>{validationError}</span>
                    </p>
                  </div>
                )}

                {apiKey && isValidated && (
                  <div className="mt-3.5 py-2 px-3 bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-850 font-bold text-left">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>개인 API Key가 성공적으로 인증 완료되었습니다.</span>
                    </span>
                    <button 
                      onClick={handleClearKey}
                      className="text-slate-500 hover:text-red-600 underline font-bold cursor-pointer text-[10px]"
                    >
                      등록 해제
                    </button>
                  </div>
                )}

                {/* Accordion dropdown for guide */}
                <div className="mt-4 border border-brand-navy/20 bg-white shadow-sm">
                  <button 
                    type="button"
                    onClick={() => setIsGuideOpen(!isGuideOpen)}
                    className="w-full px-4.5 py-3.5 bg-brand-beige hover:bg-brand-beige/80 flex items-center justify-between font-bold text-xs text-brand-navy border-b border-brand-navy/20 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-brand-navy" />
                      <span>Gemini API Key 발급 가이드</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${isGuideOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isGuideOpen && (
                    <div className="p-4 sm:p-5 text-left text-xs text-slate-700 leading-relaxed font-bold space-y-4">
                      <div className="space-y-3.5">
                        <div className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 bg-brand-navy text-white rounded-none flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">1</span>
                          <div>
                            <strong className="text-brand-navy text-xs font-bold">Google AI Studio 접속</strong>
                            <p className="text-slate-500 text-[10.5px] mt-0.5 font-bold leading-normal">
                              아래 링크를 클릭하여 Google AI Studio에 접속하세요.<br />
                              <a 
                                href="https://aistudio.google.com/apikey" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-brand-teal underline hover:text-brand-navy truncate inline-block max-w-full font-mono mt-0.5"
                              >
                                https://aistudio.google.com/apikey
                              </a>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 bg-brand-navy text-white rounded-none flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">2</span>
                          <div>
                            <strong className="text-brand-navy text-xs font-bold">Google 계정으로 로그인</strong>
                            <p className="text-slate-500 text-[10.5px] mt-0.5 font-bold">Gmail 계정으로 로그인하세요. 계정이 없으면 무료로 만들 수 있어요.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 bg-brand-navy text-white rounded-none flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">3</span>
                          <div>
                            <strong className="text-brand-navy text-xs font-bold">'API 키 만들기' 클릭</strong>
                            <p className="text-slate-500 text-[10.5px] mt-0.5 font-bold">화면에서 'Create API Key' 또는 'API 키 만들기' 버튼을 클릭하세요.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 bg-brand-navy text-white rounded-none flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">4</span>
                          <div>
                            <strong className="text-brand-navy text-xs font-bold">프로젝트 선택 후 생성</strong>
                            <p className="text-slate-500 text-[10.5px] mt-0.5 font-bold">기본 프로젝트를 선택하고 'Create API key in existing project'를 클릭하세요.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 bg-brand-navy text-white rounded-none flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">5</span>
                          <div>
                            <strong className="text-brand-navy text-xs font-bold">API 키 복사</strong>
                            <p className="text-slate-500 text-[10.5px] mt-0.5 font-bold">생성된 API 키(AIza로 시작)를 복사하세요. 이 키를 입력창에 붙여넣기하면 됩니다!</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200">
                        <a 
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="w-full h-11 flex items-center justify-center gap-2 px-5 py-3 bg-brand-teal hover:bg-brand-navy text-white font-bold border border-brand-teal shadow-sm transition-all cursor-pointer text-center text-xs"
                        >
                          <span>🔑 API 키 발급 페이지로 이동</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* Core Strengths (Bento Grid Style) */}
          <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto space-y-16">
            
            <div className="text-center space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-white bg-brand-navy px-3.5 py-1.5 border border-brand-navy inline-block tracking-widest font-mono">핵심 기능</h3>
              <p className="text-2xl md:text-3xl font-black text-brand-navy tracking-tight">직업상담사 경력 구성에 맞춰 설계했습니다</p>
              <p className="text-sm text-brand-teal max-w-xl mx-auto leading-relaxed font-bold">
                일반적인 대화형 AI나 템플릿과 달리, 직업상담사 직무와 자격 요건에 맞춰 구성했습니다.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-none border border-brand-navy/15 hover:border-brand-navy/35 transition-all shadow-md hover:shadow-lg space-y-5">
                <div className="w-12 h-12 rounded-none bg-brand-navy flex items-center justify-center text-brand-sky border border-brand-navy shadow-sm">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-lg text-brand-navy">
                    <span className="text-white bg-brand-teal font-mono text-xs px-2 py-0.5 border border-brand-teal font-extrabold">[01]</span>
                    <h4>STAR / GROW 구조로 성과 서술</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                    경험을 단순히 나열하지 않고, 구체적인 행동(KBI)과 실제 수치(KPI)를 STAR 또는 GROW 구조로 풀어냅니다.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 rounded-none border border-brand-navy/15 hover:border-brand-navy/35 transition-all shadow-md hover:shadow-lg space-y-5">
                <div className="w-12 h-12 rounded-none bg-brand-navy flex items-center justify-center text-brand-sky border border-brand-navy shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-lg text-brand-navy">
                    <span className="text-white bg-brand-teal font-mono text-xs px-2 py-0.5 border border-brand-teal font-extrabold">[02]</span>
                    <h4>증빙 자료 자동 인식</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                    빈 칸부터 채우지 않아도 됩니다. 상담일지, 보고서, 업무분장표 등을 업로드하면 필요한 정보를 자동으로 찾아 채웁니다.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-none border border-brand-navy/15 hover:border-brand-navy/35 transition-all shadow-md hover:shadow-lg space-y-5">
                <div className="w-12 h-12 rounded-none bg-brand-navy flex items-center justify-center text-brand-sky border border-brand-navy shadow-sm">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-lg text-brand-navy">
                    <span className="text-white bg-brand-teal font-mono text-xs px-2 py-0.5 border border-brand-teal font-extrabold">[03]</span>
                    <h4>추측 정보 방지</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                    실제 경력과 다른 내용을 임의로 만들지 않습니다. 수치가 불명확한 부분은 빈칸으로 남기고 질문으로 확인해, 사실에 기반한 내용만 담습니다.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-8 rounded-none border border-brand-navy/15 hover:border-brand-navy/35 transition-all shadow-md hover:shadow-lg space-y-5">
                <div className="w-12 h-12 rounded-none bg-brand-navy flex items-center justify-center text-brand-sky border border-brand-navy shadow-sm">
                  <Printer className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-lg text-brand-navy">
                    <span className="text-white bg-brand-teal font-mono text-xs px-2 py-0.5 border border-brand-teal font-extrabold">[04]</span>
                    <h4>A4 보고서 형식 출력</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                    완성된 내용을 A4 문서로 바로 확인하거나 PDF로 저장할 수 있습니다.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Quick CTA banner */}
          <section className="bg-brand-navy text-white py-16 px-6 border-b border-brand-navy/15">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-left">
                <h4 className="text-xl md:text-2xl font-black">경력을 풀어낼 시간입니다</h4>
                <p className="text-xs md:text-sm text-brand-sky space-y-1 font-bold leading-relaxed">
                  간단한 질문에 답하는 것만으로, 본인의 경력을 체계적인 포트폴리오로 완성할 수 있습니다.
                </p>
              </div>
              <button
                onClick={handleSwitchToBuilder}
                className="w-full md:w-auto shrink-0 bg-brand-teal hover:bg-white hover:text-brand-navy text-white font-bold px-6 py-4 rounded-none border border-brand-teal transition-all cursor-pointer flex items-center justify-center gap-2 text-xs shadow-md"
              >
                <span>포트폴리오 작성 시작</span>
                <ChevronRight className="w-4 h-4 text-white hover:text-brand-navy stroke-[3]" />
              </button>
            </div>
          </section>

        </div>
      ) : (
        /* Live Workspace Builder Mode */
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (Questionnaire Progress & Chat Interactions) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Status Checklist / Indicator */}
              <SidebarStatus 
                portfolio={portfolio} 
                currentQId={currentQId} 
                onJumpToQuestion={handleJumpToQuestion}
              />

              {/* Consulting Chat Bot Panel */}
              <ConsultingChat 
                portfolio={portfolio}
                onUpdatePortfolio={handleUpdatePortfolio}
                currentQId={currentQId}
                onChangeQId={setCurrentQId}
                apiKey={apiKey}
              />

              {/* Dynamic Slogan refinement (Shows near complete or ready) */}
              <SloganSelector 
                currentSlogan={portfolio.slogan} 
                onSelectSlogan={handleSelectSlogan}
              />

            </div>

            {/* Right Column (High-fidelity real-time preview of the Document) */}
            <div className="lg:col-span-8 h-full">
              <PortfolioViewer 
                portfolio={portfolio} 
                onSelectSlogan={handleSelectSlogan}
              />
            </div>

          </div>
        </main>
      )}

      {/* Footer disclaimer */}
      <footer className="bg-white border-t-2 border-slate-950 py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-extrabold text-slate-950">© 2026 직업상담사 커리어 포트폴리오 생성 컨설팅 (HRM PRO). All rights reserved.</p>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-xl mx-auto font-bold">
            ※ 원본 추출 정보가 불확실할 경우 인공지능이 임의로 추측 수치를 지어내지 않고 공란 처리 후 보완 문답을 제안합니다.
            오른쪽 우수 사례와 자격, SWOT 구조를 바탕으로 나만의 실무 역량 포트폴리오를 세련되게 완성해 보십시오.
          </p>
        </div>
      </footer>

    </div>
  );
}
