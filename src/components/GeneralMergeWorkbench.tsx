import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Layers,
  Trash2,
  GripVertical,
  Loader2,
  FileCheck,
  ArrowDownUp,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { pdfjsLib } from '../lib/pdf/pdfjsConfig';
import { mergeGeneralPdfs, type GeneralPdfFileItem } from '../lib/pdf/generalMerger';
import { PdfLivePreview } from './PdfLivePreview';

const GeneralSortableItem: React.FC<{
  item: GeneralPdfFileItem;
  index: number;
  onDelete: (id: string) => void;
}> = ({ item, index, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white border rounded-xl shadow-2xs transition ${
        isDragging
          ? 'border-indigo-500 shadow-md ring-2 ring-indigo-400/20'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 transition"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-center font-semibold shrink-0">
          {index + 1}
        </span>

        <div className="w-10 h-12 bg-slate-50 border border-slate-200 rounded shrink-0 overflow-hidden flex items-center justify-center">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="预览" className="w-full h-full object-cover" />
          ) : (
            <FileCheck className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[260px]">
            {item.name}
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {item.pageCount} 页 · {(item.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
        title="移除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const GeneralMergeWorkbench: React.FC = () => {
  const [files, setFiles] = useState<GeneralPdfFileItem[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedBytes, setMergedBytes] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFiles = async (fileList: File[]) => {
    setIsParsing(true);
    const valid = fileList.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    const parsedItems: GeneralPdfFileItem[] = [];

    for (const f of valid) {
      try {
        const ab = await f.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
        let thumb = '';
        if (doc.numPages > 0) {
          const page = await doc.getPage(1);
          const vp = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
            thumb = canvas.toDataURL('image/jpeg', 0.7);
          }
        }
        parsedItems.push({
          id: `gen-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          file: f,
          name: f.name,
          size: f.size,
          pageCount: doc.numPages,
          thumbnailUrl: thumb,
        });
      } catch (err) {
        console.error('Failed to parse pdf file:', err);
      }
    }

    setFiles((prev) => [...prev, ...parsedItems]);
    setIsParsing(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((item) => item.id === active.id);
      const newIndex = files.findIndex((item) => item.id === over.id);
      setFiles(arrayMove(files, oldIndex, newIndex));
    }
  };

  const handleMergeAndPreview = async () => {
    if (files.length === 0) return;
    setIsMerging(true);
    try {
      const bytes = await mergeGeneralPdfs(files);
      setMergedBytes(bytes);
      confetti({ particleCount: 40, spread: 50 });
    } catch (err) {
      console.error('Merge error:', err);
    } finally {
      setIsMerging(false);
    }
  };

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Upload & Order */}
        <div className="lg:col-span-5 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(Array.from(e.target.files));
              e.target.value = '';
            }}
          />

          <div
            onClick={() => !isParsing && fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 bg-white hover:bg-slate-50/50 cursor-pointer text-center transition"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {isParsing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {isParsing ? '正在解析 PDF 文档...' : '上传多个 PDF 文件进行顺序合并'}
              </h3>
              <p className="text-xs text-slate-500">
                支持合同、标书、论文、简历等任意多页 PDF 批量拼接
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center space-x-1">
                  <ArrowDownUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>待合并文件 ({files.length} 个文件 · 共 {totalPages} 页)</span>
                </span>
                <button
                  onClick={() => {
                    setFiles([]);
                    setMergedBytes(null);
                  }}
                  className="text-rose-600 hover:underline"
                >
                  清空全部
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={files.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {files.map((item, idx) => (
                      <GeneralSortableItem
                        key={item.id}
                        item={item}
                        index={idx}
                        onDelete={(id) => setFiles((prev) => prev.filter((x) => x.id !== id))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                type="button"
                disabled={files.length === 0 || isMerging}
                onClick={handleMergeAndPreview}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-40"
              >
                {isMerging ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Layers className="w-4 h-4" />
                )}
                <span>立即合并生成完整 PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Preview */}
        <div className="lg:col-span-7 sticky top-20 h-[calc(100vh-6rem)]">
          <PdfLivePreview
            pdfBytes={mergedBytes}
            isGenerating={isMerging}
            totalInvoices={files.length}
          />
        </div>
      </div>
    </div>
  );
};
