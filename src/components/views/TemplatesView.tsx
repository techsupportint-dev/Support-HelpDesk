import React from 'react';
import { TEMPLATES } from '../../data/constants';
import { useData } from '../../context/DataContext';

export const TemplatesView: React.FC = () => {
  const { addToast } = useData();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('Template copied to clipboard', 'success');
    }).catch(() => {
      addToast('Could not copy to clipboard', 'warn');
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Communication templates:</strong> Copy these standardized operational responses and replace the bracketed placeholders. Never request passwords or OTPs.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map(t => (
          <div key={t.name} className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-[#060527]">{t.name}</h3>
                <button
                  type="button"
                  onClick={() => handleCopy(t.text)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors border border-slate-200"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 font-mono">
                {t.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
