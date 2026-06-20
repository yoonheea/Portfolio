import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Upload, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  HelpCircle,
  FileCheck2,
  ChevronRight,
  Plus
} from 'lucide-react';
import { CareerPortfolio, CaseStudy, ChatMessage, QuestionId, ExtractionResult } from '../types';
import {
  recommendFramework,
  generateNarrativeCase,
  generateSwot,
  generatePortfolioSlogans,
  analyzeFileContent
} from '../utils/geminiClient';

interface ConsultingChatProps {
  portfolio: CareerPortfolio;
  onUpdatePortfolio: (updater: (prev: CareerPortfolio) => CareerPortfolio) => void;
  currentQId: QuestionId;
  onChangeQId: (qId: QuestionId) => void;
  apiKey?: string;
}

// Prefilled File Simulations for Reviewer
const FILE_SAMPLES = [
  {
    title: "PDF 업로드",
    fileName: "2025_career_award_report.pdf",
    textContent: `
[2025년 여성가족부 지정 중장년 여성 취업 연계 성과 우수사례 보고서]
상담사명: 이민수 
소속기관: 마포여성인력개발센터 (선임 취업컨설턴트)
재직기간: 2024.01 ~ 2025.12 (24개월)
보유자격: 직업상담사 2급, 직무코칭 기술지도사

■ 핵심 우수 사례 개요
- 사례명: 경력 단절 5년차 사무행정직 구직자 실전 이력서 첨삭 및 매칭 사례
- 상담기간: 2025.04.10 ~ 2025.05.20
- 대상자: 만 48세 여성 경력단절 구직자 (이전 은행 창구 행정직 10년 근무)
- 본인 역할: 대상자의 강점을 분해하여 일반 경리 및 회계 보조 직무로 재정립, 맞춤 채용 정보 12건 직접 발굴 및 연계.
- 정량적 수치 성과 (KPI): 지원한 3개 기업 중 2개사 서류 합격, 최종 1개사(연매출 200억 제조기업) 서류통과 및 채용 완료. 상담 만족도 점수 4.9점 보유 (5점 만점)
- 핵심 개입 태도 (KBI): 대상자가 나이에 대해 심한 열등감과 위축을 느끼자, 주기별 자존감 복원 대면 미팅 4회 진행. 은행 근무 시 일일 정산 업무 이력을 회계 장부 수기 기입 신뢰도로 해석하여 자소서 첫 단락에 직접 서술함.
    `
  },
  {
    title: "PPT 업로드",
    fileName: "hr_counseling_operations_status.pptx",
    textContent: `
[취업지원 집단 상담 프로그램 기획 및 운영 실무 보고]
작성자: 이민수 (주임 상담사)
소속: 중장년일자리희망센터
재직일자: 2023.03 ~ 현재
보유자격: 직업상담사 1급, 컴퓨터활용능력 1급, 전산회계
활용프로그램: MS Office 엑셀, 파워포인트, 한글 워드 프로세서, 노션 AI 작성도구

핵심 수행 내역:
- 취업 이력서 무료 첨삭 및 이미지 메이킹 강의 15회 진행
- 취업 알선 직업 선호도 검사 실시 및 분석 (총 120명 실시)
    `
  },
  {
    title: "직접 작성 텍스트 파일 업로드",
    fileName: "personal_counseling_diary_kbi.txt",
    textContent: `
[취업 희망 카드 발급 구직자 1:1 상담 회기별 일지]
상담기간: 2025.09.02 ~ 2025.09.28
대상: 청년 장기 실직 구직자 (만 27세)
본인 역량 개입 사건: 
- 대학 졸업 후 2년간 무직 상태로 가족 관계 단절 위기.
- 일차적으로 행동 대안(Options) 마련을 위해 구직 활동 계획서 3단계 공동 작성.
- 수치 데이터(KPI)는 취업 알선 1건 진행하여 면접 대기 중으로 정량 숫자는 다소 약함.
- 핵심 과정 행동(KBI): 내담자의 불안 증세를 직접 감지하고, 이력서 단순 대입보다는 심리선호도 분류 체크리스트 및 강점 연마 훈련을 주당 2회씩 선제 개입함. 내담자의 대인 기피 반사 반응이 대면 소통으로 서서히 개선되며 최종적으로 취업 포털 자가 서칭 능력을 자치적으로 회복하기 시작함.
    `
  }
];

