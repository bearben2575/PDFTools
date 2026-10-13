import { pdfjsLib } from './pdfjsConfig';
import type { InvoiceItem } from '../../types/invoice';

/**
 * Convert numeric amount to Chinese Capital Currency (大写金额)
 * Example: 1234.56 -> 壹仟贰佰叁拾肆元伍角陆分
 */
export function convertToChineseCurrency(num: number): string {
  if (num === 0) return '零元整';
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [
    ['元', '万', '亿'],
    ['', '拾', '佰', '仟'],
  ];

  let head = num < 0 ? '欠' : '';
  num = Math.abs(num);

  let s = '';
  const numStr = num.toFixed(2);
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Fraction
  for (let i = 0; i < fraction.length; i++) {
    const d = parseInt(decimalPart[i] || '0', 10);
    if (d > 0) {
      s += digit[d] + fraction[i];
    }
  }
  if (!s) {
    s = '整';
  } else {
    // Check if only corner or only cents
    if (decimalPart[0] !== '0' && decimalPart[1] === '0') {
      s += '整';
    }
  }

  // Integer
  let intPart = parseInt(integerPart, 10);
  let intResult = '';
  const bigUnits = ['', '万', '亿'];
  let bigUnitIdx = 0;

  while (intPart > 0) {
    let section = intPart % 10000;
    let sectionStr = '';
    let zero = true;
    for (let j = 0; j < 4; j++) {
      let digitVal = section % 10;
      if (digitVal === 0) {
        if (!zero) {
          zero = true;
          sectionStr = digit[0] + sectionStr;
        }
      } else {
        zero = false;
        sectionStr = digit[digitVal] + unit[1][j] + sectionStr;
      }
      section = Math.floor(section / 10);
    }
    if (sectionStr.length > 0) {
      intResult = sectionStr + bigUnits[bigUnitIdx] + intResult;
    }
    bigUnitIdx++;
    intPart = Math.floor(intPart / 10000);
  }

  intResult = intResult.replace(/零+/g, '零').replace(/零$/, '');
  if (!intResult) intResult = '零';

  return head + intResult + '元' + (s === '整' ? '整' : s);
}

/**
 * Extracts invoice info from raw text string using regex
 */
export function extractInvoiceMetadata(fullText: string): {
  amount?: number;
  invoiceNumber?: string;
  invoiceCode?: string;
  invoiceDate?: string;
  sellerName?: string;
  buyerName?: string;
} {
  const result: ReturnType<typeof extractInvoiceMetadata> = {};
  const cleaned = fullText.replace(/\s+/g, ' ');

  // 1. Amount Extraction (价税合计 / 小写 / 合计)
  // Match patterns like: (小写) ¥123.45, 价税合计 123.45, (小写)123.45
  const amountPatterns = [
    /(?:价税合计|小\s*写|合\s*计)[^\d¥￥]*[¥￥]?\s*([0-9,]+\.\d{2})/,
    /[¥￥]\s*([0-9,]+\.\d{2})/,
    /(?:金额|税额|总计)[^\d¥￥]*[¥￥]?\s*([0-9,]+\.\d{2})/,
  ];

  for (const pat of amountPatterns) {
    const match = pat.exec(cleaned);
    if (match && match[1]) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        result.amount = val;
        break;
      }
    }
  }

  // 2. Invoice Number (发票号码: 8位、10位、20位数电票)
  const noMatch = /(?:发票号码|发票号|No\.?)\s*[:：]?\s*([0-9]{8,20})/i.exec(cleaned);
  if (noMatch && noMatch[1]) {
    result.invoiceNumber = noMatch[1].trim();
  } else {
    // Try matching standalone 20-digit or 8-digit sequence near keywords
    const altNoMatch = /\b([0-9]{20})\b/.exec(cleaned);
    if (altNoMatch) {
      result.invoiceNumber = altNoMatch[1];
    }
  }

  // 3. Invoice Code (发票代码: 通常10-12位)
  const codeMatch = /(?:发票代码)\s*[:：]?\s*([0-9]{10,12})/.exec(cleaned);
  if (codeMatch && codeMatch[1]) {
    result.invoiceCode = codeMatch[1].trim();
  }

  // 4. Invoice Date (开票日期: 2024年05月01日 或 2024-05-01)
  const dateMatch = /(?:开票日期|日期)\s*[:：]?\s*(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/.exec(cleaned);
  if (dateMatch && dateMatch[1]) {
    result.invoiceDate = dateMatch[1].trim();
  }

  // 5. Seller Name (销售方名称 / 销 方)
  const sellerMatch = /(?:销售方|销\s*方)(?:[^\n\r]*?名称)?\s*[:：]?\s*([^\s:：]{4,30})/.exec(cleaned);
  if (sellerMatch && sellerMatch[1]) {
    result.sellerName = sellerMatch[1].trim();
  }

  // 6. Buyer Name (购买方名称 / 购 方)
  const buyerMatch = /(?:购买方|购\s*方)(?:[^\n\r]*?名称)?\s*[:：]?\s*([^\s:：]{4,30})/.exec(cleaned);
  if (buyerMatch && buyerMatch[1]) {
    result.buyerName = buyerMatch[1].trim();
  }

  // 7. Fallback to filename parsing if amount not found in text
  if (!result.amount) {
    const fnAmountMatch = /(?:[^\d]|^)([0-9]+\.[0-9]{2})(?:元|\.pdf|$)/i.exec(cleaned);
    if (fnAmountMatch && fnAmountMatch[1]) {
      result.amount = parseFloat(fnAmountMatch[1]);
    }
  }

  return result;
}

/**
 * Parses a single uploaded PDF or image file, generates visual thumbnail and extracts metadata
 */
export async function parsePdfInvoice(file: File): Promise<InvoiceItem> {
  const sampleMeta = (file as any).__sampleMeta;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  const firstPage = await pdfDoc.getPage(1);

  const viewport = firstPage.getViewport({ scale: 1.0 });
  const width = viewport.width;
  const height = viewport.height;

  // Render thumbnail canvas (target width ~400px for retina clarity)
  const thumbScale = Math.min(2.0, 400 / Math.max(width, height));
  const thumbViewport = firstPage.getViewport({ scale: Math.max(1.0, thumbScale) });

  const canvas = document.createElement('canvas');
  canvas.width = thumbViewport.width;
  canvas.height = thumbViewport.height;
  const ctx = canvas.getContext('2d');

  let thumbnailUrl = '';
  if (ctx) {
    await firstPage.render({
      canvasContext: ctx,
      canvas,
      viewport: thumbViewport,
    }).promise;
    thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
  }

  // Extract text content for metadata parsing
  let fullText = file.name;
  try {
    const textContent = await firstPage.getTextContent();
    const extracted = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += ' ' + extracted;
  } catch (err) {
    console.warn('Text extraction fallback:', err);
  }

  const meta = extractInvoiceMetadata(fullText);

  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    file,
    fileName: file.name,
    fileSize: file.size,
    pageCount,
    thumbnailUrl,
    width,
    height,
    invoiceNumber: sampleMeta?.invoiceNumber || meta.invoiceNumber,
    invoiceCode: sampleMeta?.invoiceCode || meta.invoiceCode,
    invoiceDate: sampleMeta?.invoiceDate || meta.invoiceDate,
    amount: sampleMeta?.amount !== undefined ? sampleMeta.amount : meta.amount,
    sellerName: sampleMeta?.sellerName || meta.sellerName,
    buyerName: sampleMeta?.buyerName || meta.buyerName,
    rotation: 0,
  };
}
