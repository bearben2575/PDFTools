import { PDFDocument } from 'pdf-lib';

export interface GeneralPdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnailUrl?: string;
}

/**
 * Merges multiple general PDF documents into a single document sequentially
 */
export async function mergeGeneralPdfs(
  files: GeneralPdfFileItem[],
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  mergedPdf.setCreator('PDFTools - 通用PDF合并');

  const total = files.length;
  for (let i = 0; i < total; i++) {
    const item = files[i];
    try {
      const arrayBuffer = await item.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (err) {
      console.error(`Failed to merge file: ${item.name}`, err);
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return await mergedPdf.save();
}
