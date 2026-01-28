import { useState } from 'react';
import { Download, X, Newspaper, Database, Trash2 } from 'lucide-react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (options: { newsOnly: boolean; maxPosts: number }) => Promise<number>;
  onClear: () => void;
  isImporting: boolean;
  progress: { total: number; current: number; subreddit: string; postsFound: number };
  historicalCount: number;
}

export const ImportDialog = ({
  isOpen,
  onClose,
  onImport,
  onClear,
  isImporting,
  progress,
  historicalCount
}: ImportDialogProps) => {
  const [newsOnly, setNewsOnly] = useState(true);
  const [maxPosts, setMaxPosts] = useState(300);
  const [importComplete, setImportComplete] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  if (!isOpen) return null;

  const handleImport = async () => {
    setImportComplete(false);
    const count = await onImport({ newsOnly, maxPosts });
    setImportedCount(count);
    setImportComplete(true);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all imported historical data?')) {
      onClear();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              backgroundColor: 'var(--accent)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={20} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Import Historical Data
              </h2>
              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '4px 0 0 0'
              }}>
                Pull viral posts from Reddit history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              borderRadius: 8
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Current Status */}
          {historicalCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 10,
              marginBottom: 20
            }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Currently stored: <strong style={{ color: 'var(--text-primary)' }}>{historicalCount} days</strong> of data
              </span>
              <button
                onClick={handleClear}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  borderRadius: 6,
                  color: 'var(--viral-high)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>
          )}

          {/* Options */}
          {!isImporting && !importComplete && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: newsOnly ? '2px solid var(--accent)' : '2px solid transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={newsOnly}
                    onChange={(e) => setNewsOnly(e.target.checked)}
                    style={{ width: 20, height: 20 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Newspaper size={18} color="var(--accent)" />
                      <span style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}>
                        News Only
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      margin: '4px 0 0 0'
                    }}>
                      Filter for newsworthy posts from r/worldnews, r/news, r/politics, etc.
                    </p>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 8
                }}>
                  Maximum posts to import: {maxPosts}
                </label>
                <input
                  type="range"
                  min={50}
                  max={500}
                  step={50}
                  value={maxPosts}
                  onChange={(e) => setMaxPosts(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'var(--bg-tertiary)',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 4
                }}>
                  <span>50</span>
                  <span>500</span>
                </div>
              </div>

              {/* Info Box */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 8,
                marginBottom: 20
              }}>
                <p style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  This will fetch top posts from r/worldnews, r/news, r/politics, r/science, r/technology and more. 
                  The import may take 1-2 minutes due to API rate limits.
                </p>
              </div>
            </>
          )}

          {/* Progress */}
          {isImporting && (
            <div style={{
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '4px solid var(--bg-tertiary)',
                borderTopColor: 'var(--accent)',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite'
              }} />
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8
              }}>
                Importing...
              </h3>
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginBottom: 16
              }}>
                {progress.subreddit}
              </p>
              <div style={{
                height: 8,
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 12
              }}>
                <div style={{
                  height: '100%',
                  width: `${(progress.current / progress.total) * 100}%`,
                  backgroundColor: 'var(--accent)',
                  transition: 'width 0.3s'
                }} />
              </div>
              <p style={{
                fontSize: 13,
                color: 'var(--text-muted)'
              }}>
                {progress.current} / {progress.total} sources • {progress.postsFound} posts found
              </p>
            </div>
          )}

          {/* Complete */}
          {importComplete && !isImporting && (
            <div style={{
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <span style={{ fontSize: 32 }}>✅</span>
              </div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8
              }}>
                Import Complete!
              </h3>
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)'
              }}>
                Successfully imported viral content from {importedCount} days.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isImporting && (
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '16px 20px',
            borderTop: '1px solid var(--border)'
          }}>
            {importComplete ? (
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Download size={18} />
                  Start Import
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
