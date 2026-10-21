import React, { useState } from 'react';
import { ShoppingCart, Edit2, Trash2, Copy, Image, Printer, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { PendingKroyItem } from '../types';
import {
  toBnNum,
  parseBnFloat,
  cleanBnInput,
  formatWeightKgGm,
} from '../utils/bengali';
import { copyToClipboard, renderMemoHtmlToImage, RenderMemoResult } from '../utils/exportMemo';
import { CreatorBadge, getCreatorBadgeHtml } from './CreatorBadge';

interface ShuknoViewProps {
  bags: number[];
  setBags: React.Dispatch<React.SetStateAction<number[]>>;
  baseRule: number;
  setBaseRule: (rule: number) => void;
  pricePerHajar: string;
  setPricePerHajar: (price: string) => void;
  deductedEmptyKg: number;
  setDeductedEmptyKg: (kg: number) => void;
  kroyKhataEnabled: boolean;
  onOpenConfirmModal: (title: string, msg: string, onOk: () => void) => void;
  onToast: (msg: string) => void;
  onSaveHistory: (
    bags: number[],
    rule: number,
    pricePerHajar: string,
    emptyBagKg: number,
    totalPrice: string
  ) => void;
  onOpenKroyAddModal: (item: PendingKroyItem) => void;
  onShowImagePreview: (data: RenderMemoResult) => void;
}

export const ShuknoView: React.FC<ShuknoViewProps> = ({
  bags,
  setBags,
  baseRule,
  setBaseRule,
  pricePerHajar,
  setPricePerHajar,
  deductedEmptyKg,
  setDeductedEmptyKg,
  kroyKhataEnabled,
  onOpenConfirmModal,
  onToast,
  onSaveHistory,
  onOpenKroyAddModal,
  onShowImagePreview,
}) => {
  const [subtab, setSubtab] = useState<'basta' | 'direct'>('basta');

  // Basta calculation inputs
  const [bagKg, setBagKg] = useState('');
  const [bagGm, setBagGm] = useState('');
  const [recentBanner, setRecentBanner] = useState<string | null>(null);

  // Deduction toggle
  const [deductionOpen, setDeductionOpen] = useState(false);
  const [emptyKg, setEmptyKg] = useState('');
  const [emptyGm, setEmptyGm] = useState('');

  // Direct weight inputs & result
  const [directKg, setDirectKg] = useState('');
  const [directGm, setDirectGm] = useState('');
  const [directResult, setDirectResult] = useState<{
    netWeight: number;
    textFormat: string;
    priceStr: string;
    totalPrice: number;
  } | null>(null);

  const calculateBreakdown = (netWeightKg: number) => {
    if (netWeightKg <= 0) {
      return { totalPrice: 0, priceStr: '০', textFormat: '০ কেজি' };
    }
    const rateNum = parseBnFloat(pricePerHajar);
    const totalPrice = (netWeightKg / baseRule) * rateNum;

    const hajar = Math.floor(netWeightKg / baseRule);
    const remainderKg = netWeightKg % baseRule;
    const weightPerShotok = baseRule / 10;
    const shotok = Math.floor(remainderKg / weightPerShotok);
    const remainingKgForFormat = remainderKg % weightPerShotok;

    let text = '';
    if (hajar > 0) text += `${toBnNum(hajar)} হাজার, `;
    if (shotok > 0 || hajar > 0) text += `${toBnNum(shotok)} শত, `;
    text += formatWeightKgGm(remainingKgForFormat);

    return {
      totalPrice: Math.round(totalPrice),
      priceStr: toBnNum(Math.round(totalPrice).toLocaleString('en-IN')),
      textFormat: text,
    };
  };

  const handleAddBag = () => {
    const kg = parseBnFloat(bagKg);
    const gm = parseBnFloat(bagGm);
    const grossWeight = kg + gm / 1000;

    if (grossWeight <= 0) {
      onToast('⚠️ দয়া করে সঠিক বস্তার ওজন লিখুন');
      return;
    }

    setBags((prev) => [...prev, grossWeight]);
    const breakdown = calculateBreakdown(grossWeight);

    setRecentBanner(
      `সর্বশেষ যোগ: <strong>${formatWeightKgGm(grossWeight)}</strong> <br>পরিমাণ: ${breakdown.textFormat} <br>মোট: <strong>৳ ${breakdown.priceStr}</strong>`
    );

    setBagKg('');
    setBagGm('');
    onToast('✅ বস্তা যোগ করা হয়েছে');
  };

  const handleEditBag = (index: number) => {
    const gross = bags[index];
    const totalGm = Math.round(gross * 1000);
    const kg = Math.floor(totalGm / 1000);
    const gm = totalGm % 1000;

    setBagKg(kg > 0 ? toBnNum(kg) : '');
    setBagGm(gm > 0 ? toBnNum(gm) : '');

    setBags((prev) => prev.filter((_, i) => i !== index));
    setRecentBanner(null);
    onToast('✏️ এডিট করার জন্য ওজন ইনপুট বক্সে নেওয়া হয়েছে');
  };

  const handleDeleteBag = (index: number) => {
    onOpenConfirmModal('বস্তা মুছুন', 'আপনি কি নিশ্চিত যে এই বস্তার হিসাবটি মুছতে চান?', () => {
      setBags((prev) => prev.filter((_, i) => i !== index));
      onToast('🗑️ বস্তা মুছে ফেলা হয়েছে');
    });
  };

  const handleResetReport = () => {
    if (bags.length === 0) {
      onToast('ℹ️ কোনো হিসাব তালিকাভুক্ত নেই');
      return;
    }
    onOpenConfirmModal('রিসেট করুন', 'আপনি কি নিশ্চিত যে শুকনো সুপারি হিসাব রিসেট করতে চান?', () => {
      setBags([]);
      setDeductedEmptyKg(0);
      setBagKg('');
      setBagGm('');
      setEmptyKg('');
      setEmptyGm('');
      setRecentBanner(null);
      onToast('🗑️ সম্পূর্ণ হিসাব মুছে ফেলা হয়েছে');
    });
  };

  const handleApplyDeduction = () => {
    const kg = parseBnFloat(emptyKg);
    const gm = parseBnFloat(emptyGm);
    const emptyW = kg + gm / 1000;

    setDeductedEmptyKg(emptyW);
    setEmptyKg('');
    setEmptyGm('');

    if (emptyW > 0) {
      onToast(`✅ মোট ওজন থেকে ${formatWeightKgGm(emptyW)} খালি বস্তার ওজন বাদ দেওয়া হয়েছে`);
    } else {
      onToast('ℹ️ কোনো ওজন বাদ দেওয়া হয়নি');
    }
  };

  const handleClearDeduction = () => {
    setDeductedEmptyKg(0);
    setEmptyKg('');
    setEmptyGm('');
    onToast('🗑️ খালি বস্তার বাদ দেওয়া ওজন ক্লিয়ার করা হয়েছে');
  };

  // Calculations for summary
  const totalGrossWeight = bags.reduce((a, b) => a + b, 0);
  let netWeight = totalGrossWeight - deductedEmptyKg;
  if (netWeight < 0) netWeight = 0;
  const finalBreakdown = calculateBreakdown(netWeight);
  const rateNum = parseBnFloat(pricePerHajar);

  const handleCopyReport = async () => {
    if (bags.length === 0) return;
    let text = '--- শুকনো সুপারি বিক্রির রসিদ ---\n';
    text += `হিসাবের নিয়ম: ১ হাজার = ${toBnNum(baseRule)} কেজি | দর: ৳ ${toBnNum(rateNum.toLocaleString('en-IN'))}\n\n`;

    bags.forEach((gross, idx) => {
      const row = calculateBreakdown(gross);
      text += `বস্তা ${toBnNum(idx + 1)}: ${formatWeightKgGm(gross)} | ${row.textFormat} | ৳ ${row.priceStr}\n`;
    });

    text += `\nমোট বস্তা: ${toBnNum(bags.length)}টি\n`;
    if (deductedEmptyKg > 0) {
      text += `বস্তাসহ মোট ওজন: ${formatWeightKgGm(totalGrossWeight)}\n`;
      text += `বাদ দেওয়া বস্তার ওজন: ${formatWeightKgGm(deductedEmptyKg)}\n`;
    }
    text += `সুপারির নিট ওজন: ${formatWeightKgGm(netWeight)}\n`;
    text += `মোট সুপারি: ${finalBreakdown.textFormat}\n`;
    text += `সর্বমোট দাম: ৳ ${finalBreakdown.priceStr}\n`;
    text += `\nCreated by Rahat Sharif\n`;

    const ok = await copyToClipboard(text);
    if (ok) onToast('📋 শুকনো সুপারি রসিদ কপি হয়েছে!');
  };

  const handlePrint = () => {
    if (bags.length === 0) return;
    document.body.classList.add('printing-shukno');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-shukno');
    }, 500);
  };

  const buildShuknoMemoHtml = () => {
    const totalBags = bags.length;
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
    if (totalBags > 80) {
      numCols = 4;
      memoWidth = 860;
    } else if (totalBags > 36) {
      numCols = 3;
      memoWidth = 800;
    } else if (totalBags > 12) {
      numCols = 2;
      memoWidth = 780;
    }

    let tableHtml = '';
    if (numCols === 1) {
      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13.5px; font-family: 'Noto Sans Bengali', sans-serif;">
          <thead>
            <tr style="background: #f1f5f9; border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-weight: 700;">
              <th style="padding: 9px 8px; text-align: center; width: 44px;">বস্তা</th>
              <th style="padding: 9px 8px; text-align: center;">ওজন</th>
              <th style="padding: 9px 8px; text-align: center;">সুপারি পরিমাণ</th>
              <th style="padding: 9px 8px; text-align: right; width: 90px;">দাম (৳)</th>
            </tr>
          </thead>
          <tbody>
      `;
      bags.forEach((gross, idx) => {
        const row = calculateBreakdown(gross);
        tableHtml += `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
            <td style="padding: 8px 6px; text-align: center; font-weight: 700; color: #64748b;">${toBnNum(idx + 1)}</td>
            <td style="padding: 8px 6px; text-align: center; font-weight: 600;">${formatWeightKgGm(gross)}</td>
            <td style="padding: 8px 6px; text-align: center; font-size: 12.5px; color: #334155;">${row.textFormat}</td>
            <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #047857;">৳ ${row.priceStr}</td>
          </tr>
        `;
      });
      tableHtml += `</tbody></table>`;
    } else {
      const rowsPerCol = Math.ceil(totalBags / numCols);
      tableHtml = `<div style="display: flex; gap: 8px; margin-bottom: 16px; font-family: 'Noto Sans Bengali', sans-serif;">`;
      for (let c = 0; c < numCols; c++) {
        const startIdx = c * rowsPerCol;
        const endIdx = Math.min(startIdx + rowsPerCol, totalBags);
        if (startIdx >= totalBags) break;

        tableHtml += `
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; font-size: ${numCols >= 3 ? '11px' : '12px'};">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-weight: 700;">
                  <th style="padding: 6px 3px; text-align: center; width: 28px;">বস্তা</th>
                  <th style="padding: 6px 3px; text-align: center;">ওজন</th>
                  ${numCols === 2 ? '<th style="padding: 6px 3px; text-align: center;">পরিমাণ</th>' : ''}
                  <th style="padding: 6px 3px; text-align: right;">দাম (৳)</th>
                </tr>
              </thead>
              <tbody>
        `;
        for (let i = startIdx; i < endIdx; i++) {
          const gross = bags[i];
          const row = calculateBreakdown(gross);
          tableHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9; ${i % 2 === 1 ? 'background: #f8fafc;' : ''}">
              <td style="padding: 5px 3px; text-align: center; font-weight: 700; color: #64748b;">${toBnNum(i + 1)}</td>
              <td style="padding: 5px 3px; text-align: center; font-weight: 600;">${formatWeightKgGm(gross)}</td>
              ${numCols === 2 ? `<td style="padding: 5px 3px; text-align: center; font-size: 11px; color: #475569;">${row.textFormat}</td>` : ''}
              <td style="padding: 5px 3px; text-align: right; font-weight: 700; color: #047857;">৳ ${row.priceStr}</td>
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
          <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">শুকনো সুপারি বিক্রির রসিদ</h2>
          <div style="font-size: 13.5px; color: #475569; font-weight: 600;">
            তারিখ: <span style="color: #0f172a; font-weight: 700;">${dateStr}</span> | হিসাবের নিয়ম: <span style="color: #047857; font-weight: 700;">১ হাজার = ${toBnNum(baseRule)} কেজি</span> | দর: <span style="color: #047857; font-weight: 700;">৳ ${toBnNum(rateNum.toLocaleString('en-IN'))}</span>
          </div>
        </div>

        ${tableHtml}

        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; font-size: 14px; font-weight: 600;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>মোট বস্তা:</span>
            <strong style="color: #0f172a; font-size: 15px;">${toBnNum(totalBags)}টি</strong>
          </div>
          ${
            deductedEmptyKg > 0
              ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b; font-size: 13px;">
              <span>বস্তাসহ মোট ওজন:</span>
              <span>${formatWeightKgGm(totalGrossWeight)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #ef4444; font-size: 13px;">
              <span>বাদ দেওয়া বস্তার ওজন:</span>
              <strong>- ${formatWeightKgGm(deductedEmptyKg)}</strong>
            </div>
          `
              : ''
          }
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>সুপারির নিট ওজন:</span>
            <strong style="color: #0f172a; font-size: 15px;">${formatWeightKgGm(netWeight)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #065f46;">
            <span>মোট সুপারি:</span>
            <strong style="font-size: 16px;">${finalBreakdown.textFormat}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px dashed #cbd5e1; font-size: 20px; font-weight: 800; color: #047857;">
            <span>সর্বমোট দাম:</span>
            <span>৳ ${finalBreakdown.priceStr}</span>
          </div>
        </div>

        ${getCreatorBadgeHtml()}
      </div>
    `;
  };

  const handleDownloadJPG = async () => {
    if (bags.length === 0) {
      onToast('⚠️ সেভ করার জন্য কোনো বস্তা যোগ করা হয়নি');
      return;
    }
    const totalBags = bags.length;
    let memoWidth = 780;
    if (totalBags > 80) memoWidth = 860;
    else if (totalBags > 36) memoWidth = 800;

    onToast('⏳ মেমো ছবি তৈরি হচ্ছে...');
    try {
      const html = buildShuknoMemoHtml();
      const res = await renderMemoHtmlToImage(html, 'Shukno_Supari_Memo.jpg', memoWidth);
      onShowImagePreview(res);
      onToast('🖼️ JPG রসিদ প্রস্তুত হয়েছে!');
    } catch {
      onToast('⚠️ মেমো ছবি তৈরিতে সমস্যা হয়েছে');
    }
  };

  // Kroy forwarding
  const handleOpenKroyFromSummary = () => {
    if (bags.length === 0) {
      onToast('⚠️ ক্রয় খাতায় যোগ করার মতো কোনো বস্তা নেই');
      return;
    }
    onOpenKroyAddModal({
      type: 'shukno',
      bags: bags.length,
      weightKg: netWeight,
      rule: baseRule,
      ruleText: `${toBnNum(baseRule)} কেজি = ১ হাজার`,
      hajarShotokText: finalBreakdown.textFormat,
      qtyText: `${toBnNum(bags.length)} বস্তা (${formatWeightKgGm(netWeight)})`,
      kuri: 0,
      rate: rateNum,
      rateText: `১ হাজার = ৳ ${toBnNum(rateNum)} (${toBnNum(baseRule)} কেজি)`,
      totalPrice: finalBreakdown.totalPrice,
    });
  };

  // Direct weight calculation
  const handleCalculateDirect = () => {
    const grossKg = parseBnFloat(directKg);
    const grossGm = parseBnFloat(directGm);
    const totalWeight = grossKg + grossGm / 1000;

    if (totalWeight <= 0) {
      setDirectResult(null);
      onToast('⚠️ অনুগ্রহ করে সুপারির সঠিক ওজন লিখুন');
      return;
    }

    const breakdown = calculateBreakdown(totalWeight);
    setDirectResult({
      netWeight: totalWeight,
      textFormat: breakdown.textFormat,
      priceStr: breakdown.priceStr,
      totalPrice: breakdown.totalPrice,
    });
  };

  const handleClearDirect = () => {
    setDirectKg('');
    setDirectGm('');
    setDirectResult(null);
  };

  const handleOpenKroyFromDirect = () => {
    if (!directResult) return;
    onOpenKroyAddModal({
      type: 'shukno',
      bags: 1,
      weightKg: directResult.netWeight,
      rule: baseRule,
      ruleText: `${toBnNum(baseRule)} কেজি = ১ হাজার`,
      hajarShotokText: directResult.textFormat,
      qtyText: `১ লট (${formatWeightKgGm(directResult.netWeight)})`,
      kuri: 0,
      rate: rateNum,
      rateText: `১ হাজার = ৳ ${toBnNum(rateNum)} (${toBnNum(baseRule)} কেজি)`,
      totalPrice: directResult.totalPrice,
    });
  };

  return (
    <div className="view-panel active">
      {/* Subtabs */}
      <div className="segmented-tabs no-print">
        <button
          className={`tab-item ${subtab === 'basta' ? 'active' : ''}`}
          onClick={() => setSubtab('basta')}
        >
          বস্তা হিসাব
        </button>
        <button
          className={`tab-item ${subtab === 'direct' ? 'active' : ''}`}
          onClick={() => setSubtab('direct')}
        >
          মোট ওজন হিসাব
        </button>
      </div>

      {/* Settings Grid (Rule + Rate) */}
      <div className="settings-grid-2 no-print">
        <div className="setting-card">
          <label>হিসাবের নিয়ম</label>
          <select
            className="std-input"
            style={{ height: '38px', fontSize: '13px' }}
            value={baseRule}
            onChange={(e) => setBaseRule(parseInt(e.target.value, 10))}
          >
            <option value={82}>৮২ কেজি = ১ হাজার</option>
            <option value={80}>৮০ কেজি = ১ হাজার</option>
          </select>
        </div>

        <div className="setting-card">
          <label>হাজারের দাম (৳)</label>
          <input
            type="text"
            className="std-input"
            style={{ height: '38px', fontSize: '14px' }}
            placeholder="০"
            inputMode="numeric"
            value={pricePerHajar}
            onChange={(e) => setPricePerHajar(cleanBnInput(e.target.value))}
          />
        </div>
      </div>

      {/* Subtab 1: Basta */}
      {subtab === 'basta' && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-dark)',
              marginBottom: '6px',
            }}
            className="no-print"
          >
            নতুন বস্তার ওজন (বস্তাসহ)
          </label>
          <div className="weight-row-group no-print">
            <input
              type="text"
              className="std-input"
              placeholder="কেজি"
              inputMode="numeric"
              value={bagKg}
              onChange={(e) => setBagKg(cleanBnInput(e.target.value))}
            />
            <input
              type="text"
              className="std-input"
              placeholder="গ্রাম"
              inputMode="numeric"
              value={bagGm}
              onChange={(e) => setBagGm(cleanBnInput(e.target.value))}
            />
            <button className="btn btn-primary" onClick={handleAddBag}>
              যোগ করুন
            </button>
          </div>

          {recentBanner && (
            <div
              className="calc-banner no-print"
              style={{ display: 'block' }}
              dangerouslySetInnerHTML={{ __html: recentBanner }}
            />
          )}

          {/* Receipt Section */}
          <div className="receipt-section" id="shuknoExportArea">
            <div className="receipt-header">
              <h3>শুকনো সুপারি বিক্রির রসিদ</h3>
              <p>
                ১ হাজার = {toBnNum(baseRule)} কেজি | দর = ৳{' '}
                {toBnNum(rateNum.toLocaleString('en-IN'))}
              </p>
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>বস্তা</th>
                  <th>ওজন</th>
                  <th>সুপারি পরিমাণ</th>
                  <th>দাম (৳)</th>
                  <th className="action-col no-print" style={{ width: '50px' }}>
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody>
                {bags.map((gross, idx) => {
                  const row = calculateBreakdown(gross);
                  return (
                    <tr key={idx}>
                      <td>{toBnNum(idx + 1)}</td>
                      <td style={{ fontWeight: 600 }}>{formatWeightKgGm(gross)}</td>
                      <td style={{ fontSize: '11px' }}>{row.textFormat}</td>
                      <td style={{ fontWeight: 700 }}>৳ {row.priceStr}</td>
                      <td className="action-cell no-print">
                        <div className="table-actions">
                          <button
                            className="icon-btn-table"
                            onClick={() => handleEditBag(idx)}
                            title="এডিট"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            className="icon-btn-table"
                            onClick={() => handleDeleteBag(idx)}
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

            {bags.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '18px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                হিসাব করার জন্য উপরে বস্তার ওজন যোগ করুন।
              </div>
            )}

            {bags.length > 0 && (
              <div className="summary-card">
                <div className="summary-row">
                  <span>মোট বস্তা:</span>
                  <strong>{toBnNum(bags.length)}টি</strong>
                </div>

                {deductedEmptyKg > 0 && (
                  <>
                    <div className="summary-row highlight-sub">
                      <span>বস্তাসহ মোট ওজন:</span>
                      <span>{formatWeightKgGm(totalGrossWeight)}</span>
                    </div>
                    <div className="summary-row highlight-red">
                      <span>বাদ দেওয়া বস্তার ওজন:</span>
                      <strong>- {formatWeightKgGm(deductedEmptyKg)}</strong>
                    </div>
                  </>
                )}

                <div className="summary-row">
                  <span>সুপারির নিট ওজন:</span>
                  <strong>{formatWeightKgGm(netWeight)}</strong>
                </div>
                <div className="summary-row" style={{ color: 'var(--primary-dark)' }}>
                  <span>মোট সুপারি:</span>
                  <strong>{finalBreakdown.textFormat}</strong>
                </div>

                <div className="summary-row total-row">
                  <span>সর্বমোট দাম:</span>
                  <strong>৳ {finalBreakdown.priceStr}</strong>
                </div>

                {kroyKhataEnabled && (
                  <button
                    className="btn no-print"
                    onClick={handleOpenKroyFromSummary}
                    style={{
                      width: '100%',
                      marginTop: '10px',
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
                      fontSize: '13px',
                      boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    এই শুকনো সুপারি হিসাবটি ক্রয় খাতায় যোগ করুন
                  </button>
                )}

                {/* Deductions Panel Toggle */}
                <div className="deduction-trigger-wrapper no-print">
                  <button
                    className={`btn-deduction-trigger ${deductionOpen ? 'active' : ''}`}
                    onClick={() => setDeductionOpen(!deductionOpen)}
                  >
                    <span>বস্তার ওজন বাদ দিন (খালি বস্তা)</span>
                    {deductionOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {deductionOpen && (
                    <div className="deduction-panel open">
                      <div className="deduction-panel-title">
                        <span>খালি বস্তার মোট ওজন লিখুন</span>
                        <button className="btn-badge-clear" onClick={handleClearDeduction}>
                          মুছে দিন
                        </button>
                      </div>
                      <div className="weight-row-group" style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className="std-input"
                          placeholder="কেজি"
                          inputMode="numeric"
                          value={emptyKg}
                          onChange={(e) => setEmptyKg(cleanBnInput(e.target.value))}
                        />
                        <input
                          type="text"
                          className="std-input"
                          placeholder="গ্রাম"
                          inputMode="numeric"
                          value={emptyGm}
                          onChange={(e) => setEmptyGm(cleanBnInput(e.target.value))}
                        />
                        <button className="btn btn-warning" onClick={handleApplyDeduction}>
                          বাদ দিন
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <CreatorBadge />
          </div>

          {/* Export Buttons */}
          {bags.length > 0 && (
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
                onClick={() =>
                  onSaveHistory(
                    bags,
                    baseRule,
                    pricePerHajar,
                    deductedEmptyKg,
                    finalBreakdown.priceStr
                  )
                }
              >
                <Save className="w-4 h-4 mr-1" /> সেভ করুন
              </button>
              <button className="btn btn-clear-all" onClick={handleResetReport}>
                <Trash2 className="w-4 h-4 mr-1 inline" /> রিসেট করুন (ক্লিয়ার)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Direct Weight */}
      {subtab === 'direct' && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-dark)',
              marginBottom: '6px',
            }}
          >
            সুপারির মোট ওজন
          </label>
          <div className="weight-row-group" style={{ marginBottom: '14px' }}>
            <input
              type="text"
              className="std-input"
              placeholder="কেজি"
              inputMode="numeric"
              value={directKg}
              onChange={(e) => setDirectKg(cleanBnInput(e.target.value))}
            />
            <input
              type="text"
              className="std-input"
              placeholder="গ্রাম"
              inputMode="numeric"
              value={directGm}
              onChange={(e) => setDirectGm(cleanBnInput(e.target.value))}
            />
          </div>

          <div className="action-grid">
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={handleCalculateDirect}
            >
              হিসাব করুন
            </button>
            <button
              className="btn btn-danger-outline"
              style={{ flex: 1 }}
              onClick={handleClearDirect}
            >
              ক্লিয়ার
            </button>
          </div>

          {directResult && (
            <div className="receipt-section">
              <div
                className="summary-card"
                style={{ border: 'none', padding: 0, background: 'transparent' }}
              >
                <div className="summary-row">
                  <span>মোট ওজন:</span>
                  <strong>{formatWeightKgGm(directResult.netWeight)}</strong>
                </div>
                <div className="summary-row" style={{ color: 'var(--primary-dark)' }}>
                  <span>পরিমাণ:</span>
                  <strong>{directResult.textFormat}</strong>
                </div>
                <div className="summary-row total-row">
                  <span>মোট দাম:</span>
                  <strong>৳ {directResult.priceStr}</strong>
                </div>
              </div>
              {kroyKhataEnabled && (
                <button
                  className="btn btn-primary"
                  onClick={handleOpenKroyFromDirect}
                  style={{ width: '100%', marginTop: '10px', fontWeight: 700 }}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  ক্রয় খাতায় জমা করুন
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
