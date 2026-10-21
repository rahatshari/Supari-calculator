import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React App:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('kacha_draft_items');
      localStorage.removeItem('shukno_draft_state');
      localStorage.removeItem('supari_history_kacha');
      localStorage.removeItem('supari_history_shukno');
      localStorage.removeItem('supari_kroy_khata_db');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#f8fafc',
            fontFamily: "'Noto Sans Bengali', system-ui, sans-serif",
            color: '#0f172a',
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1.5px solid #fee2e2',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#991b1b' }}>
              অ্যাপ লোড হতে সমস্যা হয়েছে
            </h3>

            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
              পূর্বের সেভ করা কোনো পুরনো ডাটার কারণে সমস্যা হতে পারে। নিচের বোতামে চাপ দিয়ে অ্যাপটি আবার চালু করুন।
            </p>

            {this.state.error && (
              <details
                style={{
                  margin: '0 0 20px',
                  textAlign: 'left',
                  background: '#f1f5f9',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: '#475569',
                  overflowX: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#334155' }}>
                  প্রযুক্তিগত বিবরণ (Technical Details)
                </summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)',
                }}
              >
                🔄 পুনরায় লোড করুন (Reload)
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#ffffff',
                  color: '#dc2626',
                  border: '1.5px solid #fecaca',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🧹 ক্যাশ পরিষ্কার করে রিস্টার্ট করুন
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
