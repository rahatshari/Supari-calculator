import React from 'react';
import { Star } from 'lucide-react';

export const CreatorBadge: React.FC = () => {
  return (
    <div className="receipt-creator-footer">
      <div className="creator-card">
        <div className="creator-inner">
          <div className="creator-icon">
            <Star className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          </div>
          <div className="creator-text-group">
            <div className="creator-subtitle">সুপারি হিসাব ক্যালকুলেটর</div>
            <div className="creator-title">
              Created by <span className="creator-highlight">Rahat Sharif</span>
            </div>
          </div>
        </div>
        <div className="creator-tag">Verified App</div>
      </div>
    </div>
  );
};

export function getCreatorBadgeHtml(): string {
  return `
    <div style="margin-top: 18px; padding-top: 14px; border-top: 2px dashed #cbd5e1;">
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%); border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 9px; background: #d1fae5; border: 1px solid #a7f3d0; display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #059669; letter-spacing: 0.3px;">সুপারি হিসাব ক্যালকুলেটর</div>
            <div style="font-size: 14.5px; font-weight: 800; color: #0f172a;">Created by <span style="color: #059669;">Rahat Sharif</span></div>
          </div>
        </div>
        <div style="background: #ffffff; color: #059669; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase;">Verified App</div>
      </div>
    </div>
  `;
}
