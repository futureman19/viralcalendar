import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

// Reddit icon component
const RedditIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8c-2 0-3 1-3 2.5 0 1.5 1.5 2.5 3 2.5s3-1 3-2.5C15 9 14 8 12 8z" />
    <circle cx="9" cy="10" r="0.5" fill="currentColor" />
    <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    <path d="M7 14c1.5 2 3.5 3 5 3s3.5-1 5-3" />
  </svg>
);

interface ApiStatusProps {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  rateLimitRemaining: number;
  onRefresh?: () => void;
}

export const ApiStatus = ({ 
  isConfigured, 
  isLoading, 
  error, 
  rateLimitRemaining,
  onRefresh 
}: ApiStatusProps) => {
  // Don't show anything if using mock data and no error
  if (!isConfigured && !error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-muted)'
      }}>
        <WifiOff size={14} />
        <span>Reddit: Demo mode</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--viral-high)'
      }}>
        <AlertCircle size={14} />
        <span style={{ flex: 1 }}>{error}</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: 'var(--viral-high)',
              display: 'flex',
              alignItems: 'center',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--viral-low)'
      }}>
        <RedditIcon size={14} />
        <span>Reddit Live</span>
      </div>
      
      {rateLimitRemaining < 20 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          backgroundColor: rateLimitRemaining < 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderRadius: 8,
          fontSize: 12,
          color: rateLimitRemaining < 5 ? 'var(--viral-high)' : 'var(--viral-medium)'
        }}>
          <span>{rateLimitRemaining} reqs left</span>
        </div>
      )}
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 6,
            opacity: isLoading ? 0.5 : 1
          }}
          title="Refresh data"
        >
          <RefreshCw size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      )}
    </div>
  );
};
