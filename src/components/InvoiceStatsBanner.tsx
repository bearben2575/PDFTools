import React from 'react';
import { Receipt, Coins, Printer } from 'lucide-react';
import { convertToChineseCurrency } from '../lib/pdf/invoiceParser';
import type { InvoiceItem, ImpositionSettings } from '../types/invoice';

interface InvoiceStatsBannerProps {
  invoices: InvoiceItem[];
  settings: ImpositionSettings;
}

export const InvoiceStatsBanner: React.FC<InvoiceStatsBannerProps> = ({
  invoices,
  settings,
}) => {
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Calculate predicted pages
  let predictedPages = 0;
  if (totalCount > 0) {
    if (settings.layoutMode === '2-up-vertical') {
      predictedPages = Math.ceil(totalCount / 2);
    } else {
      predictedPages = totalCount;
    }
    if (settings.includeSummaryCover) {
      predictedPages += 1;
    }
  }

  const chineseCap = convertToChineseCurrency(totalAmount);

  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
      {/* Background soft glow accent */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="grid grid-cols-3 gap-2 divide-x divide-white/10 text-center">
        {/* Metric 1: Count */}
        <div className="px-2">
          <div className="flex items-center justify-center space-x-1 text-blue-200 text-xs mb-1 font-medium">
            <Receipt className="w-3.5 h-3.5" />
            <span>发票份数</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {totalCount}
            <span className="text-xs font-normal text-blue-200 ml-1">份</span>
          </div>
        </div>

        {/* Metric 2: Total Amount */}
        <div className="px-2">
          <div className="flex items-center justify-center space-x-1 text-emerald-300 text-xs mb-1 font-medium">
            <Coins className="w-3.5 h-3.5" />
            <span>报销总额</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-300">
            ¥{totalAmount.toFixed(2)}
          </div>
          <div className="text-[11px] text-blue-200/90 truncate max-w-full font-sans mt-0.5" title={chineseCap}>
            {chineseCap}
          </div>
        </div>

        {/* Metric 3: Page count */}
        <div className="px-2">
          <div className="flex items-center justify-center space-x-1 text-blue-200 text-xs mb-1 font-medium">
            <Printer className="w-3.5 h-3.5" />
            <span>预计打印</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {predictedPages}
            <span className="text-xs font-normal text-blue-200 ml-1">页 A4</span>
          </div>
          {settings.includeSummaryCover && totalCount > 0 && (
            <div className="text-[10px] text-blue-300/80 mt-0.5">
              含报销封面单
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
