import React from 'react';
import { Download, Share2, X } from 'lucide-react';
import { RenderMemoResult } from '../utils/exportMemo';

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
  if (!data) return null;

  const canShare = Boolean(
    typeof navigator.share === 'function' &&
      data.blob &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({
        files: [new File([data.blob], data.fileName, { type: 'image/jpeg' })],
      })
  );

  const handleShare = async () => {
    if (!data.blob) return;
    try {
      const file = new File([data.blob], data.fileName, { type: 'image/jpeg' });
      await navigator.share({
        title: 'সুপারি বিক্রির মেমো',
        text: 'সুপারি বিক্রির হিসাব মেমো রসিদ',
        files: [file],
      });
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        onToast('⚠️ শেয়ার করা যায়নি');
      }
    }
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
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
            marginBottom: '12px',
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
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '12px',
            lineHeight: 1.4,
          }}
        >
          💡 ডাউনলোড শুরু না হলে নিচের বাটনে চাপুন অথবা ছবিতে চেপে ধরে{' '}
          <strong>'Save Image'</strong> দিন।
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href={data.dataUrl}
            download={data.fileName}
            className="btn btn-primary"
            style={{
              flex: 2,
              minWidth: '130px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '11px',
              fontWeight: 700,
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <Download className="w-4 h-4" />
            <span>JPG ডাউনলোড</span>
          </a>

          {canShare && (
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
                padding: '11px',
                fontWeight: 700,
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <Share2 className="w-4 h-4" />
              <span>শেয়ার</span>
            </button>
          )}

          <button
            className="btn btn-modal-cancel"
            onClick={onClose}
            style={{
              flex: 1,
              minWidth: '80px',
              padding: '11px',
              fontWeight: 700,
              borderRadius: '8px',
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
