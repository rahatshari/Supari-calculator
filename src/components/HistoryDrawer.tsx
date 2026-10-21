import React, { useState } from 'react';
import { X, FolderOpen, Trash2 } from 'lucide-react';
import {
  KachaHistoryRecord,
  ShuknoHistoryRecord,
  KroyDatabase,
  AppView,
} from '../types';
import { toBnNum, formatBnDate, formatWeightKgGm } from '../utils/bengali';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  kachaHistory: KachaHistoryRecord[];
  shuknoHistory: ShuknoHistoryRecord[];
  kroyDb: KroyDatabase;
  kroyKhataEnabled: boolean;
  onLoadKacha: (record: KachaHistoryRecord) => void;
  onDeleteKacha: (id: number) => void;
  onLoadShukno: (record: ShuknoHistoryRecord) => void;
  onDeleteShukno: (id: number) => void;
  onLoadKroyDate: (dateStr: string) => void;
  onDeleteKroyDate: (dateStr: string) => void;
  initialTab?: 'kacha' | 'shukno' | 'kroy';
  currentView: AppView;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  kachaHistory,
  shuknoHistory,
  kroyDb,
  kroyKhataEnabled,
  onLoadKacha,
  onDeleteKacha,
  onLoadShukno,
  onDeleteShukno,
  onLoadKroyDate,
  onDeleteKroyDate,
  currentView,
}) => {
  const [activeTab, setActiveTab] = useState<'kacha' | 'shukno' | 'kroy'>('kacha');

  // Sync tab with current view when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      if (currentView === 'shukno') {
        setActiveTab('shukno');
      } else if (currentView === 'kroy-khata' && kroyKhataEnabled) {
        setActiveTab('kroy');
      } else {
        setActiveTab('kacha');
      }
    }
  }, [isOpen, currentView, kroyKhataEnabled]);

  if (!isOpen) return null;

  const kroyDates = Object.keys(kroyDb).sort().reverse();

  return (
    <>
      <div className="overlay show no-print" onClick={onClose} />
      <div className="drawer open no-print">
        <div className="drawer-header">
          <span>সেভ করা হিসাবের হিস্ট্রি</span>
          <button className="drawer-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="drawer-body">
          <div className="history-type-tabs">
            <button
              className={`history-type-btn ${activeTab === 'kacha' ? 'active' : ''}`}
              onClick={() => setActiveTab('kacha')}
            >
              কাঁচা-পাকা
            </button>
            <button
              className={`history-type-btn ${activeTab === 'shukno' ? 'active' : ''}`}
              onClick={() => setActiveTab('shukno')}
            >
              শুকনো সুপারি
            </button>
            {kroyKhataEnabled && (
              <button
                className={`history-type-btn ${activeTab === 'kroy' ? 'active' : ''}`}
                onClick={() => setActiveTab('kroy')}
              >
                ক্রয় খাতা
              </button>
            )}
          </div>

          <div id="historyListContainer">
            {activeTab === 'kroy' && kroyKhataEnabled && (
              <>
                {kroyDates.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 10px', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                    কোনো সংরক্ষিত ক্রয় খাতার হিসাব নেই।
                  </div>
                ) : (
                  kroyDates.map((dateStr) => {
                    const entries = kroyDb[dateStr] || [];
                    if (entries.length === 0) return null;

                    let totKuri = 0;
                    let totShuknoKg = 0;
                    let totCost = 0;
                    entries.forEach((e) => {
                      if (e.type === 'shukno') {
                        totShuknoKg += e.weightKg || 0;
                      } else {
                        totKuri += e.kuri || 0;
                      }
                      totCost += e.totalPrice || 0;
                    });

                    let detailsText = '';
                    if (totKuri > 0 && totShuknoKg > 0) {
                      detailsText = `🍃 কাঁচা: ${toBnNum(totKuri.toFixed(2))} কুড়ি | 🪵 শুকনো: ${formatWeightKgGm(totShuknoKg)}`;
                    } else if (totKuri > 0) {
                      detailsText = `🍃 কাঁচা-পাকা: ${toBnNum(totKuri.toFixed(2))} কুড়ি`;
                    } else if (totShuknoKg > 0) {
                      detailsText = `🪵 শুকনো সুপারি: ${formatWeightKgGm(totShuknoKg)}`;
                    } else {
                      detailsText = `${toBnNum(entries.length)}টি চালান`;
                    }

                    return (
                      <div className="history-item-card" key={dateStr}>
                        <div className="history-card-header">
                          <h5 className="history-title">📅 {formatBnDate(dateStr)}</h5>
                          <span className="history-date">{toBnNum(entries.length)}টি চালান</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 700, marginBottom: '3px' }}>
                          {detailsText}
                        </div>
                        <div className="history-summary">
                          দিনশেষে মোট খরচ: ৳ {toBnNum(Math.round(totCost).toLocaleString('en-IN'))}
                        </div>
                        <div className="history-card-actions">
                          <button className="btn-hist-load" onClick={() => onLoadKroyDate(dateStr)}>
                            <FolderOpen className="w-3.5 h-3.5 inline mr-1" />
                            খাতা খুলুন
                          </button>
                          <button className="btn-hist-del" onClick={() => onDeleteKroyDate(dateStr)}>
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            মুছুন
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {activeTab === 'kacha' && (
              <>
                {kachaHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 10px', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                    কোনো সংরক্ষিত কাঁচা-পাকা হিসাব নেই।
                  </div>
                ) : (
                  kachaHistory.map((item) => (
                    <div className="history-item-card" key={item.id}>
                      <div className="history-card-header">
                        <h5 className="history-title">{item.title}</h5>
                        <span className="history-date">{item.date}</span>
                      </div>
                      <div className="history-summary">সর্বমোট: ৳ {toBnNum(item.totalPrice)}</div>
                      <div className="history-card-actions">
                        <button className="btn-hist-load" onClick={() => onLoadKacha(item)}>
                          <FolderOpen className="w-3.5 h-3.5 inline mr-1" />
                          লোড
                        </button>
                        <button className="btn-hist-del" onClick={() => onDeleteKacha(item.id)}>
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                          মুছুন
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'shukno' && (
              <>
                {shuknoHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 10px', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                    কোনো সংরক্ষিত শুকনো হিসাব নেই।
                  </div>
                ) : (
                  shuknoHistory.map((item) => (
                    <div className="history-item-card" key={item.id}>
                      <div className="history-card-header">
                        <h5 className="history-title">{item.title}</h5>
                        <span className="history-date">{item.date}</span>
                      </div>
                      <div className="history-summary">সর্বমোট: ৳ {toBnNum(item.totalPrice)}</div>
                      <div className="history-card-actions">
                        <button className="btn-hist-load" onClick={() => onLoadShukno(item)}>
                          <FolderOpen className="w-3.5 h-3.5 inline mr-1" />
                          লোড
                        </button>
                        <button className="btn-hist-del" onClick={() => onDeleteShukno(item.id)}>
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                          মুছুন
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
