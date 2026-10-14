import { pdfjsLib } from './pdfjsConfig';
import type { InvoiceItem } from '../../types/invoice';

export interface TextItemWithPos {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InvoiceMetadata {
  amount?: number;
  invoiceNumber?: string;
  invoiceCode?: string;
  invoiceDate?: string;
  sellerName?: string;
  buyerName?: string;
}

export interface VisualLine {
  avgY: number;
  items: TextItemWithPos[];
  text: string;
}

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

  const head = num < 0 ? '欠' : '';
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
    const section = intPart % 10000;
    let sectionStr = '';
    let zero = true;
    for (let j = 0; j < 4; j++) {
      const digitVal = Math.floor(section / Math.pow(10, j)) % 10;
      if (digitVal === 0) {
        if (!zero) {
          zero = true;
          sectionStr = digit[0] + sectionStr;
        }
      } else {
        zero = false;
        sectionStr = digit[digitVal] + unit[1][j] + sectionStr;
      }
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
 * Parses Chinese Capital Currency string into a decimal number
 * Example: 肆拾柒圆柒角肆分 -> 47.74, 玖圆叁角整 -> 9.30
 */
export function parseChineseCurrency(text: string): number | undefined {
  if (!text) return undefined;
  const match = /(?:价税合计[^\n\r]*?大写[^\n\r]*?)?([零壹贰两叁肆伍陆柒捌玖拾佰仟万亿圆元角分整正\s]+)/.exec(text);
  if (!match) return undefined;

  const digitMap: Record<string, number> = {
    '零': 0, '壹': 1, '一': 1, '贰': 2, '两': 2, '二': 2, '叁': 3, '三': 3,
    '肆': 4, '四': 4, '伍': 5, '五': 5, '陆': 6, '六': 6, '柒': 7, '七': 7,
    '捌': 8, '八': 8, '玖': 9, '九': 9,
  };

  const str = match[1].replace(/[\s整正]/g, '');
  if (!/[圆元角分]/.test(str)) return undefined;

  let yuanPart = '';
  let jiao = 0;
  let fen = 0;

  const yMatch = /(.*?)[圆元]/.exec(str);
  if (yMatch) yuanPart = yMatch[1];

  const jMatch = /([零壹贰两叁肆伍陆柒捌玖])角/.exec(str);
  if (jMatch) jiao = digitMap[jMatch[1]] || 0;

  const fMatch = /([零壹贰两叁肆伍陆柒捌玖])分/.exec(str);
  if (fMatch) fen = digitMap[fMatch[1]] || 0;

  if (!yuanPart && jiao === 0 && fen === 0) return undefined;

  let totalYuan = 0;
  if (yuanPart) {
    const parseSection = (sec: string) => {
      let num = 0;
      let cur = 0;
      for (let i = 0; i < sec.length; i++) {
        const ch = sec[i];
        if (digitMap[ch] !== undefined) {
          cur = digitMap[ch];
        } else if (ch === '仟' || ch === '千') {
          num += (cur || 1) * 1000;
          cur = 0;
        } else if (ch === '佰' || ch === '百') {
          num += (cur || 1) * 100;
          cur = 0;
        } else if (ch === '拾' || ch === '十') {
          num += (cur || 1) * 10;
          cur = 0;
        }
      }
      return num + cur;
    };

    const yiParts = yuanPart.split('亿');
    if (yiParts.length > 1) {
      const yi = parseSection(yiParts[0]);
      const rem = yiParts[1];
      const wanParts = rem.split('万');
      let wan = 0;
      let ge = 0;
      if (wanParts.length > 1) {
        wan = parseSection(wanParts[0]);
        ge = parseSection(wanParts[1]);
      } else {
        ge = parseSection(rem);
      }
      totalYuan = yi * 100000000 + wan * 10000 + ge;
    } else {
      const wanParts = yuanPart.split('万');
      if (wanParts.length > 1) {
        const wan = parseSection(wanParts[0]);
        const ge = parseSection(wanParts[1]);
        totalYuan = wan * 10000 + ge;
      } else {
        totalYuan = parseSection(yuanPart);
      }
    }
  }

  return Math.round((totalYuan + jiao * 0.1 + fen * 0.01) * 100) / 100;
}

/**
 * Reconstructs visual reading lines from 2D positioned text items
 */
export function reconstructVisualLines(items: TextItemWithPos[], yTolerance = 5): VisualLine[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: VisualLine[] = [];

  for (const it of sorted) {
    let line = lines.find((l) => Math.abs(l.avgY - it.y) <= yTolerance);
    if (!line) {
      line = { avgY: it.y, items: [], text: '' };
      lines.push(line);
    }
    line.items.push(it);
    line.avgY = line.items.reduce((s, i) => s + i.y, 0) / line.items.length;
  }

  // Sort lines top to bottom (Y descending in PDF coordinate system)
  lines.sort((a, b) => b.avgY - a.avgY);

  // In each line, sort items left to right (X ascending)
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    line.text = line.items.map((i) => i.str).join(' ');
  }

  return lines;
}

/**
 * Extracts invoice metadata from either 2D text items or raw text string
 */
export function extractInvoiceMetadata(
  input: string | TextItemWithPos[],
  _viewport?: { width: number; height: number },
  fallbackFileName?: string
): InvoiceMetadata {
  let items: TextItemWithPos[] = [];
  let fullVisualText = '';
  let lines: VisualLine[] = [];

  if (Array.isArray(input)) {
    items = input;
    lines = reconstructVisualLines(items);
    fullVisualText = lines.map((l) => l.text).join('\n');
  } else {
    fullVisualText = input;
    lines = fullVisualText.split('\n').map((t, idx) => ({
      text: t.trim(),
      items: [],
      avgY: -idx * 10,
    }));
  }

  const result: InvoiceMetadata = {};

  // 1. Amount Extraction (价税合计 - 严格优先于不含税合计与税额)
  const totalLine = lines.find((l) => /价税合计|小\s*写/.test(l.text));
  if (totalLine) {
    const numMatch = /(?:（小写）|\(小写\)|小\s*写)?[^\d¥￥]*[¥￥]?\s*([0-9,]+\.\d{2})/.exec(totalLine.text);
    if (numMatch && numMatch[1]) {
      const val = parseFloat(numMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        result.amount = val;
      }
    }
    if (!result.amount) {
      const capAmount = parseChineseCurrency(totalLine.text);
      if (capAmount !== undefined && capAmount > 0) {
        result.amount = capAmount;
      }
    }
  }

  if (!result.amount) {
    const amountPatterns = [
      /(?:价税合计|价税总额|总计)[^\n\r\d¥￥]*(?:（小写）|\(小写\)|小写)?[^\n\r\d¥￥]*[¥￥]?\s*([0-9,]+\.\d{2})/,
      /(?:（小写）|\(小写\)|小\s*写)[^\n\r\d¥￥]*[¥￥]?\s*([0-9,]+\.\d{2})/,
      /(?:合\s*计)[^\n\r\d¥￥]*[¥￥]?\s*([0-9,]+\.\d{2})/,
      /[¥￥]\s*([0-9,]+\.\d{2})/,
    ];
    for (const pat of amountPatterns) {
      const match = pat.exec(fullVisualText);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
          result.amount = val;
          break;
        }
      }
    }
  }

  if (!result.amount) {
    const capAmount = parseChineseCurrency(fullVisualText);
    if (capAmount !== undefined && capAmount > 0) {
      result.amount = capAmount;
    }
  }

  if (!result.amount && fallbackFileName) {
    const fnAmountMatch = /(?:[^\d]|^)([0-9]+\.[0-9]{2})(?:元|\.pdf|$)/i.exec(fallbackFileName);
    if (fnAmountMatch && fnAmountMatch[1]) {
      result.amount = parseFloat(fnAmountMatch[1]);
    }
  }

  // 2. Invoice Number (发票号码: 8位、10位、20位数电票)
  const noMatch = /(?:发票号码|发票号|No\.?)\s*[:：]?\s*([0-9]{8,20})/i.exec(fullVisualText);
  if (noMatch && noMatch[1]) {
    result.invoiceNumber = noMatch[1].trim();
  } else {
    // 20-digit pattern unique to 全面数字化电子发票 (数电票)
    const altNoMatch = /\b([0-9]{20})\b/.exec(fullVisualText);
    if (altNoMatch) {
      result.invoiceNumber = altNoMatch[1];
    }
  }

  // 3. Invoice Code (发票代码: 10-12位)
  const codeMatch = /(?:发票代码)\s*[:：]?\s*([0-9]{10,12})/.exec(fullVisualText);
  if (codeMatch && codeMatch[1]) {
    result.invoiceCode = codeMatch[1].trim();
  }

  // 4. Invoice Date (开票日期: 2026年10月12日 或 2026-10-12)
  const dateMatch = /(?:开票日期|日期)\s*[:：]?\s*(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/.exec(fullVisualText);
  if (dateMatch && dateMatch[1]) {
    result.invoiceDate = dateMatch[1].trim().replace(/\s+/g, '');
  } else {
    const altDateMatch = /\b(20\d{2}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日|20\d{2}[-/.]\d{1,2}[-/.]\d{1,2})\b/.exec(fullVisualText);
    if (altDateMatch) {
      result.invoiceDate = altDateMatch[1].trim().replace(/\s+/g, '');
    }
  }

  // 5. Buyer & Seller (购买方与销售方)
  // Strategy A: Spatial Zone Extraction using 2D coordinates
  if (items.length > 0) {
    const buyerInd = items.find((it) => /^(?:购|购买方|购买方信息|购货单位|买方)$/.test(it.str));
    const sellerInd = items.find((it) => /^(?:销|销售方|销售方信息|销货单位|卖方)$/.test(it.str));
    const nameLabels = items.filter((it) => /^(?:名\s*称\s*[:：]?|名称[:：]?)$/.test(it.str));

    if (buyerInd && sellerInd) {
      const isHorizontalLayout = Math.abs(buyerInd.x - sellerInd.x) > 80;
      const splitX = (buyerInd.x + sellerInd.x) / 2;
      const splitY = (buyerInd.y + sellerInd.y) / 2;

      for (const nl of nameLabels) {
        const isBuyer = isHorizontalLayout
          ? (buyerInd.x < sellerInd.x ? nl.x < splitX : nl.x >= splitX)
          : (buyerInd.y > sellerInd.y ? nl.y > splitY : nl.y <= splitY);

        const rightItems = items
          .filter(
            (it) =>
              Math.abs(it.y - nl.y) <= 5 &&
              it.x > nl.x &&
              (isHorizontalLayout ? (isBuyer ? it.x < splitX : true) : true)
          )
          .sort((a, b) => a.x - b.x);

        let nameVal = rightItems
          .map((i) => i.str)
          .join('')
          .replace(/^[：:\s]+/, '')
          .replace(/^(?:销|购|销售方|购买方).*/, '')
          .trim();

        // Check for multi-line continuation if name is wrapped
        if (nameVal && nameVal.length < 30) {
          const nextLineItems = items
            .filter(
              (it) =>
                nl.y - it.y >= 6 &&
                nl.y - it.y <= 16 &&
                Math.abs(it.x - (rightItems[0]?.x || nl.x)) <= 25 &&
                !/^(?:统一社会信用代码|纳税人识别号|地址|电话|开户行)/.test(it.str)
            )
            .sort((a, b) => a.x - b.x);

          if (nextLineItems.length > 0) {
            const extra = nextLineItems
              .map((i) => i.str)
              .join('')
              .replace(/^[：:\s]+/, '')
              .trim();
            if (extra && extra.length <= 25 && !/(?:代码|税号|账号)/.test(extra)) {
              nameVal += extra;
            }
          }
        }

        if (nameVal && nameVal.length >= 2) {
          if (isBuyer && !result.buyerName) {
            result.buyerName = nameVal;
          } else if (!isBuyer && !result.sellerName) {
            result.sellerName = nameVal;
          }
        }
      }
    }
  }

  // Strategy B: Side-by-side Regex Extraction
  if (!result.buyerName || !result.sellerName) {
    const sideBySideMatch = /(?:购|购买方)[^\n\r]*?名\s*称\s*[:：]?\s*([^\s:：]{2,50})\s+(?:销|销售方)[^\n\r]*?名\s*称\s*[:：]?\s*([^\s:：]{2,50})/.exec(fullVisualText);
    if (sideBySideMatch) {
      if (!result.buyerName) result.buyerName = sideBySideMatch[1].trim();
      if (!result.sellerName) result.sellerName = sideBySideMatch[2].trim();
    }
  }

  // Strategy C: Independent Block Regex Extraction
  if (!result.buyerName) {
    const bMatch = /(?:购买方|购\s*方|购)[^\n\r]*?(?:名\s*称)?\s*[:：]\s*([^\s:：\n\r]{4,50})/.exec(fullVisualText);
    if (bMatch) result.buyerName = bMatch[1].trim();
  }

  if (!result.sellerName) {
    const sMatch = /(?:销售方|销\s*方|销)[^\n\r]*?(?:名\s*称)?\s*[:：]\s*([^\s:：\n\r]{4,50})/.exec(fullVisualText);
    if (sMatch) result.sellerName = sMatch[1].trim();
  }

  // Strategy D: Company Entity Keyword Heuristic Fallback
  if (!result.sellerName) {
    const compMatch = /([^\s:：]{4,30}(?:有限公司|有限责任公司|股份有限公司|集团有限公司|分公司))/.exec(fullVisualText);
    if (compMatch && compMatch[1] !== result.buyerName) {
      result.sellerName = compMatch[1].trim();
    }
  }

  return result;
}

