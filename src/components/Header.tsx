import React from 'react';
import { FileText, ShieldCheck, Layers, Tag, Scissors, Sparkles } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { CURRENT_VERSION } from '../lib/version/updater';
import type { ActiveToolTab } from '../types/invoice';

interface HeaderProps {
  activeTab: ActiveToolTab;
  onTabChange: (tab: ActiveToolTab) => void;
  onOpenUpdateModal: () => void;
  hasUpdate?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenUpdateModal,
  hasUpdate,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  PDF<span className="text-blue-600">Tools</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenUpdateModal}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border flex items-center space-x-1 transition cursor-pointer ${
                    hasUpdate
                      ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                  title="点击检查在线更新"
                >
                  <span>v{CURRENT_VERSION}</span>
                  {hasUpdate ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ) : null}
                </button>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                纯本地隐私安全 · 财务发票报销拼版与效率工具
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onTabChange('invoice-merge')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'invoice-merge'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Scissors className="w-4 h-4 text-blue-600" />
              <span>发票智能合并</span>
              <span className="hidden md:inline-block ml-1 px-1.5 py-0.2 text-[10px] bg-blue-600 text-white rounded font-mono">
                A4双联
              </span>
            </button>

            <button
              onClick={() => onTabChange('invoice-rename')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'invoice-rename'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-4 h-4 text-amber-600" />
              <span>发票智能重命名</span>
              <span className="hidden md:inline-block ml-1 px-1.5 py-0.2 text-[10px] bg-amber-600 text-white rounded font-mono">
                ZIP打包
              </span>
            </button>

            <button
              onClick={() => onTabChange('general-merge')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'general-merge'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>通用 PDF 合并</span>
            </button>
          </nav>

          {/* Right Security Badge & GitHub link */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenUpdateModal}
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                hasUpdate
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="检查新版本与在线更新"
            >
              <Sparkles className={`w-3.5 h-3.5 ${hasUpdate ? 'text-amber-600' : 'text-slate-500'}`} />
              <span>{hasUpdate ? '发现新版本' : '检查更新'}</span>
            </button>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">100% 浏览器本地处理 · 零上传</span>
              <span className="sm:hidden">本地安全</span>
            </div>

            <a
              href="https://github.com/bearben2575/PDFTools"
              target="_blank"
              rel="noreferrer"
              title="查看 GitHub 开源仓库"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

