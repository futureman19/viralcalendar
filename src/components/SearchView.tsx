import { useState, useCallback, useMemo } from 'react';
import { Search, X, Calendar, Flame } from 'lucide-react';
import type { DayData, ViralEvent, ContentType } from '../types';
import { format } from 'date-fns';

interface SearchViewProps {
  onSelectDate: (date: Date) => void;
  searchEvents: (query: string, typeFilter?: ContentType | 'all') => DayData[];

}

const contentTypes: { value: ContentType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Types', icon: '🔍' },
  { value: 'news', label: 'News', icon: '📰' },
  { value: 'meme', label: 'Memes', icon: '😂' },
  { value: 'video', label: 'Videos', icon: '🎬' },
  { value: 'tweet', label: 'Tweets', icon: '💬' },
  { value: 'trend', label: 'Trends', icon: '📈' },
];

const getIntensityColor = (postCount: number) => {
  if (postCount >= 2000000) return 'var(--viral-high)';
  if (postCount >= 500000) return 'var(--viral-medium)';
  return 'var(--viral-low)';
};

export const SearchView = ({ onSelectDate, searchEvents }: SearchViewProps) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [hasSearched, setHasSearched] = useState(false);

  const results = useMemo(() => {
    if (!query.trim() && typeFilter === 'all') return [];
    return searchEvents(query, typeFilter);
  }, [query, typeFilter, searchEvents]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setTypeFilter('all');
    setHasSearched(false);
  }, []);

  const handleSelectResult = useCallback((dateStr: string) => {
    onSelectDate(new Date(dateStr));
  }, [onSelectDate]);

  const totalEvents = useMemo(() => {
    return results.reduce((sum, day) => sum + day.events.length, 0);
  }, [results]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Search Header */}
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)'
      }}>
        <form onSubmit={handleSearch}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 12,
            padding: '12px 16px'
          }}>
            <Search size={20} color="var(--text-muted)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search viral moments..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 16,
                outline: 'none'
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} color="var(--text-muted)" />
              </button>
            )}
          </div>
        </form>

        {/* Type Filter */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {contentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setTypeFilter(type.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 20,
                border: 'none',
                backgroundColor: typeFilter === type.value ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: typeFilter === type.value ? 'white' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {!hasSearched && !query && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)'
          }}>
            <Search size={64} style={{ marginBottom: 24, opacity: 0.3 }} />
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8
            }}>
              Search Viral History
            </h3>
            <p style={{ fontSize: 15 }}>
              Find viral moments by keyword, hashtag, or topic
            </p>
          </div>
        )}

        {hasSearched && results.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8
            }}>
              No results found
            </h3>
            <p style={{ fontSize: 14 }}>
              Try a different search term or filter
            </p>
            <button
              onClick={handleClear}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Search
            </button>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                Search Results
              </h3>
              <span style={{
                fontSize: 13,
                color: 'var(--text-secondary)'
              }}>
                {totalEvents} events across {results.length} days
              </span>
            </div>

            {results.map((dayData) => (
              <DayResultCard
                key={dayData.date}
                dayData={dayData}
                onSelect={() => handleSelectResult(dayData.date)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// Day Result Card Component
const DayResultCard = ({ dayData, onSelect }: { dayData: DayData; onSelect: () => void }) => {
  const date = new Date(dayData.date);
  const totalPosts = dayData.events.reduce((sum, e) => sum + e.postCount, 0);

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Date Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 10
        }}>
          <Calendar size={20} color="var(--accent)" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4
          }}>
            <Flame size={14} color={getIntensityColor(totalPosts)} fill={getIntensityColor(totalPosts)} />
            <span style={{
              fontSize: 13,
              color: 'var(--text-secondary)'
            }}>
              {dayData.events.length} events • {totalPosts >= 1000000 
                ? `${(totalPosts / 1000000).toFixed(1)}M` 
                : `${(totalPosts / 1000).toFixed(0)}K`} posts
            </span>
          </div>
        </div>
      </div>

      {/* Events Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dayData.events.slice(0, 3).map((event) => (
          <EventPreview key={event.id} event={event} />
        ))}
        {dayData.events.length > 3 && (
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            margin: '4px 0 0 0'
          }}>
            +{dayData.events.length - 3} more events
          </p>
        )}
      </div>
    </div>
  );
};

// Event Preview Component
const EventPreview = ({ event }: { event: ViralEvent }) => {
  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'news': return '📰';
      case 'meme': return '😂';
      case 'video': return '🎬';
      case 'tweet': return '💬';
      case 'trend': return '📈';
      default: return '📝';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '8px 12px',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: 8
    }}>
      <span style={{ fontSize: 18 }}>{getTypeIcon(event.type)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {event.title}
        </p>
        {event.hashtag && (
          <span style={{
            fontSize: 12,
            color: 'var(--accent)'
          }}>
            {event.hashtag}
          </span>
        )}
      </div>
    </div>
  );
};
