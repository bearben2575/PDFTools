import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { pdfjsLib } from '../lib/pdf/pdfjsConfig';

interface PdfLivePreviewProps {
  pdfBytes: Uint8Array | null;
  isGenerating: boolean;
  totalInvoices: number;
}

export const PdfLivePreview: React.FC<PdfLivePreviewProps> = ({
  pdfBytes,
  isGenerating,
  totalInvoices,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Load PDF Document when pdfBytes change
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (!pdfBytes || pdfBytes.length === 0) {
        setPdfDoc(null);
        setNumPages(0);
        setCurrentPage(1);
        return;
      }

      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(pdfBytes),
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/',
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage((prev) => Math.min(prev, doc.numPages) || 1);
        }
      } catch (err) {
        console.error('Failed to parse merged PDF for preview:', err);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfBytes]);

  // Render current page onto canvas
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current || currentPage < 1) return;

      try {
        setIsRenderingPage(true);
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Support High DPI screens
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        await page.render({
          canvasContext: ctx,
          canvas,
          transform,
          viewport,
        }).promise;
      } catch (err) {
        console.error('Error rendering PDF page preview:', err);
      } finally {
        if (!isCancelled) {
          setIsRenderingPage(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale]);

  // Handle Download
  const handleDownload = () => {
    if (!pdfBytes) return;

    try {
      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
      const fileName = `发票报销拼版_${dateStr}_${timeStr}.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Trigger Confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Handle Direct Print via hidden iframe
  const handlePrint = () => {
    if (!pdfBytes) return;

    try {
      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          iframe.contentWindow?.print();
          // Cleanup after 60s
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 60000);
        }, 200);
      };
    } catch (err) {
      console.error('Print trigger failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/70 border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Controls Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-800">A4 双联拼版实时预览</span>
          {isGenerating && (
            <span className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>拼版渲染中...</span>
            </span>
          )}
        </div>

        {/* Zoom & Page pagination */}
        {numPages > 0 && (
          <div className="flex items-center space-x-3">
            {/* Pagination */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5 text-xs text-slate-600">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="上一页"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono font-medium">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="下一页"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
                className="p-1 rounded hover:bg-white transition"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 font-mono text-[11px] min-w-[38px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
                className="p-1 rounded hover:bg-white transition"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale(1.1)}
                className="p-1 rounded hover:bg-white transition text-slate-400 hover:text-slate-600"
                title="重置缩放"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Preview Canvas Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative min-h-[460px]">
        {totalInvoices === 0 ? (
          /* Empty State */
          <div className="max-w-sm text-center p-6 bg-white/80 rounded-2xl border-2 border-dashed border-slate-300 shadow-2xs">
            <div className="w-16 h-24 mx-auto mb-4 border-2 border-slate-300 rounded-md bg-slate-50 flex flex-col items-center justify-between p-2 shadow-inner">
              <div className="w-full h-8 border border-dashed border-slate-300 rounded bg-white/70 flex items-center justify-center text-[9px] text-slate-400">
                发票 1
              </div>
              <div className="w-full border-t border-dashed border-slate-300 relative">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-slate-50 px-1 text-slate-400">
                  ✄ 裁剪
                </span>
              </div>
              <div className="w-full h-8 border border-dashed border-slate-300 rounded bg-white/70 flex items-center justify-center text-[9px] text-slate-400">
                发票 2
              </div>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">暂无待预览发票</h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              请在左侧点击上传或拖入电子发票，系统将在此处即时渲染 A4 双联拼版高保真排版。
            </p>
          </div>
        ) : (
          /* High-Fidelity Rendered Canvas */
          <div className="relative shadow-2xl rounded-sm bg-white border border-slate-300 transition-all">
            <canvas ref={canvasRef} className="block max-w-full" />
            {isRenderingPage && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white p-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-500 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>
            {totalInvoices > 0
              ? `已拼版 ${totalInvoices} 份发票 · 共 ${numPages} 页 A4`
              : '准备就绪'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Print Button */}
          <button
            type="button"
            disabled={totalInvoices === 0 || isGenerating}
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>一键打印</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            disabled={totalInvoices === 0 || isGenerating}
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>下载合并 PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
