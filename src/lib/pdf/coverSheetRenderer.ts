import { convertToChineseCurrency } from './invoiceParser';
import type { InvoiceItem, ImpositionSettings } from '../../types/invoice';

/**
 * Renders a high-resolution (300 DPI) A4 Expense Reimbursement Cover Sheet
 * using native HTML5 Canvas and system Chinese typography.
 * Returns PNG ArrayBuffer suitable for embedding into pdf-lib.
 */
export async function renderReimbursementCoverCanvas(
  invoices: InvoiceItem[],
  settings: ImpositionSettings
): Promise<Uint8Array> {
  // A4 at 300 DPI: 2480 x 3508 pixels
  const width = 2480;
  const height = 3508;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas 2d context');

  // Background - Pure White
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Outer decorative border
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 6;
  ctx.strokeRect(120, 120, width - 240, height - 240);

  ctx.strokeStyle = '#93C5FD';
  ctx.lineWidth = 2;
  ctx.strokeRect(132, 132, width - 264, height - 264);

  // Document Title
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 72px "PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(settings.reimbursementTitle || '费用报销汇总单', width / 2, 280);

  // Subtitle / English Tag
  ctx.fillStyle = '#64748B';
  ctx.font = '32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('EXPENSE REIMBURSEMENT SUMMARY SHEET', width / 2, 340);

  // Metadata Grid Box (Header info)
  const metaY = 400;
  const metaHeight = 220;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(180, metaY, width - 360, metaHeight);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(180, metaY, width - 360, metaHeight);

  // Metadata items
  ctx.textAlign = 'left';
  ctx.font = '36px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#475569';

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const totalAmount = invoices.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalCount = invoices.length;

  // Row 1
  ctx.fillText(`报销部门：${settings.departmentName || '未指定'}`, 240, metaY + 80);
  ctx.fillText(`报销人：${settings.applicantName || '财务经办人'}`, 1000, metaY + 80);
  ctx.fillText(`汇总日期：${today}`, 1760, metaY + 80);

  // Row 2
  ctx.fillText(`发票份数：${totalCount} 份`, 240, metaY + 160);
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 38px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`报销总额：¥ ${totalAmount.toFixed(2)} 元`, 1000, metaY + 160);

  // Chinese Capital Currency Banner
  const chineseCapY = 660;
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(180, chineseCapY, width - 360, 90);
  ctx.strokeStyle = '#BFDBFE';
  ctx.strokeRect(180, chineseCapY, width - 360, 90);

  ctx.fillStyle = '#1E40AF';
  ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`金额大写：${convertToChineseCurrency(totalAmount)}`, 240, chineseCapY + 58);

  // Invoices Table Header
  const tableY = 800;
  const colX = [180, 320, 840, 1260, 1860, width - 180];
  const rowHeight = 75;

  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(colX[0], tableY, colX[5] - colX[0], rowHeight);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('序号', (colX[0] + colX[1]) / 2, tableY + 50);
  ctx.fillText('发票号码', (colX[1] + colX[2]) / 2, tableY + 50);
  ctx.fillText('开票日期', (colX[2] + colX[3]) / 2, tableY + 50);
  ctx.fillText('销售方/开票商户', (colX[3] + colX[4]) / 2, tableY + 50);
  ctx.fillText('金额 (元)', (colX[4] + colX[5]) / 2, tableY + 50);

  // Table Rows (up to 20 rows on cover sheet)
  let currentY = tableY + rowHeight;
  const maxDisplay = Math.min(invoices.length, 25);

  ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';

  for (let i = 0; i < maxDisplay; i++) {
    const item = invoices[i];
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.fillRect(colX[0], currentY, colX[5] - colX[0], rowHeight);

    // Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(colX[0], currentY, colX[5] - colX[0], rowHeight);

    ctx.fillStyle = '#334155';
    // Index
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, (colX[0] + colX[1]) / 2, currentY + 48);

    // Invoice No
    const invNo = item.invoiceNumber || item.fileName.replace(/\.pdf$/i, '').substring(0, 16);
    ctx.fillText(invNo, (colX[1] + colX[2]) / 2, currentY + 48);

    // Date
    ctx.fillText(item.invoiceDate || '-', (colX[2] + colX[3]) / 2, currentY + 48);

    // Seller (truncate if too long)
    ctx.textAlign = 'left';
    let seller = item.sellerName || '-';
    if (seller.length > 14) seller = seller.substring(0, 13) + '...';
    ctx.fillText(seller, colX[3] + 20, currentY + 48);

    // Amount
    ctx.textAlign = 'right';
    const amtStr = item.amount ? `¥ ${item.amount.toFixed(2)}` : '-';
    ctx.fillText(amtStr, colX[5] - 30, currentY + 48);

    currentY += rowHeight;
  }

  // If there are more than 25 invoices
  if (invoices.length > maxDisplay) {
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText(`... 以及其余 ${invoices.length - maxDisplay} 份发票明细 ...`, width / 2, currentY + 50);
    currentY += rowHeight;
  }

  // Footer Signatures Box
  const footerY = height - 420;
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(180, footerY, width - 360, 200);

  ctx.fillStyle = '#475569';
  ctx.font = '32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('申请人签名：___________________', 240, footerY + 115);
  ctx.fillText('部门主管审批：___________________', 980, footerY + 115);
  ctx.fillText('财务审核：___________________', 1720, footerY + 115);

  // Return PNG ArrayBuffer
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });

  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
