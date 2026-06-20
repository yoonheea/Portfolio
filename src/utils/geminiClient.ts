/**
 * Gemini client fallback helper.
 * Provides double-layer architecture:
 * 1. Safely attempts to call our custom backend APIs (/api/*).
 * 2. If the backend is unavailable, non-existent, or statically hosted (e.g. on Vercel),
 *    gracefully falls back to client-side direct REST API calls using the user's Gemini API key.
 */

interface FetchOptions {
  method?: string;
  body: any;
  apiKey?: string;
}

// Low-level helper to check if custom server responds with valid JSON
async function safeServerPost(endpoint: string, data: any, apiKey?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['x-gemini-key'] = apiKey;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  const contentType = res.headers.get('content-type');
  if (res.ok && contentType && contentType.includes('application/json')) {
    const json = await res.json();
    return json;
  }
  
  // If we receive a bad response or non-JSON (like HTML from static router), throw to activate fallback
  throw new Error(`Server returned non-JSON or status ${res.status}`);
}

// Low-level direct Gemini REST fetch helper
async function directGeminiGenerate(
  prompt: string,
  key: string,
  schema?: any,
  model = 'gemini-1.5-flash'
): Promise<any> {
  if (!key || key.trim() === '') {
    throw new Error("Gemini API Key가 누락되었습니다.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key.trim())}`;
  
  const payload: any = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  if (schema) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: schema
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP ${response.status} error`;
    throw new Error(message);
  }

  const result = await response.json();
  const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error("Gemini 응답 결과에서 텍스트를 추출할 수 없습니다.");
  }

  if (schema) {
    try {
      return JSON.parse(textOutput);
    } catch (e) {
      console.error("Failed to parse schema response text as JSON:", textOutput);
      throw new Error("JSON 스키마 출력 구문 분석 실패");
    }
  }

  return textOutput;
}

// 1. Validate API Key
export async function validateGeminiKey(key: string): Promise<boolean> {
  // Try server-side first
  try {
    const srvResult = await safeServerPost('/api/validate-key', { key });
    if (srvResult && srvResult.success) {
      return true;
    }
  } catch (err) {
    console.warn("Server validation check bypassed. Trying client-side direct verification...", err);
  }

  // Fallback to client-side direct API check
  try {
    const clientUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key.trim())}`;
    const clientRes = await fetch(clientUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Validate key" }] }],
        generationConfig: { maxOutputTokens: 2 }
      })
    });

    if (clientRes.ok) {
      return true;
    } else {
      const errData = await clientRes.json().catch(() => ({}));
      const apiMessage = errData?.error?.message || "";
      if (apiMessage.includes("API key not valid")) {
        throw new Error("입력하신 API Key가 올바르지 않거나 아직 활성화되지 않았습니다.");
      } else if (apiMessage.includes("quota") || apiMessage.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("API Key의 할당량(Quota)이 부족하거나 만료되었습니다.");
      } else {
        throw new Error(apiMessage || "API Key 검증에 실패했습니다.");
      }
    }
  } catch (cliErr: any) {
    throw new Error(cliErr.message || "네트워크 오류 또는 API Key 검증 오류 발생");
  }
}

// 2. Recommend framework
export async function recommendFramework(caseData: any, apiKey?: string): Promise<{ recommended: string; reason: string }> {
  try {
    return await safeServerPost('/api/recommend-framework', { caseData }, apiKey);
  } catch (err) {
    console.warn("recommendFramework falling back to client-side Direct API...", err);
    
    // Direct prompt representation
    const prompt = `
이성적이고 직관적인 포트폴리오 작성을 격려하는 전문 HR 컨설턴트 입장에서 보았을 때, 다음 직업상담 사례에 가장 추천하는 방식이 STAR 프레임워크인지 GROW 프레임워크인지 구분하고, 그 추천 사유를 한글로 구체적으로 작성해 주십시오.

[사례명]: ${caseData.title}
[대상]: ${caseData.target}
[본인 역할]: ${caseData.role}
[KPI(정량적 성과)]: ${caseData.kpi || "없음"}
[KBI(핵심행동/과정)]: ${caseData.kbi || "없음"}

선택 규칙:
- 수치 성과(KPI) 지표가 정량적이고 구체적인 경우 'STAR'를 강력 추천하십시오.
- 장기상담, 유대 관계 극대화, 정성적인 행동력(KBI)이 매개체인 경우 'GROW'를 추천하십시오.

JSON 양식으로 응답하십시오.
`;

    const schema = {
      type: "OBJECT",
      properties: {
        recommended: { type: "STRING", description: "STAR 또는 GROW" },
        reason: { type: "STRING", description: "추전 사유 한국어 문장" }
      },
      required: ["recommended", "reason"]
    };

    return await directGeminiGenerate(prompt, apiKey || "", schema, "gemini-2.5-flash");
  }
}

