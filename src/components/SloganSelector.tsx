import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface SloganSelectorProps {
  currentSlogan: string;
  onSelectSlogan: (slogan: string) => void;
}

export default function SloganSelector({ currentSlogan, onSelectSlogan }: SloganSelectorProps) {
  const [customSlogan, setCustomSlogan] = useState('');

  const prefilledOptions = [
    "심층 상담부터 맞춤 매칭까지, 구직자와 함께 성공적인 취업 경로를 만드는 직업상담 전문가",
    "경력단절 및 취약계층의 역량을 발견하고 실질적인 고용 연계를 지원하는 맞춤 인재 파트너",
    "현장 중심 상담 노하우와 데이터 분석으로 안정적인 취업률을 달성하는 성과 지향 취업 컨설턴트",
    "구직자의 심리적 안정과 자신감 회복을 돕고 지속 가능한 일자리를 매칭하는 직업상담사"
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSlogan.trim()) {
      onSelectSlogan(customSlogan.trim());
      setCustomSlogan('');
    }
  };

  return (
    <div className="bg-white border border-brand-navy/15 rounded-none p-5 shadow-md space-y-4">
      <div>
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
          <span className="bg-brand-navy text-white px-2 py-0.5 border border-brand-navy">타이틀 및 카피라이팅 한 줄 슬로건 설정</span>
        </h4>
        <p className="text-[11px] text-brand-teal/80 font-bold leading-normal">인사의 첫인상입니다. 성과 지향적이고 진정성 있는 한 줄 슬로건을 선택하거나 직접 입력하십시오.</p>
      </div>

      {/* List of default options */}
      <div className="space-y-2">
        {prefilledOptions.map((option, idx) => {
          const isSelected = currentSlogan === option;
          return (
            <button
              key={idx}
              onClick={() => onSelectSlogan(option)}
              className={`text-left w-full p-3 rounded-none text-xs transition-all border flex items-start gap-2.5 cursor-pointer ${
                isSelected 
                  ? 'bg-brand-sky/40 border-brand-navy text-brand-navy font-bold shadow-sm' 
                  : 'bg-slate-50 border-slate-150 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-none'
              }`}
            >
              <span className={`w-4 h-4 rounded-none border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                isSelected ? 'bg-brand-navy border-brand-navy text-white' : 'border-slate-350 bg-white'
              }`}>
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-brand-sky" />}
              </span>
              <span className="leading-relaxed font-bold text-[11px]">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Manual Input form */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
        <input
          type="text"
          value={customSlogan}
          onChange={(e) => setCustomSlogan(e.target.value)}
          placeholder="나만의 맞춤 슬로건 한 줄을 직접 작성해 보세요..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-brand-teal focus:bg-white placeholder-slate-400 font-bold"
        />
        <button
          type="submit"
          disabled={!customSlogan.trim()}
          className="bg-brand-navy hover:bg-brand-teal text-white border border-brand-navy px-4 py-2 rounded-none text-xs font-bold shrink-0 cursor-pointer disabled:opacity-30 transition-all shadow-sm"
        >
          직접 반영
        </button>
      </form>
    </div>
  );
}
