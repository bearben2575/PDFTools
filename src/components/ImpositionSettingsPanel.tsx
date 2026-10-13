import React from 'react';
import {
  SlidersHorizontal,
  Scissors,
  FileCheck2,
  RotateCw,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ImpositionSettings } from '../types/invoice';

interface ImpositionSettingsPanelProps {
  settings: ImpositionSettings;
  onSettingsChange: (settings: ImpositionSettings) => void;
}

export const ImpositionSettingsPanel: React.FC<ImpositionSettingsPanelProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const update = <K extends keyof ImpositionSettings>(key: K, val: ImpositionSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: val,
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all">
      {/* Header bar toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-left text-xs font-semibold text-slate-700 transition"
      >
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span>A4 智能拼版与报销参数</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-[11px] font-normal text-slate-500">
            {settings.layoutMode === '2-up-vertical' ? 'A4双联 (2合1)' : '单张居中'} ·{' '}
            {settings.showCutLine ? '带裁剪线' : '无裁剪线'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 text-xs">
          {/* Row 1: Layout & Cut line */}
          <div className="grid grid-cols-2 gap-3">
            {/* Layout Mode */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5 flex items-center space-x-1">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                <span>页面拼版方式</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => update('layoutMode', '2-up-vertical')}
                  className={`py-1.5 px-2 rounded-md font-medium text-center transition ${
                    settings.layoutMode === '2-up-vertical'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  双联 2合1
                </button>
                <button
                  type="button"
                  onClick={() => update('layoutMode', '1-up-center')}
                  className={`py-1.5 px-2 rounded-md font-medium text-center transition ${
                    settings.layoutMode === '1-up-center'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  单张 1合1
                </button>
              </div>
            </div>

            {/* Cut line toggle */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5 flex items-center space-x-1">
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                <span>中间虚线裁剪线</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => update('showCutLine', true)}
                  className={`py-1.5 px-2 rounded-md font-medium text-center transition ${
                    settings.showCutLine
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  打印裁剪线
                </button>
                <button
                  type="button"
                  onClick={() => update('showCutLine', false)}
                  className={`py-1.5 px-2 rounded-md font-medium text-center transition ${
                    !settings.showCutLine
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  隐藏
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Margin & Auto-rotate */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            {/* Margin Preset */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">页面边距间距</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-center">
                {(['compact', 'standard', 'relaxed'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update('marginPreset', m)}
                    className={`py-1 rounded text-[11px] font-medium transition ${
                      settings.marginPreset === m
                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {m === 'compact' ? '紧凑' : m === 'standard' ? '标准' : '宽松'}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Rotate */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5 flex items-center space-x-1">
                <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                <span>纵向票据自动横旋</span>
              </label>
              <label className="flex items-center space-x-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoRotate}
                  onChange={(e) => update('autoRotate', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-600">自动旋转匹配半页</span>
              </label>
            </div>
          </div>

          {/* Row 3: Reimbursement Cover Sheet */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-1.5 font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.includeSummaryCover}
                  onChange={(e) => update('includeSummaryCover', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>附带生成「财务报销汇总封面单」</span>
              </label>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                自动大写金额与明细表
              </span>
            </div>

            {settings.includeSummaryCover && (
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2.5 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">报销人姓名</span>
                    <input
                      type="text"
                      placeholder="例如：张三"
                      value={settings.applicantName}
                      onChange={(e) => update('applicantName', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">报销部门</span>
                    <input
                      type="text"
                      placeholder="例如：技术研发部"
                      value={settings.departmentName}
                      onChange={(e) => update('departmentName', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">报销主题 / 抬头</span>
                  <input
                    type="text"
                    value={settings.reimbursementTitle}
                    onChange={(e) => update('reimbursementTitle', e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
