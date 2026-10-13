import { PDFDocument, rgb, degrees } from 'pdf-lib';
import type { InvoiceItem, ImpositionSettings } from '../../types/invoice';
import { renderReimbursementCoverCanvas } from './coverSheetRenderer';

export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;
export const HALF_HEIGHT = A4_HEIGHT / 2; // 420.945

const MARGIN_MAP = {
  compact: 12,
  standard: 20,
  relaxed: 30,
};

/**
 * Merges a list of invoice items into an A4 2-up imposition PDF document
 */
export async function mergeInvoicesToA4(
  invoices: InvoiceItem[],
  settings: ImpositionSettings
): Promise<Uint8Array> {
  const targetDoc = await PDFDocument.create();
  targetDoc.setTitle('发票合并报销单');
  targetDoc.setCreator('PDFTools - 智能发票合并打印');

  // 1. Prepend Reimbursement Cover Sheet if requested
  if (settings.includeSummaryCover && invoices.length > 0) {
    try {
      const coverPngBytes = await renderReimbursementCoverCanvas(invoices, settings);
      const coverImage = await targetDoc.embedPng(coverPngBytes);
      const coverPage = targetDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      coverPage.drawImage(coverImage, {
        x: 0,
        y: 0,
        width: A4_WIDTH,
        height: A4_HEIGHT,
      });
    } catch (err) {
      console.error('Failed to generate reimbursement cover sheet:', err);
    }
  }

  if (invoices.length === 0) {
    // If no invoices, return cover or blank page
    if (targetDoc.getPageCount() === 0) {
      targetDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    }
    return await targetDoc.save();
  }

  const margin = MARGIN_MAP[settings.marginPreset] || 20;
  const availWidth = A4_WIDTH - margin * 2;

  if (settings.layoutMode === '1-up-center') {
    // 1-up layout: 1 invoice per A4 page centered
    const availHeight = A4_HEIGHT - margin * 2;
    for (const item of invoices) {
      const page = targetDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      await drawInvoiceToSlot(targetDoc, page, item, {
        x: margin,
        y: margin,
        width: availWidth,
        height: availHeight,
      }, settings);
    }
  } else {
    // Standard 2-up vertical layout: 2 invoices per A4 page (Top and Bottom)
    const slotHeight = HALF_HEIGHT - margin * 2;

    for (let i = 0; i < invoices.length; i += 2) {
      const topInvoice = invoices[i];
      const bottomInvoice = invoices[i + 1];

      const page = targetDoc.addPage([A4_WIDTH, A4_HEIGHT]);

      // Draw Top Slot (Y: HALF_HEIGHT to A4_HEIGHT)
      if (topInvoice) {
        await drawInvoiceToSlot(
          targetDoc,
          page,
          topInvoice,
          {
            x: margin,
            y: HALF_HEIGHT + margin,
            width: availWidth,
            height: slotHeight,
          },
          settings
        );
      }

      // Draw Bottom Slot (Y: 0 to HALF_HEIGHT)
      if (bottomInvoice) {
        await drawInvoiceToSlot(
          targetDoc,
          page,
          bottomInvoice,
          {
            x: margin,
            y: margin,
            width: availWidth,
            height: slotHeight,
          },
          settings
        );
      }

      // Draw middle dashed cut line if enabled
      if (settings.showCutLine) {
        drawCutGuideLine(page);
      }
    }
  }

  return await targetDoc.save();
}

/**
 * Draws a single invoice into a specified bounding box on an A4 page
 */
async function drawInvoiceToSlot(
  targetDoc: PDFDocument,
  page: any,
  item: InvoiceItem,
  slot: { x: number; y: number; width: number; height: number },
  settings: ImpositionSettings
) {
  try {
    const arrayBuffer = await item.file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (srcDoc.getPageCount() === 0) return;

    const [embeddedPage] = await targetDoc.embedPdf(srcDoc, [0]);
    const origW = embeddedPage.width;
    const origH = embeddedPage.height;

    // Check if orientation flip is beneficial
    // If invoice is portrait (origW < origH) and slot is landscape, autoRotate
    const isPortrait = origW < origH;
    const shouldRotate = settings.autoRotate && isPortrait;

    if (shouldRotate) {
      // Rotate 90 degrees
      const scale = Math.min(slot.width / origH, slot.height / origW);
      const drawW = origW * scale;
      const drawH = origH * scale;

      // When rotating 90 degrees counter-clockwise or clockwise:
      // In pdf-lib, rotate: degrees(90) rotates around lower-left origin
      // Center calculation:
      const posX = slot.x + (slot.width - drawH) / 2 + drawH;
      const posY = slot.y + (slot.height - drawW) / 2;

      page.drawPage(embeddedPage, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH,
        rotate: degrees(90),
      });
    } else {
      // Normal direct fit
      const scale = Math.min(slot.width / origW, slot.height / origH);
      const drawW = origW * scale;
      const drawH = origH * scale;

      const posX = slot.x + (slot.width - drawW) / 2;
      const posY = slot.y + (slot.height - drawH) / 2;

      page.drawPage(embeddedPage, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH,
      });
    }
  } catch (err) {
    console.error('Error drawing invoice to slot:', err);
  }
}

/**
 * Draws an elegant dashed cut line across the middle of the A4 page
 */
function drawCutGuideLine(page: any) {
  const lineY = HALF_HEIGHT;
  const startX = 18;
  const endX = A4_WIDTH - 18;

  // Left dashed segment
  page.drawLine({
    start: { x: startX, y: lineY },
    end: { x: A4_WIDTH / 2 - 40, y: lineY },
    thickness: 0.6,
    color: rgb(0.65, 0.72, 0.8),
    dashArray: [4, 4],
  });

  // Right dashed segment
  page.drawLine({
    start: { x: A4_WIDTH / 2 + 40, y: lineY },
    end: { x: endX, y: lineY },
    thickness: 0.6,
    color: rgb(0.65, 0.72, 0.8),
    dashArray: [4, 4],
  });

  // Center subtle scissor vector marks
  const cx = A4_WIDTH / 2;
  // Blade 1
  page.drawLine({
    start: { x: cx - 12, y: lineY - 3 },
    end: { x: cx + 12, y: lineY + 3 },
    thickness: 0.8,
    color: rgb(0.55, 0.62, 0.72),
  });
  // Blade 2
  page.drawLine({
    start: { x: cx - 12, y: lineY + 3 },
    end: { x: cx + 12, y: lineY - 3 },
    thickness: 0.8,
    color: rgb(0.55, 0.62, 0.72),
  });
  // Center pivot dot
  page.drawCircle({
    x: cx,
    y: lineY,
    size: 1.5,
    color: rgb(0.4, 0.48, 0.6),
  });
}
