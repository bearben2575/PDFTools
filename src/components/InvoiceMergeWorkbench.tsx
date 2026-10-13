import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InvoiceUploader } from './InvoiceUploader';
import { InvoiceStatsBanner } from './InvoiceStatsBanner';
import { InvoiceSortableList } from './InvoiceSortableList';
import { ImpositionSettingsPanel } from './ImpositionSettingsPanel';
import { PdfLivePreview } from './PdfLivePreview';
import { parsePdfInvoice } from '../lib/pdf/invoiceParser';
import { mergeInvoicesToA4 } from '../lib/pdf/invoiceMerger';
import type { InvoiceItem, ImpositionSettings } from '../types/invoice';

const DEFAULT_SETTINGS: ImpositionSettings = {
  layoutMode: '2-up-vertical',
  showCutLine: true,
  marginPreset: 'standard',
  autoRotate: true,
  includeSummaryCover: false,
  reimbursementTitle: '费用报销汇总单',
  applicantName: '',
  departmentName: '',
  renderEngine: 'vector-smart',
};

export const InvoiceMergeWorkbench: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [settings, setSettings] = useState<ImpositionSettings>(DEFAULT_SETTINGS);
  const [isParsingFiles, setIsParsingFiles] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [mergedPdfBytes, setMergedPdfBytes] = useState<Uint8Array | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger A4 imposition generation when invoices or settings change
  const triggerMerge = useCallback(async (currentInvoices: InvoiceItem[], currentSettings: ImpositionSettings) => {
    if (currentInvoices.length === 0) {
      setMergedPdfBytes(null);
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const bytes = await mergeInvoicesToA4(currentInvoices, currentSettings);
      setMergedPdfBytes(bytes);
    } catch (err) {
      console.error('Failed to merge invoices:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, []);

  // Debounced auto-refresh of merged preview
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerMerge(invoices, settings);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [invoices, settings, triggerMerge]);

  // Handle uploaded files
  const handleFilesSelected = async (files: File[]) => {
    setIsParsingFiles(true);
    try {
      const parsedItems: InvoiceItem[] = [];
      for (const file of files) {
        try {
          const item = await parsePdfInvoice(file);
          parsedItems.push(item);
        } catch (err) {
          console.error(`Failed to parse file ${file.name}:`, err);
        }
      }
      setInvoices((prev) => [...prev, ...parsedItems]);
    } finally {
      setIsParsingFiles(false);
    }
  };

  // Handle "+1 复制副本" (Duplicate invoice)
  const handleDuplicate = (id: string) => {
    setInvoices((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;

      const copyIndex = (target.copyIndex || 0) + 1;
      const duplicate: InvoiceItem = {
        ...target,
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fileName: `${target.fileName.replace(/\.pdf$/i, '')}_副本${copyIndex}.pdf`,
        isCopy: true,
        copyIndex,
      };

      const targetIdx = prev.findIndex((item) => item.id === id);
      const updated = [...prev];
      updated.splice(targetIdx + 1, 0, duplicate);
      return updated;
    });
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    setInvoices((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle manual update of amount
  const handleUpdateAmount = (id: string, newAmount: number) => {
    setInvoices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: newAmount } : item))
    );
  };

  // Handle reorder from drag-and-drop
  const handleReorder = (newInvoices: InvoiceItem[]) => {
    setInvoices(newInvoices);
  };

  // Handle Clear All
  const handleClearAll = () => {
    if (window.confirm('确定清空当前所有已导入的发票吗？')) {
      setInvoices([]);
      setMergedPdfBytes(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: File Controls & Workbench (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Upload Zone */}
          <InvoiceUploader
            onFilesSelected={handleFilesSelected}
            isLoading={isParsingFiles}
          />

          {/* Real-time stats banner if invoices present */}
          {invoices.length > 0 && (
            <InvoiceStatsBanner invoices={invoices} settings={settings} />
          )}

          {/* Imposition settings */}
          <ImpositionSettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
          />

          {/* Sortable invoice list */}
          <InvoiceSortableList
            invoices={invoices}
            onReorder={handleReorder}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onUpdateAmount={handleUpdateAmount}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Right Panel: High-fidelity Live A4 Preview & Print (7 cols on lg) */}
        <div className="lg:col-span-7 sticky top-20 h-[calc(100vh-6rem)]">
          <PdfLivePreview
            pdfBytes={mergedPdfBytes}
            isGenerating={isGeneratingPdf}
            totalInvoices={invoices.length}
          />
        </div>
      </div>
    </div>
  );
};