// 3. Generate detailed narrative case
export async function generateNarrativeCase(caseData: any, framework: string, apiKey?: string): Promise<any> {
  try {
    return await safeServerPost('/api/generate-narrative-case', { caseData, framework }, apiKey);
  } catch (err) {
    console.warn("generateNarrativeCase falling back to client-side Direct API...", err);

    const structure = framework === 'STAR' 
      ? "S(Situation), T(Task), A(Action), R(Result) 단계로 구성" 
      : "G(Goal), R(Reality), O(Options), W(Will) 단계로 구성";

    const prompt = `
당신은 직업상담사와 취업지원 직무의 강점을 시각적·논리적으로 극대화하는 HRD/HRM 전문가이자 포트폴리오 컨설턴트입니다.
사용자가 제공한 입증 자료와 사실을 근거로, 직급과 역량을 매력적으로 보여줄 대표 사례 상세 분석 원고를 만들어 주십시오.

[선택 프레임워크]: ${framework} (${structure})
[사례 원천 자료]:
- 사례명: ${caseData.title}
- 기간: ${caseData.period}
- 대상: ${caseData.target}
- 본인 역할: ${caseData.role}
- KPI(수치 성과): ${caseData.kpi || "숫자 증빙 없음"}
- KBI(핵심 개입/행동 과정): ${caseData.kbi || "기술된 내용 없음"}

[서술 지침]:
1. "성과 및 요약 중심": 추상적이고 감성적인 형용사 표현은 배제하고, 깔끔하고 신뢰감을 주는 비즈니스 보고서 톤으로 작성하십시오.
2. "1,000자 내외 분량": 프레임워크 각각의 4단계를 정확히 구현하고, 각 단계마다 2~4문장 단위로 꼼꼼하고 논리적으로 풀어주세요.
3. "KPI & KBI 융합 기재": 마지막 단계(Result 또는 Will) 부분에는 정량적 숫자 변화(KPI)와 정성적 행동 기법(KBI)을 반드시 상호보완적으로 녹여내 주십시오.
4. "시사점(Insight) 필수": 본문 말미에 본 사례가 주는 귀한 업무적 통찰과, 입사 후 기여할 지향점(기여 방안)을 2-3문장 내외로 서술해 마쳐 주십시오.
5. "출처 반영": 원본 자료에 근거한 비비드한 서술을 하십시오. (추측으로 보완하지 않는다)

JSON 형식으로 각 단계를 별도 필드로 보장해 반환하십시오.
`;

    const schema = {
      type: "OBJECT",
      properties: {
        situationOrGoal: { type: "STRING" },
        taskOrReality: { type: "STRING" },
        actionOrOptions: { type: "STRING" },
        resultOrWill: { type: "STRING" },
        insight: { type: "STRING" }
      },
      required: ["situationOrGoal", "taskOrReality", "actionOrOptions", "resultOrWill", "insight"]
    };

    return await directGeminiGenerate(prompt, apiKey || "", schema, "gemini-1.5-flash");
  }
}

// 4. Generate SWOT
export async function generateSwot(swotAnswers: any, name: string, activeFields: string[], apiKey?: string): Promise<any> {
  try {
    return await safeServerPost('/api/generate-swot', { swotAnswers, name, activeFields }, apiKey);
  } catch (err) {
    console.warn("generateSwot falling back to client-side Direct API...", err);

    const prompt = `
당신은 직업상담사의 개인 능력과 외부 환경 요인을 매칭하는 전문 포트폴리오 컨설턴트입니다.
사용자가 입력한 아래 SWOT 실경험 근거를 바탕으로, 인사담당자가 수긍할 수 있는 논리적이고 세련된 보고서용 SWOT 분석 문장(항목당 1~2문장)을 정제해 주십시오.

[상담사 이름]: ${name || "직업상담사"}
[핵심 분야]: ${activeFields ? activeFields.join(", ") : ""}

[제공된 개별 근거]:
- S(실제 다른 상담사와 차별화된 본인 강점 상황): ${swotAnswers.strength || "상담 유형별 내담자 성격 맞춤 분석"}
- W(본인이 체감하는 보완점 및 이를 위한 실질적 보완 노력): ${swotAnswers.weakness || "행정 처리의 체계화 노력"}
- O(최근 직접 체감한 직군 내 정책/시장 기획 요인): ${swotAnswers.opportunity || "정부의 중장년 지원 정책 강화"}
- T(채용 경쟁 심화 등 직접 한 위협 체감): ${swotAnswers.threat || "AI 상담 서비스 툴 보급"}

[작성 및 서술 규칙]:
1. "역량 키워드 반복 금지": 프로필 부분과 단어가 중복되지 않도록 하되, 강점(S)은 실사례 상황 기반으로 가다듬으십시오.
2. "W의 강점 전환 기술": 보완점(W)은 단순히 단점만 나열하는 것이 아니라, 부족함을 자각하고 구체적으로 학습·개선하여 실제 성과로 바꾸어가는 능동적인 문장으로 정성스레 서술해 주세요.
3. "일반론 금지": 누구에게나 해당되는 공통 내용(예: '직업상담사는 친절하다')을 쓰지 말고, 구체적인 상담 사례 중심 성격과 시장 변화 중심 단어를 활용하십시오.

JSON 형식으로 strength, weakness, opportunity, threat 필드를 채워 주십시오.
`;

    const schema = {
      type: "OBJECT",
      properties: {
        strength: { type: "STRING" },
        weakness: { type: "STRING" },
        opportunity: { type: "STRING" },
        threat: { type: "STRING" }
      },
      required: ["strength", "weakness", "opportunity", "threat"]
    };

    return await directGeminiGenerate(prompt, apiKey || "", schema, "gemini-2.5-flash");
  }
}

