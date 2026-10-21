import React, { useState, useEffect } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { PendingKroyItem } from '../types';
import { toBnNum } from '../utils/bengali';

interface KroyConfirmModalProps {
  pendingItem: PendingKroyItem;
  onConfirm: (sellerName: string) => void;
  onCancel: () => void;
}

export const KroyConfirmModal: React.FC<KroyConfirmModalProps> = ({
  pendingItem,
  onConfirm,
  onCancel,
}) => {
  const [sellerName, setSellerName] = useState('');

  useEffect(() => {
    setSellerName('');
  }, [pendingItem]);

  return (
    <div className="modal-overlay show" onClick={onCancel}>
      <div
        className="modal-box"
        style={{
          maxWidth: '400px',
          width: '94%',
          textAlign: 'left',
          borderRadius: '16px',
          padding: '18px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '8px',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 800,
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>সুপারি ক্রয় নিশ্চিতকরণ</span>
          </h4>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 1,
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #a7f3d0',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '13px',
            }}
          >
            <span style={{ color: '#64748b' }}>সুপারির পরিমাণ:</span>
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              {pendingItem.qtyText}
              {pendingItem.hajarShotokText ? ` [${pendingItem.hajarShotokText}]` : ''}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '13px',
            }}
          >
            <span style={{ color: '#64748b' }}>দর:</span>
            <strong style={{ color: '#0f172a' }}>{pendingItem.rateText}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '8px',
              borderTop: '1px dashed #6ee7b7',
              fontSize: '17px',
              fontWeight: 800,
              color: '#047857',
            }}
          >
            <span>মোট মূল্য (খরচ):</span>
            <span>৳ {toBnNum(Math.round(pendingItem.totalPrice).toLocaleString('en-IN'))}</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '6px',
              display: 'block',
            }}
          >
            বিক্রেতার নাম বা পরিচয় (ঐচ্ছিক):
          </label>
          <input
            type="text"
            className="std-input"
            placeholder="যেমন: রহিম মিয়া বা লট নং"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div className="modal-buttons" style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-modal-cancel"
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
          >
            বাতিল
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(sellerName.trim() || 'সাধারণ বিক্রেতা')}
            style={{ flex: 2, padding: '10px', fontWeight: 700, borderRadius: '8px' }}
          >
            ✅ ক্রয় খাতায় যোগ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
