import { useState, useEffect } from 'react';
import { 
  X, 
  LogOut, 
  Download, 
  Trash2, 
  Settings, 
  Database,
  Globe,
  Newspaper,
  Check,
  AlertCircle,
  Save
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { NEWS_SUBREDDITS } from '../services/redditHistorical';
import type { ImportProgress } from '../services/redditHistorical';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (options: { 
    newsOnly: boolean; 
    maxPosts: number;
    subreddits: string[];
    timeframes: ('day' | 'week' | 'month' | 'year' | 'all')[];
  }) => Promise<number>;
  onClear: () => void;
  isImporting: boolean;
  progress: ImportProgress;
  historicalCount: number;
}

export const AdminPanel = ({
  isOpen,
  onClose,
  onImport,
  onClear,
  isImporting,
  progress,
  historicalCount
}: AdminPanelProps) => {
  const { logout } = useAdmin();
  const [activeTab, setActiveTab] = useState<'import' | 'sources' | 'data'>('import');
  
  // Import settings
  const [newsOnly, setNewsOnly] = useState(true);
  const [maxPosts, setMaxPosts] = useState(300);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>(NEWS_SUBREDDITS);
  const [selectedTimeframes, setSelectedTimeframes] = useState<('day' | 'week' | 'month' | 'year' | 'all')[]>(['month', 'year', 'all']);
  
  const [importComplete, setImportComplete] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [storageStats, setStorageStats] = useState({ size: 0, items: 0 });

  // Load storage stats
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('redditHistoricalData');
      if (stored) {
        const size = new Blob([stored]).size;
        const data = JSON.parse(stored);
        setStorageStats({
          size: Math.round(size / 1024 * 10) / 10, // KB
          items: Object.keys(data).length
        });
      }
    }
  }, [isOpen, historicalCount]);

  if (!isOpen) return null;

  const handleImport = async () => {
    setImportComplete(false);
    const count = await onImport({
      newsOnly,
      maxPosts,
      subreddits: selectedSubreddits,
      timeframes: selectedTimeframes
    });
    setImportedCount(count);
    setImportComplete(true);
    
    // Refresh storage stats
    const stored = localStorage.getItem('redditHistoricalData');
    if (stored) {
      setStorageStats({
        size: Math.round(new Blob([stored]).size / 1024 * 10) / 10,
        items: Object.keys(JSON.parse(stored)).length
      });
    }
  };

  const toggleSubreddit = (subreddit: string) => {
    setSelectedSubreddits(prev =>
      prev.includes(subreddit)
        ? prev.filter(s => s !== subreddit)
        : [...prev, subreddit]
    );
  };

  const toggleTimeframe = (timeframe: 'day' | 'week' | 'month' | 'year' | 'all') => {
    setSelectedTimeframes(prev =>
      prev.includes(timeframe)
        ? prev.filter(t => t !== timeframe)
        : [...prev, timeframe]
    );
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to delete ALL imported historical data?')) {
      onClear();
      setStorageStats({ size: 0, items: 0 });
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const tabs = [
    { id: 'import', label: 'Import Data', icon: Download },
    { id: 'sources', label: 'Sources', icon: Globe },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 640,
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--viral-high)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Settings size={24} color="white" />
            <div>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
                margin: 0
              }}>
                Admin Panel
              </h2>
              <p style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                margin: 0
              }}>
                Advanced configuration
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
                color: 'white',
                borderRadius: 8
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 16px',
                backgroundColor: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--viral-high)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '20px'
        }}>
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div>
              {!isImporting && !importComplete && (
                <>
                  {/* News Only Toggle */}
                  <div style={{ marginBottom: 24 }}>
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
                          Filter for newsworthy posts from selected sources
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Max Posts Slider */}
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
                      max={1000}
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
                      <span>1000</span>
                    </div>
                  </div>

                  {/* Selected Sources Summary */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 10,
                    marginBottom: 24
                  }}>
                    <h4 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      margin: '0 0 12px 0'
                    }}>
                      Configuration Summary
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Sources:</span>
                        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                          {selectedSubreddits.length} subreddits
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Timeframes:</span>
                        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                          {selectedTimeframes.join(', ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Content filter:</span>
                        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                          {newsOnly ? 'News only' : 'All content'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 8,
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <AlertCircle size={20} color="var(--accent)" />
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.5
                    }}>
                      Estimated time: ~{Math.ceil(selectedSubreddits.length * selectedTimeframes.length * 2)} seconds
                      <br />
                      <span style={{ fontSize: 12 }}>Reddit API rate limit: 1 request per 2 seconds</span>
                    </p>
                  </div>
                </>
              )}

              {/* Progress */}
              {isImporting && (
                <div style={{
                  padding: '40px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: '6px solid var(--bg-tertiary)',
                    borderTopColor: 'var(--accent)',
                    margin: '0 auto 24px',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <h3 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8
                  }}>
                    Importing from Reddit...
                  </h3>
                  <p style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    marginBottom: 20
                  }}>
                    {progress.subreddit}
                  </p>
                  <div style={{
                    height: 10,
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 5,
                    overflow: 'hidden',
                    marginBottom: 16
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
                  padding: '40px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <Check size={40} color="var(--viral-low)" />
                  </div>
                  <h3 style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8
                  }}>
                    Import Complete!
                  </h3>
                  <p style={{
                    fontSize: 15,
                    color: 'var(--text-secondary)'
                  }}>
                    Successfully imported viral content from {importedCount} days.
                  </p>
                  <button
                    onClick={() => setImportComplete(false)}
                    style={{
                      marginTop: 24,
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
                    Import More
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sources Tab */}
          {activeTab === 'sources' && (
            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 16px 0'
              }}>
                Select Subreddits
              </h3>
              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 16
              }}>
                Choose which subreddits to pull viral content from:
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
                marginBottom: 24
              }}>
                {NEWS_SUBREDDITS.map(subreddit => (
                  <button
                    key={subreddit}
                    onClick={() => toggleSubreddit(subreddit)}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: selectedSubreddits.includes(subreddit) 
                        ? 'var(--accent)' 
                        : 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: 8,
                      color: selectedSubreddits.includes(subreddit) 
                        ? 'white' 
                        : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    r/{subreddit}
                    {selectedSubreddits.includes(subreddit) && <Check size={14} />}
                  </button>
                ))}
              </div>

              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '24px 0 16px 0'
              }}>
                Timeframes
              </h3>
              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 16
              }}>
                Which time periods to include:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(['day', 'week', 'month', 'year', 'all'] as const).map(timeframe => (
                  <button
                    key={timeframe}
                    onClick={() => toggleTimeframe(timeframe)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: selectedTimeframes.includes(timeframe) 
                        ? 'var(--viral-medium)' 
                        : 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: 8,
                      color: selectedTimeframes.includes(timeframe) 
                        ? 'white' 
                        : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      textTransform: 'capitalize'
                    }}
                  >
                    {selectedTimeframes.includes(timeframe) && <Check size={14} />}
                    {timeframe === 'all' ? 'All Time' : timeframe}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div>
              {/* Storage Stats */}
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 12,
                marginBottom: 24
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 16px 0'
                }}>
                  Storage Statistics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Days stored</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{storageStats.items}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Storage used</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{storageStats.size} KB</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 16px 0'
              }}>
                Data Actions
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => {
                    const data = localStorage.getItem('redditHistoricalData');
                    if (data) {
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `viral-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                    }
                  }}
                  disabled={storageStats.items === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: storageStats.items === 0 ? 'not-allowed' : 'pointer',
                    opacity: storageStats.items === 0 ? 0.5 : 1
                  }}
                >
                  <Save size={20} color="var(--accent)" />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div>Export Data</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                      Download backup as JSON
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleClear}
                  disabled={storageStats.items === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 10,
                    color: 'var(--viral-high)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: storageStats.items === 0 ? 'not-allowed' : 'pointer',
                    opacity: storageStats.items === 0 ? 0.5 : 1
                  }}
                >
                  <Trash2 size={20} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div>Clear All Data</div>
                    <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 400 }}>
                      Delete all imported historical data
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Import Button */}
        {activeTab === 'import' && !isImporting && !importComplete && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 12
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px 24px',
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
              disabled={selectedSubreddits.length === 0 || selectedTimeframes.length === 0}
              style={{
                flex: 2,
                padding: '14px 24px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: selectedSubreddits.length === 0 || selectedTimeframes.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: selectedSubreddits.length === 0 || selectedTimeframes.length === 0 ? 0.5 : 1
              }}
            >
              <Download size={18} />
              Start Import ({selectedSubreddits.length * selectedTimeframes.length} sources)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
