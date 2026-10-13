import React, { useState, useMemo } from 'react';
import {
  Tag,
  Download,
  Trash2,
  FileCheck,
  Loader2,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InvoiceUploader } from './InvoiceUploader';
import { parsePdfInvoice } from '../lib/pdf/invoiceParser';
import {
  generateRenamedFilename,
  createRenamedInvoicesZip,
  PRESET_RENAME_TEMPLATES,
  type RenameRuleSettings,
  type DateFormatOption,
} from '../lib/pdf/invoiceRenamer';
import type { InvoiceItem } from '../types/invoice';

interface RenamedItemState {
  invoice: InvoiceItem;
  customName?: string; // allow user manual overrides
}

export const InvoiceRenameWorkbench: React.FC = () => {
  const [items, setItems] = useState<RenamedItemState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  const [settings, setSettings] = useState<RenameRuleSettings>({
    template: '{日期}_{销售方}_{金额}',
    dateFormat: 'YYYYMMDD',
    amountSuffix: true,
  });

  // Calculate final filename for each item
  const renamedList = useMemo(() => {
    return items.map((it) => {
      const autoName = generateRenamedFilename(it.invoice, settings);
      return {
        ...it,
        finalName: it.customName || autoName,
      };
    });
  }, [items, settings]);

  const handleFilesSelected = async (files: File[]) => {
    setIsLoading(true);
    try {
      const newItems: RenamedItemState[] = [];
      for (const file of files) {
        try {
          const inv = await parsePdfInvoice(file);
          newItems.push({ invoice: inv });
        } catch (err) {
          console.error(`Failed to parse invoice ${file.name}:`, err);
        }
      }
      setItems((prev) => [...prev, ...newItems]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateInsert = (tag: string) => {
    setSettings((prev) => ({
      ...prev,
      template: prev.template ? `${prev.template}_${tag}` : tag,
    }));
  };

  // Download a single renamed PDF
  const handleDownloadSingle = (item: { invoice: InvoiceItem; finalName: string }) => {
    const blob = new Blob([item.invoice.file], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (renamedList.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zipPayload = renamedList.map((it) => ({
        file: it.invoice.file,
        targetName: it.finalName,
      }));

      const zipBlob = await createRenamedInvoicesZip(zipPayload, (p) => setZipProgress(p));
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.download = `发票批量重命名_${today}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleUpdateCustomName = (id: string, name: string) => {
    setItems((prev) =>
      prev.map((it) => (it.invoice.id === id ? { ...it, customName: name } : it))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.invoice.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('确定清空所有待重命名发票吗？')) {
      setItems([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Introduction */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                <Tag className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                发票批量智能重命名
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              自动提取发票开票日期、销售方、报销金额与发票号码，按财务归档标准格式批量重命名并一键打包下载 ZIP。
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={renamedList.length === 0 || isZipping}
              onClick={handleDownloadZip}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在打包 ({zipProgress}%)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>一键打包下载全部重命名发票 (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel: Upload & Rules (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Uploader */}
          <InvoiceUploader
            onFilesSelected={handleFilesSelected}
            isLoading={isLoading}
          />

          {/* Renaming Rules Settings Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>重命名模板规则设置</span>
              </span>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                推荐预设模板
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_RENAME_TEMPLATES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, template: preset.template }))
                    }
                    className={`px-2.5 py-2 rounded-xl text-xs text-left transition border ${
                      settings.template === preset.template
                        ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <div className="truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      {preset.template}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Input */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                自定义模板格式
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.template}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, template: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  placeholder="例如：{日期}_{销售方}_{金额}"
                />
              </div>

              {/* Clickable Variable Tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '+ {日期}', tag: '{日期}' },
                  { label: '+ {销售方}', tag: '{销售方}' },
                  { label: '+ {金额}', tag: '{金额}' },
                  { label: '+ {发票号码}', tag: '{发票号码}' },
                  { label: '+ {发票代码}', tag: '{发票代码}' },
                  { label: '+ {购买方}', tag: '{购买方}' },
                  { label: '+ {原文件名}', tag: '{原文件名}' },
                ].map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => handleTemplateInsert(t.tag)}
                    className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-md border border-slate-200 transition"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date format & Amount suffix */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">
                  日期输出格式
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      dateFormat: e.target.value as DateFormatOption,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="YYYYMMDD">20261010 (紧凑8位)</option>
                  <option value="YYYY-MM-DD">2026-10-10 (横杠分隔)</option>
                  <option value="raw">保持原始格式</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">
                  金额附加单位
                </label>
                <label className="flex items-center space-x-2 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.amountSuffix}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        amountSuffix: e.target.checked,
                      }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-slate-600">金额后带"元"</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Renamed Preview List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-xs text-slate-600 font-semibold flex items-center space-x-2">
                <span>重命名实时效果对照表 ({renamedList.length} 份)</span>
              </div>
              {renamedList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-600 hover:underline"
                >
                  清空列表
                </button>
              )}
            </div>

            {renamedList.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">暂无待重命名发票</p>
                <p className="text-xs text-slate-400 mt-1">
                  在左侧点击上传发票，系统将在此处即时展示新旧文件名对照并支持微调。
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pr-1">
                {renamedList.map((item, idx) => (
                  <div
                    key={item.invoice.id}
                    className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/60 px-2 rounded-xl transition"
                  >
                    {/* Index & Thumbnail */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <div className="w-12 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                        {item.invoice.thumbnailUrl ? (
                          <img
                            src={item.invoice.thumbnailUrl}
                            alt="发票缩略"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileCheck className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* File Names (Old vs New) */}
                      <div className="min-w-0 space-y-1">
                        {/* Old Name */}
                        <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                          原名：{item.invoice.fileName}
                        </div>

                        {/* New Name Input */}
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={item.finalName}
                            onChange={(e) =>
                              handleUpdateCustomName(item.invoice.id, e.target.value)
                            }
                            className="text-xs font-semibold text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded-md px-1.5 py-0.5 truncate w-[260px] sm:w-[320px] focus:outline-none transition"
                            title="可直接点击微调新文件名"
                          />
                        </div>

                        {/* Metadata badges */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                            ¥{item.invoice.amount?.toFixed(2) || '0.00'}
                          </span>
                          {item.invoice.invoiceDate && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {item.invoice.invoiceDate}
                            </span>
                          )}
                          {item.invoice.sellerName && (
                            <span
                              className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded truncate max-w-[120px]"
                              title={item.invoice.sellerName}
                            >
                              {item.invoice.sellerName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="下载此单张重命名发票"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.invoice.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="移除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
