import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Zap,
  FileText,
  Brain,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  RefreshCw,
  Sparkles,
  Info,
  Menu,
  X,
  Plus,
  Minus,
  Calculator,
  Coins,
  RotateCcw,
  Download,
  Trash2,
  Tag,
  BookOpen,
  Sliders,
  Smartphone,
  Copy,
  Layers,
  Clock,
  Calendar,
  Save
} from 'lucide-react';
import { Race, HorseRaceEntry, LearningEvent, MemoryEntry, DatabaseStats } from './types';

const HIPODROMS = [
  "İSTANBUL",
  "ANKARA",
  "İZMİR",
  "ADANA",
  "BURSA",
  "KOCAELİ",
  "ANTALYA",
  "ELAZIĞ",
  "DİYARBAKIR",
  "ŞANLIURFA"
];

const CATEGORIES = [
  { key: "HEPSİ", label: "Tüm Kategoriler" },
  { key: "HAFIZA_NOTU", label: "🧠 Hafıza Notu" },
  { key: "AT_NOTU", label: "🐴 At Notu" },
  { key: "JOKEY_SIRI", label: "🏇 Jokey Sırrı" },
  { key: "GALOP_KAYDI", label: "⏱️ Galop Kaydı" },
  { key: "PIST_BILGISI", label: "🌿 Pist & Hava" },
  { key: "YARIS_SONUCU", label: "🏆 Yarış Sonucu" },
  { key: "GENEL", label: "📝 Genel Not" }
];

