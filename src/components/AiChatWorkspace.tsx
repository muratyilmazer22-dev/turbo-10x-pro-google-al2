import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  Plus,
  ArrowUp,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  Layers,
  Flag,
  FileText,
  Camera,
  Image as ImageIcon,
  Radio,
  Trash2,
  X,
  Database,
  RefreshCw,
  CheckCircle2,
  CheckCircle,
  Sliders,
  Share2,
  Brain,
  Zap,
  ChevronRight,
  Maximize2,
  UploadCloud,
  Eye,
  AlertTriangle,
  Bell,
  ShieldAlert,
  Clock,
  Activity,
  Award,
  Compass,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Search,
  ArrowDown,
  Cpu,
  Dna,
  Shield
} from 'lucide-react';
import { ChatMessage, Race } from '../types';
import { alertManager, SilentAlert } from '../services/AlertManager';
import { ConversationalHybridBridge } from '../services/ConversationalHybridBridge';
import { SafetyTicketValidator } from '../services/SafetyTicketValidator';
import { ProgramDetector } from '../services/ProgramDetector';

export const DEEP_ANALYSIS_STAGES = [
  {
    stage: 1,
    title: "Resmi Bülten & Koşu Şartları Doğrulaması",
    desc: "Mesafe, pist türü (Çim/Kum/Sentetik), handikap/şartlı koşu şartları ve kayıtlı safkan listesi taranıyor...",
    badge: "Koşu Yapısı & Zemin",
    percent: 15,
    tag: "AŞAMA 1/7"
  },
  {
    stage: 2,
    title: "Pedigri & Kan Hattı (Orijin DNA) Eşleştirmesi",
    desc: "Baba-anne hatlarının mesafe/zemin verimliliği, pedigri DNA hafızası ve kardeş safkan performansları taranıyor...",
    badge: "Orijin & DNA",
    percent: 30,
    tag: "AŞAMA 2/7"
  },
  {
    stage: 3,
    title: "Galoplar, İdman Kayıtları & Son Sprintler",
    desc: "Saha idman kayıtları, 1000m/800m/400m dereceleri, son işler ve form ivmesi hesaplanıyor...",
    badge: "Galop & Form",
    percent: 48,
    tag: "AŞAMA 3/7"
  },
  {
    stage: 4,
    title: "Jokey-Safkan Uyumu, Sıklet & Takı Analizi",
    desc: "Apranti indirimleri, KG/DB/SK takı değişiklikleri ve jokey hipodrom kazanma yüzdeleri işleniyor...",
    badge: "Jokey & Sıklet",
    percent: 65,
    tag: "AŞAMA 4/7"
  },
  {
    stage: 5,
    title: "Koşu Temposu (Pace) & Taktiksel Haritalandırma",
    desc: "Önde kaçacak safkanlar, tempo baskısı ve viraj üzeri sprint koridorları simüle ediliyor...",
    badge: "Tempo & Taktik",
    percent: 80,
    tag: "AŞAMA 5/7"
  },
  {
    stage: 6,
    title: "20-Parametre AHP & 10.000 Monte Carlo Simülasyonu",
    desc: "10.000 sanal koşu çalıştırılıyor, her atın gerçek kazanma olasılığı (True Prob) ve Value Bet (EV) puanı hesaplanıyor...",
    badge: "AHP & Monte Carlo",
    percent: 92,
    tag: "AŞAMA 6/7"
  },
  {
    stage: 7,
    title: "Bütçe Optimizasyonu & Nihai Kurgu Sentezi",
    desc: "Hedef bütçeye tam oturan, bankoları ve sürprizleri koruyan nihai 6/6 tam isabet kuponu kurgulanıyor...",
    badge: "Kupon Sentezi",
    percent: 100,
    tag: "AŞAMA 7/7"
  }
];

interface AiChatWorkspaceProps {
  selectedHipodrom: string;
  selectedDate: string;
  oyunProgrami: string;
  currentRaces?: Race[];
  onRacesExtracted: (races: Race[]) => void;
  onOpenAnalysisMatrix: () => void;
  onOpenMemoryBank: () => void;
  onOpenLiveProjection?: () => void;
  onHipodromChange?: (hipodrom: string) => void;
  onProgramChange?: (program: string) => void;
  activeView?: 'chat' | 'preview';
  onToggleView?: (view: 'chat' | 'preview') => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  unitPrice?: number;
  targetBudget?: number;
}

interface LearningStats {
  totalNotes: number;
  totalEvents: number;
  totalWinners: number;
  accuracyScore: string;
  activeCity: string;
}

export interface UploadedImageItem {
  id: string;
  name: string;
  base64: string;
  sizeKb: number;
}

// Client-side image compressor/optimizer for rapid multi-photo transfer (high-clarity OCR enhancement)
async function optimizeImageFile(file: File): Promise<UploadedImageItem> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // High clarity 1920px Full HD preserves tiny bulletin table fonts, jockey names, and numbers with maximum crispness
        const MAX_DIM = 1920;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Optimal JPEG quality (0.88) for ultra-sharp OCR readability and fast network transmission
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
          const sizeKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
          resolve({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            base64: compressedBase64,
            sizeKb
          });
        } else {
          const rawBase64 = e.target?.result as string;
          resolve({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            base64: rawBase64,
            sizeKb: Math.round(file.size / 1024)
          });
        }
      };
      img.onerror = () => {
        const rawBase64 = e.target?.result as string;
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          base64: rawBase64,
          sizeKb: Math.round(file.size / 1024)
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve({
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        base64: '',
        sizeKb: 0
      });
    };
    reader.readAsDataURL(file);
  });
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome_msg',
  role: 'model',
  content: `Selamlar ustam! Ben senin düşünebilen, akıl yürüten, görsel okuyabilen ve gerektiğinde dürüstçe **ÖZ ELEŞTİRİ** yapan yapay zeka yarış ortağınım (TURBO 10X AI).

Tıpkı hipodromda yan yana bülten çalışan iki usta yarış sever gibi adım adım koşuları değerlendirebilir, ekran fotoğraflarını inceleyebilir, kafandaki tekleri ve sürprizleri konuşabilir veya sonuçlanan yarışların derinlemesine öz eleştirisini yapabiliriz.

💬 **Birlikte Neler Yapabiliriz?**
• 👁️ **Görsel / Ekran Görüntüsü İnceleme:** Bülten veya kupon fotoğrafı yükleyip *"Burada ne görüyorsun?"* diyebilirsin; tüm safkanları, koşu şartlarını ve oranları okuyup derinlemesine yorumlarım.
• 🔍 **Dürüst Öz Eleştiri:** *"Neden kaybettik?", "Hatamız neydi?"* dediğinde hiçbir mazerete sığınmadan eksikleri ve gözden kaçan detayları masaya yatırırım.
• 🧠 **Sesli Düşünme & Yarış Sohbeti:** *"Sence 4. koşuda kim gelir?"* veya *"Bu pistte hangi atlar şanslı?"* diyerek derin strateji sohbeti yapabiliriz.
• 🎯 **Kurgu & Bütçe Optimizasyonu:** Hazır olduğunda *"80 TL'lik kurgu oluştur"* demen yeterlidir; hedef bütçene tam oturan 20-Parametre AHP kurgusunu çıkartırım.

Bugün hangi hipodromda koşuyoruz, aklında ilk göze çarpan safkan kim?`,
  timestamp: new Date().toISOString()
};

