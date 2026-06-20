import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy client setup or default with custom dynamic API key support
const getGeminiClient = (customKey?: string) => {
  const key = customKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API 0: Validate Gemini API Key
app.post("/api/validate-key", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key || typeof key !== "string" || key.trim() === "") {
      return res.status(400).json({ error: "Gemini API Key를 입력해주십시오." });
    }

    // Attempt to initialize and perform a micro-generation to guarantee key authentication
    const testClient = new GoogleGenAI({
      apiKey: key.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-validator',
        }
      }
    });

    // Request a payload of maximum 2 output tokens to keep it instant and completely free
    await testClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Validate key",
      config: {
        maxOutputTokens: 2
      }
    });

    return res.json({ success: true, message: "유효한 Gemini API Key입니다." });

  } catch (error: any) {
    console.error("Gemini Key validation error details:", error);
    let errorMessage = "유효하지 않은 API Key이거나 네트워크 오류입니다. 키 발급 상태를 확인하세요.";
    if (error && error.message) {
      if (error.message.includes("API key not valid") || error.status === 400) {
        errorMessage = "입력하신 API Key가 올바르지 않거나 아직 승인되지 않았습니다. (API key not valid)";
      } else if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
        errorMessage = "API Key의 할당량(Quota)이 부족하거나 만료되었습니다. 다른 키나 신규 키를 발급하십시오.";
      } else {
        errorMessage = `API Key 인증 실패: ${error.message}`;
      }
    }
    return res.status(400).json({ error: errorMessage });
  }
});

// API 1: Analyze file content / raw text for any matching Q-IDs
app.post("/api/analyze-file", async (req, res) => {
  try {
    const { fileName, textContent } = req.body;

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ error: "분석할 내용이 비어있습니다." });
    }

    const customKey = req.headers["x-gemini-key"] as string | undefined;
    const client = getGeminiClient(customKey);

    if (!client) {
      // Return safe standard mock data so preview functions even if API keys are temporary missing
      return res.json({
        identifiedType: "업로드 파일 (데모 모드)",
        foundData: {
          totalExperience: "3년",
          companyName: "종로여성인력개발센터",
          jobTitle: "직업상담사",
          employmentPeriod: "2024.01 ~ 2025.12",
          activeFields: ["이력서·자소서 컨설팅", "면접 컨설팅"],
          certifications: ["직업상담사 2급"],
          tools: ["엑셀", "한글"]
        },
        foundCases: [
          {
            title: "이력서 첨삭 및 모의 면접을 통한 중장년 여성 알선 사례",
            period: "2024.05 ~ 2024.06",
            target: "경력단절 중장년 구직자",
            role: "1:1 집중 서류 컨설팅 및 실전 동행 면접 지도",
            kpi: "3명 지원 중 2명 최종 합격, 만족도 4.9/5점",
            isKpiEstimated: false,
            kbi: "내담자의 단절 전 행정 경력을 도출해 신중년 구인기업 행정직 요구 수준과 직접 연결"
          }
        ]
      });
    }

    // Call Gemini with structured schema
    const prompt = `
당신은 대기업 및 공공기관 출신의 HR 전문가이자 포트폴리오 컨전트입니다.
업로드된 파일에서 텍스트 수집본을 면밀히 검토하고, 직업상담사 커리어 포트폴리오의 Q-ID 항목에 해당하는 정보를 추출하십시오.

[분석할 파일명]: ${fileName || "알 수 없는 파일"}
[파일 원본 텍스트 내용]:
${textContent.slice(0, 20000)}

[필수 추출 규칙]:
- "추측으로 채우지 않는다": 파일에 기재되지 않은 값은 절대 지어내거나 추정하지 말고 null 등으로 그대로 둘 것. 숫자는 특히 정확하고 엄격해야 함.
- "식별된 내용에 대해": Q1~Q4(경력), Q5(핵심활동분야), Q10~11(사례 KPI/KBI), Q16~Q17(자격사항 및 툴)을 추출할 것.
- Q5(핵심활동분야는 다음 후보 중 매칭되는 것만 포함): "이력서·자소서 컨설팅", "면접 컨설팅", "직업선호도검사·강점분석", "취업지원 프로그램 기획·운영", "강의", "슈퍼비전·모니터링"

JSON 형식으로 정밀 분석 결과를 돌려주세요.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifiedType: {
              type: Type.STRING,
              description: "파일 성격 분석 (예: '2025년 취업지원 우수사례 포상 보고서')"
            },
            foundData: {
              type: Type.OBJECT,
              properties: {
                totalExperience: { type: Type.STRING },
                companyName: { type: Type.STRING },
                jobTitle: { type: Type.STRING },
                employmentPeriod: { type: Type.STRING },
                activeFields: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                certifications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                tools: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            },
            foundCases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "사례 한 줄 요약" },
                  period: { type: Type.STRING, description: "사례 진행 기간" },
                  target: { type: Type.STRING, description: "사례 대상" },
                  role: { type: Type.STRING, description: "본인의 구체적인 역할" },
                  kpi: { type: Type.STRING, description: "정량적 수치 성과 (숫자, 만족도 등)" },
                  kbi: { type: Type.STRING, description: "행동 및 기법(수치화되지 않는 행위)" }
                }
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("File analysis error:", error);
    res.status(500).json({ error: error.message || "파일 분석 중 서버 오류가 발생했습니다." });
  }
});

// API 2: Determine & Recommend STAR or GROW structure for a case
app.post("/api/recommend-framework", async (req, res) => {
  try {
    const { caseData } = req.body;

    if (!caseData) {
      return res.status(400).json({ error: "사례 데이터가 누락되었습니다." });
    }

    const customKey = req.headers["x-gemini-key"] as string | undefined;
    const client = getGeminiClient(customKey);

    if (!client) {
      // Local check
      const hasNumber = /\d+/.test(caseData.kpi || "");
      const recommended = (hasNumber && caseData.kpi.trim().length > 2) ? 'STAR' : 'GROW';
      const reason = recommended === 'STAR' 
        ? "정량적 수치(KPI) 성과가 명확하게 명시되어 있어, 성과를 구조적으로 보여주는 STAR 프레임워크가 적합합니다."
        : "수치 데이터가 정성적이거나 상담 및 개입 과정의 강점이 두드러지므로, 목표 설정과 동기 부여 과정을 극대화하는 GROW 프레임워크가 적합합니다.";
      return res.json({ recommended, reason });
    }

    const prompt = `