/**
 * Parses a single uploaded PDF invoice file, generates visual thumbnail and extracts complete metadata
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

  // Extract text content with coordinates for intelligent layout-aware parsing
  let meta: InvoiceMetadata = {};
  try {
    const textContent = await firstPage.getTextContent();
    const rawItems: TextItemWithPos[] = textContent.items
      .filter((item: any) => 'str' in item && typeof item.str === 'string' && item.str.trim())
      .map((item: any) => ({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
        w: item.width || 0,
        h: item.height || 0,
      }));

    meta = extractInvoiceMetadata(rawItems, viewport, file.name);

    // If multi-page and critical info like amount or invoiceNumber is missing, check page 2
    if ((!meta.amount || !meta.invoiceNumber) && pageCount > 1) {
      try {
        const secondPage = await pdfDoc.getPage(2);
        const secondTc = await secondPage.getTextContent();
        const secondItems: TextItemWithPos[] = secondTc.items
          .filter((item: any) => 'str' in item && typeof item.str === 'string' && item.str.trim())
          .map((item: any) => ({
            str: item.str.trim(),
            x: item.transform[4],
            y: item.transform[5],
            w: item.width || 0,
            h: item.height || 0,
          }));
        const secondMeta = extractInvoiceMetadata(secondItems, viewport, file.name);
        meta = {
          amount: meta.amount ?? secondMeta.amount,
          invoiceNumber: meta.invoiceNumber ?? secondMeta.invoiceNumber,
          invoiceCode: meta.invoiceCode ?? secondMeta.invoiceCode,
          invoiceDate: meta.invoiceDate ?? secondMeta.invoiceDate,
          sellerName: meta.sellerName ?? secondMeta.sellerName,
          buyerName: meta.buyerName ?? secondMeta.buyerName,
        };
      } catch (p2Err) {
        console.warn('Page 2 inspection skipped:', p2Err);
      }
    }
  } catch (err) {
    console.warn('Layout-aware text extraction fallback:', err);
    meta = extractInvoiceMetadata(file.name, viewport, file.name);
  }

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
