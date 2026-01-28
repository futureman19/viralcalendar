import { Calendar, Search, Moon, Sun, ChevronLeft, BarChart3, Download, Lock, Settings } from 'lucide-react';
import type { ViewMode } from '../types';
import { ApiStatus } from './ApiStatus';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onBack?: () => void;
  title?: string;
  apiStatus?: {
    isConfigured: boolean;
    isLoading: boolean;
    error: string | null;
    rateLimitRemaining: number;
  };
  onRefresh?: () => void;
  onImport?: () => void;
  onAdminClick?: () => void;
  isAdmin?: boolean;
  historicalCount?: number;
}

export const Header = ({ 
  viewMode, 
  setViewMode, 
  isDark, 
  toggleTheme, 
  onBack,
  title,
  apiStatus,
  onRefresh,
  onImport,
  onAdminClick,
  isAdmin,
  historicalCount
}: HeaderProps) => {
  const showBackButton = viewMode !== 'calendar' && viewMode !== 'search';

  return (
    <header className="safe-area-top" style={{
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        {showBackButton && onBack ? (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8
            }}
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div style={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--accent)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={22} color="white" />
          </div>
        )}
        <h1 style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title || 'Viral Calendar'}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {apiStatus && viewMode === 'calendar' && (
          <div style={{ marginRight: 8 }}>
            <ApiStatus
              isConfigured={apiStatus.isConfigured}
              isLoading={apiStatus.isLoading}
              error={apiStatus.error}
              rateLimitRemaining={apiStatus.rateLimitRemaining}
              onRefresh={onRefresh}
            />
          </div>
        )}
        {/* Import Button - changes to Admin Panel when logged in */}
        {onImport && viewMode === 'calendar' && (
          <button
            onClick={onImport}
            title={isAdmin ? "Admin Panel" : "Import historical data"}
            style={{
              background: isAdmin ? 'var(--viral-high)' : 'none',
              border: 'none',
              padding: 10,
              cursor: 'pointer',
              color: isAdmin ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!isAdmin) {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isAdmin) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {isAdmin ? <Settings size={22} /> : <Download size={22} />}
            {historicalCount && historicalCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                backgroundColor: 'var(--viral-low)',
                borderRadius: '50%'
              }} />
            )}
          </button>
        )}

        {/* Admin Login Button - only shown when not logged in */}
        {onAdminClick && viewMode === 'calendar' && (
          <button
            onClick={onAdminClick}
            title="Admin Login"
            style={{
              background: 'none',
              border: 'none',
              padding: 10,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Lock size={22} />
          </button>
        )}
        {viewMode === 'calendar' && (
          <button
            onClick={() => setViewMode('search')}
            style={{
              background: 'none',
              border: 'none',
              padding: 10,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Search size={22} />
          </button>
        )}
        
        {viewMode === 'search' && (
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              background: 'none',
              border: 'none',
              padding: 10,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8
            }}
          >
            <Calendar size={22} />
          </button>
        )}

        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            padding: 10,
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {isDark ? <Sun size={22} /> : <Moon size={22} />}
        </button>
      </div>
    </header>
  );
};