당신은 인사담당자 눈높이에 맞는 직업상담사 포트폴리오를 설계하는 HR 전문가입니다.
아래 사례 내용을 살펴본 후, 'STAR' 프레임워크(Situation, Task, Action, Result)와 'GROW' 프레임워크(Goal, Reality, Options, Will) 중 어느 것이 최적인지 제안하고 구체적인 추천 이유를 한국어로 서술해 주십시오.

[사례명]: ${caseData.title}
[대상]: ${caseData.target}
[본인 역할]: ${caseData.role}
[KPI(정량적 성과)]: ${caseData.kpi || "없음"}
[KBI(핵심행동/과정)]: ${caseData.kbi || "없음"}

[룰]:
1. 수치 성과(KPI)가 돋보이거나 완결도가 높으면 STAR를 추천하십시오.
2. 수치와는 별개로 복합적인 심리상담, 장기코칭 과정의 태도나 차별화된 개입과정이 핵심인 경우 GROW를 추천하십시오.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommended: { type: Type.STRING, description: "STAR 또는 GROW" },
            reason: { type: Type.STRING, description: "추천 사유 설명" }
          },
          required: ["recommended", "reason"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Recommend framework error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API 3: Generate detailed Narrative Case (STAR or GROW)
app.post("/api/generate-narrative-case", async (req, res) => {
  try {
    const { caseData, framework } = req.body;

    if (!caseData || !framework) {
      return res.status(400).json({ error: "필수 데이터(caseData, framework)가 누락되었습니다." });
    }

    const customKey = req.headers["x-gemini-key"] as string | undefined;
    const client = getGeminiClient(customKey);

    if (!client) {
      // Mock generation if no API key
      const isStar = framework === 'STAR';
      return res.json({
        situationOrGoal: isStar 
          ? `[Situation] 2025년 소속 기관에서 진행된 프로그램에 배정받아, 구직 취약 계층 ${caseData.target || '구직자'}를 전담하여 알선을 담당했습니다. 구체적 자격 파악 및 경력 단절 해소가 시급한 상황이었습니다.`
          : `[Goal] 내담자인 ${caseData.target || '구직자'}가 자기효능감을 회복하고 궁극적인 자립역량을 구축하여, 장기 실직 위기에서 탈출하는 구체적인 행동 목표를 정비했습니다.`,
        taskOrReality: isStar
          ? `[Task] 단기간 내에 대상자의 전공과 경력을 신설 일자리와 매칭해야 했으며, 대상자의 고질적 정보 비대칭성을 극복하고 성공적인 이력 완성이라는 과제를 수반했습니다.`
          : `[Reality] 4개월간 실직이 이어지며 이력서 10회 불합격으로 자존감이 매우 낮았고, 구직 희망 방향과 실질 시장 요구 간의 괴리가 커 일차적인 대안 마련이 부족한 현실에 처했습니다.`,
        actionOrOptions: isStar
          ? `[Action] 일주일 간격으로 매주 1회 대면 상담을 하여 역량을 꼼꼼하게 다듬었습니다. 서류 보완뿐만 아니라 멘탈 코칭과 2회의 실전 모의 면접 피드백을 통해 역량을 극대화시켰습니다. ${caseData.kbi || ''}`
          : `[Options] 행정 분야 외에 중견 기업의 총무 보조 영역까지 시장성을 열어두고 탐색했으며, 내담자가 선호하는 지역 사회 서비스를 모니터링하여 직접 서칭 범위를 조율하는 등의 3가지 입체 옵션을 설계했습니다. ${caseData.kbi || ''}`,
        resultOrWill: isStar
          ? `[Result] 그 결과 ${caseData.kpi || '성공적인 알선 달성'}의 뛰어난 수치 성과를 입증했습니다. 특히 위축되었던 구직자가 주도적 역량을 직접 자랑하는 눈부신 주체적 도약을 보였습니다.`
          : `[Will] 향후 이력 제안 프로세스를 꾸준히 수행할 실행 의지를 확고히 하였으며, 실제 알선 및 면접 참여 건수를 대폭 늘리는 등의 후속 플랜을 성공적으로 안착시켰습니다. (${caseData.kpi || '성과 완료'})`,
        insight: "본 사례에서 축적한 프로세스 중심 개입 능력을 살려 귀사 입사 후에도 매월 취업 기획 건수 향상 및 맞춤 서류 컨설팅 합격률 제고에 결정적으로 기여하겠습니다.",
        fullText: "사례 작성이 성공적으로 완료되었습니다."
      });
    }

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
- KPI(수치 성과): ${caseData.kpi || "숫자 증빙 없음"} (추정 여부: ${caseData.isKpiEstimated ? "추정치임" : "확정치임"})
- KBI(핵심 개입/행동 과정): ${caseData.kbi || "기술된 내용 없음"}

[서술 지침]:
1. "성과 및 요약 중심": 추상적이고 감성적인 형용사 표현은 배제하고, 깔끔하고 신뢰감을 주는 비즈니스 보고서 톤으로 작성하십시오.
2. "1,000자 내외 분량": 프레임워크 각각의 4단계를 정확히 구현하고, 각 단계마다 2~4문장 단위로 꼼꼼하고 논리적으로 풀어주세요.
3. "KPI & KBI 융합 기재": 마지막 단계(Result 또는 Will) 부분에는 정량적 숫자 변화(KPI)와 정성적 행동 기법(KBI)을 반드시 상호보완적으로 녹여내 주십시오.
4. "시사점(Insight) 필수": 본문 말미에 본 사례가 주는 귀한 업무적 통찰과, 입사 후 기여할 지향점(기여 방안)을 2-3문장 내외로 서술해 마쳐 주십시오.
5. "출처 반영": 원본 자료에 근거한 비비드한 서술을 하십시오. (추측으로 보완하지 않는다)

JSON 형식으로 각 단계를 별도 필드로 보장해 반환하십시오.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            situationOrGoal: { 
              type: Type.STRING, 
              description: framework === 'STAR' ? "Situation 단계 서술 (2~4문장)" : "Goal 단계 서술 (2~4문장)" 
            },
            taskOrReality: { 
              type: Type.STRING, 
              description: framework === 'STAR' ? "Task 단계 서술 (2~4문장)" : "Reality 단계 서술 (2~4문장)" 
            },
            actionOrOptions: { 
              type: Type.STRING, 
              description: framework === 'STAR' ? "Action 단계 서술 (2~4문장)" : "Options 단계 서술 (2~4문장)" 
            },
            resultOrWill: { 
              type: Type.STRING, 
              description: framework === 'STAR' ? "Result 단계 서술 (KPI+KBI 포함, 2~4문장)" : "Will 단계 서술 (KPI+KBI 포함, 2~4문장)" 
            },
            insight: { 
              type: Type.STRING, 
              description: "사례 전체의 비즈니스 시사점 및 현업 적용 방안 (Insight)" 
            }
          },
          required: ["situationOrGoal", "taskOrReality", "actionOrOptions", "resultOrWill", "insight"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Generate narrative error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API 4: SWOT Consolidation Based on Specific User Evidences
app.post("/api/generate-swot", async (req, res) => {
  try {
    const { swotAnswers, name, activeFields } = req.body;

    if (!swotAnswers) {
      return res.status(400).json({ error: "SWOT 응답 근거가 누락되었습니다." });
    }

    const customKey = req.headers["x-gemini-key"] as string | undefined;
    const client = getGeminiClient(customKey);

    if (!client) {
      // Return safe standard SWOT
      return res.json({
        strength: `[S 강점]: ${swotAnswers.strength || "개인 맞춤형 1:1 진단과 설득력이 강점이며 이를 바탕으로 빠른 채용 연계 가능"}`,
        weakness: `[W 보완책]: ${swotAnswers.weakness || "상담 업무 시 공감 수준 제어로 감정 관리 및 행정 표준화를 꾸준히 이행 중"}`,
        opportunity: `[O 기회]: ${swotAnswers.opportunity || "정부 주도의 중장년 재취업 지원 강화 정책으로 맞춤 컨설턴트 수요 확대"}`,
        threat: `[T 위협]: ${swotAnswers.threat || "상담 자동화 AI 툴 보급에 맞추어 디지털 기반 컨설팅 역량을 연마하며 위협 극복"}`
      });
    }

    const prompt = `
당신은 직업상담사의 개인 능력과 외부 환경 요인을 매칭하는 전문 포트폴리오 컨설턴트입니다.
사용자가 입력한 아래 SWOT 실경험 근거를 바탕으로, 인사담당자가 수긍할 수 있는 논리적이고 세련된 보고서용 SWOT 분석 문장(항목당 1~2문장)을 정제해 주십시오.

[상담사 이름]: ${name || "직업상담사"}
[핵심 분야]: ${activeFields ? activeFields.join(", ") : ""}

[제공된 개별 근거]:
- S(실제 다른 상담사와 차별화된 본인 강점 상황): ${swotAnswers.strength || "미제공 - 주도적 행동 기반 정제 요구"}
- W(본인이 체감하는 보완점 및 이를 위한 실질적 보완 노력): ${swotAnswers.weakness || "미제공"}
- O(최근 직접 체감한 직군 내 정책/시장 기획 요인): ${swotAnswers.opportunity || "미제공"}
- T(채용 경쟁 심화 등 직접 한 위협 체감): ${swotAnswers.threat || "미제공"}

[작성 및 서술 규칙]:
1. "역량 키워드 반복 금지": 프로필 부분과 단어가 중복되지 않도록 하되, 강점(S)은 실사례 상황 기반으로 가다듬으십시오.
2. "W의 강점 전환 기술": 보완점(W)은 단순히 단점만 나열하는 것이 아니라, 부족함을 자각하고 구체적으로 학습·개선하여 실제 성과로 바꾸어가는 능동적인 문장으로 정성스레 서술해 주세요.
3. "일반론 금지": 누구에게나 해당되는 공통 내용(예: '직업상담사는 친절하다')을 쓰지 말고, 구체적인 상담 사례 중심 성격과 시장 변화 중심 단어를 활용하십시오.

JSON 형식으로 strength, weakness, opportunity, threat 필드를 채워 주십시오.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strength: { type: Type.STRING },
            weakness: { type: Type.STRING },
            opportunity: { type: Type.STRING },
            threat: { type: Type.STRING }
          },
          required: ["strength", "weakness", "opportunity", "threat"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("SWOT error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API 5: Generate Title & Logo Slogans
app.post("/api/generate-portfolio-slogans", async (req, res) => {
  try {
    const { totalExperience, activeFields, companyName } = req.body;

    const customKey = req.headers["x-gemini-key"] as string | undefined;
    const client = getGeminiClient(customKey);

    if (!client) {
      return res.json({
        slogans: [
          "심층 상담부터 맞춤 매칭까지, 구직자와 함께 성공적인 취업 경로를 만드는 직업상담 전문가",
          "경력단절 및 취약계층의 역량을 발견하고 실질적인 고용 연계를 지원하는 맞춤 인재 파트너",
          "현장 중심 상담 노하우와 데이터 분석으로 안정적인 취업률을 달성하는 성과 지향 취업 컨설턴트"
        ]
      });
    }

    const prompt = `
당신은 직업상담사 커리어 포트폴리오의 타이틀 슬로건을 기획하는 전문 카피라이터입니다.
상담사 정보: ${totalExperience || '신입'} 경력, 핵심역량분야: ${activeFields ? activeFields.join(", ") : "취업 상담"}, 이전 소속기관: ${companyName || "고용 유관 단체"}.

인사담당자가 한눈에 직무적 진정성과 성과지향주의를 단번에 이해할 수 있는 전문적이고 무게감 있는 비즈니스 '한 줄 슬로건' 3가지를 제안하십시오.
과장되거나 뜬구름 잡는 화려한 미사여구는 빼고, 성과와 기여가 드러나는 수려하고 깔끔한 한국어 명사 종결형 슬로건이어야 합니다.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slogans: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["slogans"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Slogan generation error:", error);
    res.status(500).json({ error: error.message });
  }
});


// Dev vs production Vite routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT} in env: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
