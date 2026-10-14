import JSZip from 'jszip';
import type { InvoiceItem } from '../../types/invoice';

export type DateFormatOption = 'YYYYMMDD' | 'YYYY-MM-DD' | 'raw';

export interface RenameRuleSettings {
  template: string;
  dateFormat: DateFormatOption;
  amountSuffix: boolean; // whether to append "元" after amount
}

export const PRESET_RENAME_TEMPLATES = [
  {
    id: 'date-seller-amount',
    name: '日期_销售方_金额 (推荐)',
    template: '{日期}_{销售方}_{金额}',
  },
  {
    id: 'date-amount-no',
    name: '日期_金额_发票号码',
    template: '{日期}_{金额}_{发票号码}',
  },
  {
    id: 'seller-date-amount',
    name: '销售方_日期_金额',
    template: '{销售方}_{日期}_{金额}',
  },
  {
    id: 'no-seller-amount',
    name: '发票号码_销售方_金额',
    template: '{发票号码}_{销售方}_{金额}',
  },
];

/**
 * Clean illegal filesystem characters in Windows and macOS
 * Characters: \ / : * ? " < > |
 */
export function sanitizeFilename(name: string): string {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
}

/**
 * Formats a raw invoice date string into requested date format
 */
export function formatInvoiceDate(rawDate?: string, format: DateFormatOption = 'YYYYMMDD'): string {
  if (!rawDate) return '未知日期';

  // Extract year, month, day digits
  const match = /(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/.exec(rawDate);
  if (!match) {
    return sanitizeFilename(rawDate);
  }

  const y = match[1];
  const m = match[2].padStart(2, '0');
  const d = match[3].padStart(2, '0');

  if (format === 'YYYYMMDD') {
    return `${y}${m}${d}`;
  }
  if (format === 'YYYY-MM-DD') {
    return `${y}-${m}-${d}`;
  }
  return sanitizeFilename(rawDate);
}

/**
 * Generates the target filename for an invoice item based on template rules
 */
export function generateRenamedFilename(
  item: InvoiceItem,
  settings: RenameRuleSettings
): string {
  let template = settings.template;

  const dateStr = formatInvoiceDate(item.invoiceDate, settings.dateFormat);
  const sellerStr = sanitizeFilename(item.sellerName || '未知销售方');
  const buyerStr = sanitizeFilename(item.buyerName || '未知购买方');
  const noStr = sanitizeFilename(item.invoiceNumber || '未知号码');
  const codeStr = sanitizeFilename(item.invoiceCode || '');

  let amountStr = item.amount !== undefined ? item.amount.toFixed(2) : '0.00';
  if (settings.amountSuffix) {
    amountStr += '元';
  }

  const originalBase = sanitizeFilename(item.fileName.replace(/\.pdf$/i, ''));

  // Replace variable placeholders (support both Chinese and English tags)
  let result = template
    .replace(/\{日期\}|\{date\}/gi, dateStr)
    .replace(/\{销售方\}|\{seller\}/gi, sellerStr)
    .replace(/\{购买方\}|\{buyer\}/gi, buyerStr)
    .replace(/\{金额\}|\{amount\}/gi, amountStr)
    .replace(/\{发票号码\}|\{invoiceNo\}/gi, noStr)
    .replace(/\{发票代码\}|\{invoiceCode\}/gi, codeStr)
    .replace(/\{原文件名\}|\{original\}/gi, originalBase);

  result = sanitizeFilename(result);
  result = result.replace(/__+/g, '_').replace(/^_+|_+$/g, '');
  if (!result) {
    result = `发票_${noStr}_${amountStr}`;
  }

  return `${result}.pdf`;
}

/**
 * Packages an array of files with their custom renamed names into a single ZIP file
 */
export async function createRenamedInvoicesZip(
  items: { file: File; targetName: string }[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  // Deduplicate file names in case duplicates exist
  const usedNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let fileName = item.targetName;

    if (usedNames.has(fileName)) {
      const base = fileName.replace(/\.pdf$/i, '');
      let counter = 1;
      while (usedNames.has(`${base}_${counter}.pdf`)) {
        counter++;
      }
      fileName = `${base}_${counter}.pdf`;
    }
    usedNames.add(fileName);

    const arrayBuffer = await item.file.arrayBuffer();
    zip.file(fileName, arrayBuffer);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / items.length) * 50));
    }
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent / 2));
      }
    }
  );

  return zipBlob;
}
