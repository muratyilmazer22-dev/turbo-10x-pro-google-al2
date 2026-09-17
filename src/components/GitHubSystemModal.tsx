import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  FolderGit2, 
  Save, 
  ShieldCheck, 
  X, 
  Copy, 
  Terminal, 
  CloudUpload,
  Layers,
  Database
} from 'lucide-react';

interface GitHubStatus {
  isGitRepo: boolean;
  currentBranch: string;
  totalCommits: number;
  lastCommit: {
    hash: string;
    shortHash: string;
    author: string;
    email: string;
    date: string;
    message: string;
  } | null;
  uncommittedFilesCount: number;
  uncommittedFiles: string[];
  isClean: boolean;
  remoteUrl: string;
  config: {
    repo: string;
    branch: string;
    hasToken: boolean;
    autoSync: boolean;
  };
  ciWorkflow: {
    configured: boolean;
    path: string;
  };
}

interface CommitItem {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

interface GitHubSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubSystemModal: React.FC<GitHubSystemModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pull' | 'commit' | 'history' | 'settings'>('overview');
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [pulling, setPulling] = useState<boolean>(false);
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [selectedPullBranch, setSelectedPullBranch] = useState<string>('fix/6x6-tutturma-motor-tamamlama');
  const [availableBranches, setAvailableBranches] = useState<string[]>(['main', 'fix/6x6-tutturma-motor-tamamlama']);
  const [pullResult, setPullResult] = useState<any>(null);
  const [repoConfig, setRepoConfig] = useState({
    repo: 'muratyilmazer22-dev/turbo-10x-pro-google-al2',
    branch: 'main',
    token: '',
    remoteUrl: 'https://github.com/muratyilmazer22-dev/turbo-10x-pro-google-al2.git',
    autoSync: true
  });
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.config) {
          setRepoConfig(prev => ({
            ...prev,
            repo: data.config.repo || prev.repo,
            branch: data.config.branch || 'main',
            remoteUrl: data.remoteUrl || prev.remoteUrl,
            autoSync: data.config.autoSync ?? true
          }));
        }
      }
    } catch (err: any) {
      console.error('GitHub status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommits = async () => {
    try {
      const res = await fetch('/api/github/commits');
      if (res.ok) {
        const data = await res.json();
        setCommits(data.commits || []);
      }
    } catch (err) {
      console.error('GitHub commits fetch error:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/github/branches');
      if (res.ok) {
        const data = await res.json();
        if (data.remoteBranches && data.remoteBranches.length > 0) {
          setAvailableBranches(data.remoteBranches);
        }
      }
    } catch (err) {
      console.error('GitHub branches fetch error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchCommits();
      fetchBranches();
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  const handlePullFromGitHub = async (branchToUse?: string) => {
    const branch = branchToUse || selectedPullBranch || 'main';
    try {
      setPulling(true);
      setPullResult(null);
      const res = await fetch('/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPullResult(data);
        setFeedbackMsg({
          type: 'success',
          text: `✓ GitHub '${branch}' dalından güncel kodlar başarıyla çekildi ve sisteme entegre edildi!`
        });
        fetchStatus();
        fetchCommits();
      } else {
        setFeedbackMsg({
          type: 'error',
          text: data.error || 'Kodlar çekilirken bir hata oluştu.'
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Bağlantı hatası.'
      });
    } finally {
      setPulling(false);
    }
  };

  const handleCreateCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          type: 'success',
          text: data.committed ? `✓ Commit oluşturuldu (${data.commit?.shortHash}): ${data.commit?.message}` : (data.message || 'Çalışma alanı zaten güncel.')
        });
        setCommitMessage('');
        fetchStatus();
        fetchCommits();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Commit oluşturulamadı.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Bağlantı hatası.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repoConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({ type: 'success', text: '✓ GitHub yapılandırması başarıyla kaydedildi.' });
        fetchStatus();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Ayarlar kaydedilemedi.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFullSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/github/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({ type: 'success', text: `✓ ${data.message}` });
        fetchStatus();
        fetchCommits();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Senkronizasyon başarısız.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#131418] border border-[#282A30] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282A30] bg-[#1A1C22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-inner">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  GitHub Entegrasyonu & Çalışma Sistemi
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  TURBO 10X PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tam Git sürüm kontrolü, otomatik veritabanı yedekleme, CI/CD ve uzak depo yönetimi
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#282A30] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#282A30] bg-[#16181E] overflow-x-auto text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400 bg-[#1A1C22]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Depo Durumu & Özet
          </button>

          <button
            onClick={() => setActiveTab('pull')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pull'
                ? 'border-emerald-400 text-emerald-400 bg-[#1A1C22]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            GitHub'dan Çek (Pull)
          </button>

          <button
            onClick={() => setActiveTab('commit')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'commit'
                ? 'border-cyan-400 text-cyan-400 bg-[#1A1C22]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            Hızlı Commit & Yedekle
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-400 bg-[#1A1C22]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Commit Geçmişi ({commits.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-cyan-400 text-cyan-400 bg-[#1A1C22]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            GitHub Ayarları & Uzak Depo
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-3 text-xs sm:text-sm border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:bg-black/20 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#1A1C22] border border-[#282A30] space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Aktif Dal (Branch)</span>
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    {status?.currentBranch || 'main'}
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] text-emerald-400">Git Repo Aktif</div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1C22] border border-[#282A30] space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Toplam Commit</span>
                    <GitCommit className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {status?.totalCommits || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">Versiyon Kayıtları</div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1C22] border border-[#282A30] space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Çalışma Ağacı</span>
                    <Terminal className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold font-mono">
                    {status?.isClean ? (
                      <span className="text-emerald-400">Tertemiz (Clean)</span>
                    ) : (
                      <span className="text-amber-400">{status?.uncommittedFilesCount} dosya</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {status?.isClean ? 'Değişiklikler commit edilmiş' : 'Commit bekleyen dosyalar var'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1C22] border border-[#282A30] space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>GitHub Actions CI/CD</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>Aktif</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] text-slate-400">.github/workflows/ci.yml</div>
                </div>
              </div>

              {/* Last Commit Card */}
              {status?.lastCommit && (
                <div className="p-4 rounded-xl bg-[#16181E] border border-[#282A30] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GitCommit className="w-4 h-4" /> Son Commit
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 rounded text-[11px] bg-black/40 text-cyan-300 font-mono border border-slate-700">
                        {status.lastCommit.shortHash}
                      </code>
                      <button
                        onClick={() => handleCopy(status?.lastCommit?.hash || '', 'last')}
                        className="p-1 hover:text-cyan-400 text-slate-400 cursor-pointer"
                        title="Hash Kopyala"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {status.lastCommit.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span>Yazar: <strong className="text-slate-200">{status.lastCommit.author}</strong></span>
                    <span>Tarih: <strong className="text-slate-200">{status.lastCommit.date}</strong></span>
                  </div>
                </div>
              )}

              {/* Fast Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('pull')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <GitPullRequest className="w-4 h-4" />
                  GitHub'dan Kodları Çek (Pull)
                </button>

                <button
                  onClick={handleFullSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Senkronize Ediliyor...' : 'Tüm Sistemi & Hafızayı Senkronize Et'}
                </button>

                <a
                  href="/api/github/bundle-download"
                  download="turbo_10x_pro_github_repo.zip"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#20232B] hover:bg-[#282A30] text-slate-200 hover:text-white font-medium text-xs sm:text-sm border border-[#3E424C] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  Depo Kodlarını İndir (.ZIP)
                </a>

                <a
                  href="/api/system/github-sync-bundle"
                  download="github_full_system_sync_bundle.json"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#20232B] hover:bg-[#282A30] text-slate-200 hover:text-white font-medium text-xs sm:text-sm border border-[#3E424C] transition-all cursor-pointer"
                >
                  <Database className="w-4 h-4 text-indigo-400" />
                  Hafıza & DB Dışa Aktar (.JSON)
                </a>
              </div>
            </div>
          )}

          {/* TAB: PULL FROM GITHUB */}
          {activeTab === 'pull' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#1A1C22] border border-[#282A30] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                      <GitPullRequest className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">GitHub Uzak Depodan Kod Çekme & Entegrasyon</h3>
                      <p className="text-xs text-slate-400">
                        GitHub üzerindeki <code>main</code> veya <code>fix/6x6-tutturma-motor-tamamlama</code> dalına bağlanıp güncel kodları uygulamaya entegre edin.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fetchBranches}
                    className="p-1.5 rounded-lg bg-[#20232B] hover:bg-[#282A30] text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                    title="Dalları Yenile"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dalları Yenile</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Bağlı GitHub Deposu:</span>
                    <span className="text-cyan-400 font-mono text-[11px] font-medium truncate max-w-[320px]">
                      https://github.com/muratyilmazer22-dev/turbo-10x-pro-google-al2.git
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Mevcut Çalışan Yerel Dal:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-mono text-[11px] font-bold">
                      {status?.currentBranch || 'main'}
                    </span>
                  </div>
                </div>

                {/* Branch Selection */}
                <div className="space-y-3 pt-1">
                  <label className="text-xs text-slate-300 font-medium block">
                    Çekilecek Uzak GitHub Dalı (Remote Branch):
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setSelectedPullBranch('fix/6x6-tutturma-motor-tamamlama')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedPullBranch === 'fix/6x6-tutturma-motor-tamamlama'
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-[#14161C] border-[#2A2D36] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                          fix/6x6-tutturma-motor-tamamlama
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">
                          Önerilen (6/6 Motoru)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        AHP Puanlama, Monte Carlo Pace Simülasyonu, Knapsack Bütçe Motoru, useGeminiAnalysis ve telefon entegrasyonu rehberleri içerir.
                      </p>
                    </div>

                    <div
                      onClick={() => setSelectedPullBranch('main')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedPullBranch === 'main'
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-[#14161C] border-[#2A2D36] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                          main
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                          Ana Dal
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        PWA mobil bildirimleri, mobil meta etiketleri ve temel üretim sürümünü barındırır.
                      </p>
                    </div>
                  </div>

                  {/* Manual Branch Input */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Veya özel dal adı girin:</span>
                      {availableBranches.length > 0 && (
                        <span>Mevcut dallar: {availableBranches.join(', ')}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={selectedPullBranch}
                      onChange={(e) => setSelectedPullBranch(e.target.value)}
                      placeholder="Örn: fix/6x6-tutturma-motor-tamamlama veya main"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#131418] border border-[#3E424C] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Pull Action Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Seçili dal: <strong className="text-emerald-400 font-mono">{selectedPullBranch}</strong>
                  </div>
                  <button
                    onClick={() => handlePullFromGitHub()}
                    disabled={pulling}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${pulling ? 'animate-spin' : ''}`} />
                    {pulling ? 'Kodlar Çekiliyor & Entegre Ediliyor...' : `GitHub '${selectedPullBranch}' Dalından Çek ve Entegre Et`}
                  </button>
                </div>
              </div>

              {/* Pull Result Details */}
              {pullResult && (
                <div className="p-4 rounded-xl bg-[#15191D] border border-emerald-800/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{pullResult.message}</span>
                  </div>

                  {pullResult.pulledCommit && (
                    <div className="p-3 rounded-lg bg-black/40 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Commit Hash:</span>
                        <code className="text-cyan-300 font-mono">{pullResult.pulledCommit.shortHash}</code>
                      </div>
                      <div className="text-white font-medium">
                        {pullResult.pulledCommit.message}
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1">
                        <span>Yazar: {pullResult.pulledCommit.author}</span>
                        <span>Tarih: {pullResult.pulledCommit.date}</span>
                      </div>
                    </div>
                  )}

                  {pullResult.updatedFiles && pullResult.updatedFiles.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-300 font-medium">
                        İncelenen / Entegre Edilen Dosyalar ({pullResult.updatedFilesCount}):
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-slate-400 bg-black/30 p-2 rounded-lg">
                        {pullResult.updatedFiles.map((file: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                            <span className="text-emerald-400">✓</span>
                            <span>{file}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMIT & BACKUP */}
          {activeTab === 'commit' && (
            <form onSubmit={handleCreateCommit} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1A1C22] border border-[#282A30] space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-cyan-400" />
                  Yeni Commit & Sistem Durumu Kaydı
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bu işlem, mevcut tüm kaynak kodları, TJK 24-aylık hafıza veritabanını, bültenleri ve kullanıcı notlarını otomatik olarak Git deposuna kaydeder ve <code>backups/latest_db_backup.json</code> dosyasına anlık yedek alır.
                </p>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs text-slate-300 font-medium">Commit Mesajı</label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Örn: 24 aylık Ankara hafızası ve 1. Altılı tempo katsayıları güncellendi"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#131418] border border-[#3E424C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Çalışma alanındaki {status?.uncommittedFilesCount || 0} dosya otomatik eklenecektir (git add .)
                  </span>
                  <button
                    type="submit"
                    disabled={loading || !commitMessage.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Kaydediliyor...' : 'Commit Et & Yedekle'}
                  </button>
                </div>
              </div>

              {/* Uncommitted files list */}
              {status && status.uncommittedFiles && status.uncommittedFiles.length > 0 && (
                <div className="p-4 rounded-xl bg-[#16181E] border border-[#282A30] space-y-2">
                  <div className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Değişen / İzlenen Dosyalar ({status.uncommittedFilesCount})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300 bg-black/30 p-2.5 rounded-lg">
                    {status.uncommittedFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{f.slice(0, 2)}</span>
                        <span>{f.slice(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Son Git Değişiklikleri (Commits)
                </h3>
                <button
                  onClick={fetchCommits}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#20232B] hover:bg-[#282A30] text-xs text-slate-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Yenile
                </button>
              </div>

              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {commits.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Henüz kayıtlı commit bulunamadı.
                  </div>
                ) : (
                  commits.map((c) => (
                    <div
                      key={c.hash}
                      className="p-3.5 rounded-xl bg-[#1A1C22] border border-[#282A30] hover:border-cyan-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {c.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{c.author}</span>
                          <span>•</span>
                          <span>{c.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <code className="px-2.5 py-1 rounded text-xs bg-black/40 text-cyan-300 font-mono border border-slate-700">
                          {c.shortHash}
                        </code>
                        <button
                          onClick={() => handleCopy(c.hash, c.shortHash)}
                          className="p-1.5 hover:text-cyan-400 text-slate-400 cursor-pointer rounded-lg hover:bg-[#282A30]"
                          title="Hash Kopyala"
                        >
                          {copiedHash === c.shortHash ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & REMOTE CONFIG */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1A1C22] border border-[#282A30] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">GitHub Uzak Depo Yapılandırması</h3>
                    <p className="text-xs text-slate-400">
                      Projeyi kendi GitHub hesabınızdaki depoyla senkronize etmek için yapılandırın.
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-cyan-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium">GitHub Repository (kullanici/repo)</label>
                    <input
                      type="text"
                      value={repoConfig.repo}
                      onChange={(e) => setRepoConfig({ ...repoConfig, repo: e.target.value })}
                      placeholder="kullanici/turbo-10x-pro"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#131418] border border-[#3E424C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium">Hedef Dal (Branch)</label>
                    <input
                      type="text"
                      value={repoConfig.branch}
                      onChange={(e) => setRepoConfig({ ...repoConfig, branch: e.target.value })}
                      placeholder="main"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#131418] border border-[#3E424C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">Git Remote Origin URL</label>
                  <input
                    type="text"
                    value={repoConfig.remoteUrl}
                    onChange={(e) => setRepoConfig({ ...repoConfig, remoteUrl: e.target.value })}
                    placeholder="https://github.com/kullanici/turbo-10x-pro.git"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131418] border border-[#3E424C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">GitHub Personal Access Token (PAT) [Opsiyonel]</label>
                  <input
                    type="password"
                    value={repoConfig.token}
                    onChange={(e) => setRepoConfig({ ...repoConfig, token: e.target.value })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131418] border border-[#3E424C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400">
                    Token güvenle yerel veritabanında saklanır ve asla dışarıya sızdırılmaz.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoSyncCheck"
                    checked={repoConfig.autoSync}
                    onChange={(e) => setRepoConfig({ ...repoConfig, autoSync: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#131418] border-[#3E424C] text-cyan-500 focus:ring-0"
                  />
                  <label htmlFor="autoSyncCheck" className="text-xs text-slate-300 cursor-pointer">
                    Her bülten analizinde ve kurgu oluşturulduğunda otomatik Git snapshot al
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#282A30] bg-[#16181E] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Git & GitHub Entegrasyonu Tam Aktif</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#20232B] hover:bg-[#282A30] text-slate-200 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
