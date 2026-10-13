import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Copy,
  Trash2,
  Calendar,
  Building2,
  FileCheck,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import type { InvoiceItem } from '../types/invoice';

interface InvoiceCardProps {
  invoice: InvoiceItem;
  index: number;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateAmount: (id: string, newAmount: number) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  index,
  onDuplicate,
  onDelete,
  onUpdateAmount,
}) => {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [tempAmount, setTempAmount] = useState(invoice.amount?.toString() || '0');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: invoice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const handleSaveAmount = () => {
    const parsed = parseFloat(tempAmount);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateAmount(invoice.id, parsed);
    }
    setIsEditingAmount(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border rounded-xl p-3 shadow-2xs transition-all duration-150 ${
        isDragging
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-400/30'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center space-x-3">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 transition"
          title="按住拖拽调整拼版顺序"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Index Badge */}
        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-center font-semibold">
          {index + 1}
        </div>

        {/* Thumbnail preview */}
        <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center relative">
          {invoice.thumbnailUrl ? (
            <img
              src={invoice.thumbnailUrl}
              alt="发票缩略图"
              className="w-full h-full object-cover"
            />
          ) : (
            <FileCheck className="w-6 h-6 text-slate-400" />
          )}
          {invoice.isCopy && (
            <span className="absolute bottom-0 right-0 bg-amber-500 text-white text-[9px] px-1 font-bold rounded-tl">
              副本
            </span>
          )}
        </div>

        {/* Invoice Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4
              className="text-xs font-semibold text-slate-800 truncate max-w-[220px]"
              title={invoice.fileName}
            >
              {invoice.fileName}
            </h4>
            {/* Amount Badge */}
            <div className="flex items-center space-x-1 shrink-0">
              {isEditingAmount ? (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-slate-500">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tempAmount}
                    onChange={(e) => setTempAmount(e.target.value)}
                    className="w-20 px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveAmount}
                    className="p-0.5 text-emerald-600 hover:text-emerald-700"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingAmount(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingAmount(true)}
                  className="group/amt flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200/80 cursor-pointer transition text-xs font-bold"
                  title="点击手动校准金额"
                >
                  <span>¥{invoice.amount?.toFixed(2) || '0.00'}</span>
                  <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/amt:opacity-100 text-emerald-600 transition" />
                </div>
              )}
            </div>
          </div>

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
            {invoice.invoiceNumber && (
              <span className="font-mono text-slate-600">
                NO.{invoice.invoiceNumber}
              </span>
            )}
            {invoice.invoiceDate && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{invoice.invoiceDate}</span>
              </span>
            )}
            {invoice.sellerName && (
              <span
                className="flex items-center space-x-1 truncate max-w-[140px]"
                title={invoice.sellerName}
              >
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{invoice.sellerName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions (Duplicate & Delete) */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={() => onDuplicate(invoice.id)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="复制发票副本（打多份报销）"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(invoice.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="移除发票"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
