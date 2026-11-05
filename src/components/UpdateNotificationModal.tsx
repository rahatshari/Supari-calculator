import React from 'react';
import { Download, Sparkles, X, ExternalLink } from 'lucide-react';
import { AppUpdateInfo } from '../config/version';
import { toBnNum } from '../utils/bengali';

interface UpdateNotificationModalProps {
  updateInfo: AppUpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !updateInfo || !updateInfo.hasUpdate) return null;

  const handleDownload = () => {
    const targetUrl = updateInfo.apkUrl || updateInfo.downloadUrl;
    if (targetUrl) {
      window.location.href = targetUrl;
    }
    onClose();
  };

  const handleOpenReleasePage = () => {
    if (updateInfo.downloadUrl) {
      window.location.href = updateInfo.downloadUrl;
    }
  };

  return (
    <div className="modal-overlay show no-print" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-box"
        style={{
          maxWidth: '430px',
          width: '92%',
          textAlign: 'left',
          borderRadius: '20px',
          padding: '24px 22px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
          border: '1.5px solid #a7f3d0',
          background: '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 6px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#047857',
                  background: '#d1fae5',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginBottom: '2px',
                }}
              >
                নতুন ভার্সন রিলিজ
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                সুপারি হিসাব আপডেট!
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version Compare Badge */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>বর্তমান ভার্সন:</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>
              v{toBnNum(updateInfo.currentVersion)}
            </div>
          </div>
          <div style={{ fontSize: '18px', color: '#059669', fontWeight: 900 }}>➔</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>নতুন ভার্সন:</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#059669' }}>
              v{toBnNum(updateInfo.latestVersion)}
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            আপডেটে কী কী নতুন রয়েছে:
          </div>
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#166534',
              lineHeight: 1.55,
              whiteSpace: 'pre-line',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            {updateInfo.releaseNotes}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleDownload}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
            }}
          >
            <Download className="w-5 h-5" />
            নতুন APK ডাউনলোড করুন
          </button>

          {updateInfo.downloadUrl && (
            <button
              onClick={handleOpenReleasePage}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '9px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              গিটহাব রিলিজ পেজে দেখুন
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            পরে মনে করিয়ে দিন
          </button>
        </div>
      </div>
    </div>
  );
};
