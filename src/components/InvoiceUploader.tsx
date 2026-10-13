import React, { useRef, useState } from 'react';
import { UploadCloud, Sparkles, Loader2 } from 'lucide-react';
import { generateSampleInvoiceFiles } from '../lib/pdf/sampleInvoiceGenerator';

interface InvoiceUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({
  onFilesSelected,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = ''; // Reset input
    }
  };

  const handleLoadSamples = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingSamples(true);
    try {
      const sampleFiles = await generateSampleInvoiceFiles();
      onFilesSelected(sampleFiles);
    } catch (err) {
      console.error('Failed to generate sample invoices:', err);
    } finally {
      setIsGeneratingSamples(false);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center select-none ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${
              isDragOver ? 'scale-110 bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isLoading || isGeneratingSamples ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-7 h-7 text-blue-600" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {isLoading ? '正在解析发票元数据...' : '点击或拖拽上传电子发票'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              支持多选 PDF 增值税发票、数电发票 · 自动提取金额与开票信息
            </p>
          </div>

          {/* Quick Action Button for Samples */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isLoading || isGeneratingSamples}
              onClick={handleLoadSamples}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/80 transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>载入 3 张真实测试发票 (快速体验)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
