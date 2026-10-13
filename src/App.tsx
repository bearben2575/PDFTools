import React, { useState } from 'react';
import { Header } from './components/Header';
import { InvoiceMergeWorkbench } from './components/InvoiceMergeWorkbench';
import { InvoiceRenameWorkbench } from './components/InvoiceRenameWorkbench';
import { GeneralMergeWorkbench } from './components/GeneralMergeWorkbench';
import type { ActiveToolTab } from './types/invoice';
import { Shield, GitBranch, Scale, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveToolTab>('invoice-merge');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'invoice-merge' && <InvoiceMergeWorkbench />}
        {activeTab === 'invoice-rename' && <InvoiceRenameWorkbench />}
        {activeTab === 'general-merge' && <GeneralMergeWorkbench />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            {/* Privacy indicator */}
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>所有文件处理均在您的浏览器本地内存中完成，无任何文件上传至远程服务器。</span>
            </div>

            {/* Open Source Repo & License */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href="https://github.com/bearben2575/PDFTools"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-blue-600 font-medium transition"
              >
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                <span>GitHub 开源仓库</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <span>•</span>

              <a
                href="https://github.com/bearben2575/PDFTools/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-600 transition"
              >
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <span>基于 MIT License 协议开源</span>
              </a>

              <span>•</span>

              <span className="text-slate-400">
                PDFTools © 2026
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
