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
            </div>
          ) : (
            /* Already latest state */
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  当前已是最新版本 (v{CURRENT_VERSION})
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  您的客户端与官方主分支保持完全同步，所有功能均为最新。
                </p>
              </div>

              {checkResult?.releaseInfo?.highlights && (
                <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700 mb-1">当前版本功能：</div>
                  {checkResult.releaseInfo.highlights.slice(0, 3).map((h, idx) => (
                    <div key={idx} className="truncate">• {h}</div>
                  ))}
                </div>
              )}
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
