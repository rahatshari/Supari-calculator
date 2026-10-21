import React, { useState } from 'react';
import { ShoppingCart, Edit2, Trash2, Copy, Image, Printer, Save } from 'lucide-react';
import { KachaItem, PendingKroyItem } from '../types';
import {
  toBnNum,
  parseBnFloat,
  cleanBnInput,
} from '../utils/bengali';
import { copyToClipboard, renderMemoHtmlToImage, RenderMemoResult } from '../utils/exportMemo';
import { CreatorBadge, getCreatorBadgeHtml } from './CreatorBadge';

interface KachaPakaViewProps {
  items: KachaItem[];
  setItems: React.Dispatch<React.SetStateAction<KachaItem[]>>;
  ghaRule: number;
  setGhaRule: (rule: number) => void;
  kroyKhataEnabled: boolean;
  onOpenConfirmModal: (title: string, msg: string, onOk: () => void) => void;
  onToast: (msg: string) => void;
  onSaveHistory: (items: KachaItem[], rule: number, grandTotal: string) => void;
  onOpenKroyAddModal: (item: PendingKroyItem) => void;
  onShowImagePreview: (data: RenderMemoResult) => void;
  onOpenSettings?: () => void;
}

const tiPerGha = 10;

export const KachaPakaView: React.FC<KachaPakaViewProps> = ({
  items,
  setItems,
  ghaRule,
  setGhaRule,
  kroyKhataEnabled,
  onOpenConfirmModal,
  onToast,
  onSaveHistory,
  onOpenKroyAddModal,
  onShowImagePreview,
  onOpenSettings,
}) => {
  const [subtab, setSubtab] = useState<'main' | 'rate'>('main');

  // Input states for main calculation
  const [inputKuri, setInputKuri] = useState('');
  const [inputGha, setInputGha] = useState('');
  const [inputTi, setInputTi] = useState('');
  const [inputRate, setInputRate] = useState('');
  const [recentBanner, setRecentBanner] = useState<string | null>(null);

  // Rate checker inputs
  const [rateCheckRule, setRateCheckRule] = useState(21);
  const [findKuri, setFindKuri] = useState('');
  const [findGha, setFindGha] = useState('');
  const [findTi, setFindTi] = useState('');
  const [findPrice, setFindPrice] = useState('');
  const [rateCheckResult, setRateCheckResult] = useState<{
    pricePerKuri: number;
    pricePerGha: number;
    totalTi: number;
    totalKuri: number;
    totalPrice: number;
    qtyText: string;
  } | null>(null);

  // Live Gha Rate Calculation
  const currentRateVal = parseBnFloat(inputRate);
  const liveGhaRate = currentRateVal > 0 ? (currentRateVal / ghaRule).toFixed(2) : null;

  // Add Item
  const handleAddItem = () => {
    const kuri = parseBnFloat(inputKuri);
    const gha = parseBnFloat(inputGha);
    const ti = parseBnFloat(inputTi);
    const rate = parseBnFloat(inputRate);

    const tiPerKuri = ghaRule * tiPerGha;
    const totalTi = kuri * tiPerKuri + gha * tiPerGha + ti;

    if (totalTi <= 0 || rate <= 0) {
      onToast('⚠️ সঠিক পরিমাণ ও প্রতি কুড়ির দর (টাকা) লিখুন');
      return;
    }

    const totalKuri = totalTi / tiPerKuri;
    const totalPrice = Math.round(totalKuri * rate * 100) / 100;
    const ghaRateVal = rate / ghaRule;

    const parts: string[] = [];
    if (kuri > 0) parts.push(`${toBnNum(kuri)} কুড়ি`);
    if (gha > 0) parts.push(`${toBnNum(gha)} ঘা`);
    if (ti > 0) parts.push(`${toBnNum(ti)} টি`);
    const qtyString = parts.length > 0 ? parts.join(' ') : `${toBnNum(totalTi)} টি`;

    const newItem: KachaItem = {
      kuri,
      gha,
      ti,
      totalTi,
      totalKuri,
      rate,
      ghaRate: ghaRateVal,
      totalPrice,
      qtyString,
    };

    setItems((prev) => [...prev, newItem]);
    setRecentBanner(
      `সর্বশেষ যোগ: <strong>${qtyString}</strong> | কুড়ির দর: <strong>${toBnNum(rate)} ৳</strong> (প্রতি ঘা: <strong>৳ ${toBnNum(ghaRateVal.toFixed(2))}</strong>) <br>মোট: <strong>৳ ${toBnNum(totalPrice.toFixed(2))}</strong>`
    );

    setInputKuri('');
    setInputGha('');
    setInputTi('');
    setInputRate('');
    onToast('✅ কাঁচা-পাকা হিসাব যোগ করা হয়েছে');
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    setInputKuri(item.kuri > 0 ? toBnNum(item.kuri) : '');
    setInputGha(item.gha > 0 ? toBnNum(item.gha) : '');
    setInputTi(item.ti > 0 ? toBnNum(item.ti) : '');
    setInputRate(item.rate > 0 ? toBnNum(item.rate) : '');

    setItems((prev) => prev.filter((_, i) => i !== index));
    setRecentBanner(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
    onToast('✏️ পরিবর্তনের জন্য ইনপুট বক্সে নেওয়া হয়েছে');
  };

  const handleDeleteItem = (index: number) => {
    onOpenConfirmModal('আইটেম মুছুন', 'আপনি কি নিশ্চিত যে এই হিসাবটি তালিকা থেকে মুছতে চান?', () => {
      setItems((prev) => prev.filter((_, i) => i !== index));
      setRecentBanner(null);
      onToast('🗑️ হিসাবটি মুছে ফেলা হয়েছে');
    });
  };

  const handleResetReport = () => {
    if (items.length === 0) {
      onToast('ℹ️ রিপোর্ট ইতিমধ্যে ফাঁকা আছে');
      return;
    }
    onOpenConfirmModal('রিপোর্ট মুছুন', 'আপনি কি নিশ্চিত যে সম্পূর্ণ কাঁচা-পাকা সুপারি রিপোর্ট মুছে ফেলতে চান?', () => {
      setItems([]);
      setRecentBanner(null);
      onToast('🗑️ সম্পূর্ণ রিপোর্ট মুছে ফেলা হয়েছে');
    });
  };

  // Calculations for summary
  let totalTi = 0;
  let totalKuri = 0;
  let grandTotal = 0;
  items.forEach((item) => {
    totalTi += item.totalTi;
    totalKuri += item.totalKuri;
    grandTotal += item.totalPrice;
  });

  const tiPerKuri = ghaRule * tiPerGha;
  const finalKuri = Math.floor(totalTi / tiPerKuri);
  const remAfterKuri = totalTi % tiPerKuri;
  const finalGha = Math.floor(remAfterKuri / tiPerGha);
  const finalTi = remAfterKuri % tiPerGha;

  const finalQtyParts: string[] = [];
  if (finalKuri > 0) finalQtyParts.push(`${toBnNum(finalKuri)} কুড়ি`);
  if (finalGha > 0) finalQtyParts.push(`${toBnNum(finalGha)} ঘা`);
  if (finalTi > 0) finalQtyParts.push(`${toBnNum(finalTi)} টি`);
  const finalQtyText = finalQtyParts.length > 0 ? finalQtyParts.join(' ') : '০ কুড়ি';
  const avgGhaRate = totalKuri > 0 ? grandTotal / totalKuri / ghaRule : 0;

  const handleCopyReport = async () => {
    if (items.length === 0) return;
    const dateStr = toBnNum(
      new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    );
    let text = '--- কাঁচা-পাকা সুপারি হিসাব রসিদ ---\n';
    text += `তারিখ: ${dateStr}\n`;
    text += `হিসাবের নিয়ম: ${toBnNum(ghaRule)} ঘা = ১ কুড়ি\n\n`;
    items.forEach((item, i) => {
      const itemGhaRate = item.ghaRate || item.rate / ghaRule;
      text += `${toBnNum(i + 1)}. ${item.qtyString} | দর: ${toBnNum(item.rate)} ৳ / কুড়ি (১ ঘা = ${toBnNum(itemGhaRate.toFixed(2))} ৳) | দাম: ${toBnNum(item.totalPrice.toFixed(2))} ৳\n`;
    });
    text += `\nসর্বমোট সুপারি: ${finalQtyText}\n`;
    text += `প্রতি ঘায়ের গড় দাম: ৳ ${toBnNum(avgGhaRate.toFixed(2))}\n`;
    text += `সর্বমোট দাম: ৳ ${toBnNum(grandTotal.toFixed(2))}\n`;
    text += `\nCreated by Rahat Sharif\n`;

    const ok = await copyToClipboard(text);
    if (ok) onToast('📋 কাঁচা-পাকা রসিদ কপি হয়েছে!');
  };

  const handlePrint = () => {
    if (items.length === 0) return;
    document.body.classList.add('printing-kacha');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-kacha');
    }, 500);
  };

  const buildKachaMemoHtml = () => {
    const totalEntries = items.length;
    const dateStr = toBnNum(
      new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );

    let numCols = 1;
    let memoWidth = 780;
    if (totalEntries > 80) {
      numCols = 4;
      memoWidth = 860;
    } else if (totalEntries > 36) {
      numCols = 3;
      memoWidth = 800;
    } else if (totalEntries > 14) {
      numCols = 2;
      memoWidth = 780;
    }

    let tableHtml = '';
    if (numCols === 1) {
      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13.5px; font-family: 'Noto Sans Bengali', sans-serif;">
          <thead>
            <tr style="background: #f1f5f9; border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-weight: 700;">
              <th style="padding: 9px 8px; text-align: center; width: 44px;">নং</th>
              <th style="padding: 9px 8px; text-align: center;">পরিমাণ</th>
              <th style="padding: 9px 8px; text-align: center;">দর (কুড়ি / ঘা)</th>
              <th style="padding: 9px 8px; text-align: right; width: 110px;">মোট টাকা (৳)</th>
            </tr>
          </thead>
          <tbody>
      `;
      items.forEach((item, idx) => {
        const itemGhaRate = item.ghaRate || item.rate / ghaRule;
        tableHtml += `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
            <td style="padding: 8px 6px; text-align: center; font-weight: 700; color: #64748b;">${toBnNum(idx + 1)}</td>
            <td style="padding: 8px 6px; text-align: center; font-weight: 600;">${item.qtyString}</td>
            <td style="padding: 8px 6px; text-align: center;">
              <div style="font-weight: 700; color: #0f172a;">${toBnNum(item.rate)} ৳ / কুড়ি</div>
              <div style="font-size: 11px; color: #047857; font-weight: 700;">(১ ঘা = ৳ ${toBnNum(itemGhaRate.toFixed(2))})</div>
            </td>
            <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #047857;">৳ ${toBnNum(item.totalPrice.toFixed(2))}</td>
          </tr>
        `;
      });
      tableHtml += `</tbody></table>`;
    } else {
      const rowsPerCol = Math.ceil(totalEntries / numCols);
      tableHtml = `<div style="display: flex; gap: 8px; margin-bottom: 16px; font-family: 'Noto Sans Bengali', sans-serif;">`;
      for (let c = 0; c < numCols; c++) {
        const startIdx = c * rowsPerCol;
        const endIdx = Math.min(startIdx + rowsPerCol, totalEntries);
        if (startIdx >= totalEntries) break;

        tableHtml += `
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; font-size: ${numCols >= 3 ? '10.5px' : '12px'};">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-weight: 700;">
                  <th style="padding: 5px 2px; text-align: center; width: 26px;">নং</th>
                  <th style="padding: 5px 2px; text-align: center;">পরিমাণ</th>
                  <th style="padding: 5px 2px; text-align: center;">দর</th>
                  <th style="padding: 5px 2px; text-align: right;">মোট (৳)</th>
                </tr>
              </thead>
              <tbody>
        `;
        for (let i = startIdx; i < endIdx; i++) {
          const item = items[i];
          const itemGhaRate = item.ghaRate || item.rate / ghaRule;
          tableHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9; ${i % 2 === 1 ? 'background: #f8fafc;' : ''}">
              <td style="padding: 4px 2px; text-align: center; font-weight: 700; color: #64748b;">${toBnNum(i + 1)}</td>
              <td style="padding: 4px 2px; text-align: center; font-weight: 600;">${item.qtyString}</td>
              <td style="padding: 4px 2px; text-align: center; font-size: ${numCols >= 3 ? '9.5px' : '11px'};">
                <div>${toBnNum(item.rate)} ৳</div>
                <div style="color: #047857; font-weight: 700;">(১ ঘা: ৳ ${toBnNum(itemGhaRate.toFixed(2))})</div>
              </td>
              <td style="padding: 4px 2px; text-align: right; font-weight: 700; color: #047857;">৳ ${toBnNum(item.totalPrice.toFixed(2))}</td>
            </tr>
          `;
        }
        tableHtml += `</tbody></table></div>`;
      }
      tableHtml += `</div>`;
    }

    return `
      <div style="width: ${memoWidth}px; background: #ffffff; padding: 24px 28px; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; color: #0f172a;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
          <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">কাঁচা-পাকা সুপারি বিক্রির রসিদ</h2>
          <div style="font-size: 13.5px; color: #475569; font-weight: 600;">
            তারিখ: <span style="color: #0f172a; font-weight: 700;">${dateStr}</span> | হিসাবের নিয়ম: <span style="color: #047857; font-weight: 700;">${toBnNum(ghaRule)} ঘা = ১ কুড়ি</span>
          </div>
        </div>

        ${tableHtml}

        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; font-size: 14px; font-weight: 600;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>মোট এন্ট্রি:</span>
            <strong style="color: #0f172a; font-size: 15px;">${toBnNum(totalEntries)}টি</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #065f46;">
            <span>সর্বমোট সুপারি:</span>
            <strong style="font-size: 16px;">${finalQtyText}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #475569;">
            <span>মোট কুড়ি (দশমিক):</span>
            <strong>${toBnNum(totalKuri.toFixed(2))}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #047857;">
            <span>প্রতি ঘায়ের গড় দাম:</span>
            <strong>৳ ${toBnNum(avgGhaRate.toFixed(2))}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px dashed #cbd5e1; font-size: 20px; font-weight: 800; color: #047857;">
            <span>সর্বমোট দাম:</span>
            <span>৳ ${toBnNum(grandTotal.toFixed(2))}</span>
          </div>
        </div>

        ${getCreatorBadgeHtml()}
      </div>
    `;
  };

  const handleDownloadJPG = async () => {
    if (items.length === 0) {
      onToast('⚠️ সেভ করার জন্য কোনো হিসাব নেই');
      return;
    }
    const totalEntries = items.length;
    let memoWidth = 780;
    if (totalEntries > 80) memoWidth = 860;
    else if (totalEntries > 36) memoWidth = 800;

    onToast('⏳ মেমো ছবি তৈরি হচ্ছে...');
    try {
      const html = buildKachaMemoHtml();
      const res = await renderMemoHtmlToImage(html, 'Kacha_Paka_Supari_Memo.jpg', memoWidth);
      onShowImagePreview(res);
      onToast('🖼️ JPG রসিদ প্রস্তুত হয়েছে!');
    } catch {
      onToast('⚠️ মেমো ছবি তৈরিতে সমস্যা হয়েছে');
    }
  };

  // Add Item to Kroy Khata modal from Main summary
  const handleOpenKroyFromSummary = () => {
    if (items.length === 0) {
      onToast('⚠️ ক্রয় খাতায় যোগ করার মতো কোনো হিসাব নেই');
      return;
    }
    const avgRate = totalKuri > 0 ? grandTotal / totalKuri : 0;
    onOpenKroyAddModal({
      type: 'kacha',
      qtyText: finalQtyText,
      kuri: totalKuri,
      rule: ghaRule,
      ruleText: `${toBnNum(ghaRule)} ঘা = ১ কুড়ি`,
      rate: avgRate,
      rateText: `গড় দর: ৳ ${toBnNum(Math.round(avgRate))} / কুড়ি (${toBnNum(ghaRule)} ঘা)`,
      totalPrice: grandTotal,
    });
  };

  const handleOpenKroyFromSingleItem = (item: KachaItem) => {
    onOpenKroyAddModal({
      type: 'kacha',
      qtyText: item.qtyString,
      kuri: item.totalKuri,
      rule: ghaRule,
      ruleText: `${toBnNum(ghaRule)} ঘা = ১ কুড়ি`,
      rate: item.rate,
      rateText: `দর: ৳ ${toBnNum(item.rate)} / কুড়ি (${toBnNum(ghaRule)} ঘা)`,
      totalPrice: item.totalPrice,
    });
  };

  // Rate Checker Logic
  const handleCalculateRate = () => {
    const kuri = parseBnFloat(findKuri);
    const gha = parseBnFloat(findGha);
    const ti = parseBnFloat(findTi);
    const price = parseBnFloat(findPrice);

    const totalTiVal = kuri * rateCheckRule * tiPerGha + gha * tiPerGha + ti;
    if (totalTiVal <= 0 || price <= 0) {
      onToast('⚠️ সঠিক পরিমাণ ও মোট দাম দিন');
      return;
    }

    const pricePerTi = price / totalTiVal;
    const pricePerGha = pricePerTi * tiPerGha;
    const pricePerKuri = pricePerTi * (rateCheckRule * tiPerGha);
    const totalKuriVal = totalTiVal / (rateCheckRule * tiPerGha);

    const parts: string[] = [];
    if (kuri > 0) parts.push(`${toBnNum(kuri)} কুড়ি`);
    if (gha > 0) parts.push(`${toBnNum(gha)} ঘা`);
    if (ti > 0) parts.push(`${toBnNum(ti)} টি`);
    const qtyText = parts.length > 0 ? parts.join(' ') : `${toBnNum(totalTiVal)} টি`;

    setRateCheckResult({
      pricePerKuri,
      pricePerGha,
      totalTi: totalTiVal,
      totalKuri: totalKuriVal,
      totalPrice: price,
      qtyText,
    });
    onToast('✅ ১ কুড়ির দর বের করা হয়েছে');
  };

  const handleClearRateFields = () => {
    setFindKuri('');
    setFindGha('');
    setFindTi('');
    setFindPrice('');
    setRateCheckResult(null);
  };

  // Forward calculated rate lot to Kroy Khata
  const handleOpenKroyFromRateCheck = () => {
    if (!rateCheckResult) return;
    onOpenKroyAddModal({
      type: 'kacha',
      qtyText: rateCheckResult.qtyText,
      kuri: rateCheckResult.totalKuri,
      rule: rateCheckRule,
      ruleText: `${toBnNum(rateCheckRule)} ঘা = ১ কুড়ি`,
      rate: rateCheckResult.pricePerKuri,
      rateText: `যাচাইকৃত দর: ৳ ${toBnNum(Math.round(rateCheckResult.pricePerKuri))} / কুড়ি (${toBnNum(rateCheckRule)} ঘা)`,
      totalPrice: rateCheckResult.totalPrice,
    });
  };

  // Add verified rate lot directly into Main Kacha Calculator list
  const handleAddRateCheckToMainList = () => {
    if (!rateCheckResult) return;
    const kuri = parseBnFloat(findKuri);
    const gha = parseBnFloat(findGha);
    const ti = parseBnFloat(findTi);
    const rate = Math.round(rateCheckResult.pricePerKuri);
    const ghaRateVal = rateCheckResult.pricePerGha;
    const totalPrice = rateCheckResult.totalPrice;

    const newItem: KachaItem = {
      id: Date.now(),
      kuri,
      gha,
      ti,
      totalTi: rateCheckResult.totalTi,
      totalKuri: rateCheckResult.totalKuri,
      rate,
      ghaRate: ghaRateVal,
      totalPrice,
      qtyString: rateCheckResult.qtyText,
    };

    setItems((prev) => [...prev, newItem]);
    setRecentBanner(
      `দর যাচাই থেকে যোগ: <strong>${rateCheckResult.qtyText}</strong> | দর: <strong>${toBnNum(rate)} ৳</strong> (প্রতি ঘা: <strong>৳ ${toBnNum(ghaRateVal.toFixed(2))}</strong>) <br>মোট: <strong>৳ ${toBnNum(totalPrice.toFixed(2))}</strong>`
    );
    setInputKuri('');
    setInputGha('');
    setInputTi('');
    setInputRate('');
    setSubtab('main');
    window.scrollTo({ top: 120, behavior: 'smooth' });
    onToast('✅ দর যাচাইকৃত হিসাবটি কাঁচা-পাকা মূল তালিকায় যোগ হয়েছে');
  };

  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedToday = toBnNum(new Date().toLocaleDateString('bn-BD', dateOptions));

  return (
    <div className="view-panel active">
      {/* Subtabs */}
      <div className="segmented-tabs no-print">
        <button
          className={`tab-item ${subtab === 'main' ? 'active' : ''}`}
          onClick={() => setSubtab('main')}
        >
          মূল হিসাব
        </button>
        <button
          className={`tab-item ${subtab === 'rate' ? 'active' : ''}`}
          onClick={() => setSubtab('rate')}
        >
          দর যাচাই
        </button>
      </div>

      {/* Subtab 1: Main Calculation */}
      {subtab === 'main' && (
        <div>
          <div className="settings-bar no-print">
            <span>হিসাবের নিয়ম:</span>
            <select
              value={ghaRule}
              onChange={(e) => setGhaRule(parseInt(e.target.value, 10))}
            >
              <option value={21}>২১ ঘা = ১ কুড়ি</option>
              <option value={20}>২০ ঘা = ১ কুড়ি</option>
            </select>
          </div>

          <div className="grid-inputs no-print">
            <div className="input-box">
              <label>কুড়ি</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={inputKuri}
                onChange={(e) => setInputKuri(cleanBnInput(e.target.value))}
              />
            </div>
            <div className="input-box">
              <label>ঘা</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={inputGha}
                onChange={(e) => setInputGha(cleanBnInput(e.target.value))}
              />
            </div>
            <div className="input-box">
              <label>টি (পিস)</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={inputTi}
                onChange={(e) => setInputTi(cleanBnInput(e.target.value))}
              />
            </div>
          </div>

          {/* Rate input with live gha preview */}
          <div className="input-box rate-box-wrapper no-print" style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '4px',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-dark)',
                  marginBottom: 0,
                }}
              >
                প্রতি কুড়ির দাম (৳)
              </label>
              {liveGhaRate && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#047857',
                    background: '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  ১ ঘা = ৳ {toBnNum(liveGhaRate)}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="০"
              inputMode="decimal"
              value={inputRate}
              onChange={(e) => setInputRate(cleanBnInput(e.target.value))}
            />
          </div>

          <div className="action-grid no-print">
            <button className="btn btn-danger-outline" onClick={handleResetReport}>
              রিপোর্ট মুছুন
            </button>
            <button className="btn btn-primary" onClick={handleAddItem}>
              হিসাব যোগ করুন
            </button>
          </div>

          {recentBanner && (
            <div
              className="calc-banner no-print"
              style={{ display: 'block' }}
              dangerouslySetInnerHTML={{ __html: recentBanner }}
            />
          )}

          {/* Printable & Exportable Receipt Section */}
          <div className="receipt-section" id="kachaExportArea">
            <div className="receipt-header">
              <h3>কাঁচা-পাকা সুপারি বিক্রির রসিদ</h3>
              <p>
                তারিখ: <span>{formattedToday}</span> | হিসাবের নিয়ম:{' '}
                <span>{toBnNum(ghaRule)} ঘা = ১ কুড়ি</span>
              </p>
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>নং</th>
                  <th>পরিমাণ</th>
                  <th>দর (কুড়ি / ঘা)</th>
                  <th>মোট টাকা (৳)</th>
                  <th className="action-col no-print" style={{ width: kroyKhataEnabled ? '60px' : '46px' }}>
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const itemGhaRate = item.ghaRate || item.rate / ghaRule;
                  return (
                    <tr key={idx}>
                      <td>{toBnNum(idx + 1)}</td>
                      <td style={{ fontWeight: 600 }}>{item.qtyString}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{toBnNum(item.rate)} ৳ / কুড়ি</div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#047857',
                            fontWeight: 700,
                            marginTop: '2px',
                          }}
                        >
                          (১ ঘা = ৳ {toBnNum(itemGhaRate.toFixed(2))})
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>৳ {toBnNum(item.totalPrice.toFixed(2))}</td>
                      <td className="action-cell no-print">
                        <div className="table-actions">
                          {kroyKhataEnabled && (
                            <button
                              className="icon-btn-table"
                              onClick={() => handleOpenKroyFromSingleItem(item)}
                              title="ক্রয় খাতায় যোগ"
                              style={{ color: '#059669', fontSize: '13px' }}
                            >
                              <ShoppingCart className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                          <button
                            className="icon-btn-table"
                            onClick={() => handleEditItem(idx)}
                            title="এডিট"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            className="icon-btn-table"
                            onClick={() => handleDeleteItem(idx)}
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {items.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '18px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                এখনো কোনো হিসাব যোগ করা হয়নি।
              </div>
            )}

            {items.length > 0 && (
              <div className="summary-card">
                <div className="summary-row">
                  <span>মোট এন্ট্রি:</span>
                  <strong>{toBnNum(items.length)}টি</strong>
                </div>
                <div className="summary-row">
                  <span>সর্বমোট সুপারি:</span>
                  <strong>{finalQtyText}</strong>
                </div>
                <div className="summary-row">
                  <span>মোট কুড়ি (দশমিক):</span>
                  <strong>{toBnNum(totalKuri.toFixed(2))}</strong>
                </div>
                <div className="summary-row" style={{ color: '#047857' }}>
                  <span>প্রতি ঘায়ের দাম:</span>
                  <strong>৳ {toBnNum(avgGhaRate.toFixed(2))}</strong>
                </div>
                <div className="summary-row total-row">
                  <span>সর্বমোট দাম:</span>
                  <strong>৳ {toBnNum(grandTotal.toFixed(2))}</strong>
                </div>

                {kroyKhataEnabled && (
                  <button
                    className="btn no-print"
                    onClick={handleOpenKroyFromSummary}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: 'white',
                      fontWeight: 700,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13.5px',
                      boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    এই সম্পূর্ণ হিসাবটি ক্রয় খাতায় যোগ করুন
                  </button>
                )}
              </div>
            )}

            <CreatorBadge />
          </div>

          {/* Export Buttons */}
          {items.length > 0 && (
            <div className="export-grid no-print">
              <button className="btn btn-copy" onClick={handleCopyReport}>
                <Copy className="w-4 h-4 mr-1" /> কপি করুন
              </button>
              <button className="btn btn-jpg" onClick={handleDownloadJPG}>
                <Image className="w-4 h-4 mr-1" /> JPG সেভ
              </button>
              <button className="btn btn-print" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" /> প্রিন্ট করুন
              </button>
              <button
                className="btn btn-save"
                onClick={() => onSaveHistory(items, ghaRule, grandTotal.toFixed(2))}
              >
                <Save className="w-4 h-4 mr-1" /> সেভ করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Rate Checker */}
      {subtab === 'rate' && (
        <div>
          <div className="settings-bar">
            <span>হিসাবের নিয়ম:</span>
            <select
              value={rateCheckRule}
              onChange={(e) => setRateCheckRule(parseInt(e.target.value, 10))}
            >
              <option value={21}>২১ ঘা = ১ কুড়ি</option>
              <option value={20}>২০ ঘা = ১ কুড়ি</option>
            </select>
          </div>

          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              margin: '0 0 14px',
            }}
          >
            ক্রেতা নির্দিষ্ট পরিমাণের যে দাম বলেছে তা লিখুন। এক কুড়ির দাম বের হয়ে যাবে।
          </p>

          <div className="grid-inputs">
            <div className="input-box">
              <label>কুড়ি</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={findKuri}
                onChange={(e) => setFindKuri(cleanBnInput(e.target.value))}
              />
            </div>
            <div className="input-box">
              <label>ঘা</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={findGha}
                onChange={(e) => setFindGha(cleanBnInput(e.target.value))}
              />
            </div>
            <div className="input-box">
              <label>টি (পিস)</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={findTi}
                onChange={(e) => setFindTi(cleanBnInput(e.target.value))}
              />
            </div>
          </div>

          <div className="input-box rate-box-wrapper">
            <label>উক্ত পরিমাণের দাম (৳)</label>
            <input
              type="text"
              placeholder="০"
              inputMode="decimal"
              value={findPrice}
              onChange={(e) => setFindPrice(cleanBnInput(e.target.value))}
            />
          </div>

          <div className="action-grid">
            <button className="btn btn-secondary" onClick={handleClearRateFields}>
              ক্লিয়ার
            </button>
            <button className="btn btn-primary" onClick={handleCalculateRate}>
              দর যাচাই করুন
            </button>
          </div>

          {rateCheckResult && (
            <div
              className="calc-banner"
              style={{ display: 'block', textAlign: 'left', marginTop: '16px' }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                পরিমাণ: <strong>{rateCheckResult.qtyText}</strong> (মোট দাম: ৳{' '}
                <strong>{toBnNum(rateCheckResult.totalPrice)}</strong>)
              </div>
              <div style={{ fontSize: '16px', marginBottom: '6px' }}>
                ১ কুড়ির দাম:{' '}
                <strong style={{ fontSize: '20px', color: 'var(--danger)', fontWeight: 800 }}>
                  {toBnNum(Math.round(rateCheckResult.pricePerKuri))} ৳
                </strong>
              </div>
              <div style={{ fontSize: '14px', borderTop: '1px dashed #34d399', paddingTop: '6px' }}>
                ১ ঘার দাম: <strong>{toBnNum(rateCheckResult.pricePerGha.toFixed(2))} ৳</strong>
              </div>

              {/* Actions for Rate Checked Lot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {/* 1. Add directly to Main Kacha Calculator list */}
                <button
                  className="btn btn-primary"
                  onClick={handleAddRateCheckToMainList}
                  style={{
                    width: '100%',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    padding: '10px',
                  }}
                >
                  ➕ কাঁচা-পাকা মূল হিসাব তালিকায় যোগ করুন
                </button>

                {/* 2. Add to Daily Purchase Ledger (Only if Kroy Khata is enabled) */}
                {kroyKhataEnabled && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleOpenKroyFromRateCheck}
                    style={{
                      width: '100%',
                      fontWeight: 700,
                      fontSize: '13px',
                      padding: '9px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#047857',
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1.5" />
                    🛒 এই হিসাবটি দৈনিক ক্রয় খাতায় জমা করুন
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
