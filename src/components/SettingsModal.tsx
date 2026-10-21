import React from 'react';
import { Settings2, X, ShoppingBag, Check, Shield } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kroyKhataEnabled: boolean;
  onToggleKroyKhata: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  kroyKhataEnabled,
  onToggleKroyKhata,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay show no-print" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          maxWidth: '420px',
          width: '94%',
          textAlign: 'left',
          borderRadius: '18px',
          padding: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <Settings2 className="w-5 h-5" />
            </div>
            <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              অ্যাপ সেটিংস
            </h4>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting Card: দৈনিক সুপারি ক্রয় খাতা */}
        <div
          style={{
            background: kroyKhataEnabled ? '#f0fdf4' : '#f8fafc',
            border: `1.5px solid ${kroyKhataEnabled ? '#86efac' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '14px',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: kroyKhataEnabled ? '#10b981' : '#cbd5e1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.25s ease',
                }}
              >
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                  দৈনিক সুপারি ক্রয় খাতা
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.35 }}>
                  ক্রয় চালান ট্র্যাকিং, বিক্রেতার তালিকা ও দিনশেষের মোট খরচের হিসাব
                </div>
              </div>
            </div>

            {/* Custom Modern Toggle Switch */}
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '28px',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={kroyKhataEnabled}
                onChange={(e) => onToggleKroyKhata(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: kroyKhataEnabled ? '#10b981' : '#cbd5e1',
                  borderRadius: '28px',
                  transition: '0.25s ease',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    height: '22px',
                    width: '22px',
                    left: kroyKhataEnabled ? '25px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </span>
            </label>
          </div>

          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11.5px',
            }}
          >
            <span style={{ color: '#64748b' }}>ফিচার স্ট্যাটাস:</span>
            <span
              style={{
                fontWeight: 800,
                color: kroyKhataEnabled ? '#047857' : '#64748b',
                background: kroyKhataEnabled ? '#dcfce7' : '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {kroyKhataEnabled ? '✓ সক্রিয় (ON)' : '✕ বন্ধ (OFF)'}
            </span>
          </div>
        </div>

        {/* Helpful Tip */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#92400e',
            marginBottom: '16px',
            display: 'flex',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '15px' }}>💡</span>
          <div>
            <strong>টিপস:</strong> আপনি যদি শুধু কেনা-বেচার সাধারণ হিসাব করতে চান তবে এটি বন্ধ
            রাখতে পারেন। বন্ধ রাখলে হোম স্ক্রিন ও ক্যালকুলেটর থেকে ক্রয় খাতার অতিরিক্ত বাটনগুলো লুকানো
            থাকবে।
          </div>
        </div>

        {/* Close Button */}
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '11px', fontWeight: 700, borderRadius: '10px', fontSize: '14px' }}
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
};
