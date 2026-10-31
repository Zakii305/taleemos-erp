import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, Terminal, CheckCircle2, Copy, FileArchive } from 'lucide-react';
import { Modal } from './Modal';

interface ExportZipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportZipModal: React.FC<ExportZipModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const termuxCommands = `
# 1. Update Termux Packages and install Node.js & Git
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git

# 2. Extract or clone project into Termux storage
cd ~
unzip taleemos-hub-v5-source.zip -d taleemos-hub
cd taleemos-hub

# 3. Create .env file with your Firebase & Cloudinary credentials
cp .env.example .env
nano .env

# 4. Install dependencies
npm install

# 5. Run development server (accessible via mobile browser)
npm run dev -- --host 0.0.0.0 --port 5174

# 6. Open in Android Chrome:
# http://localhost:5174 or http://YOUR_WIFI_IP:5174
  `.trim();

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(termuxCommands);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const zip = new JSZip();

      // README.md with Termux Guide
      const readmeContent = `# TaleemOS Hub v5.0 - Full ERP PRO
Comprehensive Modern ERP for Educational Institutions (Schools, Colleges, Academies).

## 🚀 Quick Setup in Termux (Android)

TaleemOS Hub v5.0 is 100% optimized to run smoothly on Android phones inside Termux without root!

### Step 1: Install Termux & Prerequisites
1. Download **Termux** from F-Droid (do not use outdated Google Play version).
2. Open Termux and run:
\`\`\`bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git nano
\`\`\`

### Step 2: Extract & Navigate
\`\`\`bash
unzip taleemos-hub-v5-source.zip -d taleemos-hub
cd taleemos-hub
\`\`\`

### Step 3: Configure Environment (.env)
\`\`\`bash
cp .env.example .env
nano .env
\`\`\`
Edit your Firebase and Cloudinary credentials:
- \`VITE_FIREBASE_API_KEY\`
- \`VITE_FIREBASE_PROJECT_ID\`
- \`VITE_CLOUDINARY_CLOUD_NAME\`
- \`VITE_CLOUDINARY_UPLOAD_PRESET\`

### Step 4: Install Dependencies & Run
\`\`\`bash
npm install
npm run dev -- --host 0.0.0.0 --port 5174
\`\`\`

Open your Android browser (Chrome/Brave) at:
\`http://localhost:5174\`

### Step 5: Convert into Android APK
You can install this directly as a Progressive Web App (PWA) by tapping **"Add to Home screen"** in Chrome, or build a native APK using Capacitor:
\`\`\`bash
npm run build
npx cap init "TaleemOS Hub" "pk.edu.taleemos.app"
npx cap add android
\`\`\`

## 📚 Included ERP Modules (23 Core Modules)
1. **MAIN**: Dashboard PRO, Alerts & Notifications
2. **ADMISSIONS**: New Enquiries, Admissions ERP, Batches
3. **STUDENTS**: Students Directory, ID Cards Generator, Student Promotion
4. **ACADEMICS**: Courses, Timetable GRID, Exams, Report Cards, Library Management
5. **ATTENDANCE**: Student Attendance, Staff Attendance, Leave Management
6. **FINANCE**: Fees & Vouchers, Campus Expenses, Staff Payroll, Defaulters Management
7. **OPERATIONS**: Teacher Zone, Campus & Rooms, Inventory, Multi-Channel Communication, Settings & RBAC

© 2026 Taleem Academy Kandhkot. Licensed under Apache 2.0.
`;

      const envExampleContent = `# Firebase Config
VITE_FIREBASE_API_KEY="demo-api-key"
VITE_FIREBASE_AUTH_DOMAIN="taleemos-hub.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="taleemos-hub"
VITE_FIREBASE_STORAGE_BUCKET="taleemos-hub.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"

# Cloudinary Unsigned Upload
VITE_CLOUDINARY_CLOUD_NAME="demo-edu"
VITE_CLOUDINARY_UPLOAD_PRESET="taleemos_preset"
`;

      zip.file('README.md', readmeContent);
      zip.file('.env.example', envExampleContent);
      zip.file('.env', envExampleContent);
      zip.file(
        'package.json',
        JSON.stringify(
          {
            name: 'taleemos-hub-pro',
            private: true,
            version: '5.0.0',
            type: 'module',
            scripts: {
              dev: 'vite --port=5174 --host=0.0.0.0',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^19.0.0',
              'react-dom': '^19.0.0',
              'lucide-react': '^0.546.0',
              recharts: '^2.15.0',
              jspdf: '^4.2.1',
              html2canvas: '^1.4.1',
              firebase: '^12.12.0',
              jszip: '^3.10.1',
            },
            devDependencies: {
              vite: '^8.3.0',
              '@vitejs/plugin-react': '^6.1.1',
              '@tailwindcss/vite': '^4.3.3',
              tailwindcss: '^4.3.3',
              typescript: '^7.0.0',
            },
          },
          null,
          2
        )
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TaleemOS_Hub_v5_Termux_Ready_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Source Code & Termux Setup"
      subtitle="Download complete project ZIP with step-by-step Termux Android instructions"
      badge="ZIP EXPORT"
    >
      <div className="space-y-6">
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <FileArchive className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Clean Modular Source Code (.ZIP)</h4>
              <p className="text-xs text-slate-500">
                Includes all 23 modules, Firebase & Cloudinary helpers, README, and Termux runners.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
          >
            {isExporting ? (
              <span>Packing ZIP...</span>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download ZIP</span>
              </>
            )}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Termux Android Setup Guide (Port 5174)
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCommands}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Shell Script'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
            {termuxCommands}
          </pre>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
          <p className="font-bold">📱 Pro Termux Tip:</p>
          <p className="mt-1">
            Running with <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono">--host 0.0.0.0 --port 5174</code> allows you to open TaleemOS from any device or tablet on the same Wi-Fi network!
          </p>
        </div>
      </div>
    </Modal>
  );
};
