export interface InvoiceItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  pageCount: number;
  thumbnailUrl?: string;
  /** High-res rendered page image dataURL (ensures 100% stamp/annotation fidelity when needed) */
  renderedImageUrl?: string;
  width: number;
  height: number;
  /** Extracted Invoice Metadata */
  invoiceNumber?: string;
  invoiceCode?: string;
  invoiceDate?: string;
  amount?: number;
  sellerName?: string;
  buyerName?: string;
  isCopy?: boolean;
  copyIndex?: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface ImpositionSettings {
  /** Layout per A4 page: 2-up vertical (default for invoices) or 1-up */
  layoutMode: '2-up-vertical' | '1-up-center';
  /** Draw dashed scissor cut line in the middle of A4 */
  showCutLine: boolean;
  /** Margin size in points (compact: 10, standard: 18, relaxed: 28) */
  marginPreset: 'compact' | 'standard' | 'relaxed';
  /** Auto-rotate portrait invoices to fit half-A4 landscape slot */
  autoRotate: boolean;
  /** Prepend a reimbursement summary cover sheet */
  includeSummaryCover: boolean;
  /** Reimbursement cover metadata */
  reimbursementTitle: string;
  applicantName: string;
  departmentName: string;
  /** Render mode: vector (fast, crisp text + flattened stamps) or raster-highres (100% pixel-identical for stubborn seals) */
  renderEngine: 'vector-smart' | 'highres-raster';
}

export type ActiveToolTab =
  | 'invoice-merge'
  | 'general-merge'
  | 'invoice-rename'
  | 'pdf-split'
  | 'pdf-watermark';
