import React from 'react';
import { Smartphone, X } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          maxWidth: '380px',
          width: '94%',
          textAlign: 'left',
          borderRadius: '18px',
          padding: '20px',
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
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <span>অ্যাপ ইনস্টল নির্দেশিকা</span>
          </h4>
          <button
            onClick={onClose}
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

        <p
          style={{
            fontSize: '13px',
            color: '#475569',
            margin: '0 0 12px',
            lineHeight: 1.5,
          }}
        >
          আইফোন বা সাফারিতে অ্যাপ হিসেবে ইনস্টল করতে নিচের ৩টি ধাপ অনুসরণ করুন:
        </p>

        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '12.5px',
            lineHeight: 1.6,
            color: '#1e293b',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '10px',
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                background: '#10b981',
                color: 'white',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              ১
            </span>
            <div>
              সাফারি ব্রাউজারের নিচে <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '10px',
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                background: '#10b981',
                color: 'white',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              ২
            </span>
            <div>
              তালিকা থেকে <strong>'Add to Home Screen'</strong> (হোম স্ক্রিনে যোগ করুন) নির্বাচন করুন।
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span
              style={{
                background: '#10b981',
                color: 'white',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              ৩
            </span>
            <div>
              উপরে ডানপাশে <strong>'Add'</strong> চাপলেই অ্যাপটি মোবাইলে সেভ হয়ে যাবে।
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '11px', fontWeight: 700, borderRadius: '10px', fontSize: '14px' }}
        >
          ঠিক আছে, বুঝেছি
        </button>
      </div>
    </div>
  );
};
