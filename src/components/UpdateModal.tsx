import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  CURRENT_VERSION,
  applyOnlineUpdate,
  type UpdateCheckResult,
} from '../lib/version/updater';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkResult: UpdateCheckResult | null;
  onRefreshCheck: () => void;
  isChecking: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  checkResult,
  onRefreshCheck,
  isChecking,
}) => {
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsApplying(true);
    await applyOnlineUpdate();
  };

  const hasUpdate = checkResult?.hasUpdate;
  const latestVersion = checkResult?.latestVersion || CURRENT_VERSION;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header decoration banner */}
        <div className={`p-6 text-white ${hasUpdate ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                {hasUpdate ? <Sparkles className="w-5 h-5 text-amber-300" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
              </span>
              <div>
                <h3 className="text-base font-bold">
                  {hasUpdate ? '发现新版本可用' : '版本检查与更新'}
                </h3>
                <p className="text-xs text-white/80 mt-0.5 font-mono">
                  当前本��运行：v{CURRENT_VERSION}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          {isChecking ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-7 h-7 mx-auto animate-spin text-blue-600" />
              <p className="text-xs">正在连接远端检测最新版本...</p>
            </div>
          ) : hasUpdate ? (
            /* Has Update state */
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-blue-900 block">
                    最新���本 v{latestVersion}
                  </span>
                  <span className="text-[11px] text-blue-700">
                    发布日期：{checkResult?.releaseInfo?.releaseDate || '近期'}
                  </span>
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                  可立即升级
                </span>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1.5">
                  {checkResult?.releaseInfo?.title || '新版本更新亮点'}：
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
                  {(checkResult?.releaseInfo?.highlights || ['包含性能优化与已知问题修复']).map((hl, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Desktop EXE Download Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>桌面客户端下载 (.exe / .msi)：</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">仅 3MB · 离线断网可用</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://github.com/bearben2575/PDFTools/releases/download/v${latestVersion}/PDFTools_v${latestVersion}_Setup_x64.exe`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                  >
                    <span>📥 安装向导版 .exe (3MB)</span>
                  </a>
                  <a
                    href={`https://github.com/bearben2575/PDFTools/releases/download/v${latestVersion}/PDFTools_v${latestVersion}_x64.msi`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                  >
                    <span>标准安装包 .msi (3MB)</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Already latest state */
            <div className="py-2 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  当前已是最新版本 (v{CURRENT_VERSION})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  您的客户端保持完全同步，所有功能均为最新。
                </p>
              </div>

              {/* Desktop EXE Download Section */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-left space-y-2">
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Windows 桌面轻量安装包 (仅 3MB)：</span>
                  <span className="text-[10px] text-emerald-600 font-normal">支持完全离线断网运行</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://github.com/bearben2575/PDFTools/releases/download/v${CURRENT_VERSION}/PDFTools_v${CURRENT_VERSION}_Setup_x64.exe`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-lg transition shadow-2xs"
                  >
                    <span>📥 安装向导版 .exe (3MB)</span>
                  </a>
                  <a
                    href={`https://github.com/bearben2575/PDFTools/releases/download/v${CURRENT_VERSION}/PDFTools_v${CURRENT_VERSION}_x64.msi`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-lg transition shadow-2xs"
                  >
                    <span>Windows 标准包 .msi</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error notice if any */}
          {checkResult?.error && (
            <div className="flex items-center space-x-2 p-2.5 bg-amber-50 text-amber-800 rounded-xl text-xs border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>检测提示：{checkResult.error}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              disabled={isChecking}
              onClick={onRefreshCheck}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>重新检查</span>
            </button>

            <div className="flex items-center space-x-2">
              {hasUpdate ? (
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={handleApply}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition"
                >
                  {isApplying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>立即在线升级 (热更新)</span>
                </button>
              ) : (
                <a
                  href="https://github.com/bearben2575/PDFTools/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  <span>查看 Releases 历史</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
