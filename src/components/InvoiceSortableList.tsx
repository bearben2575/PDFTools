import React from 'react';
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
} from '@dnd-kit/sortable';
import { InvoiceCard } from './InvoiceCard';
import type { InvoiceItem } from '../types/invoice';
import { ArrowDownUp } from 'lucide-react';

interface InvoiceSortableListProps {
  invoices: InvoiceItem[];
  onReorder: (invoices: InvoiceItem[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateAmount: (id: string, newAmount: number) => void;
  onClearAll: () => void;
}

export const InvoiceSortableList: React.FC<InvoiceSortableListProps> = ({
  invoices,
  onReorder,
  onDuplicate,
  onDelete,
  onUpdateAmount,
  onClearAll,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = invoices.findIndex((item) => item.id === active.id);
      const newIndex = invoices.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(invoices, oldIndex, newIndex));
    }
  };

  if (invoices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center space-x-1.5 font-medium text-slate-600">
          <ArrowDownUp className="w-3.5 h-3.5 text-blue-600" />
          <span>待拼版发票列表 ({invoices.length} 份 · 可拖动排序)</span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-rose-600 hover:text-rose-700 hover:underline transition"
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
          items={invoices.map((inv) => inv.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {invoices.map((inv, idx) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                index={idx}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onUpdateAmount={onUpdateAmount}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
