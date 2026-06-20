import React from 'react';
import { CheckCircle2, Circle, FileText, Briefcase, Award, TrendingUp, HelpCircle } from 'lucide-react';
import { CareerPortfolio, QuestionId } from '../types';

interface SidebarStatusProps {
  portfolio: CareerPortfolio;
  currentQId: QuestionId;
  onJumpToQuestion?: (qId: QuestionId) => void;
}

export default function SidebarStatus({ portfolio, currentQId, onJumpToQuestion }: SidebarStatusProps) {
  const steps = [
    {
      section: 'A. 경력 개요 (Career Profile)',
      icon: Briefcase,
      items: [
        { id: 'Q1', label: '총 경력 기간', value: portfolio.totalExperience },
        { id: 'Q2', label: '소속 기관명', value: portfolio.companyName },
        { id: 'Q3', label: '직급', value: portfolio.jobTitle },
        { id: 'Q4', label: '재직 기간', value: portfolio.employmentPeriod },
      ]
    },
    {
      section: 'B. 활동 분야 (Fields)',
      icon: Award,
      items: [
        { id: 'Q5', label: '핵심 활동 분야', value: portfolio.activeFields.length > 0 ? `${portfolio.activeFields.length}개 분야` : '' },
      ]
    },
    {
      section: 'C/D. 대표 사례 (Cases)',
      icon: FileText,
      items: [
        { id: 'Q6', label: '사례 수집 및 요약', value: portfolio.cases.length > 0 ? `${portfolio.cases.length}건 작성 중` : '' },
      ]
    },
    {
      section: 'E. SWOT 분석 (SWOT)',
      icon: TrendingUp,
      items: [
        { id: 'Q12', label: 'S (강점 근거)', value: portfolio.swot.strength },
        { id: 'Q13', label: 'W (보완점/대책)', value: portfolio.swot.weakness },
        { id: 'Q14', label: 'O (기회 요인)', value: portfolio.swot.opportunity },
        { id: 'Q15', label: 'T (위협 요인)', value: portfolio.swot.threat },
      ]
    },
    {
      section: 'F. 자격 및 기술 (Skills)',
      icon: HelpCircle,
      items: [
        { id: 'Q16', label: '보유 자격증', value: portfolio.certifications.length > 0 ? `${portfolio.certifications.length}개` : '' },
        { id: 'Q17', label: '행정 및 매칭 툴', value: portfolio.tools.length > 0 ? `${portfolio.tools.length}개` : '' },
      ]
    }
  ];

  return (
    <div className="bg-white border border-brand-navy/15 rounded-none p-5 shadow-md space-y-5">
      <div className="pb-3.5 border-b border-brand-navy/15">
        <h3 className="font-bold text-xs text-brand-navy uppercase tracking-widest mb-2 flex justify-between items-center">
          <span>워크플로우 진척도</span>
          <span className="text-white bg-brand-navy font-mono font-bold border border-brand-navy px-2 py-0.5 text-[11px] shadow-sm">
            {calculateCompletionRate(portfolio)}%
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-slate-100 border border-slate-200 rounded-none overflow-hidden p-0.5">
            <div 
               className="h-full bg-brand-sky transition-all duration-500 rounded-none border-r border-brand-navy/30" 
              style={{ width: `${calculateCompletionRate(portfolio)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-brand-navy uppercase tracking-widest">
                <Icon className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span>{sec.section}</span>
              </div>
              <ul className="space-y-1 pl-3 border-l border-brand-navy/15">
                {sec.items.map((item) => {
                  const isCompleted = !!item.value;
                  const isActive = currentQId === item.id || 
                    (item.id === 'Q6' && ['Q6','Q7','Q8','Q9','Q10','Q11'].includes(currentQId));

                  return (
                    <li 
                      key={item.id}
                      onClick={() => onJumpToQuestion?.(item.id as QuestionId)}
                      className={`group flex items-center justify-between py-1.5 text-xs transition-all cursor-pointer rounded-none px-2 -ml-2 border ${
                        isActive 
                          ? 'bg-brand-sky/40 border-brand-navy text-brand-navy font-bold shadow-sm' 
                          : 'border-transparent hover:bg-slate-50 text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-navy fill-brand-sky shrink-0 stroke-[2.5]" />
                        ) : isActive ? (
                          <div className="w-2.5 h-2.5 bg-brand-teal rounded-none shrink-0 border border-brand-teal animate-pulse" />
                        ) : (
                          <div className="w-2.5 h-2.5 border border-slate-300 bg-white rounded-none shrink-0" />
                        )}
                        <span className={`transition-colors text-[11px] truncate ${isActive ? 'font-bold text-brand-navy' : isCompleted ? 'text-brand-navy font-semibold' : 'text-slate-500'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`text-[9px] truncate max-w-[85px] text-right font-mono px-1 font-bold ${isActive ? 'text-brand-navy' : 'text-slate-400'}`}>
                        {item.value ? (item.value.length > 25 ? `${item.value.slice(0, 25)}...` : item.value) : '대기'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calculateCompletionRate(portfolio: CareerPortfolio): number {
  const totalTasks = 12; // Q1, Q2, Q3, Q4, Q5, cases, Q12, Q13, Q14, Q15, Q16, Q17
  let completedTasks = 0;

  if (portfolio.totalExperience) completedTasks++;
  if (portfolio.companyName) completedTasks++;
  if (portfolio.jobTitle) completedTasks++;
  if (portfolio.employmentPeriod) completedTasks++;
  if (portfolio.activeFields.length > 0) completedTasks++;
  if (portfolio.cases.length > 0) completedTasks++;
  if (portfolio.swot.strength) completedTasks++;
  if (portfolio.swot.weakness) completedTasks++;
  if (portfolio.swot.opportunity) completedTasks++;
  if (portfolio.swot.threat) completedTasks++;
  if (portfolio.certifications.length > 0) completedTasks++;
  if (portfolio.tools.length > 0) completedTasks++;

  return Math.round((completedTasks / totalTasks) * 100);
}
