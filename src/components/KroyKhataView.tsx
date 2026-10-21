import React, { useState } from 'react';
import { ShoppingCart, Edit2, Trash2, Copy, Image, Printer } from 'lucide-react';
import { KroyEntry, KroyDatabase } from '../types';
import {
  toBnNum,
  parseBnFloat,
  cleanBnInput,
  formatWeightKgGm,
  formatBnDate,
  formatBnTime,
  getTodayDateStr,
} from '../utils/bengali';
import { copyToClipboard, renderMemoHtmlToImage, RenderMemoResult } from '../utils/exportMemo';
import { CreatorBadge, getCreatorBadgeHtml } from './CreatorBadge';

interface KroyKhataViewProps {
  kroyDb: KroyDatabase;
  setKroyDb: React.Dispatch<React.SetStateAction<KroyDatabase>>;
  activeDate: string;
  setActiveDate: (date: string) => void;
  onOpenConfirmModal: (title: string, msg: string, onOk: () => void) => void;
  onToast: (msg: string) => void;
  onShowImagePreview: (data: RenderMemoResult) => void;
}

const tiPerGha = 10;

export const KroyKhataView: React.FC<KroyKhataViewProps> = ({
  kroyDb,
  setKroyDb,
  activeDate,
  setActiveDate,
  onOpenConfirmModal,
  onToast,
  onShowImagePreview,
}) => {
  const [currentTab, setCurrentTab] = useState<'kacha' | 'shukno' | 'all'>('kacha');

  // Direct Entry: Kacha
  const [kachaSeller, setKachaSeller] = useState('');
  const [kachaRule, setKachaRule] = useState(21);
  const [kachaKuri, setKachaKuri] = useState('');
  const [kachaGha, setKachaGha] = useState('');
  const [kachaTi, setKachaTi] = useState('');
  const [kachaRate, setKachaRate] = useState('');
  const [kachaEntryMode, setKachaEntryMode] = useState<'regular' | 'rate-check'>('regular');
  const [kachaTotalPriceInput, setKachaTotalPriceInput] = useState('');

  // Direct Entry: Shukno
  const [shuknoSeller, setShuknoSeller] = useState('');
  const [shuknoRule, setShuknoRule] = useState(82);
  const [shuknoBags, setShuknoBags] = useState('');
  const [shuknoKg, setShuknoKg] = useState('');
  const [shuknoGm, setShuknoGm] = useState('');
  const [shuknoRate, setShuknoRate] = useState('');

  const entries = kroyDb[activeDate] || [];
  const kachaEntries = entries
    .map((e, idx) => ({ ...e, originalIndex: idx }))
    .filter((e) => e.type !== 'shukno');
  const shuknoEntries = entries
    .map((e, idx) => ({ ...e, originalIndex: idx }))
    .filter((e) => e.type === 'shukno');

  // Calculations: Kacha
  let totalKachaKuri = 0;
  let totalKachaSpent = 0;
  kachaEntries.forEach((e) => {
    totalKachaKuri += e.kuri || 0;
    totalKachaSpent += e.totalPrice || 0;
  });
  const tiPerKuri = kachaRule * tiPerGha;
  const totalKachaTi = Math.round(totalKachaKuri * tiPerKuri);
  const finalKuri = Math.floor(totalKachaTi / tiPerKuri);
  const remAfterKuri = totalKachaTi % tiPerKuri;
  const finalGha = Math.floor(remAfterKuri / tiPerGha);
  const finalTi = remAfterKuri % tiPerGha;

  const kachaParts: string[] = [];
  if (finalKuri > 0) kachaParts.push(`${toBnNum(finalKuri)} কুড়ি`);
  if (finalGha > 0) kachaParts.push(`${toBnNum(finalGha)} ঘা`);
  if (finalTi > 0) kachaParts.push(`${toBnNum(finalTi)} টি`);
  const kachaQtyText =
    kachaParts.length > 0
      ? kachaParts.join(' ')
      : totalKachaKuri > 0
      ? `${toBnNum(totalKachaKuri.toFixed(2))} কুড়ি`
      : '০ কুড়ি';
  const avgKachaRate = totalKachaKuri > 0 ? totalKachaSpent / totalKachaKuri : 0;

  // Calculations: Shukno
  let totalShuknoWeight = 0;
  let totalShuknoBags = 0;
  let totalShuknoSpent = 0;
  shuknoEntries.forEach((e) => {
    totalShuknoWeight += e.weightKg || 0;
    totalShuknoBags += e.bags || 1;
    totalShuknoSpent += e.totalPrice || 0;
  });

  const hajarCount = Math.floor(totalShuknoWeight / shuknoRule);
  const remKg = totalShuknoWeight % shuknoRule;
  const weightPerShotok = shuknoRule / 10;
  const shotokCount = Math.floor(remKg / weightPerShotok);
  const remainingKg = remKg % weightPerShotok;

  const shuknoHajarParts: string[] = [];
  if (hajarCount > 0) shuknoHajarParts.push(`${toBnNum(hajarCount)} হাজার`);
  if (shotokCount > 0 || hajarCount > 0) shuknoHajarParts.push(`${toBnNum(shotokCount)} শত`);
  if (remainingKg > 0 || shuknoHajarParts.length === 0)
    shuknoHajarParts.push(formatWeightKgGm(remainingKg));
  const shuknoBreakdownText = shuknoHajarParts.join(', ');

  const grandTotalSpent = totalKachaSpent + totalShuknoSpent;

  // Direct Add Kacha
  const handleAddDirectKacha = () => {
    const seller = kachaSeller.trim() || 'সাধারণ বিক্রেতা';
    const kuri = parseBnFloat(kachaKuri);
    const gha = parseBnFloat(kachaGha);
    const ti = parseBnFloat(kachaTi);
    const rate = parseBnFloat(kachaRate);

    const calcTiPerKuri = kachaRule * tiPerGha;
    const totalTi = kuri * calcTiPerKuri + gha * tiPerGha + ti;

    if (totalTi <= 0 || rate <= 0) {
      onToast('⚠️ সঠিক পরিমাণ (কুড়ি/ঘা/টি) ও প্রতি কুড়ির দর দিন');
      return;
    }

    const calculatedKuri = totalTi / calcTiPerKuri;
    const totalPrice = Math.round(calculatedKuri * rate * 100) / 100;

    const parts: string[] = [];
    if (kuri > 0) parts.push(`${toBnNum(kuri)} কুড়ি`);
    if (gha > 0) parts.push(`${toBnNum(gha)} ঘা`);
    if (ti > 0) parts.push(`${toBnNum(ti)} টি`);
    const qtyText = parts.length > 0 ? parts.join(' ') : `${toBnNum(totalTi)} টি`;

    const newEntry: KroyEntry = {
      id: Date.now(),
      time: formatBnTime(new Date()),
      seller,
      type: 'kacha',
      qtyText,
      kuri: calculatedKuri,
      rule: kachaRule,
      ruleText: `${toBnNum(kachaRule)} ঘা = ১ কুড়ি`,
      rate,
      rateText: `দর: ৳ ${toBnNum(rate)} / কুড়ি (${toBnNum(kachaRule)} ঘা)`,
      totalPrice,
    };

    setKroyDb((prev) => ({
      ...prev,
      [activeDate]: [...(prev[activeDate] || []), newEntry],
    }));

    setKachaSeller('');
    setKachaKuri('');
    setKachaGha('');
    setKachaTi('');
    setKachaRate('');
    onToast('✅ কাঁচা-পাকা ক্রয় খাতায় সফলভাবে যোগ হয়েছে');
  };

  // Direct Add Kacha via Rate Checker
  const handleAddRateCheckedKacha = () => {
    const seller = kachaSeller.trim() || 'সাধারণ বিক্রেতা';
    const kuri = parseBnFloat(kachaKuri);
    const gha = parseBnFloat(kachaGha);
    const ti = parseBnFloat(kachaTi);
    const totalPrice = parseBnFloat(kachaTotalPriceInput);

    const calcTiPerKuri = kachaRule * tiPerGha;
    const totalTi = kuri * calcTiPerKuri + gha * tiPerGha + ti;

    if (totalTi <= 0 || totalPrice <= 0) {
      onToast('⚠️ সঠিক পরিমাণ ও মোট টাকা লিখুন');
      return;
    }

    const calculatedKuri = totalTi / calcTiPerKuri;
    const calculatedRate = Math.round(totalPrice / calculatedKuri);

    const parts: string[] = [];
    if (kuri > 0) parts.push(`${toBnNum(kuri)} কুড়ি`);
    if (gha > 0) parts.push(`${toBnNum(gha)} ঘা`);
    if (ti > 0) parts.push(`${toBnNum(ti)} টি`);
    const qtyText = parts.length > 0 ? parts.join(' ') : `${toBnNum(totalTi)} টি`;

    const newEntry: KroyEntry = {
      id: Date.now(),
      time: formatBnTime(new Date()),
      seller,
      type: 'kacha',
      qtyText,
      kuri: calculatedKuri,
      rule: kachaRule,
      ruleText: `${toBnNum(kachaRule)} ঘা = ১ কুড়ি`,
      rate: calculatedRate,
      rateText: `যাচাইকৃত দর: ৳ ${toBnNum(calculatedRate)} / কুড়ি (${toBnNum(kachaRule)} ঘা)`,
      totalPrice,
    };

    setKroyDb((prev) => ({
      ...prev,
      [activeDate]: [...(prev[activeDate] || []), newEntry],
    }));

    setKachaSeller('');
    setKachaKuri('');
    setKachaGha('');
    setKachaTi('');
    setKachaTotalPriceInput('');
    onToast('✅ দর যাচাইকৃত কাঁচা-পাকা চালান সফলভাবে ক্রয় খাতায় যোগ হয়েছে');
  };

  // Direct Add Shukno
  const handleAddDirectShukno = () => {
    const seller = shuknoSeller.trim() || 'সাধারণ বিক্রেতা';
    const bagsCount = parseBnFloat(shuknoBags) || 1;
    const kg = parseBnFloat(shuknoKg);
    const gm = parseBnFloat(shuknoGm);
    const totalWeight = kg + gm / 1000;
    const rate = parseBnFloat(shuknoRate);

    if (totalWeight <= 0) {
      onToast('⚠️ সুপারির সঠিক ওজন (কেজি ও গ্রাম) লিখুন');
      return;
    }
    if (rate <= 0) {
      onToast('⚠️ প্রতি হাজারের দর লিখুন');
      return;
    }

    const hajar = Math.floor(totalWeight / shuknoRule);
    const remainderKg = totalWeight % shuknoRule;
    const weightPerShotok = shuknoRule / 10;
    const shotok = Math.floor(remainderKg / weightPerShotok);
    const remKgShotok = remainderKg % weightPerShotok;

    let breakdownText = '';
    if (hajar > 0) breakdownText += `${toBnNum(hajar)} হাজার, `;
    if (shotok > 0 || hajar > 0) breakdownText += `${toBnNum(shotok)} শত, `;
    breakdownText += formatWeightKgGm(remKgShotok);

    const totalPrice = Math.round((totalWeight / shuknoRule) * rate);

    const newEntry: KroyEntry = {
      id: Date.now(),
      time: formatBnTime(new Date()),
      seller,
      type: 'shukno',
      bags: bagsCount,
      weightKg: totalWeight,
      rule: shuknoRule,
      ruleText: `${toBnNum(shuknoRule)} কেজি = ১ হাজার`,
      hajarShotokText: breakdownText,
      qtyText: `${toBnNum(bagsCount)} বস্তা (${formatWeightKgGm(totalWeight)})`,
      rate,
      rateText: `১ হাজার = ৳ ${toBnNum(rate)} (${toBnNum(shuknoRule)} কেজি)`,
      totalPrice,
    };

    setKroyDb((prev) => ({
      ...prev,
      [activeDate]: [...(prev[activeDate] || []), newEntry],
    }));

    setShuknoSeller('');
    setShuknoBags('');
    setShuknoKg('');
    setShuknoGm('');
    setShuknoRate('');
    onToast('✅ শুকনো সুপারি ক্রয় এন্ট্রি সফলভাবে যোগ হয়েছে');
  };

  const handleEditItem = (originalIdx: number) => {
    const entry = entries[originalIdx];
    if (!entry) return;

    if (entry.type === 'shukno') {
      setCurrentTab('shukno');
      setShuknoSeller(entry.seller === 'সাধারণ বিক্রেতা' ? '' : entry.seller);
      setShuknoBags(entry.bags ? toBnNum(entry.bags) : '১');
      if (entry.rule) setShuknoRule(entry.rule);
      if (entry.weightKg && entry.weightKg > 0) {
        const totGm = Math.round(entry.weightKg * 1000);
        const kg = Math.floor(totGm / 1000);
        const gm = totGm % 1000;
        setShuknoKg(kg > 0 ? toBnNum(kg) : '');
        setShuknoGm(gm > 0 ? toBnNum(gm) : '');
      }
      setShuknoRate(entry.rate > 0 ? toBnNum(entry.rate) : '');
    } else {
      setCurrentTab('kacha');
      setKachaSeller(entry.seller === 'সাধারণ বিক্রেতা' ? '' : entry.seller);
      if (entry.rule) setKachaRule(entry.rule);
      setKachaRate(entry.rate > 0 ? toBnNum(entry.rate) : '');
    }

    setKroyDb((prev) => {
      const currentList = prev[activeDate] || [];
      return {
        ...prev,
        [activeDate]: currentList.filter((_, i) => i !== originalIdx),
      };
    });

    window.scrollTo({ top: 200, behavior: 'smooth' });
    onToast('✏️ পরিবর্তনের জন্য ইনপুট বক্সে নেওয়া হয়েছে');
  };

  const handleDeleteItem = (originalIdx: number) => {
    onOpenConfirmModal('ক্রয় হিসাব মুছুন', 'আপনি কি নিশ্চিত যে এই চালানটি ক্রয় খাতা থেকে মুছতে চান?', () => {
      setKroyDb((prev) => {
        const currentList = prev[activeDate] || [];
        const nextList = currentList.filter((_, i) => i !== originalIdx);
        if (nextList.length === 0) {
          const copy = { ...prev };
          delete copy[activeDate];
          return copy;
        }
        return { ...prev, [activeDate]: nextList };
      });
      onToast('🗑️ ক্রয় হিসাব মুছে ফেলা হয়েছে');
    });
  };

  const handleResetKroy = () => {
    if (entries.length === 0) {
      onToast('ℹ️ এই দিনের খাতা ইতিমধ্যে ফাঁকা');
      return;
    }
    const dateBn = formatBnDate(activeDate);
    let promptMsg = '';
    if (currentTab === 'kacha') {
      promptMsg = `${dateBn}-এর কাঁচা-পাকা সুপারি ক্রয় হিসাব মুছে ফেলতে চান?`;
    } else if (currentTab === 'shukno') {
      promptMsg = `${dateBn}-এর শুকনো সুপারি ক্রয় হিসাব মুছে ফেলতে চান?`;
    } else {
      promptMsg = `${dateBn}-এর সমস্ত (কাঁচা ও শুকনো) ক্রয় হিসাব মুছে ফেলতে চান?`;
    }

    onOpenConfirmModal('খাতা খালি করুন', promptMsg, () => {
      setKroyDb((prev) => {
        const currentList = prev[activeDate] || [];
        let remaining: KroyEntry[] = [];
        if (currentTab === 'kacha') {
          remaining = currentList.filter((e) => e.type === 'shukno');
        } else if (currentTab === 'shukno') {
          remaining = currentList.filter((e) => e.type !== 'shukno');
        } else {
          remaining = [];
        }
        if (remaining.length === 0) {
          const copy = { ...prev };
          delete copy[activeDate];
          return copy;
        }
        return { ...prev, [activeDate]: remaining };
      });
      onToast('🗑️ ক্রয় খাতা মুছে ফেলা হয়েছে');
    });
  };

  const handleCopyReport = async () => {
    if (entries.length === 0) return;
    const dateBn = formatBnDate(activeDate);
    let text = '';

    if (currentTab === 'kacha') {
      text += `--- দৈনিক কাঁচা-পাকা সুপারি ক্রয় খাতা ---\n`;
      text += `তারিখ: ${dateBn} (হিসাবের নিয়ম: ${toBnNum(kachaRule)} ঘা = ১ কুড়ি)\n`;
      text += `মোট চালান: ${toBnNum(kachaEntries.length)} জন\n\n`;
      kachaEntries.forEach((e, i) => {
        text += `${toBnNum(i + 1)}. [${e.time}] ${e.seller} - ${e.qtyText} | দর: ৳ ${toBnNum(Math.round(e.rate))} (${toBnNum(e.rule || kachaRule)} ঘা) | মোট: ৳ ${toBnNum(e.totalPrice.toFixed(2))}\n`;
      });
      text += `\n--------------------------------\n`;
      text += `মোট কেনা সুপারি: ${kachaQtyText}\n`;
      text += `মোট কুড়ি (দশমিক): ${toBnNum(totalKachaKuri.toFixed(2))} কুড়ি\n`;
      text += `দিনশেষে কাঁচা-পাকা মোট খরচ: ৳ ${toBnNum(totalKachaSpent.toFixed(2))}\n`;
    } else if (currentTab === 'shukno') {
      text += `--- দৈনিক শুকনো সুপারি ক্রয় খাতা ---\n`;
      text += `তারিখ: ${dateBn} (হিসাবের নিয়ম: ${toBnNum(shuknoRule)} কেজি = ১ হাজার)\n`;
      text += `মোট চালান: ${toBnNum(shuknoEntries.length)} জন\n\n`;
      shuknoEntries.forEach((e, i) => {
        text += `${toBnNum(i + 1)}. [${e.time}] ${e.seller} - ${e.qtyText} | ভাঙানো: ${e.hajarShotokText || '-'} (${toBnNum(e.rule || shuknoRule)} কেজি) | মোট: ৳ ${toBnNum(e.totalPrice.toFixed(2))}\n`;
      });
      text += `\n--------------------------------\n`;
      text += `মোট শুকনো ওজন: ${formatWeightKgGm(totalShuknoWeight)}\n`;
      text += `দিনশেষে শুকনো সুপারি মোট খরচ: ৳ ${toBnNum(totalShuknoSpent.toFixed(2))}\n`;
    } else {
      text += `--- দৈনিক সমন্বিত সুপারি ক্রয় খাতা ---\n`;
      text += `তারিখ: ${dateBn}\n`;
      text += `সর্বমোট চালান: ${toBnNum(entries.length)} জন\n\n`;
      if (kachaEntries.length > 0) {
        text += `[ 🍃 কাঁচা-পাকা সুপারি ]\n`;
        kachaEntries.forEach((e, i) => {
          text += `${toBnNum(i + 1)}. ${e.seller} - ${e.qtyText} | খরচ: ৳ ${toBnNum(e.totalPrice.toFixed(2))}\n`;
        });
        text += `কাঁচা-পাকা উপমোট: ৳ ${toBnNum(totalKachaSpent.toFixed(2))}\n\n`;
      }
      if (shuknoEntries.length > 0) {
        text += `[ 🪵 শুকনো সুপারি ]\n`;
        shuknoEntries.forEach((e, i) => {
          text += `${toBnNum(i + 1)}. ${e.seller} - ${e.qtyText} | খরচ: ৳ ${toBnNum(e.totalPrice.toFixed(2))}\n`;
        });
        text += `শুকনো সুপারি উপমোট: ৳ ${toBnNum(totalShuknoSpent.toFixed(2))}\n\n`;
      }
      text += `--------------------------------\n`;
      text += `দিনশেষে সর্বমোট সর্বসাকুল্যে খরচ: ৳ ${toBnNum(grandTotalSpent.toFixed(2))}\n`;
    }
    text += `\nCreated by Rahat Sharif\n`;

    const ok = await copyToClipboard(text);
    if (ok) onToast('📋 ক্রয় খাতা রিপোর্ট কপি হয়েছে!');
  };

  const handlePrint = () => {
    if (entries.length === 0) return;
    document.body.classList.add('printing-kroy');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-kroy');
    }, 500);
  };

  const buildKroyMemoHtml = () => {
    const dateBn = formatBnDate(activeDate);
    const creatorBadgeHtml = getCreatorBadgeHtml();
    const memoWidth = 780;

    if (currentTab === 'kacha') {
      let tableRows = '';
      kachaEntries.forEach((item, idx) => {
        tableRows += `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
            <td style="padding: 7px 5px; text-align: center; font-weight: 700; color: #64748b;">${toBnNum(idx + 1)}</td>
            <td style="padding: 7px 5px; text-align: center; font-size: 11px; color: #64748b;">${item.time || '-'}</td>
            <td style="padding: 7px 5px; text-align: left; font-weight: 700; color: #0f172a;">${item.seller}</td>
            <td style="padding: 7px 5px; text-align: center; font-weight: 600;">${item.qtyText}</td>
            <td style="padding: 7px 5px; text-align: center; font-size: 11.5px;">
              ৳ ${toBnNum(item.rate ? Math.round(item.rate) : '-')}
              <span style="font-size: 10px; color: #047857;">(${toBnNum(item.rule || kachaRule)} ঘা)</span>
            </td>
            <td style="padding: 7px 5px; text-align: right; font-weight: 700; color: #047857;">৳ ${toBnNum(item.totalPrice.toFixed(2))}</td>
          </tr>
        `;
      });

      return `
        <div style="width: ${memoWidth}px; background: #ffffff; padding: 24px 28px; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; color: #0f172a;">
          <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 14px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #047857;">দৈনিক কাঁচা-পাকা সুপারি ক্রয় খাতা (খরিদ চালান)</h2>
            <div style="font-size: 13.5px; color: #475569; font-weight: 600;">
              তারিখ: <span style="color: #0f172a; font-weight: 700;">${dateBn}</span> | কাঁচা-পাকা সুপারি হিসাব (${toBnNum(kachaRule)} ঘা = ১ কুড়ি)
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
            <thead>
              <tr style="background: #f1f5f9; border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-weight: 700;">
                <th style="padding: 8px 6px; text-align: center; width: 34px;">নং</th>
                <th style="padding: 8px 6px; text-align: center; width: 75px;">সময়</th>
                <th style="padding: 8px 6px; text-align: left;">বিক্রেতা</th>
                <th style="padding: 8px 6px; text-align: center;">পরিমাণ</th>
                <th style="padding: 8px 6px; text-align: center;">দর (৳)</th>
                <th style="padding: 8px 6px; text-align: right; width: 95px;">মোট খরচ (৳)</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>

          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; font-size: 14px; font-weight: 600;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>মোট বিক্রেতা / চালান:</span>
              <strong style="color: #0f172a; font-size: 15px;">${toBnNum(kachaEntries.length)} জন</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #065f46;">
              <span>দিনশেষে মোট কেনা সুপারি (${toBnNum(kachaRule)} ঘা নিয়মে):</span>
              <strong style="font-size: 16px;">${kachaQtyText}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #475569;">
              <span>মোট কুড়ি (দশমিক):</span>
              <strong>${toBnNum(totalKachaKuri.toFixed(2))} কুড়ি</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #047857;">
              <span>গড় দর (প্রতি কুড়ি):</span>
              <strong>৳ ${toBnNum(avgKachaRate.toFixed(2))}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px dashed #cbd5e1; font-size: 20px; font-weight: 800; color: #047857;">
              <span>দিনশেষে কাঁচা-পাকা সর্বমোট খরচ:</span>
              <span>৳ ${toBnNum(totalKachaSpent.toFixed(2))}</span>
            </div>
          </div>

          ${creatorBadgeHtml}
        </div>
      `;
    } else if (currentTab === 'shukno') {
      let tableRows = '';
      shuknoEntries.forEach((item, idx) => {
        tableRows += `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
            <td style="padding: 7px 5px; text-align: center; font-weight: 700; color: #64748b;">${toBnNum(idx + 1)}</td>
            <td style="padding: 7px 5px; text-align: center; font-size: 11px; color: #64748b;">${item.time || '-'}</td>
            <td style="padding: 7px 5px; text-align: left; font-weight: 700; color: #0f172a;">${item.seller}</td>
            <td style="padding: 7px 5px; text-align: center; font-weight: 600;">${item.qtyText}</td>
            <td style="padding: 7px 5px; text-align: center; font-size: 11.5px; color: #92400e;">
              ${item.hajarShotokText || '-'}
              <span style="font-size: 10px; color: #b45309;">(${toBnNum(item.rule || shuknoRule)} কেজি)</span>
            </td>
            <td style="padding: 7px 5px; text-align: center; font-size: 12px;">৳ ${toBnNum(item.rate ? Math.round(item.rate) : '-')}</td>
            <td style="padding: 7px 5px; text-align: right; font-weight: 700; color: #b45309;">৳ ${toBnNum(item.totalPrice.toFixed(2))}</td>
          </tr>
        `;
      });

      return `
        <div style="width: ${memoWidth}px; background: #ffffff; padding: 24px 28px; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; color: #0f172a;">
          <div style="text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 14px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #b45309;">দৈনিক শুকনো সুপারি ক্রয় খাতা (খরিদ চালান)</h2>
            <div style="font-size: 13.5px; color: #475569; font-weight: 600;">
              তারিখ: <span style="color: #0f172a; font-weight: 700;">${dateBn}</span> | শুকনো সুপারি হিসাব (${toBnNum(shuknoRule)} কেজি = ১ হাজার)
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
            <thead>
              <tr style="background: #fef3c7; border-top: 1.5px solid #fcd34d; border-bottom: 1.5px solid #fcd34d; color: #92400e; font-weight: 700;">
                <th style="padding: 8px 6px; text-align: center; width: 34px;">নং</th>
                <th style="padding: 8px 6px; text-align: center; width: 75px;">সময়</th>
                <th style="padding: 8px 6px; text-align: left;">বিক্রেতা</th>
                <th style="padding: 8px 6px; text-align: center;">বস্তা ও ওজন</th>
                <th style="padding: 8px 6px; text-align: center;">ভাঙানো পরিমাণ</th>
                <th style="padding: 8px 6px; text-align: center;">দর (৳)</th>
                <th style="padding: 8px 6px; text-align: right; width: 95px;">মোট খরচ (৳)</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>

          <div style="background: #fffbeb; border: 1.5px solid #fcd34d; border-radius: 12px; padding: 16px 20px; font-size: 14px; font-weight: 600;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>মোট বিক্রেতা / চালান:</span>
              <strong style="color: #0f172a; font-size: 15px;">${toBnNum(shuknoEntries.length)} জন</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #92400e;">
              <span>মোট বস্তার সংখ্যা:</span>
              <strong style="font-size: 16px;">${toBnNum(totalShuknoBags)} টি</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #78350f;">
              <span>সর্বমোট শুকনো ওজন (${toBnNum(shuknoRule)} কেজি নিয়মে):</span>
              <strong>${formatWeightKgGm(totalShuknoWeight)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px dashed #fcd34d; font-size: 20px; font-weight: 800; color: #b45309;">
              <span>দিনশেষে শুকনো সুপারি সর্বমোট খরচ:</span>
              <span>৳ ${toBnNum(totalShuknoSpent.toFixed(2))}</span>
            </div>
          </div>

          ${creatorBadgeHtml}
        </div>
      `;
    } else {
      // COMBINED (ALL)
      let kachaTableHtml = '';
      if (kachaEntries.length > 0) {
        kachaTableHtml = `
          <div style="margin-bottom: 16px;">
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 6px 10px; font-weight: 700; color: #065f46; font-size: 13px; margin-bottom: 6px;">
              🍃 ১. কাঁচা-পাকা সুপারি চালান (উপমোট: ৳ ${toBnNum(totalKachaSpent.toFixed(2))})
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; color: #475569;">
                  <th style="padding: 6px 4px; text-align: center; width: 30px;">নং</th>
                  <th style="padding: 6px 4px; text-align: left;">বিক্রেতা</th>
                  <th style="padding: 6px 4px; text-align: center;">পরিমাণ</th>
                  <th style="padding: 6px 4px; text-align: right;">খরচ (৳)</th>
                </tr>
              </thead>
              <tbody>
                ${kachaEntries
                  .map(
                    (item, idx) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 5px 4px; text-align: center;">${toBnNum(idx + 1)}</td>
                    <td style="padding: 5px 4px; font-weight: 700;">${item.seller}</td>
                    <td style="padding: 5px 4px; text-align: center;">${item.qtyText} <span style="font-size: 10px; color: #047857;">(${toBnNum(item.rule || 21)} ঘা)</span></td>
                    <td style="padding: 5px 4px; text-align: right; font-weight: 700; color: #047857;">৳ ${toBnNum(item.totalPrice.toFixed(2))}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      let shuknoTableHtml = '';
      if (shuknoEntries.length > 0) {
        shuknoTableHtml = `
          <div style="margin-bottom: 16px;">
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 6px 10px; font-weight: 700; color: #92400e; font-size: 13px; margin-bottom: 6px;">
              🪵 ২. শুকনো সুপারি চালান (উপমোট: ৳ ${toBnNum(totalShuknoSpent.toFixed(2))})
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #fef3c7; border-bottom: 1.5px solid #fcd34d; color: #92400e;">
                  <th style="padding: 6px 4px; text-align: center; width: 30px;">নং</th>
                  <th style="padding: 6px 4px; text-align: left;">বিক্রেতা</th>
                  <th style="padding: 6px 4px; text-align: center;">ওজন ও বস্তা</th>
                  <th style="padding: 6px 4px; text-align: right;">খরচ (৳)</th>
                </tr>
              </thead>
              <tbody>
                ${shuknoEntries
                  .map(
                    (item, idx) => `
                  <tr style="border-bottom: 1px solid #fef3c7;">
                    <td style="padding: 5px 4px; text-align: center;">${toBnNum(idx + 1)}</td>
                    <td style="padding: 5px 4px; font-weight: 700;">${item.seller}</td>
                    <td style="padding: 5px 4px; text-align: center;">${item.qtyText} <span style="font-size: 10px; color: #b45309;">(${toBnNum(item.rule || 82)} কেজি)</span></td>
                    <td style="padding: 5px 4px; text-align: right; font-weight: 700; color: #b45309;">৳ ${toBnNum(item.totalPrice.toFixed(2))}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      return `
        <div style="width: ${memoWidth}px; background: #ffffff; padding: 24px 28px; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; color: #0f172a;">
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #0f172a;">দৈনিক সমন্বিত সুপারি ক্রয় খাতা (খরিদ চালান)</h2>
            <div style="font-size: 13.5px; color: #475569; font-weight: 600;">
              তারিখ: <span style="color: #0f172a; font-weight: 700;">${dateBn}</span> | কাঁচা-পাকা ও শুকনো সুপারি সম্মিলিত হিসাব
            </div>
          </div>

          ${kachaTableHtml}
          ${shuknoTableHtml}

          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; font-size: 14px; font-weight: 600;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>মোট বিক্রেতা / চালান:</span>
              <strong style="color: #0f172a; font-size: 15px;">${toBnNum(entries.length)} জন</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #065f46;">
              <span>কাঁচা-পাকা সুপারি উপমোট খরচ:</span>
              <strong>৳ ${toBnNum(totalKachaSpent.toFixed(2))}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #92400e;">
              <span>শুকনো সুপারি উপমোট খরচ:</span>
              <strong>৳ ${toBnNum(totalShuknoSpent.toFixed(2))}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px dashed #cbd5e1; font-size: 20px; font-weight: 800; color: #1d4ed8;">
              <span>দিনশেষে সর্বমোট সর্বসাকুল্যে খরচ:</span>
              <span>৳ ${toBnNum(grandTotalSpent.toFixed(2))}</span>
            </div>
          </div>

          ${creatorBadgeHtml}
        </div>
      `;
    }
  };

  const handleDownloadJPG = async () => {
    if (entries.length === 0) {
      onToast('⚠️ সেভ করার জন্য এই তারিখে কোনো ক্রয় হিসাব নেই');
      return;
    }
    let fileName = `Supari_Kroy_Khata_${activeDate}.jpg`;
    if (currentTab === 'kacha') fileName = `Kacha_Paka_Kroy_Khata_${activeDate}.jpg`;
    else if (currentTab === 'shukno') fileName = `Shukno_Supari_Kroy_Khata_${activeDate}.jpg`;
    else fileName = `Supari_Kroy_Khata_Sompadito_${activeDate}.jpg`;

    onToast('⏳ মেমো ছবি তৈরি হচ্ছে...');
    try {
      const html = buildKroyMemoHtml();
      const res = await renderMemoHtmlToImage(html, fileName, 780);
      onShowImagePreview(res);
      onToast('🖼️ JPG রসিদ প্রস্তুত হয়েছে!');
    } catch {
      onToast('⚠️ মেমো ছবি তৈরিতে সমস্যা হয়েছে');
    }
  };

  // Live calculation previews for direct forms
  const liveKachaTiPerKuri = kachaRule * tiPerGha;
  const liveKachaTotalTi =
    parseBnFloat(kachaKuri) * liveKachaTiPerKuri +
    parseBnFloat(kachaGha) * tiPerGha +
    parseBnFloat(kachaTi);
  const liveKachaRateNum = parseBnFloat(kachaRate);
  const liveKachaTotalPrice =
    liveKachaTotalTi > 0 && liveKachaRateNum > 0
      ? (liveKachaTotalTi / liveKachaTiPerKuri) * liveKachaRateNum
      : 0;

  // Live rate check calculation preview
  const liveKachaTotalPriceInputVal = parseBnFloat(kachaTotalPriceInput);
  const liveKachaCheckRatePerKuri =
    liveKachaTotalTi > 0 && liveKachaTotalPriceInputVal > 0
      ? (liveKachaTotalPriceInputVal / (liveKachaTotalTi / liveKachaTiPerKuri))
      : 0;
  const liveKachaCheckRatePerGha =
    liveKachaCheckRatePerKuri > 0 ? liveKachaCheckRatePerKuri / kachaRule : 0;

  const liveShuknoWeight = parseBnFloat(shuknoKg) + parseBnFloat(shuknoGm) / 1000;
  const liveShuknoRateNum = parseBnFloat(shuknoRate);
  const liveShuknoPrice =
    liveShuknoWeight > 0 && liveShuknoRateNum > 0
      ? (liveShuknoWeight / shuknoRule) * liveShuknoRateNum
      : 0;

  const isToday = activeDate === getTodayDateStr();
  const dateBn = formatBnDate(activeDate);

  return (
    <div className="view-panel active">
      {/* Date Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
        className="no-print"
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            খাতার তারিখ
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#065f46' }}>
            {isToday ? `আজকের খাতা (${dateBn})` : dateBn}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="date"
            className="std-input"
            style={{ padding: '6px 10px', fontSize: '13px', margin: 0, width: 'auto' }}
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={() => setActiveDate(getTodayDateStr())}
            style={{ padding: '6px 12px', fontSize: '12.5px', margin: 0, whiteSpace: 'nowrap' }}
          >
            আজকে
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="segmented-tabs no-print" style={{ marginBottom: '14px' }}>
        <button
          className={`tab-item ${currentTab === 'kacha' ? 'active' : ''}`}
          onClick={() => setCurrentTab('kacha')}
        >
          🍃 কাঁচা-পাকা সুপারি
        </button>
        <button
          className={`tab-item ${currentTab === 'shukno' ? 'active' : ''}`}
          onClick={() => setCurrentTab('shukno')}
        >
          🪵 শুকনো সুপারি
        </button>
        <button
          className={`tab-item ${currentTab === 'all' ? 'active' : ''}`}
          onClick={() => setCurrentTab('all')}
        >
          📊 সর্বমোট (উভয়)
        </button>
      </div>

      {/* Dashboards */}
      {currentTab === 'kacha' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }} className="no-print">
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1.5px solid #a7f3d0', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(5,150,105,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🍃</span> <span>মোট কাঁচা-পাকা সুপারি</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#047857', lineHeight: 1.3 }}>
              {kachaQtyText}
            </div>
            <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600, marginTop: '3px' }}>
              দশমিক: {toBnNum(totalKachaKuri.toFixed(2))} কুড়ি
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(37,99,235,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>💰</span> <span>কাঁচা-পাকা মোট খরচ</span>
            </div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: '#1d4ed8', lineHeight: 1.3 }}>
              ৳ {toBnNum(Math.round(totalKachaSpent).toLocaleString('en-IN'))}
            </div>
            <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: 600, marginTop: '3px' }}>
              বিক্রেতা: {toBnNum(kachaEntries.length)} জন | গড়: ৳{toBnNum(Math.round(avgKachaRate).toLocaleString('en-IN'))}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'shukno' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }} className="no-print">
          <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1.5px solid #fcd34d', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(180,83,9,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🪵</span> <span>মোট কেনা শুকনো সুপারি</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#78350f', lineHeight: 1.3 }}>
              {formatWeightKgGm(totalShuknoWeight)}
            </div>
            <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 600, marginTop: '3px' }}>
              {shuknoBreakdownText}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(220,38,38,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>💰</span> <span>শুকনো বাবদ মোট খরচ</span>
            </div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: '#b91c1c', lineHeight: 1.3 }}>
              ৳ {toBnNum(Math.round(totalShuknoSpent).toLocaleString('en-IN'))}
            </div>
            <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 600, marginTop: '3px' }}>
              বিক্রেতা: {toBnNum(shuknoEntries.length)} জন | বস্তা: {toBnNum(totalShuknoBags)} টি
            </div>
          </div>
        </div>
      )}

      {currentTab === 'all' && (
        <div style={{ marginBottom: '16px' }} className="no-print">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '12px', padding: '11px 12px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#065f46' }}>🍃 কাঁচা-পাকা সুপারি</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#047857' }}>{kachaQtyText}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                খরচ: ৳ {toBnNum(Math.round(totalKachaSpent).toLocaleString('en-IN'))}
              </div>
            </div>
            <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: '12px', padding: '11px 12px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#92400e' }}>🪵 শুকনো সুপারি</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#78350f' }}>{formatWeightKgGm(totalShuknoWeight)}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', marginTop: '2px' }}>
                খরচ: ৳ {toBnNum(Math.round(totalShuknoSpent).toLocaleString('en-IN'))}
              </div>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #93c5fd', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>💰 দিনশেষে সর্বমোট সর্বসাকুল্যে খরচ</div>
              <div style={{ fontSize: '11.5px', color: '#2563eb' }}>মোট বিক্রেতা / চালান: {toBnNum(entries.length)} জন</div>
            </div>
            <div style={{ fontSize: '21px', fontWeight: 800, color: '#1d4ed8' }}>
              ৳ {toBnNum(Math.round(grandTotalSpent).toLocaleString('en-IN'))}
            </div>
          </div>
        </div>
      )}

      {/* Direct Entry Form: Kacha */}
      {(currentTab === 'kacha' || currentTab === 'all') && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }} className="no-print">
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🍃</span> <span>কাঁচা-পাকা সুপারি সরাসরি ক্রয় এন্ট্রি</span>
            </span>
            <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              কুড়ি/ঘা/টি হিসাব
            </span>
          </div>

          {/* Mode Switch: Standard vs Rate Check */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setKachaEntryMode('regular')}
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                border: `1.5px solid ${kachaEntryMode === 'regular' ? '#10b981' : '#e2e8f0'}`,
                background: kachaEntryMode === 'regular' ? '#ecfdf5' : '#ffffff',
                color: kachaEntryMode === 'regular' ? '#065f46' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📝 সাধারণ এন্ট্রি (দর দিয়ে)
            </button>
            <button
              type="button"
              onClick={() => setKachaEntryMode('rate-check')}
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                border: `1.5px solid ${kachaEntryMode === 'rate-check' ? '#10b981' : '#e2e8f0'}`,
                background: kachaEntryMode === 'rate-check' ? '#ecfdf5' : '#ffffff',
                color: kachaEntryMode === 'rate-check' ? '#065f46' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔍 দর যাচাই করে এন্ট্রি (মোট টাকায়)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', marginBottom: '10px' }}>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>বিক্রেতা / গ্রাহকের নাম (ঐচ্ছিক)</label>
              <input
                type="text"
                placeholder="যেমন: সালাম বেপারি বা করিম মিয়া"
                value={kachaSeller}
                onChange={(e) => setKachaSeller(e.target.value)}
              />
            </div>
            <div className="input-box">
              <label style={{ fontSize: '12px', fontWeight: 700 }}>হিসাবের নিয়ম</label>
              <select
                className="std-input"
                style={{ height: '44px', padding: '6px 8px', fontSize: '13px', fontWeight: 700 }}
                value={kachaRule}
                onChange={(e) => setKachaRule(parseInt(e.target.value, 10))}
              >
                <option value={21}>২১ ঘা = ১ কুড়ি</option>
                <option value={20}>২০ ঘা = ১ কুড়ি</option>
              </select>
            </div>
          </div>

          <div className="grid-inputs" style={{ marginBottom: '10px' }}>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>কুড়ি</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={kachaKuri}
                onChange={(e) => setKachaKuri(cleanBnInput(e.target.value))}
              />
            </div>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>ঘা</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={kachaGha}
                onChange={(e) => setKachaGha(cleanBnInput(e.target.value))}
              />
            </div>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>টি (পিস)</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={kachaTi}
                onChange={(e) => setKachaTi(cleanBnInput(e.target.value))}
              />
            </div>
          </div>

          {kachaEntryMode === 'regular' ? (
            <>
              <div className="input-box rate-box-wrapper" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: 0 }}>প্রতি কুড়ির দর (৳)</label>
                  {liveKachaRateNum > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                      ১ ঘা = ৳ {toBnNum((liveKachaRateNum / kachaRule).toFixed(2))}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="০"
                  inputMode="decimal"
                  value={kachaRate}
                  onChange={(e) => setKachaRate(cleanBnInput(e.target.value))}
                />
              </div>

              {liveKachaTotalPrice > 0 && (
                <div style={{ display: 'flex', background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: '#065f46', fontWeight: 600 }}>হিসাবকৃত মোট খরচ:</span>
                  <strong style={{ fontSize: '16px', color: '#047857' }}>৳ {toBnNum(liveKachaTotalPrice.toFixed(2))}</strong>
                </div>
              )}

              <button className="btn btn-primary" onClick={handleAddDirectKacha} style={{ width: '100%' }}>
                <ShoppingCart className="w-4 h-4 mr-1" />
                কাঁচা-পাকা ক্রয় খাতায় জমা করুন
              </button>
            </>
          ) : (
            <>
              <div className="input-box rate-box-wrapper" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: 0 }}>উক্ত পরিমাণের মোট দাম (৳)</label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>স্বয়ংক্রিয় দর যাচাই</span>
                </div>
                <input
                  type="text"
                  placeholder="উক্ত পরিমাণের মোট টাকা লিখুন"
                  inputMode="decimal"
                  value={kachaTotalPriceInput}
                  onChange={(e) => setKachaTotalPriceInput(cleanBnInput(e.target.value))}
                />
              </div>

              {liveKachaCheckRatePerKuri > 0 && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12.5px' }}>
                    <span style={{ color: '#065f46' }}>যাচাইকৃত ১ কুড়ির দর:</span>
                    <strong style={{ color: '#dc2626', fontSize: '14px' }}>
                      ৳ {toBnNum(Math.round(liveKachaCheckRatePerKuri))} / কুড়ি
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px dashed #a7f3d0', paddingTop: '4px' }}>
                    <span style={{ color: '#065f46' }}>প্রতি ঘার দর:</span>
                    <strong style={{ color: '#047857' }}>৳ {toBnNum(liveKachaCheckRatePerGha.toFixed(2))}</strong>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleAddRateCheckedKacha}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 3px 8px rgba(5,150,105,0.25)',
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                🔍 দর যাচাই করে ক্রয় খাতায় জমা করুন
              </button>
            </>
          )}
        </div>
      )}

      {/* Direct Entry Form: Shukno */}
      {currentTab === 'shukno' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }} className="no-print">
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🪵</span> <span>শুকনো সুপারি সরাসরি ক্রয় এন্ট্রি</span>
            </span>
            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              ওজন ও হাজার হিসাব
            </span>
          </div>

          <div className="input-box" style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px' }}>বিক্রেতা / গ্রাহকের নাম (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="যেমন: খলিল ব্যাপারী বা করিম আড়তদার"
              value={shuknoSeller}
              onChange={(e) => setShuknoSeller(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', marginBottom: '10px' }}>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>হিসাবের নিয়ম</label>
              <select
                className="std-input"
                style={{ height: '44px', padding: '6px 8px', fontSize: '13px', fontWeight: 700 }}
                value={shuknoRule}
                onChange={(e) => setShuknoRule(parseInt(e.target.value, 10))}
              >
                <option value={82}>৮২ কেজি = ১ হাজার</option>
                <option value={80}>৮০ কেজি = ১ হাজার</option>
              </select>
            </div>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>বস্তার সংখ্যা</label>
              <input
                type="text"
                placeholder="১"
                inputMode="numeric"
                value={shuknoBags}
                onChange={(e) => setShuknoBags(cleanBnInput(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>কেজি</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={shuknoKg}
                onChange={(e) => setShuknoKg(cleanBnInput(e.target.value))}
              />
            </div>
            <div className="input-box">
              <label style={{ fontSize: '12px' }}>গ্রাম</label>
              <input
                type="text"
                placeholder="০"
                inputMode="numeric"
                value={shuknoGm}
                onChange={(e) => setShuknoGm(cleanBnInput(e.target.value))}
              />
            </div>
          </div>

          <div className="input-box rate-box-wrapper" style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '3px' }}>প্রতি হাজারের দর (৳)</label>
            <input
              type="text"
              placeholder="০"
              inputMode="decimal"
              value={shuknoRate}
              onChange={(e) => setShuknoRate(cleanBnInput(e.target.value))}
            />
          </div>

          {liveShuknoPrice > 0 && (
            <div style={{ display: 'flex', background: '#fffbeb', border: '1px dashed #fcd34d', borderRadius: '8px', padding: '9px 12px', marginBottom: '12px', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#78350f', fontWeight: 700 }}>হিসাবকৃত মোট খরচ:</span>
                <strong style={{ fontSize: '16px', color: '#b45309' }}>
                  ৳ {toBnNum(Math.round(liveShuknoPrice).toLocaleString('en-IN'))}
                </strong>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleAddDirectShukno}
            style={{ width: '100%', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            শুকনো সুপারি ক্রয় খাতায় জমা করুন
          </button>
        </div>
      )}

      {/* Receipt / Table Section */}
      <div className="receipt-section" id="kroyExportArea">
        <div className="receipt-header">
          <h3>
            {currentTab === 'kacha'
              ? 'দৈনিক কাঁচা-পাকা সুপারি ক্রয় খাতা (খরিদ চালান)'
              : currentTab === 'shukno'
              ? 'দৈনিক শুকনো সুপারি ক্রয় খাতা (খরিদ চালান)'
              : 'দৈনিক সমন্বিত সুপারি ক্রয় খাতা (উভয় হিসাব)'}
          </h3>
          <p>
            তারিখ: <span>{dateBn}</span> | আড়ত / পাইকারি হিসাব
          </p>
        </div>

        {/* Dynamic Tables */}
        {currentTab === 'kacha' && (
          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ width: '34px' }}>নং</th>
                <th>সময়</th>
                <th>বিক্রেতা</th>
                <th>পরিমাণ</th>
                <th>দর (৳)</th>
                <th>মোট খরচ (৳)</th>
                <th className="action-col no-print" style={{ width: '60px' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {kachaEntries.map((item, idx) => (
                <tr key={item.id}>
                  <td>{toBnNum(idx + 1)}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.time || '-'}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.seller}</td>
                  <td style={{ fontWeight: 600 }}>{item.qtyText}</td>
                  <td style={{ fontSize: '12px' }}>
                    ৳ {toBnNum(item.rate ? Math.round(item.rate) : '-')}
                    <div style={{ fontSize: '10.5px', color: '#047857', fontWeight: 600 }}>
                      {toBnNum(item.rule || 21)} ঘা/কুড়ি
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#047857' }}>৳ {toBnNum(item.totalPrice.toFixed(2))}</td>
                  <td className="action-cell no-print">
                    <div className="table-actions">
                      <button className="icon-btn-table" onClick={() => handleEditItem(item.originalIndex)} title="এডিট">
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button className="icon-btn-table" onClick={() => handleDeleteItem(item.originalIndex)} title="মুছুন">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentTab === 'shukno' && (
          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ width: '34px' }}>নং</th>
                <th>সময়</th>
                <th>বিক্রেতা</th>
                <th>বস্তা ও ওজন</th>
                <th>ভাঙানো পরিমাণ</th>
                <th>দর (৳)</th>
                <th>মোট খরচ (৳)</th>
                <th className="action-col no-print" style={{ width: '60px' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {shuknoEntries.map((item, idx) => (
                <tr key={item.id}>
                  <td>{toBnNum(idx + 1)}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.time || '-'}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.seller}</td>
                  <td style={{ fontWeight: 600 }}>{item.qtyText}</td>
                  <td style={{ fontSize: '12px', color: '#78350f' }}>
                    {item.hajarShotokText || '-'}
                    <div style={{ fontSize: '10.5px', color: '#b45309', fontWeight: 600 }}>
                      {toBnNum(item.rule || 82)} কেজি/হাজার
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>৳ {toBnNum(item.rate ? Math.round(item.rate) : '-')}</td>
                  <td style={{ fontWeight: 700, color: '#b45309' }}>৳ {toBnNum(item.totalPrice.toFixed(2))}</td>
                  <td className="action-cell no-print">
                    <div className="table-actions">
                      <button className="icon-btn-table" onClick={() => handleEditItem(item.originalIndex)} title="এডিট">
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button className="icon-btn-table" onClick={() => handleDeleteItem(item.originalIndex)} title="মুছুন">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentTab === 'all' && (
          <div>
            {kachaEntries.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '7px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#065f46' }}>
                  <span>🍃 ১. কাঁচা-পাকা সুপারি চালান ({toBnNum(kachaEntries.length)}টি)</span>
                  <span>মোট: ৳ {toBnNum(totalKachaSpent.toFixed(2))}</span>
                </div>
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>নং</th>
                      <th>সময়</th>
                      <th>বিক্রেতা</th>
                      <th>পরিমাণ</th>
                      <th>দর (৳)</th>
                      <th>খরচ (৳)</th>
                      <th className="action-col no-print" style={{ width: '60px' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kachaEntries.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{toBnNum(idx + 1)}</td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.time || '-'}</td>
                        <td style={{ fontWeight: 700 }}>{item.seller}</td>
                        <td>{item.qtyText}</td>
                        <td style={{ fontSize: '12px' }}>
                          ৳ {toBnNum(item.rate ? Math.round(item.rate) : '-')}
                          <span style={{ fontSize: '10.5px', color: '#047857', fontWeight: 600 }}>
                            ({toBnNum(item.rule || 21)} ঘা)
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#047857' }}>৳ {toBnNum(item.totalPrice.toFixed(2))}</td>
                        <td className="action-cell no-print">
                          <div className="table-actions">
                            <button className="icon-btn-table" onClick={() => handleEditItem(item.originalIndex)} title="এডিট">
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button className="icon-btn-table" onClick={() => handleDeleteItem(item.originalIndex)} title="মুছুন">
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {shuknoEntries.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '7px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                  <span>🪵 ২. শুকনো সুপারি চালান ({toBnNum(shuknoEntries.length)}টি)</span>
                  <span>মোট: ৳ {toBnNum(totalShuknoSpent.toFixed(2))}</span>
                </div>
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>নং</th>
                      <th>সময়</th>
                      <th>বিক্রেতা</th>
                      <th>ওজন ও পরিমাণ</th>
                      <th>দর (৳)</th>
                      <th>খরচ (৳)</th>
                      <th className="action-col no-print" style={{ width: '60px' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shuknoEntries.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{toBnNum(idx + 1)}</td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.time || '-'}</td>
                        <td style={{ fontWeight: 700 }}>{item.seller}</td>
                        <td>
                          {item.qtyText}
                          <div style={{ fontSize: '11px', color: '#78350f' }}>{item.hajarShotokText || ''}</div>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          ৳ {toBnNum(item.rate ? Math.round(item.rate) : '-')}
                          <span style={{ fontSize: '10.5px', color: '#b45309', fontWeight: 600 }}>
                            ({toBnNum(item.rule || 82)} কেজি)
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#b45309' }}>৳ {toBnNum(item.totalPrice.toFixed(2))}</td>
                        <td className="action-cell no-print">
                          <div className="table-actions">
                            <button className="icon-btn-table" onClick={() => handleEditItem(item.originalIndex)} title="এডিট">
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button className="icon-btn-table" onClick={() => handleDeleteItem(item.originalIndex)} title="মুছুন">
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {((currentTab === 'kacha' && kachaEntries.length === 0) ||
          (currentTab === 'shukno' && shuknoEntries.length === 0) ||
          (currentTab === 'all' && entries.length === 0)) && (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            📭 এই তারিখে কোনো{' '}
            {currentTab === 'kacha'
              ? 'কাঁচা-পাকা'
              : currentTab === 'shukno'
              ? 'শুকনো'
              : ''}{' '}
            সুপারি ক্রয় করা হয়নি।
          </div>
        )}

        {/* Summary Card */}
        {entries.length > 0 && (
          <div className="summary-card">
            {currentTab === 'kacha' && kachaEntries.length > 0 && (
              <>
                <div className="summary-row">
                  <span>মোট বিক্রেতা / চালান:</span>
                  <strong>{toBnNum(kachaEntries.length)} জন</strong>
                </div>
                <div className="summary-row" style={{ color: '#065f46' }}>
                  <span>দিনশেষে মোট কেনা সুপারি ({toBnNum(kachaRule)} ঘা নিয়মে):</span>
                  <strong>{kachaQtyText}</strong>
                </div>
                <div className="summary-row" style={{ color: '#475569' }}>
                  <span>মোট কুড়ি (দশমিক):</span>
                  <strong>{toBnNum(totalKachaKuri.toFixed(2))} কুড়ি</strong>
                </div>
                <div className="summary-row" style={{ color: '#047857' }}>
                  <span>গড় দর (প্রতি কুড়ি):</span>
                  <strong>৳ {toBnNum(avgKachaRate.toFixed(2))}</strong>
                </div>
                <div className="summary-row total-row">
                  <span>দিনশেষে কাঁচা-পাকা বাবদ সর্বমোট খরচ:</span>
                  <strong>৳ {toBnNum(totalKachaSpent.toFixed(2))}</strong>
                </div>
              </>
            )}

            {currentTab === 'shukno' && shuknoEntries.length > 0 && (
              <>
                <div className="summary-row">
                  <span>মোট বিক্রেতা / চালান:</span>
                  <strong>{toBnNum(shuknoEntries.length)} জন</strong>
                </div>
                <div className="summary-row" style={{ color: '#92400e' }}>
                  <span>মোট বস্তার সংখ্যা:</span>
                  <strong>{toBnNum(totalShuknoBags)} টি</strong>
                </div>
                <div className="summary-row" style={{ color: '#78350f' }}>
                  <span>সর্বমোট শুকনো ওজন:</span>
                  <strong>{formatWeightKgGm(totalShuknoWeight)}</strong>
                </div>
                <div className="summary-row" style={{ color: '#475569' }}>
                  <span>ভাঙানো পরিমাণ ({toBnNum(shuknoRule)} কেজি নিয়মে):</span>
                  <strong>{shuknoBreakdownText}</strong>
                </div>
                <div className="summary-row total-row" style={{ color: '#b91c1c' }}>
                  <span>দিনশেষে শুকনো সুপারি বাবদ মোট খরচ:</span>
                  <strong>৳ {toBnNum(totalShuknoSpent.toFixed(2))}</strong>
                </div>
              </>
            )}

            {currentTab === 'all' && (
              <>
                <div className="summary-row">
                  <span>মোট বিক্রেতা / সর্বমোট চালান:</span>
                  <strong>{toBnNum(entries.length)} জন</strong>
                </div>
                <div className="summary-row" style={{ color: '#065f46' }}>
                  <span>কাঁচা-পাকা ক্রয় খরচ:</span>
                  <strong>৳ {toBnNum(totalKachaSpent.toFixed(2))} ({kachaQtyText})</strong>
                </div>
                <div className="summary-row" style={{ color: '#92400e' }}>
                  <span>শুকনো সুপারি ক্রয় খরচ:</span>
                  <strong>৳ {toBnNum(totalShuknoSpent.toFixed(2))} ({formatWeightKgGm(totalShuknoWeight)})</strong>
                </div>
                <div className="summary-row total-row">
                  <span>দিনশেষে সর্বমোট সর্বসাকুল্যে খরচ:</span>
                  <strong>৳ {toBnNum(grandTotalSpent.toFixed(2))}</strong>
                </div>
              </>
            )}
          </div>
        )}

        <CreatorBadge />
      </div>

      {/* Export buttons */}
      {entries.length > 0 && (
        <div className="export-grid no-print" style={{ marginTop: '14px' }}>
          <button className="btn btn-copy" onClick={handleCopyReport}>
            <Copy className="w-4 h-4 mr-1" /> রিপোর্ট কপি
          </button>
          <button className="btn btn-jpg" onClick={handleDownloadJPG}>
            <Image className="w-4 h-4 mr-1" /> JPG সেভ
          </button>
          <button className="btn btn-print" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> প্রিন্ট করুন
          </button>
          <button className="btn btn-clear-all" onClick={handleResetKroy}>
            <Trash2 className="w-4 h-4 mr-1 inline" /> এই খাতা মুছুন
          </button>
        </div>
      )}
    </div>
  );
};