export default function App() {
  // Live Date and Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Navigation State
  const [menu, setMenu] = useState<string>("Analiz Paneli");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedHipodrom, setSelectedHipodrom] = useState<string>("İSTANBUL");
  const [oyunProgrami, setOyunProgrami] = useState<string>("1. Altılı Ganyan");

  // Bulletin & Analysis State
  const [savedBulletinContent, setSavedBulletinContent] = useState<string>("");
  const [useSavedBulletin, setUseSavedBulletin] = useState<boolean>(true);
  const [customBulletinInput, setCustomBulletinInput] = useState<string>("");
  const [showBulletinExpander, setShowBulletinExpander] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'kurgu' | 'table' | 'cards'>('kurgu');
  const [expandedLegs, setExpandedLegs] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [races, setRaces] = useState<Race[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Kupon Bütçe ve Ücret State
  const [unitPrice, setUnitPrice] = useState<number>(1.25);
  const [targetBudget, setTargetBudget] = useState<number>(100);

  const maxAllowedCombinations = Math.floor((targetBudget > 0 ? targetBudget : 0) / (unitPrice > 0 ? unitPrice : 1.25));

  // Akıllı Bütçe Dağılım Hesabı (Optimal Bütçe Kullanımı)
  const budgetDistribution = useMemo(() => {
    if (!races || races.length === 0) {
      return { counts: [1, 1, 1, 1, 1, 1], combinations: 1 };
    }

    const numLegs = races.length;
    const maxComb = Math.max(1, maxAllowedCombinations);

    // Precompute cumulative AI scores for taking top k horses in leg i
    const scoreSums: number[][] = races.map(r => {
      const sums = [0];
      let running = 0;
      const sorted = [...(r.horses || [])].sort((a, b) => b.score - a.score);
      for (let k = 0; k < sorted.length; k++) {
        running += sorted[k].score;
        sums.push(running);
      }
      return sums;
    });

    const maxAvailable = races.map(r => (r.horses ? r.horses.length : 1));

    let bestCounts = new Array(numLegs).fill(1);
    let bestComb = 1;
    let bestValue = -1;

    function search(legIdx: number, currentComb: number, currentCounts: number[], currentScoreSum: number) {
      if (legIdx === numLegs) {
        // Primary priority: maximize combination count up to maxComb
        // Secondary priority: maximize sum of selected horses' AI scores
        const value = currentComb * 1000000 + currentScoreSum;
        if (value > bestValue) {
          bestValue = value;
          bestComb = currentComb;
          bestCounts = [...currentCounts];
        }
        return;
      }

      const maxForLeg = Math.min(maxAvailable[legIdx], maxComb);
      for (let c = 1; c <= maxForLeg; c++) {
        const nextComb = currentComb * c;
        if (nextComb > maxComb) break;

        currentCounts[legIdx] = c;
        const legScore = scoreSums[legIdx][c] || 0;
        search(legIdx + 1, nextComb, currentCounts, currentScoreSum + legScore);
      }
    }

    search(0, 1, new Array(numLegs).fill(1), 0);

    return { counts: bestCounts, combinations: bestComb };
  }, [races, maxAllowedCombinations]);

  // Highlight matching search words/phrases with blue badge in notebook view
  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return text;
    const searchTrim = search.trim();
    const escaped = searchTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(searchRegex);
    return parts.map((part, i) =>
      part.toLowerCase() === searchTrim.toLowerCase() ? (
        <mark key={i} className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded shadow-md inline border border-blue-400">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Top surprise candidates for each leg (Sürpriz At Bulucu)
  const surpriseCandidates = useMemo(() => {
    if (!races || races.length === 0) return [];
    return races.map((race, rIdx) => {
      const sortedBySurprise = [...race.horses].sort((a, b) => (b.surpriseScore || 0) - (a.surpriseScore || 0));
      const topSurprise = sortedBySurprise[0];
      return {
        legIndex: rIdx + 1,
        raceNo: race.raceNo,
        horse: topSurprise
      };
    });
  }, [races]);

  // Management State
  const [manageHipodrom, setManageHipodrom] = useState<string>("İSTANBUL");
  const [rawBulletinText, setRawBulletinText] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // OCR Simulation State
  const [ocrFileName, setOcrFileName] = useState<string>("");
  const [ocrText, setOcrText] = useState<string>("");
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);

  // Learning Logs State
  const [learningEvents, setLearningEvents] = useState<LearningEvent[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);

  // Memory / Knowledge Bank State ("Kendi Veri Bankam")
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [memorySearch, setMemorySearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("HEPSİ");
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [memoryLoading, setMemoryLoading] = useState<boolean>(false);

  // Add Memory Form State
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("AT_NOTU");
  const [newHorseName, setNewHorseName] = useState<string>("");
  const [newTags, setNewTags] = useState<string>("");
  const [addMemoryLoading, setAddMemoryLoading] = useState<boolean>(false);

  // Self-Learning Result Feedback State
  const [learnWinnerHorse, setLearnWinnerHorse] = useState<string>("");
  const [learnBeatenHorses, setLearnBeatenHorses] = useState<string>("");
  const [learnWinnerJockey, setLearnWinnerJockey] = useState<string>("");
  const [learnWeight, setLearnWeight] = useState<string>("57.5");
  const [learnDistance, setLearnDistance] = useState<string>("1400m");
  const [learnTrackType, setLearnTrackType] = useState<string>("Çim");
  const [learnRaceNo, setLearnRaceNo] = useState<number>(1);
  const [learnTrack, setLearnTrack] = useState<string>("Normal 3.3");
  const [learnLoading, setLearnLoading] = useState<boolean>(false);

  // JSON Import State
  const [jsonImportText, setJsonImportText] = useState<string>("");
  const [showImportBox, setShowImportBox] = useState<boolean>(false);

  // Initial load on mount
  useEffect(() => {
    fetchMemoryEntries();
    fetchDbStats();
    fetchLearningEvents();
    fetchBulletin(selectedHipodrom);
  }, []);

  // Fetch Bulletin when selected Hipodrom changes
  useEffect(() => {
    fetchBulletin(selectedHipodrom);
  }, [selectedHipodrom]);

  // Fetch Bulletin for Management
  useEffect(() => {
    fetchManageBulletin(manageHipodrom);
  }, [manageHipodrom]);

  // Fetch data on menu change or filter change
  useEffect(() => {
    if (menu === "Öğrenme Logları") {
      fetchLearningEvents();
    }
    fetchMemoryEntries();
    fetchDbStats();
  }, [menu, selectedCategory, memorySearch]);

  const fetchBulletin = async (hipodrom: string) => {
    try {
      const res = await fetch(`/api/bulletins/${encodeURIComponent(hipodrom)}`);
      if (res.ok) {
        let data: any = {};
        try { data = await res.json(); } catch (e) {}
        if (data && data.content) {
          setSavedBulletinContent(data.content);
          try { localStorage.setItem(`cached_bulletin_${hipodrom}`, data.content); } catch (e) {}
          return;
        }
      }
      const cached = localStorage.getItem(`cached_bulletin_${hipodrom}`);
      if (cached) setSavedBulletinContent(cached);
      else setSavedBulletinContent("");
    } catch (err) {
      console.error("Bülten okuma hatası:", err);
      const cached = localStorage.getItem(`cached_bulletin_${hipodrom}`);
      if (cached) setSavedBulletinContent(cached);
    }
  };

  const fetchManageBulletin = async (hipodrom: string) => {
    try {
      const res = await fetch(`/api/bulletins/${encodeURIComponent(hipodrom)}`);
      if (res.ok) {
        let data: any = {};
        try { data = await res.json(); } catch (e) {}
        if (data && data.content) {
          setRawBulletinText(data.content);
          try { localStorage.setItem(`cached_bulletin_${hipodrom}`, data.content); } catch (e) {}
          return;
        }
      }
      const cached = localStorage.getItem(`cached_bulletin_${hipodrom}`);
      if (cached) setRawBulletinText(cached);
    } catch (err) {
      console.error("Bülten yönetim hatası:", err);
      const cached = localStorage.getItem(`cached_bulletin_${hipodrom}`);
      if (cached) setRawBulletinText(cached);
    }
  };

  const fetchLearningEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch('/api/learning-events');
      if (res.ok) {
        let data: any = {};
        try { data = await res.json(); } catch (e) {}
        setLearningEvents(data.events || []);
      }
    } catch (err) {
      console.error("Öğrenme logları hatası:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchMemoryEntries = async () => {
    setMemoryLoading(true);
    try {
      const url = `/api/memory?q=${encodeURIComponent(memorySearch)}&category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      if (res.ok) {
        let data: any = {};
        try { data = await res.json(); } catch (e) {}
        setMemoryEntries(data.notes || []);
        try { localStorage.setItem('cached_memory_notes', JSON.stringify(data.notes || [])); } catch (e) {}
      } else {
        const cached = localStorage.getItem('cached_memory_notes');
        if (cached) setMemoryEntries(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Hafıza okuma hatası:", err);
      const cached = localStorage.getItem('cached_memory_notes');
      if (cached) setMemoryEntries(JSON.parse(cached));
    } finally {
      setMemoryLoading(false);
    }
  };

  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/db/stats');
      if (res.ok) {
        let data: any = {};
        try { data = await res.json(); } catch (e) {}
        if (data && typeof data === 'object') {
          setDbStats(data);
        }
      }
    } catch (err) {
      console.error("DB stat hatası:", err);
    }
  };

  const handleSaveBulletin = async () => {
    if (!rawBulletinText.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen kaydedilecek bülten metnini girin.' });
      return;
    }
    setSaveLoading(true);
    try {
      const res = await fetch('/api/bulletins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hipodrom: manageHipodrom, content: rawBulletinText.trim() })
      });
      let data: any = {};
      try { data = await res.json(); } catch (e) {}
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `✅ ${manageHipodrom} bülteni kapalı devre veritabanına başarıyla kaydedildi.` });
        try { localStorage.setItem(`cached_bulletin_${manageHipodrom}`, rawBulletinText.trim()); } catch (e) {}
        if (manageHipodrom === selectedHipodrom) {
          setSavedBulletinContent(rawBulletinText.trim());
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Kayıt hatası oluştu.' });
      }
    } catch (err) {
      // Local fallback
      try { localStorage.setItem(`cached_bulletin_${manageHipodrom}`, rawBulletinText.trim()); } catch (e) {}
      if (manageHipodrom === selectedHipodrom) {
        setSavedBulletinContent(rawBulletinText.trim());
      }
      setStatusMessage({ type: 'success', text: `✅ ${manageHipodrom} bülteni cihaz hafızasına kaydedildi.` });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    let textToAnalyze = useSavedBulletin && savedBulletinContent ? savedBulletinContent : customBulletinInput;
    if (!textToAnalyze.trim() && customBulletinInput.trim()) {
      textToAnalyze = customBulletinInput;
    }
    if (!textToAnalyze.trim() && savedBulletinContent.trim()) {
      textToAnalyze = savedBulletinContent;
    }

    if (!textToAnalyze.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen analiz edilecek bülten metnini girin veya veritabanından bir hipodrom seçin.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulletinText: textToAnalyze,
          oyunProgrami,
          hipodrom: selectedHipodrom
        })
      });

      let data: any = {};
      try { data = await res.json(); } catch (e) {}

      if (res.ok) {
        if (!data.races || data.races.length === 0) {
          setStatusMessage({ type: 'error', text: 'Koşu veya geçerli at verisi ayrıştırılamadı. Bülten formatını kontrol edin.' });
          setRaces([]);
        } else {
          setRaces(data.races);
          setViewMode('kurgu');
          setStatusMessage({ type: 'success', text: `✅ Toplam ${data.races.length} koşu 20-Parametre Motoruyla başarıyla analiz edildi.` });
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Analiz hatası.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Sunucuyla bağlantı hatası.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunOCR = async (fileObj?: File) => {
    const nameToUse = fileObj ? fileObj.name : ocrFileName;
    if (!nameToUse) {
      setStatusMessage({ type: 'error', text: 'Lütfen önce bir bülten görseli seçin.' });
      return;
    }
    setOcrLoading(true);
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName: nameToUse })
      });
      let data: any = {};
      try { data = await res.json(); } catch (e) {}
      if (res.ok && data.text) {
        setOcrText(data.text);
        setRawBulletinText(data.text);
        setCustomBulletinInput(data.text);
        setNewContent(data.text);
        setStatusMessage({ type: 'success', text: '✅ Metin / OCR taraması bültenden başarıyla çıkarıldı ve alana yerleştirildi!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Görsel okunamadı veya metin bulunamadı.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Görsel veya metin tarama hatası.' });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'memory' | 'bulletin') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type.startsWith('image/')) {
      setOcrFileName(file.name);
      handleRunOCR(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          if (targetField === 'memory') {
            setNewContent(text);
            setStatusMessage({ type: 'success', text: `📄 "${file.name}" dosya içeriği hafıza alanına yüklendi!` });
          } else {
            setRawBulletinText(text);
            setCustomBulletinInput(text);
            setStatusMessage({ type: 'success', text: `📄 "${file.name}" bülten içeriği alana yüklendi!` });
          }
        }
      };
      reader.onerror = () => {
        setStatusMessage({ type: 'error', text: 'Dosya okunurken bir hata oluştu.' });
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen hafızaya kaydedilecek not içeriğini girin.' });
      return;
    }

    setAddMemoryLoading(true);

    const fallbackNote: MemoryEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      title: newTitle && newTitle.trim() ? newTitle.trim() : (newHorseName ? `${newHorseName} Notu` : "Özel Veri Bankası Kaydı"),
      content: newContent.trim(),
      category: newCategory || "GENEL",
      horse_name: newHorseName ? newHorseName.trim() : undefined,
      tags: newTags ? newTags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          horse_name: newHorseName,
          tags: newTags
        })
      });

      let data: any = {};
      try { data = await res.json(); } catch (e) {}
      if (res.ok) {
        setStatusMessage({ type: 'success', text: '🧠 Veri kapalı devre hafıza bankanıza kaydedildi!' });
        setNewTitle("");
        setNewContent("");
        setNewHorseName("");
        setNewTags("");
        fetchMemoryEntries();
        fetchDbStats();
      } else {
        // Fallback to local storage
        const updated = [data.note || fallbackNote, ...memoryEntries];
        setMemoryEntries(updated);
        try { localStorage.setItem('cached_memory_notes', JSON.stringify(updated)); } catch (e) {}
        setStatusMessage({ type: 'success', text: '🧠 Veri cihaz hafızasına yerel olarak kaydedildi!' });
        setNewTitle("");
        setNewContent("");
        setNewHorseName("");
        setNewTags("");
      }
    } catch (err) {
      // Local Fallback on network/mobile error
      const updated = [fallbackNote, ...memoryEntries];
      setMemoryEntries(updated);
      try { localStorage.setItem('cached_memory_notes', JSON.stringify(updated)); } catch (e) {}
      setStatusMessage({ type: 'success', text: '🧠 İnternet/Ağ hatası: Veri mobil cihaz hafızasına güvenle kaydedildi.' });
      setNewTitle("");
      setNewContent("");
      setNewHorseName("");
      setNewTags("");
    } finally {
      setAddMemoryLoading(false);
    }
  };

  const handleQuickMemorySave = async () => {
    if (!newContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen hafızaya kaydedilecek metin veya at adı yazın.' });
      return;
    }

    setAddMemoryLoading(true);
    const cleanStr = newContent.trim();
    const firstLine = cleanStr.split('\n')[0].substring(0, 40);

    const fallbackNote: MemoryEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      title: firstLine,
      content: cleanStr,
      category: 'HAFIZA_NOTU',
      horse_name: cleanStr.length < 35 ? cleanStr : undefined,
      tags: []
    };

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: firstLine,
          content: cleanStr,
          category: 'HAFIZA_NOTU',
          horse_name: cleanStr.length < 35 ? cleanStr : undefined,
          tags: []
        })
      });

      let data: any = {};
      try { data = await res.json(); } catch (e) {}
      if (res.ok) {
        setStatusMessage({ type: 'success', text: '🧠 Veri kapalı devre hafıza bankanıza başarıyla kaydedildi!' });
        setNewContent('');
        fetchMemoryEntries();
        fetchDbStats();
      } else {
        const updated = [data.note || fallbackNote, ...memoryEntries];
        setMemoryEntries(updated);
        try { localStorage.setItem('cached_memory_notes', JSON.stringify(updated)); } catch (e) {}
        setStatusMessage({ type: 'success', text: '🧠 Veri cihaz hafızanıza yerel olarak kaydedildi!' });
        setNewContent('');
      }
    } catch (err) {
      const updated = [fallbackNote, ...memoryEntries];
      setMemoryEntries(updated);
      try { localStorage.setItem('cached_memory_notes', JSON.stringify(updated)); } catch (e) {}
      setStatusMessage({ type: 'success', text: '🧠 Veri cihaz hafızanıza yerel olarak kaydedildi.' });
      setNewContent('');
    } finally {
      setAddMemoryLoading(false);
    }
  };

  const handleDeleteMemory = async (id: number) => {
    let confirmDelete = true;
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        confirmDelete = window.confirm("Bu hafıza kaydını silmek istediğinize emin misiniz?");
      }
    } catch (e) {
      confirmDelete = true;
    }
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMessage({ type: 'info', text: 'Kayıt hafızadan silindi.' });
      } else {
        setMemoryEntries(prev => prev.filter(m => m.id !== id));
        setStatusMessage({ type: 'info', text: 'Kayıt yerel cihaz hafızasından silindi.' });
      }
      fetchMemoryEntries();
      fetchDbStats();
    } catch (err) {
      setMemoryEntries(prev => prev.filter(m => m.id !== id));
      setStatusMessage({ type: 'info', text: 'Kayıt yerel cihaz hafızasından silindi.' });
    }
  };

  const handleLearnResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnWinnerHorse.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen kazanan at adını girin.' });
      return;
    }

    setLearnLoading(true);
    try {
      const res = await fetch('/api/learn-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceNo: learnRaceNo,
          hipodrom: selectedHipodrom,
          winnerHorseName: learnWinnerHorse,
          winnerJockey: learnWinnerJockey,
          beatenHorses: learnBeatenHorses,
          weight: learnWeight,
          distance: learnDistance,
          trackType: learnTrackType,
          trackCondition: learnTrack
        })
      });

      let data: any = {};
      try { data = await res.json(); } catch (e) {}

      if (res.ok) {
        setStatusMessage({ type: 'success', text: data.message || 'Yarış sonucu öğrenme sistemine başarıyla kaydedildi!' });
        setLearnWinnerHorse("");
        setLearnWinnerJockey("");
        setLearnBeatenHorses("");
        fetchDbStats();
        fetchLearningEvents();
        fetchMemoryEntries();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Öğrenme işlemi hatası.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Sunucu bağlantı hatası: İşlem yerel cihazda tamamlandı.' });
    } finally {
      setLearnLoading(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const res = await fetch('/api/db/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `veri_bankasi_yedek_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setStatusMessage({ type: 'success', text: '✅ Veritabanı yedeği başarıyla indirildi!' });
      } else {
        window.open('/api/db/export', '_blank');
      }
    } catch (err) {
      window.open('/api/db/export', '_blank');
    }
  };

  const handleImportDatabase = async () => {
    if (!jsonImportText.trim()) return;
    try {
      const parsed = JSON.parse(jsonImportText);
      const res = await fetch('/api/db/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseData: parsed })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: '✅ Veritabanı yedekten yüklendi!' });
        setShowImportBox(false);
        setJsonImportText("");
        fetchMemoryEntries();
        fetchDbStats();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Yükleme hatası.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Geçersiz JSON formatı.' });
    }
  };

  // Highest score in analyzed races
  const highestScore = races.length > 0
    ? Math.max(...races.flatMap(r => r.horses.map(h => h.score)))
    : 98.42;

  // Score Color Helper
  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-amber-500 font-bold';
    if (score >= 82) return 'text-emerald-400 font-bold';
    if (score >= 75) return 'text-blue-400 font-bold';
    return 'text-[#8E9299] font-bold';
  };

  // Selection Rationale / Why Selected Helper
  const getHorseSelectionRationale = (horse: HorseRaceEntry, hIdx: number, isBanko: boolean, legHorseCount: number) => {
    const hp = horse.handicap || 70;
    const weight = horse.weight || 58;
    const eq = horse.equipments && horse.equipments.length > 0 ? horse.equipments.join(', ') : null;
    const wins = horse.totalWins || 0;
    const duo = horse.duoWins || 0;

    if (horse.hasRaceHistory === false || wins === 0) {
      return `Koşu/yarış geçmişi bulunmamaktadır. ${horse.sire} / ${horse.dam} (Anne-Baba Kan Hattı / Pedigree DNA) potansiyeli, ${weight} kg sıklet avantajı ve ${horse.jockeyName} jokey eşleşmesi ile sistem tarafından otomatik seçilmiştir.`;
    }

    if (isBanko) {
      return `AI skor lideri (${horse.score.toFixed(1)} Puan). ${hp >= 75 ? `${hp} HP yüksek handikap gücü` : 'Yüksek form derecesi'}, ${horse.jockeyName} tecrübesi ve %${Math.min(98, Math.round(horse.score))}'lik galibiyet ihtimali ile ayağın tek BANKO adayı.`;
    }
    if (hIdx === 0) {
      return `Ayağın 1. favorisi. ${horse.jockeyName} idaresi, ${hp} HP kalite puanı ve ${wins > 0 ? `${wins} birincilik tecrübesi` : 'yükselen form grafiği'} ile kupona birinci sıradan eklendi.`;
    }
    if (hIdx === 1) {
      if (weight <= 55) {
        return `Favoriye en güçlü rakip. ${weight} kg hafif sıklet avantajı, ${hp} HP gücü ve yüksek son düzlük temposuyla kupon emniyeti için seçildi.`;
      }
      if (eq) {
        return `${eq} donanım avantajı, ${horse.jockeyName} jokey uyumu ve ${horse.score.toFixed(1)} AI skoruyla favoriyi yıkma potansiyeline sahip.`;
      }
      return `${duo > 0 ? `${duo} kez ikili tamamlama derecesi` : 'Kararlı form yapısı'} ve ${horse.score.toFixed(1)} AI skoru ile favorinin en yakın sigortası.`;
    }
    // hIdx >= 2 (Sürpriz / Bütçe genişletme atı)
    if (weight <= 54) {
      return `Bütçe genişletme sigortası. ${weight} kg elverişli sıklet ve ${horse.jockeyName} hamlesi ile yüksek ganyanlı sürpriz avantajı.`;
    }
    if (eq) {
      return `Donanım (${eq}) takısı ve ${hp} HP gücüyle ikramiyeyi yükseltebilecek sürpriz kapalı kutu.`;
    }
    return `${horse.score.toFixed(1)} AI skoru ve pist/mesafe uyumu ile akıllı bütçe dağılımında kupona dahil edildi.`;
  };

  return (
    <div className="flex h-screen w-full bg-[#151619] text-[#E0E0E0] font-sans overflow-hidden">
      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:relative z-50 top-0 bottom-0 left-0 w-72 md:w-64 border-r border-[#2A2D35] flex flex-col bg-[#151619] shrink-0 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${sidebarCollapsed ? 'md:hidden' : ''}`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#2A2D35] flex items-center justify-between">
          <div>
            <h1 className="text-amber-500 font-black text-xl tracking-tighter flex items-center gap-2">
              <span>🏇</span> TURBO-10X PRO
            </h1>
            <p className="text-[10px] text-[#8E9299] uppercase tracking-widest mt-0.5">
              Kapalı Devre AI Veri Bankası
            </p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 text-[#8E9299] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-3.5 overflow-y-auto">
          {/* Ana Menü / Sistem Menüsü */}
          <div className="space-y-1 pb-3 border-b border-[#2A2D35]">
            <div className="text-[10px] text-amber-500 uppercase font-bold tracking-wider px-1 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Sistem Menüsü</span>
            </div>
            {[
              { id: "Analiz Paneli", label: "Analiz Paneli", icon: Zap },
              { id: "Kendi Veri Bankam", label: "Hafıza Bankası", icon: BookOpen },
              { id: "Bülten Yükle / Yönet", label: "Bülten Yönetimi", icon: FileText },
              { id: "Öğrenme Logları", label: "Öğrenme Logları", icon: Layers }
            ].map((navItem) => {
              const isActive = menu === navItem.id;
              const Icon = navItem.icon;
              return (
                <button
                  key={navItem.id}
                  onClick={() => {
                    setMenu(navItem.id);
                    setStatusMessage(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer min-h-[38px] ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-[#8E9299] hover:text-white hover:bg-[#1B1D23]"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-950" : "text-amber-500"}`} />
                  <span>{navItem.label}</span>
                </button>
              );
            })}
          </div>

          {/* Program ve Kurgu Parametreleri (Yan Panel Top) */}
          <div className="space-y-3.5">
            <div className="text-[10px] text-amber-500 uppercase font-bold tracking-wider px-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Program & Kurgu Ayarları</span>
            </div>

            {/* 1. Tarih Seçimi */}
            <div>
              <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1 px-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Tarih Seçimi</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#1B1D23] text-xs font-semibold font-mono text-white border border-[#2A2D35] rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 min-h-[42px]"
              />
            </div>

            {/* 2. Hipodrom Seçimi */}
            <div>
              <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1 px-1 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Hipodrom Seçimi</span>
              </label>
              <select
                value={selectedHipodrom}
                onChange={(e) => setSelectedHipodrom(e.target.value)}
                className="w-full bg-[#1B1D23] text-xs font-semibold text-white border border-[#2A2D35] rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 min-h-[42px] cursor-pointer"
              >
                {HIPODROMS.map((hip) => (
                  <option key={hip} value={hip} className="bg-[#151619]">{hip}</option>
                ))}
              </select>
            </div>

            {/* 3. Program Türü */}
            <div>
              <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1 px-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Program Türü</span>
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[#1B1D23] p-1 rounded-lg border border-[#2A2D35]">
                {["1. Altılı", "2. Altılı"].map((pShort) => {
                  const fullProg = pShort === "1. Altılı" ? "1. Altılı Ganyan" : "2. Altılı Ganyan";
                  const isSel = oyunProgrami === fullProg;
                  return (
                    <button
                      key={pShort}
                      onClick={() => setOyunProgrami(fullProg)}
                      className={`py-1.5 text-[11px] font-bold rounded transition-colors text-center min-h-[38px] cursor-pointer ${
                        isSel
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "text-[#8E9299] hover:text-white"
                      }`}
                    >
                      {pShort}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Kurgu Ücreti (Hedef Bütçe) */}
            <div className="bg-[#1B1D23] p-2.5 rounded-lg border border-[#2A2D35] space-y-2">
              <label className="text-[10px] text-[#8E9299] uppercase font-bold block px-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Kurgu Ücreti</span>
                </span>
                <span className="text-amber-400 font-mono font-bold text-xs">{targetBudget} TL</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTargetBudget(prev => Math.max(5, prev - 5))}
                  className="w-8 h-8 bg-[#0F1012] hover:bg-[#2A2D35] text-[#8E9299] hover:text-white rounded border border-[#2A2D35] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="5 TL Azalt"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="10000"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0F1012] text-amber-400 font-mono font-bold text-xs text-center py-1.5 px-2 rounded border border-[#3A3D45] focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Hedef Bütçe"
                  />
                  <span className="absolute right-2 text-[10px] font-bold text-amber-500 pointer-events-none">TL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetBudget(prev => prev + 5)}
                  className="w-8 h-8 bg-[#0F1012] hover:bg-[#2A2D35] text-[#8E9299] hover:text-white rounded border border-[#2A2D35] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="5 TL Artır"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Birim Fiyat */}
            <div className="bg-[#1B1D23] p-2.5 rounded-lg border border-[#2A2D35] space-y-2">
              <label className="text-[10px] text-[#8E9299] uppercase font-bold block px-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Birim Fiyat</span>
                </span>
                <span className="text-amber-400 font-mono font-bold text-xs">{unitPrice.toFixed(2)} TL</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setUnitPrice(prev => Math.max(0.10, Math.round((prev - 0.05) * 100) / 100))}
                  className="w-8 h-8 bg-[#0F1012] hover:bg-[#2A2D35] text-[#8E9299] hover:text-white rounded border border-[#2A2D35] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="0.05 TL Azalt"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="number"
                    step="0.05"
                    min="0.10"
                    max="100"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 1.25)}
                    className="w-full bg-[#0F1012] text-amber-400 font-mono font-bold text-xs text-center py-1.5 px-2 rounded border border-[#3A3D45] focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Birim Fiyat"
                  />
                  <span className="absolute right-2 text-[10px] font-bold text-amber-500 pointer-events-none">TL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUnitPrice(prev => Math.round((prev + 0.05) * 100) / 100)}
                  className="w-8 h-8 bg-[#0F1012] hover:bg-[#2A2D35] text-[#8E9299] hover:text-white rounded border border-[#2A2D35] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="0.05 TL Artır"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabela Özet Tutar Kartı */}
            <div className="bg-gradient-to-br from-[#1F222A] to-[#151619] p-2.5 rounded-lg border border-amber-500/30 shadow-md space-y-1 font-mono">
              <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
                <span>Maks. Kombinasyon:</span>
                <span className="text-white font-bold">{maxAllowedCombinations.toLocaleString('tr-TR')} Adet</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
                <span>Birim Çarpan:</span>
                <span className="text-white font-bold">{unitPrice.toFixed(2)} TL</span>
              </div>
              <div className="pt-1.5 border-t border-[#2A2D35] flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Kurgu Bütçesi:</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {targetBudget.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Database Status Footer */}
        <div className="p-4 border-t border-[#2A2D35] bg-[#0F1012]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
            <span className="text-[11px] font-mono text-[#8E9299]">KAPALI DEVRE MOD: AKTİF</span>
          </div>
          <p className="text-[10px] text-[#5C616B] font-mono">
            DB: turbo_pro_data.json
          </p>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER BAR */}
        <header className="border-b border-[#2A2D35] bg-[#1B1D23] shrink-0">
          {/* Main Header Row */}
          <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2">
            {/* Left Side: Toggle Menu & Desktop Module Tabs */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setMobileMenuOpen(!mobileMenuOpen);
                  } else {
                    setSidebarCollapsed(!sidebarCollapsed);
                  }
                }}
                className="p-2 text-[#8E9299] hover:text-white rounded-lg border border-[#2A2D35] bg-[#0F1012] min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer active:bg-white/5 transition-colors shrink-0"
                title="Yan Paneli Aç / Kapat"
                aria-label="Yan Paneli Aç / Kapat"
              >
                <Menu className="w-5 h-5 text-amber-500" />
              </button>

              {/* Desktop Header Navigation Tabs */}
              <div className="hidden lg:flex items-center gap-1 bg-[#0F1012] p-1 rounded-lg border border-[#2A2D35]">
                {[
                  { id: "Analiz Paneli", label: "Analiz", icon: Zap },
                  { id: "Kendi Veri Bankam", label: "Hafıza", icon: BookOpen },
                  { id: "Bülten Yükle / Yönet", label: "Bülten", icon: FileText },
                  { id: "Öğrenme Logları", label: "Loglar", icon: Layers }
                ].map((tab) => {
                  const isActive = menu === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMenu(tab.id);
                        setStatusMessage(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[34px] ${
                        isActive
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "text-[#8E9299] hover:text-white hover:bg-[#1B1D23]"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Live Date & Clock, Analiz Et Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Selected Date & Live Clock Widget (Desktop & Tablet - Read Only) */}
              <div className="hidden sm:flex items-center gap-2 bg-[#0F1012] border border-[#2A2D35] px-2.5 sm:px-3 py-1.5 rounded-lg font-mono text-xs shrink-0">
                <div className="flex items-center gap-1 text-white font-bold text-[11px] sm:text-xs whitespace-nowrap" title="Seçili Program Tarihi (Yan Panelden Değiştirilebilir)">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {selectedDate ? selectedDate.split('-').reverse().join('.') : currentTime.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-[#3A3D45] font-bold">|</span>
                <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] sm:text-xs whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                  <span>{currentTime.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false })}</span>
                </div>
              </div>

              {/* Analiz Et Button */}
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white px-3 sm:px-5 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all uppercase tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-600/30 min-h-[40px] shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span className="hidden sm:inline">Analiz Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white shrink-0" />
                    <span>Analiz Et</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Sub-Header Control Strip (Visible on mobile screens < 640px - Display Only) */}
          <div className="sm:hidden px-3 py-1.5 bg-[#151619] border-t border-[#2A2D35] flex items-center justify-between gap-2 font-mono text-xs">
            {/* Mobile Read-only Date Display */}
            <div className="flex items-center gap-1.5 bg-[#0F1012] border border-[#2A2D35] px-2.5 py-1 rounded-md text-white font-bold text-xs" title="Seçili Tarih">
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{selectedDate ? selectedDate.split('-').reverse().join('.') : ''}</span>
            </div>

            {/* Mobile Live Clock */}
            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-[#0F1012] border border-[#2A2D35] px-2.5 py-1 rounded-md shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
              <span>{currentTime.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false })}</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 pb-24">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 sm:p-4 rounded-lg border text-xs sm:text-sm font-mono flex items-center justify-between shrink-0 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-[#2A2D35] text-[#E0E0E0]'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                {statusMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {statusMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-xs text-[#8E9299] hover:text-white uppercase font-bold ml-4"
              >
                [Kapat]
              </button>
            </div>
          )}

          {/* --- MENU 1: ANALİZ PANELİ --- */}
          {menu === "Analiz Paneli" && (
            <div className="flex flex-col gap-6 flex-1">
              {/* STATS GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#1B1D23] p-3.5 border border-[#2A2D35] rounded-lg">
                  <p className="text-[10px] text-[#8E9299] uppercase font-bold">Toplam Koşu</p>
                  <p className="text-xl sm:text-2xl font-mono text-white font-bold mt-1">
                    {races.length > 0 ? `${races.length} KOŞU` : '6 KOŞU'}
                  </p>
                </div>
                <div className="bg-[#1B1D23] p-3.5 border border-[#2A2D35] rounded-lg">
                  <p className="text-[10px] text-[#8E9299] uppercase font-bold">Motor Parametresi</p>
                  <p className="text-xl sm:text-2xl font-mono text-white font-bold mt-1">20 PARAMETRE</p>
                </div>
                <div className="bg-[#1B1D23] p-3.5 border border-[#2A2D35] rounded-lg border-l-4 border-l-amber-500">
                  <p className="text-[10px] text-amber-500/90 uppercase font-bold">En Yüksek AI Puan</p>
                  <p className="text-xl sm:text-2xl font-mono text-amber-500 font-bold mt-1">
                    {highestScore.toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#1B1D23] p-3.5 border border-[#2A2D35] rounded-lg">
                  <p className="text-[10px] text-[#8E9299] uppercase font-bold">Öğrenme Çarpanı</p>
                  <p className="text-xl sm:text-2xl font-mono text-white font-bold mt-1">α 0.35</p>
                </div>
              </div>

              {/* BÜLTEN SEÇİMİ & ANALİZ BAŞLATMA MERKEZİ */}
              <div className="bg-[#1B1D23] border border-amber-500/40 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2D35] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/40 text-amber-400 shrink-0">
                      <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                        <span>⚡</span> 20-PARAMETRE ANALİZ & BÜLTEN SİSTEMİ ({selectedHipodrom})
                      </h3>
                      <p className="text-[11px] text-[#8E9299]">
                        Veritabanındaki bülteni kullanın, panodan bülten yapıştırın veya dosya/fotoğraf yükleyerek analiz başlatın.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setUseSavedBulletin(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        useSavedBulletin
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-[#0F1012] text-[#8E9299] border-[#2A2D35] hover:text-white'
                      }`}
                    >
                      💾 Kayıtlı Bülten ({selectedHipodrom})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseSavedBulletin(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        !useSavedBulletin
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-[#0F1012] text-[#8E9299] border-[#2A2D35] hover:text-white'
                      }`}
                    >
                      ✍️ Özel / Yeni Metin
                    </button>
                  </div>
                </div>

                {!useSavedBulletin ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-[#8E9299] uppercase font-bold block">
                        Bülten Metni / Program Detayları
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) {
                                setCustomBulletinInput(text);
                                setRawBulletinText(text);
                                setStatusMessage({ type: 'success', text: '✅ Panodaki metin bülten alanına yapıştırıldı!' });
                              }
                            } catch (e) {
                              setStatusMessage({ type: 'info', text: 'Panodan okumak için Ctrl+V ile metni kutuya yapıştırın.' });
                            }
                          }}
                          className="bg-[#2A2D35] hover:bg-white/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Panodan Yapıştır</span>
                        </button>

                        <label className="bg-[#2A2D35] hover:bg-white/10 text-white border border-[#3A3D45] px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Dosya / Yükle</span>
                          <input
                            type="file"
                            accept="*/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'bulletin')}
                          />
                        </label>
                      </div>
                    </div>

                    <textarea
                      rows={5}
                      value={customBulletinInput}
                      onChange={(e) => {
                        setCustomBulletinInput(e.target.value);
                        setRawBulletinText(e.target.value);
                      }}
                      placeholder="Buraya hipodrom bültenini yapıştırın veya dosya yükleyin... (Örn: 1. KOŞU: 1 SHINING GLORY 58kg...)"
                      className="w-full bg-[#0F1012] border border-[#2A2D35] rounded-lg p-3 text-xs font-mono text-white placeholder-[#5C616B] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="bg-[#0F1012] border border-[#2A2D35] rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Database className="w-4 h-4" />
                        <span>Veritabanındaki Kayıtlı Bülten: {selectedHipodrom}</span>
                      </span>
                      <span className="text-[10px] text-[#8E9299]">
                        {savedBulletinContent ? `${savedBulletinContent.length} karakter kayıtlı` : 'Henüz kayıt yok'}
                      </span>
                    </div>

                    {savedBulletinContent ? (
                      <div className="text-xs font-mono text-[#8E9299] max-h-24 overflow-y-auto bg-[#151619] p-2 rounded border border-[#2A2D35]">
                        {savedBulletinContent.substring(0, 300)}...
                      </div>
                    ) : (
                      <div className="text-xs text-rose-400 font-mono">
                        {selectedHipodrom} için henüz kaydedilmiş bülten bulunmuyor. "Özel / Yeni Metin" butonuna basarak bülteninizi yapıştırabilirsiniz.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[#2A2D35]">
                  <div className="text-[11px] text-[#8E9299] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>20 İstatistiksel Parametre + Hafıza Bankası + Sıklet/Rekabet Katsayıları işlenecektir.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAnalysis}
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase px-6 py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ANALİZ EDİLİYOR...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-slate-950" />
                        <span>⚡ 20-PARAMETRE ENGINE İLE ANALİZ ET & KURGU OLUŞTUR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* View Mode Switcher & Analysis Summary Bar */}
              {races.length > 0 && (
                <div className="space-y-6">
                  {/* ANALİZ ZEHİRLENMESİ ÖNLEME MERKEZİ & TEK BAKIŞTA AI SENTEZ */}
                  <div className="bg-gradient-to-r from-[#1B1D23] via-[#1A2536] to-[#1B1D23] border border-blue-500/40 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/40 shrink-0">
                          <Brain className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-blue-300 uppercase tracking-wide flex items-center gap-2">
                            <span>🛡️</span> ANALİZ ZEHİRLENMESİ ÖNLEME MERKEZİ (TEK BAKIŞTA SENTEZ)
                          </h3>
                          <p className="text-[11px] text-[#8E9299]">
                            20 parametrelik istatistiksel karmaşa ve bilgi kirliliği süzülmüştür. Karar vermenizi kolaylaştıracak net özet:
                          </p>
                        </div>
                      </div>
                      <span className="bg-blue-950 text-blue-300 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-500/40 self-start sm:self-center shrink-0">
                        ⚡ Net Karar Filtresi Aktif
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Banko Özet */}
                      <div className="bg-[#0F1012] border border-amber-500/40 p-3 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                          <span className="flex items-center gap-1">⭐ TEK BAKIŞTA GÜVENİLİR BANKO</span>
                        </div>
                        {(() => {
                          const bestSingle = races.map((r, i) => ({ leg: i + 1, horse: r.horses[0] }))
                            .sort((a, b) => b.horse.score - a.horse.score)[0];
                          return bestSingle ? (
                            <div>
                              <div className="text-sm font-black text-white">
                                {bestSingle.leg}. Ayak: #{bestSingle.horse.no} {bestSingle.horse.horseName}
                              </div>
                              <div className="text-[10px] font-mono text-amber-400/90 mt-0.5">
                                🏇 Jokey: {bestSingle.horse.jockeyName} | AI Skor: {bestSingle.horse.score.toFixed(1)} P
                              </div>
                            </div>
                          ) : <div className="text-xs text-[#8E9299]">Veri yok</div>;
                        })()}
                      </div>

                      {/* Bomb / Surprise Özet */}
                      <div className="bg-[#0F1012] border border-purple-500/40 p-3 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                          <span>💣 YÜKSEK GANYANLI SÜRPRİZ</span>
                        </div>
                        {(() => {
                          const bestSurprise = races.map((r, i) => {
                            const sorted = [...r.horses].sort((a, b) => (b.surpriseScore || 0) - (a.surpriseScore || 0));
                            return { leg: i + 1, horse: sorted[0] };
                          }).sort((a, b) => (b.horse.surpriseScore || 0) - (a.horse.surpriseScore || 0))[0];
                          return bestSurprise ? (
                            <div>
                              <div className="text-sm font-black text-white">
                                {bestSurprise.leg}. Ayak: #{bestSurprise.horse.no} {bestSurprise.horse.horseName}
                              </div>
                              <div className="text-[10px] font-mono text-purple-300/90 mt-0.5">
                                💣 Sürpriz Oranı: %{bestSurprise.horse.surpriseScore || 85} | {bestSurprise.horse.weight || 53} kg
                              </div>
                            </div>
                          ) : <div className="text-xs text-[#8E9299]">Veri yok</div>;
                        })()}
                      </div>

                      {/* Kupon Kurgu Özet */}
                      <div className="bg-[#0F1012] border border-emerald-500/40 p-3 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                          <span>📊 ÖNERİLEN KUPON DAĞILIMI</span>
                          <span className="font-mono text-xs text-emerald-300">{budgetDistribution.combinations * unitPrice} TL</span>
                        </div>
                        <div className="text-xs font-mono text-[#E0E0E0] font-bold">
                          {budgetDistribution.counts.map((c, idx) => `${idx + 1}.Ayak: ${c} At`).join(' × ')}
                        </div>
                        <div className="text-[10px] text-[#8E9299]">
                          Bütçenize ({targetBudget} TL) tam uyarlanmış 1. Favori + Güvenlik kurgusu.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SÜRPRİZ & BOMBA AT BULUCU (NEW FEATURE) */}
                  <div className="bg-gradient-to-r from-[#1B1D23] via-[#241B2E] to-[#1B1D23] border border-purple-500/40 rounded-xl p-4 sm:p-5 space-y-3 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/40 text-purple-300 font-extrabold text-base shrink-0">
                          💣
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                            <span>💣</span> 6'LI GANYAN SÜRPRİZ & BOMBA AT BULUCU
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-[#8E9299]">
                            Düşük sıklet, yüksek Pedigree DNA ve handikap potansiyeline sahip ikramiye patlatacak sürpriz adaylar:
                          </p>
                        </div>
                      </div>
                      <span className="bg-purple-950/80 text-purple-300 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-500/40 self-start sm:self-center shrink-0">
                        AI Sürpriz Motoru Aktif
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
                      {surpriseCandidates.map((c) => (
                        <div
                          key={c.raceNo}
                          className="bg-[#0F1012] border border-purple-500/30 hover:border-purple-400 p-2.5 rounded-lg space-y-1 font-mono text-xs transition-colors"
                        >
                          <div className="flex items-center justify-between text-[10px] text-purple-400 font-extrabold border-b border-purple-500/20 pb-1">
                            <span>{c.legIndex}. AYAK</span>
                            <span className="bg-purple-950 text-purple-300 font-extrabold px-1.5 py-0.2 rounded border border-purple-500/40 text-[9px]">
                              💣 %{c.horse.surpriseScore || 75}
                            </span>
                          </div>
                          <div className="font-extrabold text-white text-xs truncate pt-0.5">
                            #{c.horse.no} {c.horse.horseName}
                          </div>
                          <div className="text-[10px] text-purple-200/80 font-semibold truncate">
                            🏇 {c.horse.jockeyName} | {c.horse.weight || 52} kg
                          </div>
                          <div className="text-[9px] text-[#8E9299] truncate" title={c.horse.surpriseReason}>
                            {c.horse.surpriseReason || "Sürpriz Potansiyel"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SINGLE 6'LI GANYAN KURGUSU VIEW */}
                  <div className="bg-[#1B1D23] border border-amber-500/40 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
                    {/* 6 LEGS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {races.map((race, rIdx) => {
                          const legHorseCount = budgetDistribution.counts[rIdx] || 1;
                          const selectedHorses = race.horses.slice(0, legHorseCount);
                          const nonSelectedHorses = race.horses.slice(legHorseCount);
                          const isBanko = legHorseCount === 1;
                          const isExpanded = expandedLegs[rIdx];

                          return (
                            <div
                              key={race.raceNo}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                                isBanko
                                  ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                  : 'bg-[#151619] border-[#2A2D35]'
                              }`}
                            >
                              {/* Leg Header */}
                              <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-white">
                                    {rIdx + 1}. AYAK ({race.raceNo}. Koşu)
                                  </span>
                                  {isBanko ? (
                                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                      ⭐ TEK BANKO
                                    </span>
                                  ) : (
                                    <span className="bg-[#2A2D35] text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                      {legHorseCount} At Seçildi
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#8E9299] font-mono">
                                  Lider AI: {race.horses[0]?.score.toFixed(2)}
                                </span>
                              </div>

                              {/* List of Selected Horses */}
                              <div className="space-y-2 flex-1">
                                {selectedHorses.map((horse, hIdx) => (
                                  <div
                                    key={horse.no}
                                    className={`p-2.5 rounded-lg border text-xs font-mono transition-colors ${
                                      hIdx === 0 && isBanko
                                        ? 'bg-amber-500/20 border-amber-500/60 text-white'
                                        : 'bg-[#0F1012] border-[#2A2D35] text-[#E0E0E0]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`w-6 h-6 rounded flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                          hIdx === 0 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#2A2D35] text-white'
                                        }`}>
                                          {horse.no}
                                        </span>
                                        <div className="truncate">
                                          <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                                            {hIdx === 0 && <Trophy className="w-3 h-3 text-amber-400 shrink-0 inline" />}
                                            <span className="truncate">{horse.horseName}</span>
                                            {horse.isSurprise && (
                                              <span
                                                className="bg-purple-950/90 text-purple-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-purple-500/50 shrink-0"
                                                title={horse.surpriseReason}
                                              >
                                                💣 SÜRPRİZ (%{horse.surpriseScore})
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-amber-400/90 flex items-center gap-1.5 mt-0.5 truncate">
                                            <span className="font-semibold">🏇 {horse.jockeyName}</span>
                                            <span className="text-[#3A3D45]">|</span>
                                            <span className="text-[#8E9299]">{horse.weight || 58} kg</span>
                                            <span className="text-[#3A3D45]">|</span>
                                            <span className="text-[#8E9299]">{horse.handicap || 75} HP</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0 ml-2">
                                        <div className={`font-bold ${getScoreColorClass(horse.score)}`}>
                                          {horse.score.toFixed(2)}
                                        </div>
                                        <div className="text-[9px] text-[#8E9299]">
                                          {hIdx === 0 ? '#1 En İyi At' : `#${hIdx + 1}. At`}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Selection Rationale */}
                                    <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-[#A0A5B0] font-sans leading-relaxed flex items-start gap-1.5 bg-black/20 p-2 rounded border border-white/5">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-bold text-amber-400/90 mr-1">Seçim Sebebi:</span>
                                        <span>{getHorseSelectionRationale(horse, hIdx, isBanko, legHorseCount)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Expander for remaining unselected horses in this leg */}
                              {nonSelectedHorses.length > 0 && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedLegs(prev => ({ ...prev, [rIdx]: !prev[rIdx] }))}
                                    className="w-full text-[10px] text-[#8E9299] hover:text-amber-400 font-mono flex items-center justify-center gap-1 py-1.5 rounded bg-[#0F1012] border border-[#2A2D35] hover:border-amber-500/40 transition-colors cursor-pointer"
                                  >
                                    <span>{isExpanded ? '▲ Diğer Atları Gizle' : `▼ Ayağın Diğer Atları (${nonSelectedHorses.length} At)`}</span>
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-2 space-y-1.5 pt-1 border-t border-[#2A2D35]">
                                      {nonSelectedHorses.map((h) => (
                                        <div key={h.no} className="p-1.5 rounded bg-[#0F1012] border border-[#2A2D35] text-[10px] font-mono flex items-center justify-between text-[#8E9299]">
                                          <div className="flex items-center gap-2 truncate">
                                            <span className="w-4 h-4 bg-[#2A2D35] text-white font-bold rounded flex items-center justify-center text-[9px] shrink-0">
                                              {h.no}
                                            </span>
                                            <span className="text-white font-semibold truncate">{h.horseName}</span>
                                            <span className="text-[#5C616B] text-[9px] truncate">({h.jockeyName})</span>
                                          </div>
                                          <span className={`font-bold ${getScoreColorClass(h.score)}`}>
                                            {h.score.toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                </div>
              )}
            </div>
          )}

          {/* --- MENU 2: KENDİ VERİ BANKAM (HAFIZA & KOPYALA-YAPIŞTIR) --- */}
          {menu === "Kendi Veri Bankam" && (
            <div className="space-y-6">
              {/* Large Copy-Paste & Screenshot Input Card */}
              <div className="bg-[#1B1D23] border border-amber-500/40 rounded-xl p-4 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2D35] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/40 shrink-0">
                      <BookOpen className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                        <span>🧠</span> HAFIZA & BÜLTEN KOPYALA - YAPIŞTIR MERKEZİ
                      </h3>
                      <p className="text-[11px] text-[#8E9299]">
                        Google NotebookLM notlarınızı, yarış duyumlarını veya galopları topluca buraya yazın/yapıştırın; yapay zeka hafızasına aktarın.
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setNewContent(text);
                            setStatusMessage({ type: 'success', text: '📋 Panodaki metin alana yapıştırıldı!' });
                          }
                        } catch (e) {
                          setStatusMessage({ type: 'info', text: 'Panodan okumak için Ctrl+V yapın veya metni kutuya yapıştırın.' });
                        }
                      }}
                      className="bg-[#2A2D35] hover:bg-white/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Panodan Yapıştır</span>
                    </button>

                    <label className="bg-[#2A2D35] hover:bg-white/10 text-white border border-[#3A3D45] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[38px]">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dosya / Fotoğraf Yükle</span>
                      <input
                        type="file"
                        accept="*/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'memory')}
                      />
                    </label>
                  </div>
                </div>

                {/* Google NotebookLM Import Help Box */}
                <div className="bg-[#0F1012] border border-blue-500/30 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📘</span>
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                        Google NotebookLM'den Hafıza Aktarım Kılavuzu
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/40">
                      Tam Entegrasyon
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A0A5B0] leading-relaxed">
                    NotebookLM (<a href="https://notebooklm.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">notebooklm.google.com</a>) üzerindeki tüm notlarınızı veya kaynak metinlerinizi kopyalayıp aşağıdaki kutuya yapıştırın ve <strong>"💾 Hafızaya Kaydet"</strong> butonuna basın. Yapay zeka bülten analizinde bu notları otomatik olarak hatırlar ve değerlendirir.
                  </p>
                </div>

                {/* Large Textarea */}
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="NotebookLM notlarınızı, galop derecelerini, duyumları veya at analizlerini buraya yapıştırın (Örn: 'SHINING GLORY 1400m çimde 1.24 derece yaptı, favori...')..."
                    className="w-full bg-[#0F1012] border border-[#2A2D35] rounded-xl p-4 text-xs sm:text-sm font-mono text-[#E0E0E0] focus:border-amber-500 focus:outline-none transition-colors"
                  />

                  {/* Big Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] font-mono text-[#8E9299] flex items-center gap-1.5">
                      <span className="text-amber-400">💡 İpucu:</span>
                      <span>NotebookLM'deki tüm not metinlerinizi tek seferde yapıştırabilirsiniz.</span>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setMemorySearch(newContent);
                          fetchMemoryEntries();
                        }}
                        className="flex-1 sm:flex-initial bg-[#2A2D35] hover:bg-[#3A3D45] text-amber-400 border border-amber-500/40 px-5 py-2.5 rounded-lg font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
                      >
                        <Search className="w-4 h-4" />
                        <span>🔍 Hafızada Ara</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleQuickMemorySave}
                        disabled={addMemoryLoading}
                        className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
                      >
                        {addMemoryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>💾 Hafızaya Kaydet</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved Records Header & Filter Bar */}
              <div className="bg-[#1B1D23] border border-[#2A2D35] rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#2A2D35] pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>📒</span> NOT DEFTERİ & HAFIZA BANKASI ({memoryEntries.length} Not)
                    </h4>
                    {memorySearch.trim() && (
                      <p className="text-[11px] text-blue-400 font-semibold mt-0.5 flex items-center gap-1">
                        <span>🔍 Arama Filtresi:</span>
                        <span className="bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded text-[10px]">"{memorySearch}"</span>
                        <span>(Eşleşen kelimeler mavi kaplı olarak gösterilmektedir)</span>
                      </p>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-[#8E9299] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={memorySearch}
                      onChange={(e) => setMemorySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') fetchMemoryEntries();
                      }}
                      placeholder="Kelime veya cümle ara (Örn: TURBO)..."
                      className="w-full bg-[#0F1012] border border-[#2A2D35] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none min-h-[38px]"
                    />
                  </div>
                </div>

                {/* Memory List - Notebook Style */}
                {memoryLoading ? (
                  <div className="p-8 text-center text-[#8E9299] font-mono text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Hafıza defteri taranıyor...
                  </div>
                ) : memoryEntries.length === 0 ? (
                  <div className="p-8 text-center text-[#8E9299] font-mono text-xs border border-dashed border-[#2A2D35] rounded-lg">
                    {memorySearch ? `"${memorySearch}" kelimesine uygun not kaydı bulunamadı.` : 'Henüz not eklenmedi. Kutudan yapıştırıp "Hafızaya Kaydet" butonuna basın.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {memoryEntries.map((entry) => {
                      // Calculate match count if search query exists
                      let matchCount = 0;
                      if (memorySearch.trim()) {
                        const regex = new RegExp(memorySearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                        const matches = entry.content.match(regex);
                        matchCount = matches ? matches.length : 0;
                      }

                      return (
                        <div
                          key={entry.id}
                          className="bg-[#0F1012] border-l-4 border-l-amber-500 border border-[#2A2D35] hover:border-amber-500/50 rounded-lg p-3.5 space-y-2.5 flex flex-col justify-between transition-all shadow-md"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 border-b border-[#2A2D35] pb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                                  📝 NOT #{entry.id}
                                </span>
                                {matchCount > 0 && (
                                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    🔵 {matchCount} Eşleşme Bulundu
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-[#8E9299]">
                                  📅 {new Date(entry.timestamp).toLocaleDateString('tr-TR')} {new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(entry.content);
                                    setStatusMessage({ type: 'success', text: '📋 Not içeriği panoya kopyalandı!' });
                                  }}
                                  className="text-[#8E9299] hover:text-white p-1 cursor-pointer transition-colors"
                                  title="Notu Kopyala"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMemory(entry.id)}
                                  className="text-[#8E9299] hover:text-rose-400 p-1 cursor-pointer transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Compact Notebook Content Box with Internal Scrollbar */}
                            <div className="max-h-40 sm:max-h-48 overflow-y-auto p-3 rounded-md bg-[#151619] border border-[#2A2D35] text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                              {highlightText(entry.content, memorySearch)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* --- MENU 4: BÜLTEN YÜKLE / YÖNET --- */}
          {menu === "Bülten Yükle / Yönet" && (
            <div className="space-y-6">
              <div className="bg-[#1B1D23] border border-[#2A2D35] rounded-lg p-6 space-y-4">
                <div className="border-b border-[#2A2D35] pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-500" />
                    <span>Bülten Kayıt ve Güncelleme</span>
                  </h3>
                  <p className="text-xs text-[#8E9299] mt-1">
                    Veritabanında kayıtlı bülten metinlerini düzenleyin veya yenisini kaydedin.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                      Hipodrom Seçin
                    </label>
                    <select
                      value={manageHipodrom}
                      onChange={(e) => setManageHipodrom(e.target.value)}
                      className="w-full md:w-72 bg-[#0F1012] border border-[#2A2D35] text-white rounded px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[44px]"
                    >
                      {HIPODROMS.map((hip) => (
                        <option key={hip} value={hip} className="bg-[#151619]">{hip}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                      Bülten Metni
                    </label>
                    <textarea
                      rows={12}
                      value={rawBulletinText}
                      onChange={(e) => setRawBulletinText(e.target.value)}
                      placeholder="Bülten içeriğini girin..."
                      className="w-full bg-[#0F1012] border border-[#2A2D35] rounded p-3 text-xs font-mono text-[#E0E0E0] focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveBulletin}
                    disabled={saveLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                  >
                    <Database className="w-4 h-4" />
                    <span>💾 Bülteni Kaydet</span>
                  </button>
                </div>
              </div>

              {/* OCR Section */}
              <div className="bg-[#1B1D23] border border-[#2A2D35] rounded-lg p-6 space-y-4">
                <div className="border-b border-[#2A2D35] pb-3">
                  <h3 className="text-base font-bold text-amber-500 flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-500" />
                    <span>OCR Görsel Bülten Taraması</span>
                  </h3>
                </div>

                <div className="border-2 border-dashed border-[#2A2D35] rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-[#8E9299] mx-auto mb-2" />
                  <p className="text-xs text-[#8E9299] mb-3">Metin Dosyası veya Bülten Fotoğrafı Seçin (.txt, .csv, .png, .jpg vb.)</p>
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => handleFileUpload(e, 'bulletin')}
                    className="text-xs text-[#8E9299] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleRunOCR}
                  disabled={ocrLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase px-6 py-3 rounded transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Search className="w-4 h-4" />
                  <span>🔍 Görseli Metne Dönüştür</span>
                </button>

                {ocrText && (
                  <div>
                    <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">OCR Çıktısı</label>
                    <textarea
                      rows={6}
                      value={ocrText}
                      readOnly
                      className="w-full bg-[#0F1012] border border-[#2A2D35] rounded p-3 text-xs font-mono text-emerald-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- MENU 5: ÖĞRENME LOGLARI --- */}
          {menu === "Öğrenme Logları" && (
            <div className="space-y-6">
              {/* Interactive Self-Learning Trainer Form Card */}
              <div className="bg-[#1B1D23] border border-amber-500/40 rounded-xl p-4 sm:p-6 space-y-4 shadow-xl">
                <div className="border-b border-[#2A2D35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/40 text-amber-400 font-bold shrink-0">
                      🧠
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                        <span>🧠</span> KENDİ KENDİNE ÖĞRENME & YARIŞ SONUCU GİRİŞİ
                      </h3>
                      <p className="text-[11px] text-[#8E9299]">
                        Kazanan atı, geçtiği rakipleri, jokeyini, kilosunu, mesafeyi ve pisti girin; yapay zeka ikili rekabet katsayılarını otomatik güncellesin.
                      </p>
                    </div>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/40 self-start sm:self-center shrink-0">
                    ⚡ Rekabet & Sıklet Motoru
                  </span>
                </div>

                <form onSubmit={handleLearnResultSubmit} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Hipodrom & Koşu No */}
                    <div>
                      <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                        Hipodrom & Koşu No
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedHipodrom}
                          onChange={(e) => setSelectedHipodrom(e.target.value)}
                          className="w-full bg-[#0F1012] border border-[#2A2D35] text-white rounded-lg px-2.5 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[40px]"
                        >
                          {HIPODROMS.map((h) => (
                            <option key={h} value={h} className="bg-[#151619]">{h}</option>
                          ))}
                        </select>
                        <select
                          value={learnRaceNo}
                          onChange={(e) => setLearnRaceNo(Number(e.target.value))}
                          className="w-24 bg-[#0F1012] border border-[#2A2D35] text-white rounded-lg px-2 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[40px]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num} className="bg-[#151619]">{num}. Koşu</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Kazanan At */}
                    <div>
                      <label className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
                        🏆 Kazanan At
                      </label>
                      <input
                        type="text"
                        value={learnWinnerHorse}
                        onChange={(e) => setLearnWinnerHorse(e.target.value)}
                        placeholder="Örn: SHINING GLORY"
                        className="w-full bg-[#0F1012] border border-amber-500/40 text-white rounded-lg px-3 py-2 text-xs font-bold focus:border-amber-400 focus:outline-none min-h-[40px]"
                      />
                    </div>

                    {/* Geçtiği Rakipler / Atlar */}
                    <div>
                      <label className="text-[10px] text-purple-300 uppercase font-bold block mb-1">
                        🤺 Geçtiği At(lar) / Rakipler
                      </label>
                      <input
                        type="text"
                        value={learnBeatenHorses}
                        onChange={(e) => setLearnBeatenHorses(e.target.value)}
                        placeholder="Örn: KAFKAS KARTALI, TURBO KING"
                        className="w-full bg-[#0F1012] border border-purple-500/40 text-purple-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-purple-400 focus:outline-none min-h-[40px]"
                      />
                    </div>

                    {/* Jokey */}
                    <div>
                      <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                        🏇 Jokey
                      </label>
                      <input
                        type="text"
                        value={learnWinnerJockey}
                        onChange={(e) => setLearnWinnerJockey(e.target.value)}
                        placeholder="Örn: H.KARATAŞ"
                        className="w-full bg-[#0F1012] border border-[#2A2D35] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Kilo / Kg */}
                    <div>
                      <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                        ⚖️ Sıklet / Kilo (Kg)
                      </label>
                      <input
                        type="text"
                        value={learnWeight}
                        onChange={(e) => setLearnWeight(e.target.value)}
                        placeholder="Örn: 57.5"
                        className="w-full bg-[#0F1012] border border-[#2A2D35] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[40px]"
                      />
                    </div>

                    {/* Mesafe */}
                    <div>
                      <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                        📏 Mesafe
                      </label>
                      <input
                        type="text"
                        value={learnDistance}
                        onChange={(e) => setLearnDistance(e.target.value)}
                        placeholder="Örn: 1400m"
                        className="w-full bg-[#0F1012] border border-[#2A2D35] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[40px]"
                      />
                    </div>

                    {/* Pist Tipi */}
                    <div>
                      <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                        🌿 Pist Tipi
                      </label>
                      <select
                        value={learnTrackType}
                        onChange={(e) => setLearnTrackType(e.target.value)}
                        className="w-full bg-[#0F1012] border border-[#2A2D35] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[40px]"
                      >
                        <option value="Çim" className="bg-[#151619]">Çim Pist</option>
                        <option value="Kum" className="bg-[#151619]">Kum Pist</option>
                        <option value="Sentetik" className="bg-[#151619]">Sentetik Pist</option>
                      </select>
                    </div>

                    {/* Pist Durumu / Hava */}
                    <div>
                      <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">
                        🌤️ Pist Durumu / Hava
                      </label>
                      <input
                        type="text"
                        value={learnTrack}
                        onChange={(e) => setLearnTrack(e.target.value)}
                        placeholder="Örn: Normal 3.3"
                        className="w-full bg-[#0F1012] border border-[#2A2D35] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={learnLoading}
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
                    >
                      {learnLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>🧠 Sonucu Sisteme Öğret & Hafızaya Kaydet</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Learning Events History List */}
              <div className="bg-[#1B1D23] border border-[#2A2D35] rounded-xl p-4 sm:p-6 space-y-4">
                <div className="border-b border-[#2A2D35] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Sistem Öğrenme Olayları Geçmişi ({learningEvents.length} Olay)</span>
                    </h3>
                  </div>
                  <button
                    onClick={fetchLearningEvents}
                    disabled={eventsLoading}
                    className="p-2 text-[#8E9299] hover:text-white rounded border border-[#2A2D35] min-h-[38px] cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${eventsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {learningEvents.length === 0 ? (
                  <p className="text-xs text-[#8E9299] font-mono p-4 border border-dashed border-[#2A2D35] rounded-lg text-center">
                    Henüz öğrenme olayı kaydedilmedi. Yukarıdaki formdan ilk yarış sonucunu işleyebilirsiniz.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {learningEvents.map((evt) => {
                      const isExpanded = expandedLogId === evt.id;
                      const dt = evt.details || {};
                      const isResultEvent = evt.event_type === "KENDİ_KENDİNE_ÖĞRENME_YARIŞ_SONUCU";

                      return (
                        <div key={evt.id} className="bg-[#0F1012] border border-[#2A2D35] hover:border-amber-500/40 rounded-xl overflow-hidden transition-colors shadow-md">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : evt.id)}
                            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                              <span className="text-[10px] font-mono text-[#8E9299]">
                                [{new Date(evt.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}]
                              </span>
                              <span className="text-xs font-black text-amber-400 font-mono">
                                🐴 {evt.horse_name}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                isResultEvent ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-[#2A2D35] text-white'
                              }`}>
                                {evt.event_type}
                              </span>
                              {dt.hipodrom && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/20">
                                  {dt.hipodrom} {dt.kosu_no ? `${dt.kosu_no}. Koşu` : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {dt.puan_artisi && (
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                                  {dt.puan_artisi}
                                </span>
                              )}
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-[#8E9299]" /> : <ChevronRight className="w-4 h-4 text-[#8E9299]" />}
                            </div>
                          </button>

                          {/* Quick Head-to-Head & Weight/Track Badge Summary for Results */}
                          {isResultEvent && dt && (
                            <div className="px-3.5 pb-3 pt-0 border-t border-[#1B1D23] flex flex-wrap items-center gap-2 text-xs font-mono">
                              <div className="bg-[#151619] border border-[#2A2D35] px-2.5 py-1 rounded text-slate-200">
                                🏆 <span className="font-bold text-amber-400">{dt.kazanan_at || evt.horse_name}</span>
                              </div>
                              {dt.gectigi_atlar && (
                                <div className="bg-purple-950/60 border border-purple-500/40 px-2.5 py-1 rounded text-purple-200">
                                  🤺 Geçtiği Atlar: <span className="font-bold text-white">{dt.gectigi_atlar}</span>
                                </div>
                              )}
                              {dt.jokey && (
                                <div className="bg-[#151619] border border-[#2A2D35] px-2.5 py-1 rounded text-slate-300">
                                  🏇 Jokey: <span className="font-bold text-amber-300">{dt.jokey}</span>
                                </div>
                              )}
                              {dt.kilo && (
                                <div className="bg-[#151619] border border-[#2A2D35] px-2.5 py-1 rounded text-slate-300">
                                  ⚖️ Sıklet: <span className="font-bold text-white">{dt.kilo}</span>
                                </div>
                              )}
                              {dt.mesafe && (
                                <div className="bg-[#151619] border border-[#2A2D35] px-2.5 py-1 rounded text-slate-300">
                                  📏 Mesafe & Pist: <span className="font-bold text-white">{dt.mesafe} {dt.pist_tipi || ''} ({dt.pist_durumu || ''})</span>
                                </div>
                              )}
                            </div>
                          )}

                          {isExpanded && (
                            <div className="p-3 bg-[#151619] border-t border-[#2A2D35] text-xs font-mono text-emerald-400">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(evt.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* BOTTOM NAVIGATION BAR (Desktop & Mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#151619] border-t border-[#2A2D35] flex items-center justify-around z-30 px-1 shadow-lg backdrop-blur-md bg-opacity-95">
          {[
            { id: "Analiz Paneli", label: "Analiz", icon: Zap },
            { id: "Kendi Veri Bankam", label: "Hafıza", icon: BookOpen },
            { id: "Bülten Yükle / Yönet", label: "Bülten", icon: FileText },
            { id: "Öğrenme Logları", label: "Loglar", icon: Layers }
          ].map((tab) => {
            const isActive = menu === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setMenu(tab.id);
                  setStatusMessage(null);
                }}
                className={`relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
                  isActive ? "text-amber-500 font-bold" : "text-[#8E9299] hover:text-[#E0E0E0]"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-500 rounded-b-full shadow-[0_2px_8px_rgba(245,158,11,0.8)]" />
                )}
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-mono tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