export default function ConsultingChat({ 
  portfolio, 
  onUpdatePortfolio, 
  currentQId, 
  onChangeQId,
  apiKey
}: ConsultingChatProps) {
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "안녕하세요. 경력을 STAR·GROW 구조로 풀어내는 포트폴리오 도우미입니다. 단순히 경력을 나열하는 게 아니라, 성과와 직무 역량 중심으로 구성합니다. 먼저, 기존에 작성하신 자료(포트폴리오에 필요한 내용 등)가 있다면 위에서 업로드해 주세요. 파일 내용을 자동으로 찾아 채우겠습니다. 없다면 바로 대화로 시작하겠습니다.",
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  
  // To track case study input states interactively
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  const [caseKbiDeepTriggered, setCaseKbiDeepTriggered] = useState<boolean>(false);
  const [activeSwotField, setActiveSwotField] = useState<'strength' | 'weakness' | 'opportunity' | 'threat'>('strength');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Q-ID changes to prompt the next logical single question
  useEffect(() => {
    if (messages.length <= 1) return; // ignore initial load

    // Only prompt if the last message isn't already from AI prompting us
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'user') {
      promptQuestionForId(currentQId);
    }
  }, [currentQId]);

  // Helper to add a message to the conversation
  const addBotMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Extract Q-IDs from a simulated text data (PDF, PPT)
  const handleAnalyzeText = async (fileName: string, text: string) => {
    setIsAnalyzing(true);
    addBotMessage(`📁 [파일 전송] '${fileName}' 문서를 검토하여 직업상담 전문성 단서를 신속하게 분석하고 있습니다. 잠시만 기다려 주세요...`);

    try {
      const result: ExtractionResult = await analyzeFileContent(fileName, text, apiKey);

      setIsAnalyzing(false);
      setExtractedData(result);

      // Present parsed Q-ID blocks for user confirmation [1-2, 1-3 rules]
      let confirmationText = `🔍 **[¹차 분석 완료]** 업로드하신 파일은 **"${result.identifiedType || '자료문서'}"** 유형으로 감지되었습니다.\n\n수집된 세부 정보(Q-ID 단위)들은 다음과 같습니다.`;
      
      const fd = result.foundData;
      if (fd.totalExperience) confirmationText += `\n- **Q1. 총 경력**: ${fd.totalExperience}`;
      if (fd.companyName) confirmationText += `\n- **Q2. 소속기관**: ${fd.companyName}`;
      if (fd.jobTitle) confirmationText += `\n- **Q3. 직급**: ${fd.jobTitle}`;
      if (fd.employmentPeriod) confirmationText += `\n- **Q4. 재직기간**: ${fd.employmentPeriod}`;
      if (fd.activeFields && fd.activeFields.length > 0) confirmationText += `\n- **Q5. 활동분야**: ${fd.activeFields.join(", ")}`;
      if (fd.certifications && fd.certifications.length > 0) confirmationText += `\n- **Q16. 자격증**: ${fd.certifications.join(", ")}`;
      if (fd.tools && fd.tools.length > 0) confirmationText += `\n- **Q17. 활용툴**: ${fd.tools.join(", ")}`;

      if (result.foundCases && result.foundCases.length > 0) {
        confirmationText += `\n\n💼 **감지된 우수 사례 (1건 파악됨)**:`;
        const fc = result.foundCases[0];
        if (fc.title) confirmationText += `\n- **사례명**: ${fc.title}`;
        if (fc.target) confirmationText += `\n- **대상자**: ${fc.target}`;
        if (fc.role) confirmationText += `\n- **본인역할**: ${fc.role}`;
        if (fc.kpi) confirmationText += `\n- **수치(KPI)**: ${fc.kpi}`;
        if (fc.kbi) confirmationText += `\n- **행동(KBI)**: ${fc.kbi}`;
      }

      confirmationText += `\n\n위 추출된 정보들이 실제 경력 사실과 일치하는지 확인해 주세요. 우측 포트폴리오 양식에 자동으로 반영하려면 아래 **'포트폴리오에 자동 추출본 적용'** 버튼을 눌러주십시오.`;
      
      addBotMessage(confirmationText);

    } catch (err: any) {
      setIsAnalyzing(false);
      addBotMessage(`❌ **[API 호출 실패]**\n${err.message || '요청 처리에 실패했습니다.'}\n\nGoogle 서버 일시 위축이나 일시적인 혼잡(503)일 수 있습니다. 반복 시 서비스 소개 탭에서 본인의 무료 **Gemini API Key**를 발급받아 붙여넣으시면, 대기 시간 없이 평생 쾌적하게 한도 없는 초고속 생성을 즐길 수 있습니다.`);
    }
  };

  // Apply parsed details to portfolio state
  const applyExtractedDataToPortfolio = () => {
    if (!extractedData) return;

    onUpdatePortfolio(prev => {
      const fd = extractedData.foundData;
      const fc = extractedData.foundCases && extractedData.foundCases[0];

      let updatedCases = [...prev.cases];
      if (fc) {
        // Append or replace
        const newCase: CaseStudy = {
          id: `case-${Date.now()}`,
          title: fc.title || '',
          period: fc.period || fd.employmentPeriod || '',
          target: fc.target || '',
          role: fc.role || '',
          kpi: fc.kpi || '',
          isKpiEstimated: false,
          kbi: fc.kbi || '',
          frameworkSelected: null
        };
        updatedCases = [newCase];
      }

      return {
        ...prev,
        name: fd.jobTitle ? "이민수" : prev.name, // Assign standard counselor mock name if extracted
        totalExperience: fd.totalExperience || prev.totalExperience,
        companyName: fd.companyName || prev.companyName,
        jobTitle: fd.jobTitle || prev.jobTitle,
        employmentPeriod: fd.employmentPeriod || prev.employmentPeriod,
        activeFields: fd.activeFields || prev.activeFields,
        certifications: fd.certifications || prev.certifications,
        tools: fd.tools || prev.tools,
        cases: updatedCases
      };
    });

    addBotMessage("✅ 추출본이 포트폴리오 형상에 완벽히 로드되었습니다! 이제 성과 대표 사례의 프레임워크 설계와 SWOT 분석(Q12~Q15)을 구체화해보겠습니다.\n\n사례가 더 매력적인 무기가 되도록 **STAR/GROW 프레임워크 선정**을 도와드리겠습니다. 사례의 프레임워크 자동 추천 및 내용의 고도화 생성을 원하시면 아래 **'대표 사례 1건 생성 위탁'** 버튼을 즉시 눌러주세요!");
    setExtractedData(null);
  };

  // Generate the 1,000 character narrative using STAR or GROW
  const handleAutoGenerateNarrative = async (caseStudy: CaseStudy) => {
    setIsGeneratingNarrative(true);
    addBotMessage(`🪄 AI 엔진이 사례 데이터의 정밀 KPI, KBI의 연동 관계를 추정하고 본인만의 매칭 행동력 중심인 전문 STAR/GROW 문장(1,000자 내외)으로 작성하고 있습니다. 약 5초가 소요됩니다...`);

    try {
      // 1. Ask for framework recommendation
      const rec = await recommendFramework(caseStudy, apiKey);
      const chosenFramework = (rec.recommended === 'GROW' ? 'GROW' : 'STAR') as 'STAR' | 'GROW';

      addBotMessage(`💡 **[프레임워크 추천 피드백]**\n${rec.reason}\n\n추천된 **"${chosenFramework}"** 기법을 적용하여 공식 비즈니스 서술체 원고를 실시간 집필합니다.`);

      // 2. Generate full STAR or GROW narrative
      const narrativeData = await generateNarrativeCase(caseStudy, chosenFramework, apiKey);

      onUpdatePortfolio(prev => {
        const updated = prev.cases.map(c => {
          if (c.id === caseStudy.id || c.title === caseStudy.title) {
            return {
              ...c,
              frameworkSelected: chosenFramework,
              narrativeResult: {
                situationOrGoal: narrativeData.situationOrGoal,
                taskOrReality: narrativeData.taskOrReality,
                actionOrOptions: narrativeData.actionOrOptions,
                resultOrWill: narrativeData.resultOrWill,
                insight: narrativeData.insight,
                fullText: JSON.stringify(narrativeData)
              }
            };
          }
          return c;
        });
        return { ...prev, cases: updated };
      });

      setIsGeneratingNarrative(false);
      addBotMessage(`✅ **[대표 사례 1건 완성!]**\n수치에 부합하는 KBI 개입과 정량 KPI 성과가 물샐틈없이 결합하여 우측 대표 사례 섹션04에 기입되었습니다. 한층 깊어진 시사점(Insight)도 확인해 보세요!\n\n이어서 포트폴리오를 완벽하게 꾸미기 위해 상담사님 본인 전체에 대한 **SWOT 분석** 수집을 진행하겠습니다.`);
      
      // Jump to SWOT Questions
      onChangeQId('Q12');

    } catch (err: any) {
      setIsGeneratingNarrative(false);
      addBotMessage(`❌ **[API 호출 실패]**\n${err.message || '요청 처리에 실패했습니다.'}\n\nGoogle 서버 일시 위축이나 일시적인 혼잡(503)일 수 있습니다. 반복 시 서비스 소개 탭에서 본인의 무료 **Gemini API Key**를 발급받아 붙여넣으시면, 대기 시간 없이 평생 쾌적하게 한도 없는 초고속 생성을 즐길 수 있습니다.`);
    }
  };

  // Core dialog controller of Q1 ~ Q17
  const promptQuestionForId = (qId: QuestionId) => {
    switch(qId) {
      case 'Q1':
        addBotMessage("먼저 **경력 개요(Profile)**를 설정합니다.\n\n**Q1. 본인의 관련 총 경력 기간은 몇 년 몇 개월인가요?**\n(예: '3년 2개월', '신입', '5년')");
        break;
      case 'Q2':
        addBotMessage("**Q2. 주요 소속 기관명(과거 또는 현재 근무처)은 어디인가요?**\n(예: '종로여성인력개발센터', '중장년일자리센터')");
        break;
      case 'Q3':
        addBotMessage("**Q3. 해당 기관에서의 구체적 직급 또는 직책은 무엇인가요?**\n(예: '선임 취업컨설턴트', '주임 상담사', '대리')");
        break;
      case 'Q4':
        addBotMessage("**Q4. 해당 기관 재직 기간은 언제부터 언제까지인가요?**\n(예: '2022.03 ~ 2024.12', '2024.01 ~ 현재')");
        break;
      case 'Q5':
        addBotMessage("**Q5. 본인의 핵심 활동 분야는 무엇인가요? (중복 선택 가능)**\n아래 체크박스에서 해당 품목들을 정확히 고른 후 '완료'를 눌러주세요.");
        break;
      
      // Case studies loop
      case 'Q6':
        addBotMessage(`경력과 성과를 강력하게 호소할 **대표 사례**를 수집합니다. (본인의 최고 성과 1건을 먼저 채워봅시다!)\n\n**Q6. 이 우수 상담 알선 사례의 이름(또는 핵심 주제 한 줄 설명)은 무엇인가요?**\n(예: '경력단절 여성을 위한 1:1 맞춤 일자리 매칭 성공 사례')`);
        break;
      case 'Q7':
        addBotMessage(`**Q7. 이 대표 사례의 실재 진행 기간은 언제인가요?**\n(예: '2025.04 ~ 2025.05')`);
        break;
      case 'Q8':
        addBotMessage(`**Q8. 본 사례의 직업 지도 대상 구직자는 누구였나요?**\n(예: '만 48세 회계직 경력 단절 여성 구직자', '만 29세 장기 일차 실직 청년')`);
        break;
      case 'Q9':
        addBotMessage(`**Q9. 해당 내프린트에서 본인의 구체적인 역할은 무엇이었나요?**\n(예: '행정직 역량 해체 및 세무 직군 전직 맞춤 이력서 기획 및 동행 면접 진행')`);
        break;
      case 'Q10':
        addBotMessage(`**Q10. 이 사례의 명확한 수치 데이터(KPI: 합격률, 알선 횟수, 만족도 등)가 있나요?**\n있으시다면 수치와 함께 전해주시고, 대략적이거나 정확하지 않다면 '대략 ~명' 또는 '모름'이라고 적어 주셔도 포트폴리오에는 '(추정)'으로 표기하여 준수합니다.`);
        break;
      case 'Q11':
        addBotMessage(`**Q11. 본 사례 과정에서 내담자의 마음을 열거나 변화를 이끈 본인만의 핵심 태도, 행동 및 기법(KBI)은 구체적으로 무엇인가요?**\n상황 극복의 순간 행동을 자세히 들려주세요.`);
        break;

      // SWOT
      case 'Q12':
        addBotMessage(`상담사님 전체를 조망하는 **SWOT 분석 전문 근거**를 채웁니다 (구체적 실화 수집).\n\n**Q12 (S - 강점): 동료 상담사나 타 컨설턴트와 구별되는 전적인 본인만의 실제 대면 차별점이나 노하우는 무엇인가요?**`);
        break;
      case 'Q13':
        addBotMessage(`**Q13 (W - 보완약점): 직업상담 현직에서 스스로 보완이 필요하다고 가용하는 부분과, 이를 채우기 위해 요즘 행동으로 옮기거나 배우고 있는 구체적인 일은 무엇인가요?**\n(W의 강점 전환: 해결 중인 전략 서술을 위해 구체적으로 적어주세요!)`);
        break;
      case 'Q14':
        addBotMessage(`**Q14 (O - 기회요소): 최근 고용 변화, 전직 노동 시장, 혹은 고용 법안 등에서 본인의 서비스 직무에 득이 될 기회가 되는 환경 변화는 무엇인가요?**`);
        break;
      case 'Q15':
        addBotMessage(`**Q15 (T - 위협요소): 요즘 AI 기술의 도입이나 취업 공급 경쟁 과열 요인 등 상담 환경을 어렵게 하는 위협 요소는 무엇이며 본인은 구체적으로 어떻게 이에 대응하고 있나요?**`);
        break;

      // Finish tools and certs
      case 'Q16':
        addBotMessage(`마무리 단계입니다. 자격 및 기술 리스트를 가다듬을게요.\n\n**Q16. 취득하고 계신 전문 자격증들을 쉼표(,)로 구분지어 적어주세요.**\n(예: '직업상담사 2급, 사회복지사 1급, 컴퓨터활용능력 2급')`);
        break;
      case 'Q17':
        addBotMessage(`**Q17. 업무 상 다루실 수 있는 사무용 오피스 프로그램이나 AI 챗봇 툴을 모두 말해주세요.**\n(예: '한글, MS 엑셀, 파워포인트, ChatGPT/Gemini AI')`);
        break;
      
      case 'COMPLETE':
        addBotMessage(`🎉 **[커리어 포트폴리오 최종 정비 완료!]**\n\n모든 정보 수집과 데이터 검증이 아름답게 종결되었습니다! 사용자의 경험과 성과 수집 내용이 전문가 급 문맥으로 다듬어져 우측 프리뷰 패널에 반영되었습니다.\n\n마지막으로 상단 타이틀에 어울리는 **카피라이팅 한 줄 슬로건**을 선택하고 싶으시면, 하단의 고도화 슬로건 후보를 클릭해 주십시오!`);
        break;
    }
  };

  // Triggered when user enters textual answer
  const handleUserAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const answer = inputValue.trim();
    setInputValue('');

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: answer,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Update state based on answer
    evalAndUpdatePortfolioState(answer);
  };

  // Evaluate the text answer and transition to next Q-ID with rules
  const evalAndUpdatePortfolioState = async (answer: string) => {
    switch (currentQId) {
      case 'Q1':
        onUpdatePortfolio(prev => ({ ...prev, totalExperience: answer }));
        onChangeQId('Q2');
        break;
      case 'Q2':
        onUpdatePortfolio(prev => ({ ...prev, companyName: answer }));
        onChangeQId('Q3');
        break;
      case 'Q3':
        onUpdatePortfolio(prev => ({ ...prev, jobTitle: answer }));
        onChangeQId('Q4');
        break;
      case 'Q4':
        onUpdatePortfolio(prev => ({ ...prev, employmentPeriod: answer }));
        onChangeQId('Q5');
        break;
      case 'Q5':
        // Safe split or handle
        onUpdatePortfolio(prev => ({ ...prev, activeFields: [answer] }));
        onChangeQId('Q6');
        break;

      case 'Q6':
        onUpdatePortfolio(prev => {
          const newCase: CaseStudy = {
            id: `case-${Date.now()}`,
            title: answer,
            period: '',
            target: '',
            role: '',
            kpi: '',
            isKpiEstimated: false,
            kbi: '',
            frameworkSelected: null
          };
          return { ...prev, cases: [newCase] };
        });
        onChangeQId('Q7');
        break;
      case 'Q7':
        onUpdatePortfolio(prev => {
          const cases = [...prev.cases];
          if (cases.length > 0) cases[0].period = answer;
          return { ...prev, cases };
        });
        onChangeQId('Q8');
        break;
      case 'Q8':
        onUpdatePortfolio(prev => {
          const cases = [...prev.cases];
          if (cases.length > 0) cases[0].target = answer;
          return { ...prev, cases };
        });
        onChangeQId('Q9');
        break;
      case 'Q9':
        onUpdatePortfolio(prev => {
          const cases = [...prev.cases];
          if (cases.length > 0) cases[0].role = answer;
          return { ...prev, cases };
        });
        onChangeQId('Q10');
        break;
      case 'Q10':
        const isRough = answer.includes("대략") || answer.includes("쯤") || answer.includes("모름") || answer.includes("없") || answer.length < 2;
        onUpdatePortfolio(prev => {
          const cases = [...prev.cases];
          if (cases.length > 0) {
            cases[0].kpi = answer;
            cases[0].isKpiEstimated = isRough;
          }
          return { ...prev, cases };
        });

        // RULE [2-3]: If KPI is empty/weak, trigger deep KBI question first or go to Q11
        if (isRough) {
          setCaseKbiDeepTriggered(true);
          addBotMessage("💡 구체적인 수치 증빙(KPI) 성과가 약하거나 공란이므로, 내담자의 주체적인 행동 변화 유도를 증명할 KBI 깊이가 매우 중요합니다.\n\n**[심화 질문]: 상담 당시에 먼저 내담자의 상태나 심리를 어떻게 진단했으며, 그 후 어떤 구체적 대안 구직 동선을 시도하셨나요? 또한 관찰된 내담자의 미세한 반응이나 변화를 들려주세요.**");
        } else {
          onChangeQId('Q11');
        }
        break;
      case 'Q11':
        onUpdatePortfolio(prev => {
          const cases = [...prev.cases];
          if (cases.length > 0) cases[0].kbi = answer;
          return { ...prev, cases };
        });
        
        // Formulate decision to run narrative generation
        const actualCase = portfolio.cases[0];
        if (actualCase) {
          handleAutoGenerateNarrative(actualCase);
        } else {
          onChangeQId('Q12');
        }
        break;

      case 'Q12':
        onUpdatePortfolio(prev => ({ 
          ...prev, 
          swot: { ...prev.swot, strength: answer } 
        }));
        onChangeQId('Q13');
        break;
      case 'Q13':
        onUpdatePortfolio(prev => ({ 
          ...prev, 
          swot: { ...prev.swot, weakness: answer } 
        }));
        onChangeQId('Q14');
        break;
      case 'Q14':
        onUpdatePortfolio(prev => ({ 
          ...prev, 
          swot: { ...prev.swot, opportunity: answer } 
        }));
        onChangeQId('Q15');
        break;
      case 'Q15':
        onUpdatePortfolio(prev => ({ 
          ...prev, 
          swot: { ...prev.swot, threat: answer } 
        }));
        
        // Call API 4 SWOT consolidation
        addBotMessage("📊 주신 개 실화 근거들을 매칭하여 전문가 등급의 SWOT 최종 보고 성조 문장으로 정제하고 있습니다. 잠시만 기다려 주세요...");
        generateSwot({ ...portfolio.swot, threat: answer }, portfolio.name, portfolio.activeFields, apiKey)
          .then((swCombined) => {
            onUpdatePortfolio(prev => ({
              ...prev,
              swot: swCombined
            }));
          })
          .catch((e) => {
            console.warn("SWOT generation failed:", e);
          });

        onChangeQId('Q16');
        break;

      case 'Q16':
        onUpdatePortfolio(prev => ({ 
          ...prev, 
          certifications: answer.split(',').map(s => s.trim()).filter(Boolean)
        }));
        onChangeQId('Q17');
        break;
      case 'Q17':
        onUpdatePortfolio(prev => ({ 
          ...prev, 
          tools: answer.split(',').map(s => s.trim()).filter(Boolean)
        }));
        
        // Finalize everything
        // Call slogan API optionally to preload slogans for selection
        generatePortfolioSlogans(portfolio.totalExperience, portfolio.activeFields, portfolio.companyName, apiKey)
          .then((slogansObj) => {
            if (slogansObj.slogans && slogansObj.slogans.length > 0) {
              onUpdatePortfolio(prev => ({ ...prev, slogan: slogansObj.slogans[0] }));
            }
          })
          .catch((e) => {
            console.warn("Slogans generation failed:", e);
          });
        
        onChangeQId('COMPLETE');
        break;

      default:
        // Handle deep questioning interlude
        if (caseKbiDeepTriggered) {
          setCaseKbiDeepTriggered(false);
          onUpdatePortfolio(prev => {
            const cases = [...prev.cases];
            if (cases.length > 0) {
              cases[0].kbi = (cases[0].kbi ? cases[0].kbi + " " : "") + answer;
            }
            return { ...prev, cases };
          });
          // Continue to recommend framework
          const currentCase = portfolio.cases[0];
          if (currentCase) {
            handleAutoGenerateNarrative(currentCase);
          } else {
            onChangeQId('Q12');
          }
        }
        break;
    }
  };

  // Special options selector for core fields (Q5)
  const activeFieldsOptions = [
    "이력서·자소서 컨설팅",
    "면접 컨설팅",
    "직업선호도검사·강점분석",
    "취업지원 프로그램 기획·운영",
    "강의",
    "슈퍼비전·모니터링"
  ];

  const handleToggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleConfirmFields = () => {
    onUpdatePortfolio(prev => ({
      ...prev,
      activeFields: selectedFields
    }));
    addBotMessage(`✅ 핵심 활동 분야로 [${selectedFields.join(", ")}] 목록을 확인 전송하였습니다.`);
    onChangeQId('Q6');
  };

  return (
    <div className="bg-brand-navy text-white rounded-none h-full flex flex-col overflow-hidden border border-brand-navy/30 shadow-md relative">
      
      {/* Bot Chat Header */}
      <div className="bg-slate-950 px-4 py-4 border-b border-brand-navy/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-teal text-white border border-brand-teal rounded-none flex items-center justify-center font-bold text-xs shrink-0">
            도
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
              <span>경력 포트폴리오 도우미</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sky inline-block animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-brand-sky/60 font-medium mt-1">STEP 1 — 증빙 자료 업로드</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-brand-navy border border-brand-teal/20 text-brand-sky font-mono font-bold px-2 py-0.5 rounded-none">
            STEP: {currentQId}
          </span>
        </div>
      </div>

      {/* File Drop and Sample triggers */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-brand-navy/20 text-xs">
        <div className="flex items-center gap-1.5 text-gray-300 font-bold mb-2 text-left">
          <Upload className="w-3.5 h-3.5 text-brand-sky" />
          <span>기존에 작성하신 자료(상담 대장, 기획문서 등)를 아래에서 선택(업로드)해 보세요.</span>
        </div>
        <div className="flex flex-col gap-2">
          {FILE_SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleAnalyzeText(sample.fileName, sample.textContent)}
              disabled={isAnalyzing || isGeneratingNarrative}
              className="text-left w-full text-[10.5px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-brand-teal/50 rounded-none px-3.5 py-2.5 transition-all text-gray-300 hover:text-white flex items-center justify-between disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-brand-sky shrink-0" />
                <span className="truncate font-bold tracking-tight">{sample.title}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages flow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[48vh] scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-none bg-brand-teal text-white border border-brand-teal shrink-0 flex items-center justify-center font-bold text-[10px]">
                도
              </div>
            )}

            <div className={`max-w-[85%] rounded-none px-4 py-2.5 text-xs leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-brand-sky text-brand-navy border border-brand-sky/40 font-bold shadow-sm' 
                : 'bg-slate-950 text-slate-100 border border-slate-800'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <span className={`block text-[8px] mt-1 text-right font-mono font-bold ${msg.sender === 'user' ? 'text-brand-navy/60' : 'text-gray-400'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        
        {/* Loading status indicators */}
        {(isAnalyzing || isGeneratingNarrative) && (
          <div className="flex gap-2.5 justify-start items-center text-xs text-brand-sky/80 animate-pulse pl-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-sky" />
            <span className="font-bold text-brand-sky">도우미가 성과를 입체적으로 정제 중입니다...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Interactive Panel inside the chat for Complex Qs (e.g. Activity Fields checklist) */}
      {currentQId === 'Q5' && (
        <div className="p-4 bg-slate-950 border-t border-brand-navy/20 space-y-3">
          <div className="text-xs text-slate-100 font-bold mb-1">
            Q5. 해당하시는 취업지원 활동 분야를 모두 선택하십시오:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {activeFieldsOptions.map((field) => {
              const checked = selectedFields.includes(field);
              return (
                <button
                  key={field}
                  onClick={() => handleToggleField(field)}
                  className={`text-left p-2.5 rounded-none text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                    checked 
                      ? 'bg-brand-sky/10 border-brand-sky text-brand-sky shadow-sm' 
                      : 'bg-slate-900 border-slate-850 text-gray-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                    checked ? 'bg-brand-sky border-brand-sky' : 'border-gray-600 bg-slate-950'
                  }`}>
                    {checked && <Check className="w-3 h-3 text-brand-navy stroke-[3]" />}
                  </span>
                  <span className="truncate text-[11px]">{field}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleConfirmFields}
            disabled={selectedFields.length === 0}
            className="w-full bg-brand-teal hover:bg-brand-sky hover:text-brand-navy text-white font-bold p-3 rounded-none text-xs border border-brand-teal transition-colors cursor-pointer disabled:opacity-50 shadow-sm active:translate-y-0.5"
          >
            선택한 {selectedFields.length}개 분야 확정 및 전송하기
          </button>
        </div>
      )}

      {/* Pre-actions or quick helper buttons based on extraction details ready */}
      {extractedData && (
        <div className="px-4 py-2.5 bg-brand-navy border-t border-brand-navy/30 flex gap-2 items-center justify-between">
          <span className="text-[10px] text-brand-sky font-bold">검출된 Q-ID 데이터가 로드 대기 중입니다:</span>
          <button
            onClick={applyExtractedDataToPortfolio}
            className="flex items-center gap-1.5 bg-brand-teal hover:bg-brand-sky hover:text-brand-navy text-white text-[11px] font-bold px-3.5 py-2 border border-brand-teal rounded-none cursor-pointer transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>포트폴리오에 자동 추출본 적용</span>
          </button>
        </div>
      )}

      {/* Chat Text Input Form */}
      {currentQId !== 'Q5' && (
        <form onSubmit={handleUserAnswerSubmit} className="p-3 bg-slate-950 border-t border-brand-navy/30 flex gap-2 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isAnalyzing || isGeneratingNarrative || currentQId === 'COMPLETE'}
            placeholder={
              currentQId === 'COMPLETE' 
                ? "작성이 전부 완료되었습니다!" 
                : "포인트를 한 문장으로 편하게 전달해 주세요..."
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-none px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-teal focus:bg-slate-900/60 disabled:opacity-50 font-bold"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isAnalyzing || isGeneratingNarrative || currentQId === 'COMPLETE'}
            className="bg-brand-teal text-white p-3 rounded-none border border-brand-teal cursor-pointer disabled:opacity-30 transition-all font-bold"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

    </div>
  );
}