// 5. Generate portfolio slogans
export async function generatePortfolioSlogans(
  totalExperience: string,
  activeFields: string[],
  companyName: string,
  apiKey?: string
): Promise<{ slogans: string[] }> {
  try {
    return await safeServerPost('/api/generate-portfolio-slogans', { totalExperience, activeFields, companyName }, apiKey);
  } catch (err) {
    console.warn("generatePortfolioSlogans falling back to client-side Direct API...", err);

    const prompt = `
당신은 직업상담사 커리어 포트폴리오의 타이틀 슬로건을 기획하는 전문 카피라이터입니다.
상담사 정보: ${totalExperience || '신입'} 경력, 핵심역량분야: ${activeFields ? activeFields.join(", ") : "취업 상담"}, 이전 소속기관: ${companyName || "고용 유관 단체"}.

인사담당자가 한눈에 직무적 진정성과 성과지향주의를 단번에 이해할 수 있는 전문적이고 무게감 있는 비즈니스 '한 줄 슬로건' 3가지를 제안하십시오.
과장되거나 뜬구름 잡는 화려한 미사여구는 빼고, 성과와 기여가 드러나는 수려하고 깔끔한 한국어 명사 종결형 슬로건이어야 합니다.
`;

    const schema = {
      type: "OBJECT",
      properties: {
        slogans: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["slogans"]
    };

    return await directGeminiGenerate(prompt, apiKey || "", schema, "gemini-2.5-flash");
  }
}

// 6. Analyze file
export async function analyzeFileContent(fileName: string, textContent: string, apiKey?: string): Promise<any> {
  try {
    return await safeServerPost('/api/analyze-file', { fileName, textContent }, apiKey);
  } catch (err) {
    console.warn("analyzeFileContent falling back to client-side Direct API...", err);

    const prompt = `
당신은 대기업 및 공공기관 출신의 HR 전문가이자 포트폴리오 컨설턴트입니다.
업로드된 파일에서 텍스트 수집본을 면밀히 검토하고, 직업상담사 커리어 포트폴리오의 여러 항목에 해당하는 정보를 추출하십시오.

[분석할 파일명]: ${fileName || "알 수 없는 파일"}
[파일 원본 텍스트 내용]:
${textContent.slice(0, 10000)}

[필수 추출 규칙]:
- "추측으로 채우지 않는다": 파일에 기재되지 않은 값은 절대 지어내거나 추정하지 말고 null 등으로 그대로 둘 것. 숫자는 특히 정확하고 엄격해야 함.
- "식별된 내용에 대해": Q1~Q4(경력), Q5(핵심활동분야), Q10~11(사례 KPI/KBI), Q16~Q17(자격사항 및 툴)을 추출할 것.
- Q5(핵심활동분야는 다음 후보 중 매칭되는 것만 포함): "이력서·자소서 컨설팅", "면접 컨설팅", "직업선호도검사·강점분석", "취업지원 프로그램 기획·운영", "강의", "슈퍼비전·모니터링"

JSON 형식으로 정밀 분석 결과를 돌려주세요.
`;

    const schema = {
      type: "OBJECT",
      properties: {
        identifiedType: { type: "STRING", description: "파일 성격 분석 (예: '취업지원 우수사례 포상 보고서')" },
        foundData: {
          type: "OBJECT",
          properties: {
            totalExperience: { type: "STRING" },
            companyName: { type: "STRING" },
            jobTitle: { type: "STRING" },
            employmentPeriod: { type: "STRING" },
            activeFields: { type: "ARRAY", items: { type: "STRING" } },
            certifications: { type: "ARRAY", items: { type: "STRING" } },
            tools: { type: "ARRAY", items: { type: "STRING" } }
          }
        },
        foundCases: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              period: { type: "STRING" },
              target: { type: "STRING" },
              role: { type: "STRING" },
              kpi: { type: "STRING" },
              kbi: { type: "STRING" }
            }
          }
        }
      }
    };

    return await directGeminiGenerate(prompt, apiKey || "", schema, "gemini-1.5-flash");
  }
}
