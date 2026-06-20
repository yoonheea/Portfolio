import React, { useRef } from 'react';
import { 
  Copy, 
  Printer, 
  Download, 
  Award, 
  Zap, 
  ShieldAlert, 
  Map, 
  Code, 
  BookOpen, 
  Building, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CareerPortfolio } from '../types';

interface PortfolioViewerProps {
  portfolio: CareerPortfolio;
  onSelectSlogan?: (slogan: string) => void;
}

export default function PortfolioViewer({ portfolio, onSelectSlogan }: PortfolioViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Trigger default browser print on specific print container
  const handlePrint = () => {
    window.print();
  };

  // Copy full portfolio as markdown or text to clipboard
  const handleCopyText = () => {
    const text = generatePlaintext(portfolio);
    navigator.clipboard.writeText(text);
    alert("포트폴리오 내용전체가 클립보드에 성공적으로 복사되었습니다! 원하시는 곳에 붙여넣어(Ctrl+V) 활용해 보세요.");
  };

  // Check if at least some basic information has been filled
  const isEmpty = !portfolio.name && !portfolio.totalExperience && !portfolio.companyName && !portfolio.jobTitle && portfolio.cases.length === 0;

  return (
    <div className="bg-white border border-brand-navy/15 rounded-none p-5 shadow-md h-full flex flex-col">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-navy/25 mb-5">
        <div>
          <h2 className="text-sm font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <span>실시간 포트폴리오 결과물 미리보기</span>
            <span className="text-[9px] bg-brand-navy text-white border border-brand-navy px-2 py-0.5 rounded-none font-bold font-mono tracking-widest leading-none">
              보고서 표준 규격 (A4)
            </span>
          </h2>
          <p className="text-[11px] text-brand-teal font-extrabold">작성 내용이 아래 보고서 서식에 즉시 반영됩니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-brand-navy bg-white hover:bg-brand-sky/20 border border-brand-navy/35 rounded-none transition-all cursor-pointer shadow-sm active:translate-y-0.5"
          >
            <Copy className="w-3.5 h-3.5 text-brand-navy" />
            <span>본문 복사</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-navy hover:bg-brand-teal border border-brand-navy rounded-none transition-all cursor-pointer shadow-sm active:translate-y-0.5"
          >
            <Printer className="w-3.5 h-3.5 text-brand-sky" />
            <span>A4 인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner overlay */}
      {isEmpty && (
        <div className="bg-brand-sky/20 border border-brand-teal/20 rounded-none p-4 mb-5 flex gap-2.5 items-start text-brand-navy shadow-sm">
          <AlertCircle className="w-4.5 h-4.5 text-brand-navy shrink-0 mt-0.5" />
          <div className="text-[11px] font-bold leading-relaxed text-brand-navy">
            <p className="font-extrabold text-brand-navy mb-1">인사 담당자용 커리어 가동성 정보 구축을 시작해 보세요!</p>
            <p className="text-brand-navy/85">
              오른쪽 컨설팅 대화 패널에서 파일(우수사례집, 일지 등)을 전송 또는 간단하게 단일 질문에 한 문장씩 답하시면, 실시간 빌더가 최고 수준의 문장력을 가미하여 성과 포트폴리오로 승화시킵니다.
            </p>
          </div>
        </div>
      )}

      {/* Main Document Body */}
      <div 
        ref={printRef}
        id="print-portfolio-document"
        className="flex-1 overflow-y-auto max-h-[75vh] pr-1 print:overflow-visible print:max-h-none print:p-0"
        style={{ contentVisibility: 'auto' }}
      >
        <div className="border border-brand-navy/10 rounded-none p-6 bg-white print:border-none print:shadow-none print:p-0 flex flex-col font-sans text-slate-900 space-y-6 shadow-md">
          
          {/* Section 1: 타이틀 및 헤드카피 (Slogan & Title) */}
          <header className="flex justify-between items-end border-b border-brand-navy/10 pb-4 mb-1">
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-white bg-brand-navy px-2 py-0.5 inline-block font-bold border border-brand-navy">PORTFOLIO DOSSIER</p>
              <h1 className="text-xl md:text-2xl font-bold text-brand-navy tracking-tight">직업상담사 커리어 포트폴리오</h1>
              <p className="text-xs text-brand-teal font-bold italic max-w-xl leading-relaxed">
                "{portfolio.slogan || "심층 상담부터 맞춤 매칭까지, 구직자와 함께 성공적인 취업 경로를 만드는 직업상담 전문가"}"
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="bg-brand-teal text-white px-2 py-0.5 text-[9px] font-bold uppercase mb-1.5 tracking-wider rounded-none border border-brand-teal">Verified Expert</div>
              <p className="text-[10.5px] text-slate-600 font-bold">인재: <span className="font-bold text-brand-navy underline decoration-brand-sky decoration-4 underline-offset-4">{portfolio.name || "이민수"}</span></p>
            </div>
          </header>

          {/* Section 2: 프로필 및 핵심 역량 (Profile & Competencies) */}
          <section className="bg-slate-50 border border-slate-200 p-4 rounded-none flex flex-col gap-3.5 shadow-sm">
            <div className="flex items-center">
              <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest bg-brand-sky/45 border border-brand-teal/20 px-2.5 py-1 inline-block">
                01. 프로필 및 핵심 역량
              </h2>
            </div>
            <div className="text-[11px] leading-relaxed text-slate-700 font-bold">
              총 <strong className="text-brand-navy font-bold">{portfolio.totalExperience || "3년 (예시)"}</strong> 의 경력을 활용하여 고용노동부 직업 훈련, 자소서 및 모의 면접 교정, 일련의 알선 업무를 총괄해 왔습니다. 
              특히 <strong className="text-brand-navy font-bold">{portfolio.companyName || "유관 상담센터 (예시)"}</strong> 등에서의 업무를 통해 내담자의 입체적 직무 매칭과 정확한 상담 성과를 구현합니다.
            </div>
            
            {portfolio.activeFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-slate-200 pt-2.5">
                {portfolio.activeFields.map((field, fIdx) => (
                  <span key={fIdx} className="bg-brand-sky/50 text-brand-navy text-[10px] font-bold px-2.5 py-1 border border-brand-teal/20 rounded-none shadow-sm">
                    #{field}
                  </span>
                ))}
                {portfolio.activeFieldsCustom && (
                  <span className="bg-brand-teal text-white text-[10px] font-bold px-2.5 py-1 border border-brand-teal rounded-none shadow-sm">
                    #{portfolio.activeFieldsCustom}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-1.5">
              <div className="p-3 bg-white border border-slate-200 rounded-none shadow-sm">
                <p className="text-[11px] font-bold text-brand-navy bg-brand-sky/30 border border-brand-sky/20 px-1.5 py-0.5 inline-block mb-1">[분야] 맞춤형 채용 매칭 및 알선</p>
                <p className="text-[10px] text-slate-600 leading-relaxed font-bold mt-1">강점 재정립을 통한 취약 계층 채용 장벽 극복 및 구직 종합성공률 향상</p>
                <div className="mt-2 text-[9px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 inline-block">KPI: 평균 취업성공률 87% 내외 달성</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-none shadow-sm">
                <p className="text-[11px] font-bold text-brand-navy bg-brand-sky/30 border border-brand-sky/20 px-1.5 py-0.5 inline-block mb-1">[코칭] 입체진단 KBI 솔루션</p>
                <p className="text-[10px] text-slate-600 leading-relaxed font-bold mt-1">표준화 자소서 고도화 및 면접 탈피 피드백 기법 표준화</p>
                <div className="mt-2 text-[9px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 inline-block">KBI: 1:1 밀착 클리닉 후 면접 합격률 기여</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-none shadow-sm">
                <p className="text-[11px] font-bold text-brand-navy bg-brand-sky/30 border border-brand-sky/20 px-1.5 py-0.5 inline-block mb-1">[운영] 행정 프로세스 기획</p>
                <p className="text-[10px] text-slate-600 leading-relaxed font-bold mt-1">작성 표준 템플릿 도입을 활용한 행정 소요 시간 및 사이클 주 단축</p>
                <div className="mt-2 text-[9px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 inline-block">지표: 월 행정 처리 건수 및 효율 40% 단축</div>
              </div>
            </div>
          </section>

          {/* Section 3: SWOT 분석 */}
          <section className="bg-brand-navy text-white p-5 rounded-none border border-brand-navy/20 shadow-sm">
            <h2 className="text-xs font-bold text-brand-sky mb-3.5 uppercase tracking-widest inline-block border-b border-brand-sky/30 pb-0.5">
              02. SWOT 분석
            </h2>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-none space-y-1">
                <p className="text-brand-sky font-bold tracking-wider">STRENGTH (핵심 강점)</p>
                <p className="text-slate-300 leading-relaxed font-bold">
                  {portfolio.swot.strength || "상담 타겟별 이전 직무 특성을 정확히 분석하여 고품질 채용정보 12건 이상을 선별 발굴하고, 1:1로 빈틈없는 이력 매칭을 설계할 수 있는 강점 실무력을 보유하고 있습니다."}
                </p>
              </div>
              <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-none space-y-1">
                <p className="text-white font-bold tracking-wider">WEAKNESS (보완요소 및 대책)</p>
                <p className="text-slate-300 leading-relaxed font-bold">
                  {portfolio.swot.weakness || "질적 상담 심취 시 가동 행정이 지연될 수 있었으나, 이를 전격 보완하기 위해 마인드 제어 훈련 및 주기적인 행정 서식 표준화 템플릿(상담 보고 시간 단축)을 실천하여 극복하고 있습니다."}
                </p>
              </div>
              <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-none space-y-1">
                <p className="text-brand-sky font-bold tracking-wider">OPPORTUNITY (환경 기회)</p>
                <p className="text-slate-300 leading-relaxed font-bold">
                  {portfolio.swot.opportunity || "정부의 중장년 이상 신설 지원 정책 및 기업의 중장년 대체 인력 선호 흐름이 강화되면서, 맞춤 가치관 설계가 우수한 상담사의 실무적 전문성이 한층 더 높게 평가받고 있습니다."}
                </p>
              </div>
              <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-none space-y-1">
                <p className="text-slate-300 font-bold tracking-wider">THREAT (위협 대응 전략)</p>
                <p className="text-slate-300 leading-relaxed font-bold">
                  {portfolio.swot.threat || "AI 상담 서비스 툴 보급 및 경쟁 심화가 있으나, 감정적 공감 모니터링을 더한 고차원 1:1 대인 컨설팅과 정량적 피드백 프로세스로 초개인화 서비스를 강화하여 대응합니다."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: 주요 경력 요약 */}
          <section className="bg-white border border-brand-navy/15 p-4 rounded-none shadow-sm">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest pl-2 mb-3 border-l-4 border-brand-navy">
              03. 주요 경력 요약
            </h2>
            <div className="overflow-x-auto rounded-none border border-brand-navy/15">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-brand-sky text-brand-navy border-b border-brand-navy/15">
                    <th className="p-2.5 font-bold text-[11px]">소속 기관</th>
                    <th className="p-2.5 font-bold text-[11px]">재직 기간</th>
                    <th className="p-2.5 font-bold text-[11px]">직급</th>
                    <th className="p-2.5 font-bold text-[11px]">핵심 담당 업무</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-navy/10 text-[11px] text-slate-800 font-bold">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-black text-brand-navy">
                      {portfolio.companyName || "[기관명 미입력 - 예시: 서초여성인력개발센터]"}
                    </td>
                    <td className="p-2.5 text-slate-700 font-mono">
                      {portfolio.employmentPeriod || "[재직기간 미입력 - 예시: 2024.01 ~ 2026.05]"}
                    </td>
                    <td className="p-2.5 text-slate-800">
                      {portfolio.jobTitle || "[직급 미입력 - 예시: 전임상담사]"}
                    </td>
                    <td className="p-2.5 text-slate-700">
                      {portfolio.activeFields.length > 0 
                        ? portfolio.activeFields.join(", ") 
                        : "구직자 상담, 이력서 첨삭, 취업 알선, 취업특강 기획 및 원스톱 채용 지원"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: 대표 사례 상세 분석 */}
          <section className="bg-white border border-brand-navy/15 p-4 rounded-none shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest pl-2 mb-3.5 border-l-4 border-brand-navy">
              04. 대표 사례 상세 분석
            </h2>
            
            {portfolio.cases.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-8 rounded-none text-center text-xs text-slate-400 font-bold">
                수집 완료된 구체적 대표 사례 분석이 없습니다. <br />
                오른쪽에서 구인 알선 또는 가동성 개선 사례 정보를 입력해 주세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.cases.map((cs, cIdx) => {
                  const isStar = cs.frameworkSelected === 'STAR';
                  const narrative = cs.narrativeResult;
                  const isFirst = cIdx === 0;
 
                  return (
                    <div 
                      key={cs.id} 
                      className={`border border-brand-navy/15 rounded-none p-4 flex flex-col h-full transition-all shadow-sm ${
                        isFirst ? 'bg-brand-sky/10 border-brand-navy' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-brand-navy/15">
                        <span className={`${
                          isFirst ? 'bg-brand-navy text-white' : 'bg-brand-teal text-white'
                        } px-2 py-0.5 text-[9px] font-bold border border-brand-navy/10 tracking-wider rounded-none`}>
                          CASE 0{cIdx + 1}: {cs.frameworkSelected || 'STAR'}
                        </span>
                        <span className={`text-[9px] font-bold tracking-widest uppercase ${
                          isFirst ? 'text-brand-navy bg-brand-sky px-1 border border-brand-teal/15' : 'text-slate-500'
                        }`}>
                          {isStar ? '알선 성공 사례' : '업무 효율 개선'}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold text-brand-navy mb-1.5 leading-tight">
                        {cs.title || "사례 제목 내용기입"}
                      </p>
                      
                      <div className="text-[10px] text-slate-500 font-mono mb-3.5 flex gap-1.5 font-bold">
                        <span>기간: {cs.period || "미지정"}</span>
                        <span>•</span>
                        <span>구직층: {cs.target || "미지정"}</span>
                      </div>

                      {narrative ? (
                        <div className="text-[11px] text-slate-700 space-y-2.5 flex-1 select-text font-bold leading-relaxed">
                          <p><strong className="text-brand-navy font-extrabold">{isStar ? 'S (상황): ' : 'G (목표): '}</strong>{narrative.situationOrGoal}</p>
                          <p><strong className="text-brand-navy font-extrabold">{isStar ? 'T (과제): ' : 'R (현실): '}</strong>{narrative.taskOrReality}</p>
                          <p><strong className="text-brand-navy font-extrabold">{isStar ? 'A (행동): ' : 'O (대안): '}</strong>{narrative.actionOrOptions}</p>
                          <p><strong className="text-brand-navy font-extrabold">{isStar ? 'R (성과): ' : 'W (의지): '}</strong>{narrative.resultOrWill}</p>
                          
                          <p className={`pt-2.5 border-t border-slate-150 italic font-bold text-[10px] ${
                            isFirst ? 'text-brand-navy bg-brand-sky px-1 border border-brand-teal/15' : 'text-slate-500'
                          }`}>
                            Insight: {narrative.insight}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-none text-[10.5px] text-slate-500 italic mt-auto font-bold">
                          사례 원천 기록이 수입되었습니다. AI 분석 생성을 진행해 주세요.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 6: 전문 자격 및 실무 활용 툴 기술 */}
          <section className="bg-brand-beige border border-brand-teal/15 p-4 rounded-none flex flex-wrap justify-between items-center gap-4 shadow-sm">
            <div className="flex flex-wrap gap-5">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-brand-teal font-extrabold block mb-1">Certifications</span>
                <span className="text-xs font-bold text-brand-navy">
                  {portfolio.certifications.length > 0 
                    ? portfolio.certifications.join(", ") 
                    : "직업상담사 2급, 사회복지사 2급, 인사관리사 (예시)"}
                </span>
              </div>
              <div className="border-l border-brand-teal/20 pl-5">
                <span className="text-[9px] uppercase tracking-wider text-brand-teal font-extrabold block mb-1">Technical Tools</span>
                <span className="text-xs font-bold text-brand-navy underline decoration-brand-teal/30 decoration-slice decoration-2">
                  {portfolio.tools.length > 0 
                    ? portfolio.tools.join(", ") 
                    : "Excel(Advanced), PPT, ChatGPT, 사람인/워크넷 등 구인포털 매칭툴 관리"}
                </span>
              </div>
            </div>
            
            <div className="bg-brand-sky/40 px-3.5 py-2 rounded-none text-right shrink-0">
              <p className="text-[10px] font-extrabold text-brand-navy tracking-tight italic">
                "Professionalism in every career step."
              </p>
            </div>
          </section>

          {/* Footnote Signature */}
          <footer className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono tracking-tight pb-1">
            본 포트폴리오는 직업상담사 전문성 맞춤 보고서 서식에 따라 HRM 성과 중심으로 작성 및 증명되었습니다.
          </footer>

        </div>
      </div>
    </div>
  );
}

// Generate full text layout of career portfolio for clean text copying
function generatePlaintext(p: CareerPortfolio): string {
  let text = `====================================================\n`;
  text += `직업상담사 커리어 포트폴리오 보고서 (인사담당자 송부용)\n`;
  text += `====================================================\n\n`;
  
  text += `■ 핵심 슬로건: "${p.slogan || "심층 상담부터 맞춤 매칭까지, 구직자와 함께 성공적인 취업 경로를 만드는 직업상담 전문가"}"\n`;
  text += `■ 후보 성명: ${p.name || "미입력"}\n`;
  text += `■ 총 경력 기간: ${p.totalExperience || "미입력"}\n`;
  text += `■ 주요 소속 기관: ${p.companyName || "미입력"} (${p.employmentPeriod || "재직 기간 미입력"})\n`;
  text += `■ 주요 직급: ${p.jobTitle || "미입력"}\n`;
  
  if (p.activeFields.length > 0) {
    text += `■ 핵심 활동 분야: ${p.activeFields.join(", ")} ${p.activeFieldsCustom ? `(${p.activeFieldsCustom})` : ""}\n`;
  }
  text += `\n---------------------------------------------\n`;
  text += `01. 직무 관련 전문성 SWOT 분석 결과\n`;
  text += `---------------------------------------------\n`;
  text += `▶ [STRENGTH] 강점: ${p.swot.strength || "사례 진단 및 채용 매칭 매뉴얼 활용 강점"}\n`;
  text += `▶ [WEAKNESS] 보완 및 대책: ${p.swot.weakness || "상담 지연을 서식 표준화 템플릿과 AI 툴 도입으로 효율적 보완 완료"}\n`;
  text += `▶ [OPPORTUNITY] 기회 요인: ${p.swot.opportunity || "정책상 중장년 이상 신설 지원 강화 및 대체 수요 증대 시장 국면"}\n`;
  text += `▶ [THREAT] 위협 요인 및 해결: ${p.swot.threat || "AI 챗봇 상담 보급에 맞서 1:1 대면 밀착 감정 교감 상담 고도화로 차별 확보"}\n\n`;

  text += `---------------------------------------------\n`;
  text += `02. 대표적 취업 성공 및 상담 가동성 혁신 사례\n`;
  text += `---------------------------------------------\n`;
  
  if (p.cases.length === 0) {
    text += `(작성 완료된 대표 사례가 없습니다)\n`;
  } else {
    p.cases.forEach((cs, idx) => {
      text += `[사례 0${idx + 1}] ${cs.title}\n`;
      text += `- 기간: ${cs.period}\n`;
      text += `- 대상 구직층: ${cs.target}\n`;
      text += `- 본인 역할: ${cs.role}\n`;
      text += `- 적용 프레임워크: ${cs.frameworkSelected || "미기재"}\n`;
      
      if (cs.narrativeResult) {
        const nr = cs.narrativeResult;
        text += cs.frameworkSelected === 'STAR' 
          ? `  - Situation (상황): ${nr.situationOrGoal}\n  - Task (과제): ${nr.taskOrReality}\n  - Action (행동): ${nr.actionOrOptions}\n  - Result (성과): ${nr.resultOrWill}\n`
          : `  - Goal (목표): ${nr.situationOrGoal}\n  - Reality (현실): ${nr.taskOrReality}\n  - Options (대안): ${nr.actionOrOptions}\n  - Will (실행): ${nr.resultOrWill}\n`;
        text += `  - 시사점 및 현업 기여 방안 (Insight): ${nr.insight}\n`;
      } else {
        text += `  * 정량적 성과(KPI): ${cs.kpi || "미소장"}\n  * 정성적 개역(KBI): ${cs.kbi || "미소장"}\n`;
      }
      text += `\n`;
    });
  }

  text += `---------------------------------------------\n`;
  text += `03. 보유 전문 자격증 및 업무 활용 툴 목록\n`;
  text += `---------------------------------------------\n`;
  text += `▶ 자격증: ${p.certifications.length > 0 ? p.certifications.join(", ") : "미지정"}\n`;
  text += `▶ 정보 툴 및 AI 활용도: ${p.tools.length > 0 ? p.tools.join(", ") : "미지정"}\n\n`;
  text += `※ 상기 모든 경력 및 성과는 수집된 근거를 기반으로 작성되었습니다.\n`;

  return text;
}
