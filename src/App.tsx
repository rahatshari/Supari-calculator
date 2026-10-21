import React, { useState, useEffect, useCallback } from 'react';
import {
  AppView,
  KachaItem,
  KachaHistoryRecord,
  ShuknoHistoryRecord,
  KroyDatabase,
  PendingKroyItem,
} from './types';
import { getTodayDateStr, toBnNum } from './utils/bengali';
import { RenderMemoResult } from './utils/exportMemo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { KroyConfirmModal } from './components/KroyConfirmModal';
import { IosInstallModal } from './components/IosInstallModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HomeView } from './components/HomeView';
import { KachaPakaView } from './components/KachaPakaView';
import { ShuknoView } from './components/ShuknoView';
import { KroyKhataView } from './components/KroyKhataView';

const KACHA_HIST_KEY = 'supari_history_kacha';
const SHUKNO_HIST_KEY = 'supari_history_shukno';
const KROY_KHATA_DB_KEY = 'supari_kroy_khata_db';
const KROY_KHATA_ENABLED_KEY = 'supari_kroy_khata_enabled';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const App: React.FC = () => {
  // Navigation
  const [currentView, setCurrentView] = useState<AppView>('home');

  // Feature Toggle: দৈনিক সুপারি ক্রয় খাতা (Default is FALSE / OFF)
  const [kroyKhataEnabled, setKroyKhataEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(KROY_KHATA_ENABLED_KEY);
      return saved === 'true'; // Default is false if null or not 'true'
    } catch {
      return false;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Kacha State
  const [kachaItems, setKachaItems] = useState<KachaItem[]>(() => {
    try {
      const saved = localStorage.getItem('kacha_draft_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [kachaGhaRule, setKachaGhaRule] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kacha_gha_rule');
      return saved ? parseInt(saved, 10) : 21;
    } catch {
      return 21;
    }
  });

  // Shukno State
  const [shuknoBags, setShuknoBags] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('shukno_draft_state');
      if (saved) {
        const state = JSON.parse(saved);
        return state.bags || [];
      }
    } catch {}
    return [];
  });

  const [shuknoBaseRule, setShuknoBaseRule] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('shukno_draft_state');
      if (saved) {
        const state = JSON.parse(saved);
        return state.rule || 82;
      }
    } catch {}
    return 82;
  });

  const [shuknoPricePerHajar, setShuknoPricePerHajar] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('shukno_draft_state');
      if (saved) {
        const state = JSON.parse(saved);
        return state.rate || '';
      }
    } catch {}
    return '';
  });

  const [shuknoDeductedEmptyKg, setShuknoDeductedEmptyKg] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('shukno_draft_state');
      if (saved) {
        const state = JSON.parse(saved);
        return state.deductedEmptyKg || 0;
      }
    } catch {}
    return 0;
  });

  // Kroy Khata Database & Active Date
  const [activeKroyDate, setActiveKroyDate] = useState<string>(getTodayDateStr());
  const [kroyDb, setKroyDb] = useState<KroyDatabase>(() => {
    try {
      const saved = localStorage.getItem(KROY_KHATA_DB_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // History State
  const [kachaHistory, setKachaHistory] = useState<KachaHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(KACHA_HIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shuknoHistory, setShuknoHistory] = useState<ShuknoHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SHUKNO_HIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | React.ReactNode | null>(null);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onOk: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onOk: () => {},
  });

  const [pendingKroyItem, setPendingKroyItem] = useState<PendingKroyItem | null>(null);
  const [imagePreviewData, setImagePreviewData] = useState<RenderMemoResult | null>(null);
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  // Toast helper
  const showToast = useCallback((msg: string | React.ReactNode) => {
    setToastMessage(msg);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    setToastTimer(timer);
  }, [toastTimer]);

  // Handle Feature Toggle
  const handleToggleKroyKhata = (enabled: boolean) => {
    setKroyKhataEnabled(enabled);
    localStorage.setItem(KROY_KHATA_ENABLED_KEY, String(enabled));
    if (enabled) {
      showToast('✅ দৈনিক সুপারি ক্রয় খাতা সক্রিয় করা হয়েছে');
    } else {
      showToast('ℹ️ দৈনিক সুপারি ক্রয় খাতা বন্ধ করা হয়েছে');
      if (currentView === 'kroy-khata') {
        navigate('home');
      }
    }
  };

  // Sync Drafts
  useEffect(() => {
    localStorage.setItem('kacha_draft_items', JSON.stringify(kachaItems));
  }, [kachaItems]);

  useEffect(() => {
    localStorage.setItem('kacha_gha_rule', kachaGhaRule.toString());
  }, [kachaGhaRule]);

  useEffect(() => {
    localStorage.setItem(
      'shukno_draft_state',
      JSON.stringify({
        bags: shuknoBags,
        rule: shuknoBaseRule,
        rate: shuknoPricePerHajar,
        deductedEmptyKg: shuknoDeductedEmptyKg,
      })
    );
  }, [shuknoBags, shuknoBaseRule, shuknoPricePerHajar, shuknoDeductedEmptyKg]);

  useEffect(() => {
    localStorage.setItem(KROY_KHATA_DB_KEY, JSON.stringify(kroyDb));
  }, [kroyDb]);

  useEffect(() => {
    localStorage.setItem(KACHA_HIST_KEY, JSON.stringify(kachaHistory));
  }, [kachaHistory]);

  useEffect(() => {
    localStorage.setItem(SHUKNO_HIST_KEY, JSON.stringify(shuknoHistory));
  }, [shuknoHistory]);

  // URL Hash routing
  const navigate = useCallback((view: AppView, updateHash = true) => {
    if (view === 'kroy-khata' && !kroyKhataEnabled) {
      showToast('ℹ️ দৈনিক সুপারি ক্রয় খাতা বন্ধ আছে, সেটিংস থেকে চালু করুন');
      setCurrentView('home');
      if (updateHash) window.location.hash = '#home';
      return;
    }
    setCurrentView(view);
    if (updateHash) {
      window.location.hash = view === 'home' ? '#home' : `#${view}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [kroyKhataEnabled, showToast]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#kacha-paka') setCurrentView('kacha-paka');
      else if (hash === '#shukno') setCurrentView('shukno');
      else if (hash === '#kroy-khata') {
        if (kroyKhataEnabled) {
          setCurrentView('kroy-khata');
        } else {
          setCurrentView('home');
        }
      } else {
        setCurrentView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [kroyKhataEnabled]);

  // PWA & Connectivity listeners
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true) ||
      (document.referrer && document.referrer.includes('android-app://'));

    const isInstalled = localStorage.getItem('pwa_installed') === 'true';

    if (!isStandalone && !isInstalled) {
      setCanInstall(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandalone) {
        setCanInstall(true);
      }
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      localStorage.setItem('pwa_installed', 'true');
      setDeferredPrompt(null);
      showToast('🎉 অ্যাপটি সফলভাবে আপনার ডিভাইসে ইনস্টল হয়েছে!');
    };

    const handleOnline = () => showToast('🌐 ইন্টারনেট সংযোগ ফিরে এসেছে');
    const handleOffline = () => showToast('📶 অফলাইন মোড সক্রিয়: নেট ছাড়া হিসাব চলবে');

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ensure any stale service workers are cleared to avoid cache lockups
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setCanInstall(false);
          localStorage.setItem('pwa_installed', 'true');
          showToast('✅ অ্যাপ ইনস্টল করা হচ্ছে...');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn(err);
      }
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
      if (isIos) {
        setIsIosModalOpen(true);
      } else {
        showToast('ℹ️ ব্রাউজারের মেনু (⋮ বা Share) থেকে "Install app" বা "Add to Home screen" চাপুন');
      }
    }
  };

  // History operations
  const handleSaveKachaHistory = (itemsToSave: KachaItem[], rule: number, grandTotal: string) => {
    if (itemsToSave.length === 0) {
      showToast('⚠️ সেভ করার জন্য কোনো হিসাব নেই');
      return;
    }
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const dateStr = toBnNum(new Date().toLocaleDateString('bn-BD', dateOptions));

    const record: KachaHistoryRecord = {
      id: Date.now(),
      title: `কাঁচা-পাকা (${toBnNum(kachaHistory.length + 1)})`,
      date: dateStr,
      items: JSON.parse(JSON.stringify(itemsToSave)),
      rule,
      totalPrice: grandTotal,
    };

    setKachaHistory((prev) => [record, ...prev]);
    showToast('💾 হিসাব হিস্ট্রিতে সেভ করা হয়েছে!');
  };

  const handleSaveShuknoHistory = (
    bagsToSave: number[],
    rule: number,
    priceHajar: string,
    emptyBagKg: number,
    totalPrice: string
  ) => {
    if (bagsToSave.length === 0) {
      showToast('⚠️ সেভ করার জন্য কোনো হিসাব নেই');
      return;
    }
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const dateStr = toBnNum(new Date().toLocaleDateString('bn-BD', dateOptions));

    const record: ShuknoHistoryRecord = {
      id: Date.now(),
      title: `শুকনো সুপারি (${toBnNum(shuknoHistory.length + 1)})`,
      date: dateStr,
      bags: [...bagsToSave],
      rule,
      pricePerHajar: priceHajar,
      emptyBagKg,
      totalPrice,
    };

    setShuknoHistory((prev) => [record, ...prev]);
    showToast('💾 শুকনো সুপারি হিসাব হিস্ট্রিতে সেভ করা হয়েছে!');
  };

  const handleLoadKacha = (record: KachaHistoryRecord) => {
    setKachaItems(JSON.parse(JSON.stringify(record.items)));
    setKachaGhaRule(record.rule || 21);
    setIsHistoryOpen(false);
    navigate('kacha-paka');
    showToast('✅ কাঁচা-পাকা হিসাব লোড করা হয়েছে');
  };

  const handleDeleteKacha = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'হিসাব মুছুন',
      message: 'আপনি কি নিশ্চিত যে এই হিস্ট্রি রেকর্ডটি মুছে ফেলতে চান?',
      onOk: () => {
        setKachaHistory((prev) => prev.filter((i) => i.id !== id));
        showToast('🗑️ হিসাবটি মুছে ফেলা হয়েছে');
      },
    });
  };

  const handleLoadShukno = (record: ShuknoHistoryRecord) => {
    setShuknoBags([...record.bags]);
    setShuknoBaseRule(record.rule || 82);
    setShuknoPricePerHajar(record.pricePerHajar || '');
    setShuknoDeductedEmptyKg(record.emptyBagKg || 0);
    setIsHistoryOpen(false);
    navigate('shukno');
    showToast('✅ শুকনো সুপারি হিসাব লোড করা হয়েছে');
  };

  const handleDeleteShukno = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'হিসাব মুছুন',
      message: 'আপনি কি নিশ্চিত যে এই হিস্ট্রি রেকর্ডটি মুছে ফেলতে চান?',
      onOk: () => {
        setShuknoHistory((prev) => prev.filter((i) => i.id !== id));
        showToast('🗑️ হিসাবটি মুছে ফেলা হয়েছে');
      },
    });
  };

  const handleLoadKroyDate = (dateStr: string) => {
    if (!kroyKhataEnabled) {
      showToast('ℹ️ দৈনিক সুপারি ক্রয় খাতা বন্ধ আছে, সেটিংস থেকে চালু করুন');
      return;
    }
    setActiveKroyDate(dateStr);
    setIsHistoryOpen(false);
    navigate('kroy-khata');
    showToast(`📅 খাতা লোড করা হয়েছে`);
  };

  const handleDeleteKroyDate = (dateStr: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'খাতা মুছুন',
      message: `${dateStr}-এর সম্পূর্ণ ক্রয় হিসাব কি মুছে ফেলতে চান?`,
      onOk: () => {
        setKroyDb((prev) => {
          const copy = { ...prev };
          delete copy[dateStr];
          return copy;
        });
        showToast('🗑️ ক্রয় খাতা রেকর্ড মুছে ফেলা হয়েছে');
      },
    });
  };

  // Confirm addition to Kroy Khata from modal
  const handleConfirmSaveToKroy = (sellerName: string) => {
    if (!pendingKroyItem) return;
    const today = getTodayDateStr();

    const newEntry = {
      id: Date.now(),
      time: toBnNum(new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })),
      seller: sellerName || 'সাধারণ বিক্রেতা',
      type: pendingKroyItem.type,
      qtyText: pendingKroyItem.qtyText,
      kuri: pendingKroyItem.kuri || 0,
      bags: pendingKroyItem.bags || 1,
      weightKg: pendingKroyItem.weightKg || 0,
      rule: pendingKroyItem.rule,
      ruleText: pendingKroyItem.ruleText,
      hajarShotokText: pendingKroyItem.hajarShotokText,
      rate: pendingKroyItem.rate,
      rateText: pendingKroyItem.rateText,
      totalPrice: pendingKroyItem.totalPrice,
    };

    setKroyDb((prev) => ({
      ...prev,
      [today]: [...(prev[today] || []), newEntry],
    }));

    setPendingKroyItem(null);
    showToast(
      <span>
        🛒 আজকের ক্রয় খাতায় জমা হয়েছে! (মোট: ৳ {toBnNum(newEntry.totalPrice.toFixed(0))}){' '}
        <button
          onClick={() => navigate('kroy-khata')}
          style={{
            marginLeft: '6px',
            background: '#ffffff',
            color: '#065f46',
            border: 'none',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          খাতা দেখুন ➔
        </button>
      </span>
    );
  };

  return (
    <div className="app-wrapper">
      <Header
        currentView={currentView}
        onNavigate={navigate}
        canInstall={canInstall}
        onInstall={handleInstallClick}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {currentView === 'home' && (
        <HomeView
          onNavigate={navigate}
          canInstall={canInstall}
          onInstall={handleInstallClick}
          kroyKhataEnabled={kroyKhataEnabled}
        />
      )}

      {currentView === 'kacha-paka' && (
        <KachaPakaView
          items={kachaItems}
          setItems={setKachaItems}
          ghaRule={kachaGhaRule}
          setGhaRule={setKachaGhaRule}
          kroyKhataEnabled={kroyKhataEnabled}
          onOpenConfirmModal={(title, msg, onOk) =>
            setConfirmModal({ isOpen: true, title, message: msg, onOk })
          }
          onToast={showToast}
          onSaveHistory={handleSaveKachaHistory}
          onOpenKroyAddModal={(item) => setPendingKroyItem(item)}
          onShowImagePreview={(data) => setImagePreviewData(data)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {currentView === 'shukno' && (
        <ShuknoView
          bags={shuknoBags}
          setBags={setShuknoBags}
          baseRule={shuknoBaseRule}
          setBaseRule={setShuknoBaseRule}
          pricePerHajar={shuknoPricePerHajar}
          setPricePerHajar={setShuknoPricePerHajar}
          deductedEmptyKg={shuknoDeductedEmptyKg}
          setDeductedEmptyKg={setShuknoDeductedEmptyKg}
          kroyKhataEnabled={kroyKhataEnabled}
          onOpenConfirmModal={(title, msg, onOk) =>
            setConfirmModal({ isOpen: true, title, message: msg, onOk })
          }
          onToast={showToast}
          onSaveHistory={handleSaveShuknoHistory}
          onOpenKroyAddModal={(item) => setPendingKroyItem(item)}
          onShowImagePreview={(data) => setImagePreviewData(data)}
        />
      )}

      {currentView === 'kroy-khata' && (
        <KroyKhataView
          kroyDb={kroyDb}
          setKroyDb={setKroyDb}
          activeDate={activeKroyDate}
          setActiveDate={setActiveKroyDate}
          onOpenConfirmModal={(title, msg, onOk) =>
            setConfirmModal({ isOpen: true, title, message: msg, onOk })
          }
          onToast={showToast}
          onShowImagePreview={(data) => setImagePreviewData(data)}
        />
      )}

      <Footer />

      {/* Global Modals & Notifications */}
      <Toast message={toastMessage} />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onOk();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ImagePreviewModal
        data={imagePreviewData}
        onClose={() => setImagePreviewData(null)}
        onToast={showToast}
      />

      {pendingKroyItem && (
        <KroyConfirmModal
          pendingItem={pendingKroyItem}
          onConfirm={handleConfirmSaveToKroy}
          onCancel={() => setPendingKroyItem(null)}
        />
      )}

      <IosInstallModal
        isOpen={isIosModalOpen}
        onClose={() => setIsIosModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        kroyKhataEnabled={kroyKhataEnabled}
        onToggleKroyKhata={handleToggleKroyKhata}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        kachaHistory={kachaHistory}
        shuknoHistory={shuknoHistory}
        kroyDb={kroyDb}
        kroyKhataEnabled={kroyKhataEnabled}
        onLoadKacha={handleLoadKacha}
        onDeleteKacha={handleDeleteKacha}
        onLoadShukno={handleLoadShukno}
        onDeleteShukno={handleDeleteShukno}
        onLoadKroyDate={handleLoadKroyDate}
        onDeleteKroyDate={handleDeleteKroyDate}
        currentView={currentView}
      />
    </div>
  );
};
