export interface CaseStudy {
  id: string;
  title: string;       // Q6. 사례 이름/설명
  period: string;      // Q7. 진행 기간
  target: string;      // Q8. 사례 대상
  role: string;        // Q9. 본인 역할
  kpi: string;         // Q10. 수치 데이터 (빈칸 가능)
  isKpiEstimated: boolean; // "(추정)" 표기 여부
  kbi: string;         // Q11. 핵심 행동/태도
  frameworkSelected: 'STAR' | 'GROW' | null;
  narrativeResult?: {
    situationOrGoal: string;   // Situation for STAR, Goal for GROW
    taskOrReality: string;     // Task for STAR, Reality for GROW
    actionOrOptions: string;   // Action for STAR, Options for GROW
    resultOrWill: string;       // Result for STAR, Will for GROW (with KPI + KBI)
    insight: string;           // 시사점 및 기여 방안
    fullText: string;
  };
}

export interface SwotAnalysis {
  strength: string;      // Q12. 강점 근거
  weakness: string;      // Q13. 보완점 및 보완 행동 근거
  opportunity: string;   // Q14. 기회 근거
  threat: string;        // Q15. 위협 근거
}

export interface CareerPortfolio {
  slogan: string;        // 타이틀 슬로건
  name: string;          // 상담사 이름 (또는 사용자 이름)
  totalExperience: string; // Q1. 총 경력 기간
  companyName: string;    // Q2. 주요 소속 기관명
  jobTitle: string;       // Q3. 직급
  employmentPeriod: string; // Q4. 재직 기간
  activeFields: string[];  // Q5. 핵심 활동 분야
  activeFieldsCustom?: string;
  cases: CaseStudy[];     // 대표 사례들 (3~4건 권장)
  swot: SwotAnalysis;     // SWOT 분석 근거
  certifications: string[]; // Q16. 보유 자격증
  tools: string[];        // Q17. 활용 가능 툴
}

export type QuestionId =
  | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  | 'Q5'
  | 'Q6' | 'Q7' | 'Q8' | 'Q9' | 'Q10' | 'Q11' | 'Q_CONFIRM_FRAMEWORK'
  | 'Q12' | 'Q13' | 'Q14' | 'Q15'
  | 'Q16' | 'Q17'
  | 'COMPLETE';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface ExtractionResult {
  identifiedType?: string; // e.g., "2025년 우수사례 보고서"
  foundData: Partial<CareerPortfolio>;
  foundCases?: Partial<CaseStudy>[];
}
