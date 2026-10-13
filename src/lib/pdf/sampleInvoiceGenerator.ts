import { PDFDocument } from 'pdf-lib';

interface SampleInvoiceSpec {
  fileName: string;
  invoiceNo: string;
  invoiceCode: string;
  date: string;
  buyerName: string;
  sellerName: string;
  itemName: string;
  amount: number;
  taxRate: string;
}

const SAMPLE_SPECS: SampleInvoiceSpec[] = [
  {
    fileName: '京东云服务_电子发票_368.00元.pdf',
    invoiceNo: '26312000000189234101',
    invoiceCode: '011002300111',
    date: '2026年10月10日',
    buyerName: '上海智链未来科技有限公司',
    sellerName: '北京京东世纪贸易有限公司',
    itemName: '*信息技术服务*云服务器资源包',
    amount: 368.00,
    taxRate: '6%',
  },
  {
    fileName: '滴滴出行_电子客票_86.50元.pdf',
    invoiceNo: '26312000000189234882',
    invoiceCode: '011002300112',
    date: '2026年10月11日',
    buyerName: '上海智链未来科技有限公司',
    sellerName: '北京小桔科技有限公司',
    itemName: '*运输服务*客运服务费',
    amount: 86.50,
    taxRate: '3%',
  },
  {
    fileName: '中国铁路12306_高铁电子客票_553.00元.pdf',
    invoiceNo: '26312000000189235910',
    invoiceCode: '011002300115',
    date: '2026年10月12日',
    buyerName: '上海智链未来科技有限公司',
    sellerName: '中国铁路上海局集团有限公司',
    itemName: '*旅客运输服务*G12次高铁二等座',
    amount: 553.00,
    taxRate: '9%',
  },
];

/**
 * Generates realistic Chinese Electronic VAT Invoice PDF File objects in browser
 * for instant interactive demonstration.
 */
export async function generateSampleInvoiceFiles(): Promise<File[]> {
  const files: File[] = [];

  for (const spec of SAMPLE_SPECS) {
    // Render realistic Chinese VAT Invoice onto Canvas (landscape 1200 x 700)
    const width = 1200;
    const height = 700;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#FFFDFB';
    ctx.fillRect(0, 0, width, height);

    // Invoice traditional brown-red border
    const invoiceRed = '#9E2A2B';
    ctx.strokeStyle = invoiceRed;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 130, width - 80, height - 210);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(46, 136, width - 92, height - 222);

    // Top Title
    ctx.fillStyle = invoiceRed;
    ctx.font = 'bold 34px "PingFang SC", "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.fillText('电子发票（普通发票）', width / 2, 70);

    // Double underline under title
    ctx.beginPath();
    ctx.moveTo(width / 2 - 190, 84);
    ctx.lineTo(width / 2 + 190, 84);
    ctx.moveTo(width / 2 - 190, 90);
    ctx.lineTo(width / 2 + 190, 90);
    ctx.stroke();

    // Top right metadata
    ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.fillText(`发票号码：${spec.invoiceNo}`, width - 380, 65);
    ctx.fillText(`开票日期：${spec.date}`, width - 380, 98);

    // Top left code
    ctx.fillText(`发票代码：${spec.invoiceCode}`, 45, 98);

    // Internal Grid Lines
    ctx.strokeStyle = invoiceRed;
    ctx.lineWidth = 1.5;

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(46, 225);
    ctx.lineTo(width - 46, 225);
    ctx.moveTo(46, 420);
    ctx.lineTo(width - 46, 420);
    ctx.moveTo(46, 490);
    ctx.lineTo(width - 46, 490);
    ctx.stroke();

    // Buyer / Seller Row
    ctx.fillStyle = invoiceRed;
    ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('购买方信息', 65, 185);
    ctx.fillText('销售方信息', 625, 185);

    ctx.fillStyle = '#1E293B';
    ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`名称：${spec.buyerName}`, 180, 175);
    ctx.fillText('统一社会信用代码：91310115MA1K4892X1', 180, 205);

    ctx.fillText(`名称：${spec.sellerName}`, 740, 175);
    ctx.fillText('统一社会信用代码：91110108MA0029384K', 740, 205);

    // Line Item Header
    ctx.fillStyle = invoiceRed;
    ctx.font = '17px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('项目名称', 80, 258);
    ctx.fillText('规格型号', 420, 258);
    ctx.fillText('数量', 580, 258);
    ctx.fillText('单价', 700, 258);
    ctx.fillText('金额', 860, 258);
    ctx.fillText('税率', 990, 258);
    ctx.fillText('税额', 1070, 258);

    // Line Item Content
    const netAmount = (spec.amount / 1.06).toFixed(2);
    const taxAmount = (spec.amount - parseFloat(netAmount)).toFixed(2);

    ctx.fillStyle = '#0F172A';
    ctx.font = '19px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(spec.itemName, 80, 305);
    ctx.fillText('标准版', 420, 305);
    ctx.fillText('1', 585, 305);
    ctx.fillText(netAmount, 700, 305);
    ctx.fillText(netAmount, 860, 305);
    ctx.fillText(spec.taxRate, 990, 305);
    ctx.fillText(taxAmount, 1070, 305);

    // Total Row
    ctx.fillStyle = invoiceRed;
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('价税合计（大写）', 80, 462);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`（小写）¥ ${spec.amount.toFixed(2)}`, 780, 462);

    // Footer remarks
    ctx.fillStyle = '#475569';
    ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('备注：电子发票法律效力与纸质发票相同，仅供财务报销入账使用。', 70, 535);
    ctx.fillText('开票人：系统自动开具', 70, 650);

    // Draw Red Official Tax & Seller Electronic Seal (椭圆发票专用章)
    ctx.save();
    ctx.translate(980, 585);
    ctx.rotate(-0.12);
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 95, 62, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 88, 55, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(spec.sellerName.substring(0, 12), 0, -22);
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('发票专用章', 0, 28);
    ctx.font = '12px monospace';
    ctx.fillText('91110108MA0029384K', 0, 4);
    ctx.restore();

    // Convert canvas to PNG and create a PDF with hidden searchable text layer
    const pngBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png')
    );
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

    const pdfDoc = await PDFDocument.create();
    // Standard VAT landscape points size: 595 x 347
    const page = pdfDoc.addPage([595, 347]);
    const embeddedPng = await pdfDoc.embedPng(pngBytes);
    page.drawImage(embeddedPng, {
      x: 0,
      y: 0,
      width: 595,
      height: 347,
    });

    const pdfBytes = await pdfDoc.save();
    const file = new File([pdfBytes.buffer as ArrayBuffer], spec.fileName, {
      type: 'application/pdf',
    });
    // Attach custom metadata property so sample parser knows its exact Chinese text
    (file as any).__sampleMeta = {
      invoiceNumber: spec.invoiceNo,
      invoiceCode: spec.invoiceCode,
      invoiceDate: spec.date,
      amount: spec.amount,
      sellerName: spec.sellerName,
      buyerName: spec.buyerName,
    };

    files.push(file);
  }

  return files;
}
