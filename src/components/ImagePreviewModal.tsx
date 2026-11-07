import React, { useState } from 'react';
import { Download, Share2, X, Check } from 'lucide-react';
import { RenderMemoResult, saveOrDownloadImage, shareMemoImage } from '../utils/exportMemo';

interface ImagePreviewModalProps {
  data: RenderMemoResult | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  data,
  onClose,
  onToast,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!data) return null;

  const handleDownload = async () => {
    if (isSaving) return;
    setIsSaving(true);
    onToast('⏳ মেমো রসিদ সেভ হচ্ছে...');
    try {
      const res = await saveOrDownloadImage(data);
      onToast(res.message);
      if (res.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch {
      onToast('⚠️ সেভ করা যায়নি');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    onToast('⏳ শেয়ার উইন্ডো ওপেন হচ্ছে...');
    try {
      const res = await shareMemoImage(data);
      if (!res.success) {
        onToast(res.message);
      }
    } catch {
      onToast('⚠️ শেয়ার করা যায়নি');
    }
  };

  return (
    <div className="modal-overlay show" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-box"
        style={{
          maxWidth: '520px',
          width: '94%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          borderRadius: '16px',
          textAlign: 'left',
          background: '#ffffff',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '8px',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🖼️</span> <span>মেমো ছবি প্রস্তুত হয়েছে</span>
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
              padding: '4px 8px',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            textAlign: 'center',
            marginBottom: '10px',
            background: '#f8fafc',
            borderRadius: '10px',
            padding: '6px',
            border: '1.5px dashed #cbd5e1',
          }}
        >
          <img
            src={data.dataUrl}
            alt="সুপারি মেমো"
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '6px',
              display: 'block',
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '11.5px',
            color: '#475569',
            textAlign: 'center',
            marginBottom: '12px',
            lineHeight: 1.4,
            background: '#f1f5f9',
            padding: '6px 10px',
            borderRadius: '8px',
          }}
        >
          💡 গ্যালারিতে সেভ বা WhatsApp-এ পাঠাতে নিচের বাটনে চাপুন অথবা ছবিতে চাপ দিয়ে ধরে{' '}
          <strong>'Download image'</strong> দিন।
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownload}
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              flex: 2,
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px',
              fontWeight: 800,
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              cursor: isSaving ? 'wait' : 'pointer',
            }}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : isSaved ? 'সেভ হয়েছে!' : 'JPG ডাউনলোড ও সেভ'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleShare}
            style={{
              flex: 1,
              minWidth: '90px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '12px',
              fontWeight: 700,
              borderRadius: '10px',
              fontSize: '14px',
            }}
          >
            <Share2 className="w-4 h-4" />
            <span>শেয়ার</span>
          </button>

          <button
            className="btn btn-modal-cancel"
            onClick={onClose}
            style={{
              flex: 1,
              minWidth: '70px',
              padding: '12px',
              fontWeight: 700,
              borderRadius: '10px',
              fontSize: '14px',
            }}
          >
            বন্ধ
          </button>
        </div>
      </div>
    </div>
  );
};
