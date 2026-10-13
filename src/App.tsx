import React, { useState } from 'react';
import { Header } from './components/Header';
import { InvoiceMergeWorkbench } from './components/InvoiceMergeWorkbench';
import { GeneralMergeWorkbench } from './components/GeneralMergeWorkbench';
import type { ActiveToolTab } from './types/invoice';
import { Shield } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveToolTab>('invoice-merge');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'invoice-merge' && <InvoiceMergeWorkbench />}
        {activeTab === 'general-merge' && <GeneralMergeWorkbench />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>所有文件处理均在您的浏览器本地内存中完成，无任何文件上传至远程服务器。</span>
            </div>

            <div className="flex items-center space-x-4">
              <span>PDFTools 智能发票合并助手</span>
              <span>•</span>
              <span>A4 双联排版 · 财务报销专用</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