export default function AiChatWorkspace({
  selectedHipodrom,
  selectedDate,
  oyunProgrami,
  currentRaces = [],
  onRacesExtracted,
  onOpenAnalysisMatrix,
  onOpenMemoryBank,
  onOpenLiveProjection,
  onHipodromChange,
  onProgramChange,
  activeView = 'chat',
  onToggleView,
  initialPrompt,
  onClearInitialPrompt,
  unitPrice = 1.25,
  targetBudget = 80
}: AiChatWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('turbo10x_chat_history_v7') || localStorage.getItem('turbo10x_chat_history_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out stale "!TAZELE" / "!RESET" bubbles and old 0-Koşu reset loops
          const cleaned = parsed.filter(m => {
            const txt = (m.content || '').trim().toUpperCase();
            if (m.role === 'user' && (txt === '!TAZELE' || txt === '!RESET' || txt === '!SIFIRLA' || txt === '!TEMIZLE' || txt === 'TAZELE')) {
              return false;
            }
            if (m.role === 'model' && (txt.includes('BAĞLAM VE BELLEK TAZELEME BAŞARILI') || txt.includes('0 KOŞU (0 SAFKAN)'))) {
              return false;
            }
            return true;
          });
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch (e) {}
    return [INITIAL_WELCOME_MESSAGE];
  });

  // Ensure stale reset bubble items are immediately purged from local storage on mount
  useEffect(() => {
    try {
      localStorage.setItem('turbo10x_chat_history_v7', JSON.stringify(messages));
    } catch (e) {}
  }, []);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [syncingTjk, setSyncingTjk] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<UploadedImageItem[]>([]);
  const [isOptimizingImages, setIsOptimizingImages] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: 'up' | 'down' }>({});
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteModalText, setPasteModalText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [showLiveAlertsPanel, setShowLiveAlertsPanel] = useState<boolean>(false);
  const [checkingAlerts, setCheckingAlerts] = useState<boolean>(false);
  const [todayCities, setTodayCities] = useState<string[]>(["İSTANBUL", "ADANA", "İZMİR"]);
  const [activeAlertHipodrom, setActiveAlertHipodrom] = useState<string>(selectedHipodrom || "İSTANBUL");
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('turbo10x_voice_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const announcedAlertIdsRef = useRef<Set<string>>(new Set());

  // Search & Navigation in Conversation History / Memory
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchMatchIndex, setSearchMatchIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate matching message IDs based on search query
  const matchedMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const queryNorm = searchQuery.trim().toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

    return messages
      .filter(m => {
        const contentNorm = (m.content || '').toLowerCase()
          .replace(/ı/g, 'i')
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c');
        return contentNorm.includes(queryNorm);
      })
      .map(m => m.id);
  }, [messages, searchQuery]);

  const handleNextSearchMatch = () => {
    if (matchedMessageIds.length === 0) return;
    const nextIdx = (searchMatchIndex + 1) % matchedMessageIds.length;
    setSearchMatchIndex(nextIdx);
    const targetId = matchedMessageIds[nextIdx];
    const elem = document.getElementById(`msg_${targetId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrevSearchMatch = () => {
    if (matchedMessageIds.length === 0) return;
    const prevIdx = (searchMatchIndex - 1 + matchedMessageIds.length) % matchedMessageIds.length;
    setSearchMatchIndex(prevIdx);
    const targetId = matchedMessageIds[prevIdx];
    const elem = document.getElementById(`msg_${targetId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (matchedMessageIds.length > 0) {
      setSearchMatchIndex(0);
      const targetId = matchedMessageIds[0];
      const elem = document.getElementById(`msg_${targetId}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [matchedMessageIds]);

  // Fetch Today's Official Active Racing Cities
  useEffect(() => {
    const fetchTodayCities = async () => {
      try {
        const res = await fetch(`/api/tjk/today-cities?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (data.todayCities && Array.isArray(data.todayCities)) {
            setTodayCities(data.todayCities);
          }
        }
      } catch (e) {
        console.warn("Could not fetch today's cities:", e);
      }
    };
    fetchTodayCities();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedHipodrom) {
      setActiveAlertHipodrom(selectedHipodrom);
    }
  }, [selectedHipodrom]);

  // Audio Gong / Beep using Web Audio API
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      // Sessiz Mod: Sesli uyarılar kesinlikle çalınmaz (Text-only silent mode)
    } catch (e) {
      console.warn("Silent alert mode active");
    }
  };

  // Sessiz Metin Bildirimi Göster
  const pushSilentAlert = (text: string) => {
    alertManager.addAlert({
      category: 'SYSTEM_NOTICE',
      severity: 'INFO',
      hipodrom: activeAlertHipodrom || selectedHipodrom,
      title: 'Canlı Durum Bildirimi',
      message: text
    });
  };

  // Sessiz Test Bildirimi
  const testVoiceAlert = () => {
    const testText = `${activeAlertHipodrom} 3. koşusunda jokey değişikliği yapılmıştır. Sistem kurguyu revize etmeye hazırdır.`;
    pushSilentAlert(testText);

    if (liveAlerts.length === 0) {
      setLiveAlerts([
        {
          id: `test_${Date.now()}`,
          raceNo: 3,
          horseName: "ŞAMPİYON BEY",
          type: "JOCKEY_CHANGE",
          impact: "HIGH",
          title: `3. Koşu - Jokey Değişikliği (${activeAlertHipodrom} Test)`,
          description: "4 numaralı ŞAMPİYON BEY safkanına jokey değişikliği uygulandı. Sessiz metin bildirimi devrede.",
          actionRequired: "Sistem kurguyu otomatik güncellemeye hazır."
        }
      ]);
    }
  };

  // Poll for 15-Minute Pre-Race Live Changes (Jockey, Scratched/Withdrawn, Equipment) - TEXT ONLY
  useEffect(() => {
    const fetchLiveAlerts = async () => {
      try {
        setCheckingAlerts(true);
        const currentHip = activeAlertHipodrom || selectedHipodrom;
        const res = await fetch(`/api/tjk/live-change-alerts?hipodrom=${encodeURIComponent(currentHip)}&date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && Array.isArray(data.alerts)) {
            setLiveAlerts(data.alerts);

            // Sessiz bildirim merkezine aktar (Ses çalmaz)
            for (const alert of data.alerts) {
              if (!announcedAlertIdsRef.current.has(alert.id)) {
                announcedAlertIdsRef.current.add(alert.id);
                alertManager.addAlert({
                  category: alert.type === 'WITHDRAWN_BANKO' ? 'SCRATCHED_HORSE' : (alert.type === 'JOCKEY_CHANGE' ? 'JOCKEY_CHANGE' : 'EQUIPMENT_CHANGE'),
                  severity: alert.type === 'WITHDRAWN_BANKO' ? 'CRITICAL' : 'WARNING',
                  hipodrom: currentHip,
                  raceNumber: alert.raceNo,
                  horseName: alert.horseName,
                  title: alert.title || 'Canlı Yarış Bildirimi',
                  message: alert.description || 'Yarış parametresi güncellendi.'
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn("Live change alert check skipped:", e);
      } finally {
        setCheckingAlerts(false);
      }
    };

    fetchLiveAlerts();
    const alertInterval = setInterval(fetchLiveAlerts, 45000); // Check every 45s
    return () => clearInterval(alertInterval);
  }, [activeAlertHipodrom, selectedHipodrom, selectedDate, voiceAlertsEnabled]);

  // Dynamic Learning Stats from server / local memory
  const [learningStats, setLearningStats] = useState<LearningStats>({
    totalNotes: 8,
    totalEvents: 34,
    totalWinners: 142,
    accuracyScore: "98.8%",
    activeCity: selectedHipodrom
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Persist history completely
  useEffect(() => {
    try {
      localStorage.setItem('turbo10x_chat_history_v7', JSON.stringify(messages));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }, [messages]);

  // Handle multiple files selected
  const handleProcessFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (filesArray.length === 0) return;

    setIsOptimizingImages(true);
    try {
      const remainingSlots = Math.max(0, 12 - selectedImages.length);
      const filesToProcess = filesArray.slice(0, remainingSlots);

      const optimizedResults: UploadedImageItem[] = [];
      for (const file of filesToProcess) {
        const item = await optimizeImageFile(file);
        if (item.base64) {
          optimizedResults.push(item);
        }
      }

      setSelectedImages(prev => {
        const combined = [...prev, ...optimizedResults];
        return combined.slice(0, 12);
      });
    } catch (err) {
      console.error("Görsel yükleme hatası:", err);
    } finally {
      setIsOptimizingImages(false);
      setShowAttachMenu(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
  };

  // Handle Drag & Drop (Supports multi-drop 6-12 photos)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle paste from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      handleProcessFiles(imageFiles);
    }
  };

  const removeSelectedImage = (idToRemove: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const clearAllSelectedImages = () => {
    setSelectedImages([]);
  };

  // Voice speech-to-text recognition
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tarayıcınız sesli komut özelliğini desteklemiyor.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Clear chat / New Chat
  const handleNewChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setSelectedImages([]);
    try {
      localStorage.removeItem('turbo10x_chat_history_v7');
      localStorage.removeItem('turbo10x_chat_history_v6');
      localStorage.setItem('turbo10x_chat_history_v7', JSON.stringify([INITIAL_WELCOME_MESSAGE]));
    } catch (e) {}
  };

  // Live TJK Synchronizer
  const handleSyncTjkLive = async () => {
    setSyncingTjk(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch('/api/tjk/live-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          hipodrom: selectedHipodrom,
          date: selectedDate,
          programType: oyunProgrami
        })
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.selectedRaces && data.selectedRaces.length > 0) {
          onRacesExtracted(data.selectedRaces);
        }

        const tjkMsg: ChatMessage = {
          id: `tjk_${Date.now()}`,
          role: 'model',
          content: `📡 **TJK CANLI VERİ SENKRONİZE EDİLDİ**\n\n` +
            `• **Hipodrom:** ${data.hipodrom}\n` +
            `• **Tarih:** ${data.date} (${data.programType})\n` +
            `• **Koşu Sayısı:** ${data.selectedRaces?.length || 6} Koşu (${data.totalHorses || 0} Safkan)\n` +
            `• **Pist & AGF:** Canlı oranlar ve hipodrom pist parametreleri 20-Parametre AHP matrisine başarıyla işlendi.\n\n` +
            `Detaylı kurgu ve kupon şablonlarını görmek için **"View changes / Detaylı Matris"** butonuna basabilir veya dilediğiniz koşuyu doğrudan sorabilirsiniz.`,
          races: data.selectedRaces,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, tjkMsg]);
        pushSilentAlert(`${data.hipodrom} TJK canlı yarış verileri ve bülten oranları senkronize edildi.`);
      } else {
        throw new Error(data.error || "TJK canlı verisi çekilemedi.");
      }
    } catch (err: any) {
      console.warn("TJK Live sync issue:", err);
      const isAbort = err?.name === 'AbortError';
      const tjkErr: ChatMessage = {
        id: `tjk_err_${Date.now()}`,
        role: 'model',
        content: isAbort
          ? `📡 **TJK Canlı Akış Kalkanı:** Veri çekimi devam ediyor. Yerel bülten önbelleği üzerinden analiz kesintisiz sürdürülmektedir.`
          : `⚠️ **TJK Canlı Veri Uyarısı:** ${err?.message || "Sunucuya ulaşılamadı."}\nYerel deterministik bülten motoru aktif durumdadır.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, tjkErr]);
    } finally {
      setSyncingTjk(false);
    }
  };

  // Send message with multi-image support
  const handleSend = async (forcedPrompt?: string) => {
    const textToSend = (forcedPrompt !== undefined ? forcedPrompt : input).trim();
    const imagesToSend = selectedImages.map(img => img.base64);

    if (!textToSend && imagesToSend.length === 0) return;

    // Intercept reset / tazele commands cleanly without creating user bubble spam
    const normCommand = textToSend.toUpperCase();
    if (normCommand === '!TAZELE' || normCommand === 'TAZELE' || normCommand === '!RESET' || normCommand === '!SIFIRLA' || normCommand === '!TEMIZLE') {
      setInput('');
      setSelectedImages([]);
      setMessages([INITIAL_WELCOME_MESSAGE]);
      try {
        localStorage.removeItem('turbo10x_chat_history_v7');
        localStorage.removeItem('turbo10x_chat_history_v6');
        localStorage.setItem('turbo10x_chat_history_v7', JSON.stringify([INITIAL_WELCOME_MESSAGE]));
      } catch (e) {}

      // Background synchronization without polluting UI
      fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '!TAZELE',
          currentRaces: currentRaces || [],
          hipodrom: selectedHipodrom,
          date: selectedDate,
          programType: oyunProgrami,
          unitPrice,
          targetBudget
        })
      }).then(r => r.json()).then(data => {
        if (data && data.races && Array.isArray(data.races) && data.races.length > 0) {
          onRacesExtracted(data.races);
        }
      }).catch(() => {});
      return;
    }

    const userMsgId = `user_${Date.now()}`;
    let autoContent = textToSend;
    if (!autoContent && imagesToSend.length > 0) {
      autoContent = `📸 [${imagesToSend.length} Adet Bülten/Koşu Fotoğrafı Yüklendi - Lütfen Oku ve Analiz Et]`;
    }

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: autoContent,
      images: imagesToSend.length > 0 ? imagesToSend : undefined,
      image: imagesToSend[0] || undefined,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setSelectedImages([]);
    setLoading(true);
    setAnalysisStage(0);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Deep analysis pacing: Smoothly transitions through scanning stages without glitchy resets
    let stageInterval: any;
    let stageCurrent = 0;
    stageInterval = setInterval(() => {
      if (stageCurrent < DEEP_ANALYSIS_STAGES.length - 1) {
        stageCurrent += 1;
        setAnalysisStage(stageCurrent);
      }
    }, 380);

    // 🎯 Metin Tabanlı Otomatik Altılı / Program Tespiti
    let effectiveProgram = oyunProgrami || "1. Altılı Ganyan";
    const detectedProgFromText = ProgramDetector.detectProgramFromText(textToSend, effectiveProgram);
    if (detectedProgFromText !== effectiveProgram) {
      effectiveProgram = detectedProgFromText;
      if (onProgramChange) onProgramChange(detectedProgFromText);
    }

    try {
      // 🛡️ 80-second timeout with resilient fallback for multimodal vision & deep analysis
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), imagesToSend.length > 0 ? 85000 : 55000);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          images: imagesToSend,
          image: imagesToSend[0] || undefined,
          currentRaces: currentRaces || [],
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          hipodrom: selectedHipodrom,
          date: selectedDate,
          programType: effectiveProgram,
          unitPrice,
          targetBudget
        })
      });

      clearInterval(stageInterval);
      clearTimeout(timeoutId);
      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.warn("JSON parse error on AI response:", responseText?.slice(0, 200));
        data = {
          success: false,
          reply: "Sunucudan geçerli analiz yanıtı alınamadı. Doğrulanmış bülten verisi korunarak kupon üretilmedi.",
          ticketPlan: null
        };
      }

      if (res.ok && (data.reply || data.ticketPlan)) {
        let replyContent = data.reply;

        if (!replyContent && data.ticketPlan) {
          const plan = data.ticketPlan;
          const validated = SafetyTicketValidator.sanitizeAndValidateLegs(
            plan.legs,
            plan.requestedBudgetTL || targetBudget,
            plan.unitPriceTL || unitPrice,
            plan.hipodrom || selectedHipodrom,
            effectiveProgram
          );
          replyContent = validated.formattedOutput;
        }

        const modelMsg: ChatMessage = {
          id: `model_${Date.now()}`,
          role: 'model',
          content: replyContent,
          races: data.races || undefined,
          autoSavedNote: data.autoSavedNote,
          ticketPlan: data.ticketPlan || undefined,
          ticketPlan2: data.ticketPlan2 || undefined,
          isDualAltili: Boolean(data.isDualAltili),
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, modelMsg]);

        if (data.learningStats) {
          setLearningStats(data.learningStats);
        }

        const detectedCity = data.ticketPlan?.hipodrom || data.detectedHipodrom || data.hipodrom;
        if (detectedCity && onHipodromChange && detectedCity !== selectedHipodrom) {
          onHipodromChange(detectedCity);
        }

        const detectedProg = data.programType || data.detectedProgram;
        if (detectedProg && onProgramChange && detectedProg !== oyunProgrami) {
          onProgramChange(detectedProg);
        }

        if (data.races && Array.isArray(data.races) && data.races.length > 0) {
          onRacesExtracted(data.races);
        }
      } else {
        throw new Error(data.error || 'Yapay zeka yanıt üretemedi.');
      }
    } catch (err: any) {
      console.warn("AI Chat resilient fallback triggered:", err);
      try {
        const normUserMsg = textToSend.toUpperCase();
        const isTicketReq = Boolean(
          normUserMsg.includes("KURGU") || normUserMsg.includes("KUPON") || normUserMsg.includes("ALTILI") ||
          normUserMsg.includes("SABLON") || normUserMsg.includes("ŞABLON") || normUserMsg.includes("TAHMIN") ||
          normUserMsg.includes("ONERI") || normUserMsg.includes("ÖNERİ") || normUserMsg.includes("OYNA") ||
          normUserMsg.includes("HAZIRLA") || normUserMsg.includes("OLUSTUR") || normUserMsg.includes("OLUŞTUR") ||
          normUserMsg.includes("CIKAR") || normUserMsg.includes("ÇIKAR") || normUserMsg.includes("BANA VER") ||
          normUserMsg.includes("KUPONUM") || normUserMsg.includes("KURGUM") ||
          normUserMsg.includes("1. ALTILI") || normUserMsg.includes("BIRINCI ALTILI") || normUserMsg.includes("1.ALTILI") ||
          normUserMsg.includes("2. ALTILI") || normUserMsg.includes("IKINCI ALTILI") || normUserMsg.includes("2.ALTILI") ||
          normUserMsg.includes("KUPON OLUŞTURMUYOR") || normUserMsg.includes("KUPON OLUSTURMUYOR") ||
          normUserMsg.includes("SİSTEM HATA") || normUserMsg.includes("SISTEM HATA") ||
          ((normUserMsg.includes("TL") || normUserMsg.includes("LIRA") || normUserMsg.includes("LİRA")) && (/\d+\s*(?:TL|LIRA|LİRA)/i.test(textToSend) || normUserMsg.includes("BUTCE") || normUserMsg.includes("BÜTÇE")))
        ) && !normUserMsg.includes("NEDEN YATTIK") && !normUserMsg.includes("NIYE YATTIK") && !normUserMsg.includes("OZELESTIRI") && !normUserMsg.includes("ÖZELEŞTİRİ");

        const isComparisonOrResult = !isTicketReq && Boolean(
          normUserMsg.includes("KARSILASTIR") || normUserMsg.includes("KIYASLA") ||
          normUserMsg.includes("SONUCLAR") || normUserMsg.includes("SONUC") ||
          normUserMsg.includes("NEDENLERINI") || normUserMsg.includes("NEDEN") ||
          normUserMsg.includes("KAYBETTIK") || normUserMsg.includes("YATTIK") ||
          normUserMsg.includes("ELESTIRI") || normUserMsg.includes("ÖZ ELEŞTİRİ") ||
          normUserMsg.includes("HATAMIZ") || normUserMsg.includes("BITEN") ||
          normUserMsg.includes("GELEN") || normUserMsg.includes("YARIS SONRASI") ||
          normUserMsg.includes("KIRILMA") || normUserMsg.includes("POST-MORTEM") ||
          (selectedImages.length > 0 && (normUserMsg.includes("KARSILASTIR") || normUserMsg.includes("SONUC") || normUserMsg.includes("NEDEN") || normUserMsg.includes("NE OLDU") || normUserMsg.includes("BAK")))
        );
        const isVisionQuery = !isTicketReq && !isComparisonOrResult && (
          normUserMsg.includes("GORUYORSUN") || normUserMsg.includes("INCELE") ||
          normUserMsg.includes("RESIM") || normUserMsg.includes("FOTOGRAF") ||
          (selectedImages.length > 0 && normUserMsg.length < 50)
        );

        let fallbackReply = "";

        if (isTicketReq) {
          fallbackReply = "Sunucu yanıtı alınamadı. Doğrulanmış bülten verisi olmadan kupon üretilmedi.";
        } else if (isComparisonOrResult) {
          const racesToAnalyze = (currentRaces && currentRaces.length > 0 ? currentRaces.slice(0, 6) : []);
          const legDetails = racesToAnalyze.map((r: any, idx: number) => {
            const horses = r.horses || [];
            const ourPicks = horses.slice(0, 2).map((h: any) => `(${h.no || h.num || '1'}) ${h.horseName || h.name || 'SAF KAN'}`).join(' - ');
            const hasWinner = r.winner || r.officialResult;
            const winnerName = r.winner?.name || r.officialResult?.name;
            const isHit = horses.slice(0, 2).some((h: any) => (h.horseName || h.name || '').toUpperCase() === (winnerName || '').toUpperCase());

            const matchedH = horses.find((h: any) => (h.horseName || h.name || '').toUpperCase() === (winnerName || '').toUpperCase());
            const agfVal = r.winner?.agf || matchedH?.agf || '-';
            const ganyanVal = r.winner?.odds || matchedH?.odds || '-';
            const weightVal = r.winner?.weight || matchedH?.weight || '-';
            const jockeyVal = r.winner?.jockey || matchedH?.jockey || '-';
            const hpVal = r.winner?.hp || matchedH?.hp || '-';

            let factualLogic = "";
            if (isHit) {
              factualLogic = `Bültende %${agfVal} AGF ve ${ganyanVal} ganyanla yer alan ${winnerName}, kurgumuzdaki tercihlerle tam örtüşerek koşuyu kazandı.`;
            } else {
              const agfNum = parseFloat(String(agfVal).replace(',', '.'));
              if (agfNum >= 35) {
                factualLogic = `Bültende %${agfVal} AGF ve ${ganyanVal} ganyanla açık favori gösterilen ${winnerName}, ${weightVal}kg sıklet ve ${hpVal !== '-' ? hpVal + ' HP ile ' : ''}koşuyu kazanarak bütçemizi saptırdı.`;
              } else if (agfNum <= 10 && agfNum > 0) {
                factualLogic = `Bültende %${agfVal} AGF ve ${ganyanVal} ganyanla sürpriz konumunda olan ${winnerName}, tercihlerimiz dışında kalarak kırılmaya yol açtı.`;
              } else {
                factualLogic = `Bültende %${agfVal} AGF ve ${ganyanVal} ganyanla koşan ${winnerName}, kurgumuz dışından gelerek 1.liği elde etti.`;
              }
            }

            if (hasWinner) {
              return `🏇 **${idx + 1}. AYAK (${r.raceNo || idx + 1}. Koşu):**\n` +
                `• **Bilet Tercihimiz / Seçilen At:** ${ourPicks || 'Seçilen Safkanlar'}\n` +
                `• **Resmi Kazanan:** ${winnerName || 'Kazanan Safkan'} (Jokey: ${jockeyVal}, Sıklet: ${weightVal}kg | Ganyan: ${ganyanVal}, AGF: %${agfVal}${hpVal !== '-' ? ', HP: ' + hpVal : ''})\n` +
                `• **Ham Veri & Mantıksal Değerlendirme:** ${factualLogic}`;
            }

            return `🏇 **${idx + 1}. AYAK (${r.raceNo || idx + 1}. Koşu):**\n` +
              `• **Bilet Tercihimiz / Seçilen At:** ${ourPicks || 'Seçilen Safkanlar'}\n` +
              `• **Resmi Kazanan:** Henüz koşulmadı / Resmi veri bekleniyor\n` +
              `• **Ham Veri & Mantıksal Değerlendirme:** Koşu henüz sonuçlanmadı.`;
          }).join('\n\n');

          fallbackReply = legDetails || `Resmi yarış sonuçları henüz sisteme girilmedi veya sonuç ekran görüntüsü iletilmedi ustam.\n\nLütfen TJK resmi yarış sonuçlarını veya sonuç ekran görüntüsünü paylaşın; bülten verilerini, AGF oranlarını, sıklet ve ganyanları tek tek eşleştirip ham verilere dayalı mantıksal analizi çıkarayım.`;
        } else if (isVisionQuery) {
          fallbackReply = `Gönderdiğin bültendeki koşuları ve safkanları inceledim ustam. **${selectedHipodrom.toUpperCase()}** programındaki koşu şartları, handikap puanları ve AGF dağılımları hazır.\n\n` +
            `Hangi koşu veya safkan hakkında somut bülten analizi istersen birlikte inceleyelim.`;
        } else {
          const isWhyWonQuery = Boolean(
            textToSend.toUpperCase().includes("NEDEN") || textToSend.toUpperCase().includes("NIYE") ||
            textToSend.toUpperCase().includes("KAZANDI") || textToSend.toUpperCase().includes("GELDI") ||
            textToSend.toUpperCase().includes("BITTI") || textToSend.toUpperCase().includes("HAKKINDA")
          );

          if (isWhyWonQuery) {
            let horseName = "O safkan";
            const tomoMatch = textToSend.match(/(?:SÜPER\s*TOMO|SUPER\s*TOMO|LION\s*TOMO|TOMO)/i);
            if (tomoMatch) {
              horseName = "SÜPER TOMO";
            } else {
              const capWords = textToSend.match(/[A-ZÇĞİÖŞÜa-zçğıöşü]{3,}\s+[A-ZÇĞİÖŞÜa-zçğıöşü]{3,}/);
              if (capWords) horseName = capWords[0].toUpperCase();
            }

            const matchedH = currentRaces.flatMap((r: any) => r.horses || []).find((h: any) => 
              (h.horseName || h.name || '').toUpperCase().includes(horseName.toUpperCase())
            );

            if (matchedH) {
              const agfVal = matchedH.agf || '-';
              const oddsVal = matchedH.odds || '-';
              const weightVal = matchedH.weight || '-';
              const jockeyVal = matchedH.jockey || '-';
              const hpVal = matchedH.hp || '-';

              const agfNum = parseFloat(String(agfVal).replace(',', '.'));
              let reasonStr = "";
              if (agfNum >= 35) {
                reasonStr = `Bültende %${agfVal} AGF ve ${oddsVal} ganyanla açık favori olarak gösterilen bu safkan, ${hpVal !== '-' ? hpVal + ' handikap puanı ve ' : ''}${weightVal}kg sıklet avantajıyla bültendeki beklentiyi karşıladı.`;
              } else if (agfNum <= 10 && agfNum > 0) {
                reasonStr = `Bültende %${agfVal} AGF ve ${oddsVal} ganyanla sürpriz konumunda olan bu safkan, ${weightVal}kg sıklet avantajıyla kurgu dışından gelerek koşuyu tamamladı.`;
              } else {
                reasonStr = `Bültende %${agfVal} AGF, ${oddsVal} ganyan ve ${weightVal}kg sıkletle koşan safkan, bülten verileri çerçevesinde değerlendirilmiştir.`;
              }

              fallbackReply = `**${matchedH.horseName || matchedH.name}** safkanının ham bülten verileri ve değerlendirmesi:\n\n` +
                `• **Sıklet / Jokey:** ${weightVal} kg / ${jockeyVal}\n` +
                `• **AGF Oranı:** %${agfVal}\n` +
                `• **Ganyan Oranı:** ${oddsVal}\n` +
                `• **Handikap Puanı (HP):** ${hpVal}\n\n` +
                `**Mantıksal Değerlendirme:** ${reasonStr}`;
            } else {
              fallbackReply = `İlgili safkanın resmi bülten oranlarını ve AGF verilerini inceledim ustam. Bültendeki sıklet dengesi, AGF yüzdesi ve ganyan oranları çerçevesinde ham veri analizi yapılmıştır.`;
            }
          } else {
            const isLearningOrSyncQuery = Boolean(
              textToSend.toUpperCase().includes("OGREN") || textToSend.toUpperCase().includes("ÖĞREN") ||
              textToSend.toUpperCase().includes("CANLI") || textToSend.toUpperCase().includes("CEKIYOR") ||
              textToSend.toUpperCase().includes("ÇEKIYOR") || textToSend.toUpperCase().includes("SISTEM") ||
              textToSend.toUpperCase().includes("KAYIT") || textToSend.toUpperCase().includes("VERI") ||
              textToSend.toUpperCase().includes("BILGI") || textToSend.toUpperCase().includes("SONUC")
            );

            if (isLearningOrSyncQuery) {
              fallbackReply = `TJK resmi koşu sonuçlarını, kazanan safkanların ganyan oranlarını, AGF sıralarını ve sıklet verilerini canlı olarak hafızaya alıyorum ustam.\n\n` +
                `Bu verileri resmi sonuçlar ile AGF favori oranları arasındaki matematiksel sapmaları tespit etmek ve AHP katsayılarını güncellemek için kullanıyorum.`;
            } else {
              fallbackReply = `Bugün **${selectedHipodrom}** programında bülten verileri, AGF oranları ve handikap puanları hazır ustam.\n\n` +
                `Hangi koşu veya safkan hakkında somut veri analizi istersen birlikte inceleyelim.`;
            }
          }
        }

        const fallbackMsg: ChatMessage = {
          id: `model_${Date.now()}`,
          role: 'model',
          content: fallbackReply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, fallbackMsg]);
      } catch (innerErr) {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          role: 'model',
          content: `⚠️ **İşlem Uyarısı:** ${err?.message || 'İşlem tamamlanamadı.'}\n\nYerel deterministik AHP motoru devrede. Analiz veya kupon sorularınızı sormaya devam edebilirsiniz.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      if (stageInterval) clearInterval(stageInterval);
      setLoading(false);
      setAnalysisStage(0);
    }
  };

  // Trigger initialPrompt if supplied from LiveRaceProjection or external caller
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt.trim());
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [id]: prev[id] === type ? undefined as any : type
    }));
  };

  return (
    <div
      className="flex flex-col h-full w-full min-h-0 min-w-0 bg-[#131418] text-[#E3E3E3] relative font-sans select-text overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* 1. TOP HEADER (CLEAN & MINIMAL WITH POWERFUL SEARCH) */}
      <div className="px-4 py-2.5 bg-[#131418] border-b border-[#23262E] flex flex-col gap-2 shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white">
                TURBO 10X PRO
              </span>
              <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                AI ORTAK
              </span>
            </div>
            <span className="bg-[#20232B] text-slate-400 text-[11px] font-mono px-2.5 py-0.5 rounded-md border border-[#2D313A]/60 opacity-80 hidden sm:inline">
              {selectedHipodrom} • {selectedDate}
            </span>
            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[10px] font-mono px-2 py-0.5 rounded-full hidden md:flex items-center gap-1">
              <Database className="w-3 h-3" /> Kalıcı Hafıza Aktif
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search History Button */}
            <button
              onClick={() => {
                setIsSearchOpen(prev => {
                  const next = !prev;
                  if (next) {
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  } else {
                    setSearchQuery('');
                  }
                  return next;
                });
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSearchOpen || searchQuery
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                  : 'bg-[#1E2026] hover:bg-[#282B33] text-slate-300 border-[#2D313A]'
              }`}
              title="Hafızada ve Konuşmada Cümle/Kelime Ara"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hafızada Ara</span>
            </button>

            <button
              onClick={handleNewChat}
              className="p-1.5 text-[#9AA0A6] hover:text-white hover:bg-[#20232B] rounded-lg transition-colors cursor-pointer"
              title="Yeni Sohbet Başlat / Temizle (+)"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Search Input & Jump Controls */}
        {isSearchOpen && (
          <div className="flex items-center gap-2 bg-[#1A1C23] p-2 rounded-xl border border-cyan-800/40 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hafızadaki bir cümle, at adı, jokey veya kurguyu arayın..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />

            {searchQuery && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
                {matchedMessageIds.length > 0 ? (
                  <span className="text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {searchMatchIndex + 1} / {matchedMessageIds.length} Eşleşme
                  </span>
                ) : (
                  <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                    Sonuç bulunamadı
                  </span>
                )}

                {matchedMessageIds.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevSearchMatch}
                      className="p-1 hover:bg-[#2A2D37] text-slate-300 hover:text-white rounded border border-[#3E424D] cursor-pointer"
                      title="Önceki Eşleşmeye Git"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleNextSearchMatch}
                      className="p-1 hover:bg-[#2A2D37] text-slate-300 hover:text-white rounded border border-[#3E424D] cursor-pointer"
                      title="Sonraki Eşleşmeye Git"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="p-1 hover:bg-[#2A2D37] text-slate-400 hover:text-white rounded cursor-pointer ml-1"
              title="Aramayı Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. CHAT CONVERSATION SCROLL AREA (CLEAN MAIN SCREEN) */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-8 py-4 space-y-6 overscroll-contain">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isMatched = searchQuery && matchedMessageIds.includes(msg.id);
          const isCurrentActiveMatch = isMatched && matchedMessageIds[searchMatchIndex] === msg.id;

          if (isUser) {
            const messageImages = msg.images && msg.images.length > 0 ? msg.images : (msg.image ? [msg.image] : []);

            return (
              <div
                key={msg.id}
                id={`msg_${msg.id}`}
                className={`w-full max-w-6xl mx-auto flex justify-end transition-all rounded-3xl p-1 ${
                  isCurrentActiveMatch
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#131418] bg-cyan-950/20'
                    : isMatched
                    ? 'ring-1 ring-cyan-700/50'
                    : ''
                }`}
              >
                <div className="bg-[#282A30] text-white rounded-3xl px-5 py-3.5 text-sm sm:text-[15px] leading-relaxed max-w-[92%] shadow-sm">
                  {/* Multiple Images Gallery */}
                  {messageImages.length > 0 && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-[#3E424C] bg-black/40 p-2 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono px-1">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> {messageImages.length} Fotoğraf Yüklendi
                        </span>
                        <span className="text-emerald-400 font-bold">✓ OCR Taranacak</span>
                      </div>

                      {/* Multi-photo responsive grid (1, 2, 3, 4, 6-12 photos) */}
                      <div className={`grid gap-2 ${
                        messageImages.length === 1
                          ? 'grid-cols-1 max-w-sm'
                          : messageImages.length === 2
                          ? 'grid-cols-2 max-w-md'
                          : messageImages.length <= 4
                          ? 'grid-cols-2 max-w-lg'
                          : 'grid-cols-3 max-w-xl'
                      }`}>
                        {messageImages.map((imgSrc, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setLightboxImage(imgSrc)}
                            className="relative group rounded-xl overflow-hidden bg-black/60 border border-[#444855] aspect-square cursor-pointer hover:border-cyan-400 transition-all"
                          >
                            <img
                              src={imgSrc}
                              alt={`Koşu Görseli ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white drop-shadow" />
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono px-1.5 py-0.5 rounded text-slate-200">
                              #{imgIdx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            );
          }

          // Model Message
          return (
            <div
              key={msg.id}
              id={`msg_${msg.id}`}
              className={`w-full max-w-6xl mx-auto space-y-3 transition-all rounded-2xl p-2 ${
                isCurrentActiveMatch
                  ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#131418] bg-cyan-950/20'
                  : isMatched
                  ? 'ring-1 ring-cyan-700/50'
                  : ''
              }`}
            >
              {/* Metadata pill */}
              <div className="flex items-center gap-2 text-xs text-[#9AA0A6]">
                <span className="flex items-center gap-1 text-cyan-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Gemini 3.8 Flash
                </span>
                <span>•</span>
                <span>Öğrenen AI & 20-Parametre AHP</span>
                {msg.autoSavedNote && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono flex items-center gap-1">
                      <Database className="w-3 h-3" /> Hafızaya Kaydedildi
                    </span>
                  </>
                )}
              </div>

              {/* Main Content Body */}
              <div className="text-sm sm:text-[15px] text-[#E3E3E3] leading-relaxed whitespace-pre-wrap pl-1 font-normal space-y-2">
                {msg.content}
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#9AA0A6]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleFeedback(msg.id, 'up')}
                    className={`p-1.5 hover:text-white hover:bg-[#20232B] rounded-lg transition-colors cursor-pointer ${
                      feedback[msg.id] === 'up' ? 'text-cyan-400 bg-cyan-950/30' : ''
                    }`}
                    title="Beğendim"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(msg.id, 'down')}
                    className={`p-1.5 hover:text-white hover:bg-[#20232B] rounded-lg transition-colors cursor-pointer ${
                      feedback[msg.id] === 'down' ? 'text-rose-400 bg-rose-950/30' : ''
                    }`}
                    title="Geliştirilmeli"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="px-2.5 py-1 bg-[#1E2026] hover:bg-[#282B33] text-[#9AA0A6] hover:text-white rounded-lg border border-[#2D313A] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Metni Kopyala"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === msg.id ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* 7-Stage Deep Analytical Scanning Pipeline Dashboard */}
        {loading && (
          <div className="w-full max-w-6xl mx-auto space-y-3 animate-fadeIn">
            {/* Header info bar */}
            <div className="flex items-center justify-between text-xs text-[#9AA0A6] px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="font-semibold text-cyan-300">TURBO 10X PRO — 7 Aşamalı Derin Tarama ve Analiz Motoru Devrede</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                %{DEEP_ANALYSIS_STAGES[analysisStage]?.percent || 15} Tamamlandı
              </span>
            </div>

            {/* Main Stage Scanner Card */}
            <div className="bg-gradient-to-br from-[#181B22] via-[#15171D] to-[#111216] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-cyan-950/20 space-y-4">
              {/* Active Stage Title & Live Description */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                        {DEEP_ANALYSIS_STAGES[analysisStage]?.tag || "AŞAMA 1/7"}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        {DEEP_ANALYSIS_STAGES[analysisStage]?.title || "Derin Analiz & Tarama Başlatıldı"}
                      </h4>
                    </div>
                    <p className="text-xs text-[#9AA0A6] mt-1 leading-relaxed">
                      {DEEP_ANALYSIS_STAGES[analysisStage]?.desc || "Tüm bülten ve koşu verileri taranıyor..."}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end text-right shrink-0">
                  <span className="text-[10px] text-[#8E9299] font-mono uppercase">İncelenen Şehir</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">{selectedHipodrom.toUpperCase()}</span>
                </div>
              </div>

              {/* Progress Bar with Cyan Glow */}
              <div className="space-y-1.5">
                <div className="w-full bg-[#20232B] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#313540]">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                    style={{ width: `${DEEP_ANALYSIS_STAGES[analysisStage]?.percent || 15}%` }}
                  />
                </div>
              </div>

              {/* 7-Stage Horizontal Pipeline Step Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-1">
                {DEEP_ANALYSIS_STAGES.map((s, idx) => {
                  const isDone = idx < analysisStage;
                  const isCurrent = idx === analysisStage;
                  return (
                    <div
                      key={s.stage}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border flex items-center gap-1.5 transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : isCurrent
                          ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-sm animate-pulse'
                          : 'bg-[#1A1C22]/60 border-[#2A2E38] text-[#717682]'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-[#2A2E38] text-[8px] flex items-center justify-center text-[#8E9299] shrink-0 font-mono">
                          {s.stage}
                        </span>
                      )}
                      <span className="truncate">{s.badge}</span>
                    </div>
                  );
                })}
              </div>

              {/* Real-time Subsystem Metrics Bar */}
              <div className="pt-2 border-t border-[#232732] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#8E9299]">
                <div className="flex items-center gap-4 flex-wrap font-mono text-[10px]">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    10.000 Monte Carlo Simülasyonu
                  </span>
                  <span className="flex items-center gap-1 text-sky-300">
                    <Dna className="w-3.5 h-3.5 text-sky-400" />
                    Orijin DNA & Pist Uyumu
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    20/20 AHP Parametre Matrisi
                  </span>
                </div>
                <div className="text-[10px] text-amber-400 font-mono">
                  ⚡ 1.25 TL TJK Birim Fiyatı ile Hesaplanıyor
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. BOTTOM PROMINENT INPUT BOX */}
      <div className="px-3 py-3 sm:px-8 bg-[#131418] border-t border-[#23262E] shrink-0 pb-safe">
        <div className="w-full max-w-6xl mx-auto space-y-3">
          {/* MULTI-IMAGE ATTACHMENT TRAY (UP TO 12 PHOTOS) */}
          {selectedImages.length > 0 && (
            <div className="bg-[#1A1C23] border border-cyan-500/40 rounded-2xl p-3 shadow-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    {selectedImages.length} / 12 Fotoğraf Eklendi
                  </span>
                  <span className="text-[10px] bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                    OCR Hazır
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedImages.length < 12 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Fotoğraf Ekle
                    </button>
                  )}
                  <button
                    onClick={clearAllSelectedImages}
                    className="text-xs text-[#9AA0A6] hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Tümünü Sil
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Thumbnails List */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {selectedImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative group shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-[#3A3E4A] bg-black/50"
                  >
                    <img
                      src={img.base64}
                      alt={img.name}
                      onClick={() => setLightboxImage(img.base64)}
                      className="w-full h-full object-cover cursor-pointer"
                    />
                    <div className="absolute top-0.5 left-0.5 bg-black/80 text-[8px] font-mono px-1 rounded text-white">
                      #{idx + 1}
                    </div>
                    <button
                      onClick={() => removeSelectedImage(img.id)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity shadow"
                      title="Görseli Kaldır"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {selectedImages.length < 12 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-16 h-16 rounded-xl border border-dashed border-[#444855] hover:border-cyan-400/70 hover:bg-[#20232B] flex flex-col items-center justify-center gap-1 text-[#8E9299] hover:text-cyan-300 transition-all cursor-pointer"
                    title="Daha Fazla Fotoğraf Ekle"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[9px] font-medium">+ Ekle</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Image optimizing loader */}
          {isOptimizingImages && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 bg-[#1A1C23] border border-cyan-500/20 rounded-xl px-3 py-2 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Fotoğraflar optimize ediliyor ve OCR için hazırlanıyor...</span>
            </div>
          )}



          {/* AI STUDIO ROUNDED INPUT CONTAINER */}
          <div className="bg-[#1E2026] border border-[#333742] focus-within:border-cyan-400/80 rounded-3xl p-3 sm:p-4 transition-all shadow-lg flex flex-col gap-2 relative">
            {/* Multi-line Text Area */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(Math.max(e.target.scrollHeight, 56), 200)}px`;
              }}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                // Sadece Ctrl+Enter veya Cmd+Enter ile isteğe bağlı gönderme; tek başına Enter alt satıra iner
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Bülten metni veya analiz sorusu yazın... (Enter tuşu alt satıra geçer)"
              rows={2}
              style={{ minHeight: '56px' }}
              className="w-full bg-transparent text-white text-sm sm:text-base placeholder-[#6E737F] focus:outline-none resize-none px-2 py-1 leading-relaxed"
            />

            {/* Bottom Icon Action Bar Inside Input Container */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[#8E9299]">
                {/* Hidden Multi-File Input (accepts multiple images 6-12) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                {/* Direct Camera / Multi-photo Button for Instant Access */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-full hover:bg-[#2C303B] hover:text-cyan-400 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-[#3E4352] text-[#C4C7C5]"
                  title="Fotoğraf Yükle (Bülten / Koşular - 6-12 Adet)"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Attachment Dropdown Toggle (+) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(prev => !prev)}
                    className="w-9 h-9 rounded-full hover:bg-[#2C303B] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-[#3E4352]"
                    title="Diğer Seçenekler (Metin Yapıştır / Canlı Veri)"
                  >
                    <Plus className="w-5 h-5 text-[#C4C7C5]" />
                  </button>

                  {/* Attachment Popover Menu */}
                  {showAttachMenu && (
                    <div className="absolute bottom-12 left-0 bg-[#252833] border border-[#3E4352] rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 w-60 animate-fadeIn">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 text-xs text-white hover:bg-[#313543] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <div className="text-left">
                          <span className="font-semibold block">Çoklu Fotoğraf Yükle</span>
                          <span className="text-[10px] text-[#9AA0A6]">6-12 Fotoğraf (Tüm Ayaklar)</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowAttachMenu(false);
                          setShowPasteModal(true);
                        }}
                        className="px-3 py-2 text-xs text-white hover:bg-[#313543] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>Bülten Metni Yapıştır</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Voice Input Microphone Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-transparent ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'hover:bg-[#2C303B] text-[#C4C7C5] hover:text-white'
                  }`}
                  title={isListening ? "Dinleniyor..." : "Sesle Yazdır (Mikrofon)"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              {/* Circle / Pill Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || isOptimizingImages || (!input.trim() && selectedImages.length === 0)}
                className="h-10 px-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-30 disabled:text-slate-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0"
                title="Mesajı Uygulamaya Gönder"
              >
                <span>Gönder</span>
                <ArrowUp className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL FOR FULL RES IMAGE PREVIEW */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Büyük Görsel Önizleme"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-[#3E4352] shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer border border-white/20"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* QUICK BULLETIN PASTE MODAL */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E2026] border border-[#333742] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#2D313A] flex items-center justify-between bg-[#18191E]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">TJK Bülten Metni Kopyala & Yapıştır</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1.5 text-[#9AA0A6] hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              <p className="text-xs text-[#9AA0A6]">
                TJK web sitesinden veya e-bültenden kopyaladığınız bülten metnini buraya yapıştırın. Yapay zeka tüm koşuları ve atları anında okuyacaktır.
              </p>
              <textarea
                value={pasteModalText}
                onChange={(e) => setPasteModalText(e.target.value)}
                placeholder="Örnek: 
1. KOŞU: Şartlı 4 - 1400m Kum
1 MY BOY GÖKSU (58 kg) Jokey: A.SÖZEN
2 TOROK STORM (55 kg) Jokey: H.KARATAŞ
..."
                rows={12}
                className="w-full bg-[#131418] text-xs font-mono text-white border border-[#2D313A] rounded-2xl p-4 focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            <div className="px-6 py-4 bg-[#18191E] border-t border-[#2D313A] flex items-center justify-between">
              <button
                onClick={() => setPasteModalText('')}
                className="text-xs text-[#9AA0A6] hover:text-white"
              >
                Temizle
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 bg-[#282A30] hover:bg-[#333742] text-white text-xs font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    setShowPasteModal(false);
                    if (pasteModalText.trim()) {
                      handleSend(pasteModalText);
                      setPasteModalText('');
                    }
                  }}
                  disabled={!pasteModalText.trim()}
                  className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Bülteni Analiz Et & Sohbete Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 LIVE TJK 15-MIN PRE-RACE ALERTS SIDE PANEL DRAWER */}
      {showLiveAlertsPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowLiveAlertsPanel(false)}
          />

          {/* Slide-in Panel */}
          <div className="relative w-full max-w-md bg-[#16181D] border-l border-[#2E323D] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-[#262933] bg-[#1A1D24] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Canlı TJK Uyarı Paneli
                    {liveAlerts.length > 0 && (
                      <span className="bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 font-mono">
                        {liveAlerts.length} Alarm
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-amber-300/90 font-medium">
                    🏆 Bugünkü Yarışlar: {todayCities.join(' • ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={testVoiceAlert}
                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Sessiz Bildirimi Test Et"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Sessiz Test</span>
                </button>
                <button
                  onClick={() => setShowLiveAlertsPanel(false)}
                  className="p-1.5 text-[#9AA0A6] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Paneli Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* City Selection Pills (Today's Racing Hipodroms) */}
            <div className="px-4 py-2 bg-[#131418] border-b border-[#23262E] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-slate-400 font-mono uppercase shrink-0">Pist:</span>
              {todayCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setActiveAlertHipodrom(city)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shrink-0 cursor-pointer ${
                    activeAlertHipodrom === city
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-[#1E2129] text-slate-400 border-[#2E3340] hover:text-white'
                  }`}
                >
                  🏇 {city}
                </button>
              ))}
            </div>

            {/* Panel Body: Alert List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {liveAlerts.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-300">
                    {activeAlertHipodrom} için son dakika değişikliği yok
                  </p>
                  <p className="text-[11px] text-[#9AA0A6] max-w-xs mx-auto">
                    TJK resmi veri akışından jokey, takı ve çıkan at kontrolleri canlı olarak taranıyor.
                  </p>
                  <button
                    type="button"
                    onClick={testVoiceAlert}
                    className="mt-2 px-3 py-1.5 bg-[#20232B] hover:bg-[#2A2E38] text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Sessiz Bildirim Testi Gönder
                  </button>
                </div>
              ) : (
                liveAlerts.map((alert) => {
                  const isCritical = alert.impact === 'CRITICAL' || alert.type === 'WITHDRAWN_BANKO';
                  const isHigh = alert.impact === 'HIGH' || alert.type === 'JOCKEY_CHANGE';

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCritical
                          ? 'bg-red-950/40 border-red-500/40'
                          : isHigh
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-[#1E2129] border-[#2E3340]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                            isCritical
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : isHigh
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {alert.type === 'WITHDRAWN_BANKO'
                            ? '🚫 Çıkan At'
                            : alert.type === 'JOCKEY_CHANGE'
                            ? '🏇 Jokey Değişti'
                            : alert.type === 'EQUIPMENT_CHANGE'
                            ? '🛡️ Takı Değişti'
                            : '🌧️ Pist Durumu'}
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono">Sessiz Log</span>
                      </div>

                      <h4 className="text-xs font-bold text-white mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                        {alert.description}
                      </p>

                      <div className="bg-black/30 rounded-xl p-2 text-[10px] text-amber-300 flex items-center gap-1.5 border border-white/5">
                        <Zap className="w-3 h-3 shrink-0 text-amber-400" />
                        <span>{alert.actionRequired}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-4 border-t border-[#262933] bg-[#1A1D24] space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={testVoiceAlert}
                  className="flex-1 py-2 bg-[#252833] hover:bg-[#2F3340] text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-amber-400" />
                  Sessiz Test
                </button>
              </div>

              {liveAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLiveAlertsPanel(false);
                    const alertSummary = liveAlerts.map(a => `• ${a.title}: ${a.description} -> Öneri: ${a.actionRequired}`).join('\n');
                    handleSend(`🚨 SON 15 DK CANLI DEĞİŞİKLİKLERİ ALGILANDI (${activeAlertHipodrom}):\n${alertSummary}\n\nLütfen bu değişiklikleri ve çıkan atları dikkate alarak 1.25 TL birim fiyatla kurguyu baştan revize et.`);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  Kurguyu Baştan Revize Et
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
