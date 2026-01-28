import { Flame, TrendingUp, Hash, MessageCircle, ArrowUpRight } from 'lucide-react';
import type { DayData, ViralEvent, ContentType } from '../types';
import { format } from 'date-fns';

interface DayDetailProps {
  dayData: DayData;
  onViewMonth: () => void;
}

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

const getTypeLabel = (type: ContentType) => {
  switch (type) {
    case 'news': return 'News';
    case 'meme': return 'Meme';
    case 'video': return 'Video';
    case 'tweet': return 'Tweet';
    case 'trend': return 'Trend';
    default: return 'Other';
  }
};

const getIntensityColor = (postCount: number) => {
  if (postCount >= 2000000) return 'var(--viral-high)';
  if (postCount >= 500000) return 'var(--viral-medium)';
  return 'var(--viral-low)';
};

const EventCard = ({ event, rank }: { event: ViralEvent; rank: number }) => {
  const intensityColor = getIntensityColor(event.postCount);
  
  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      border: '1px solid var(--border)',
      animation: 'fadeIn 0.3s ease-out',
      animationDelay: `${rank * 0.05}s`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{getTypeIcon(event.type)}</span>
          <div>
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: 600
            }}>
              {getTypeLabel(event.type)}
            </span>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              marginTop: 2
            }}>
              {event.title}
            </h3>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: intensityColor,
          padding: '4px 10px',
          borderRadius: 20
        }}>
          <Flame size={14} color="white" fill="white" />
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'white'
          }}>
            #{rank}
          </span>
        </div>
      </div>

      {/* Summary */}
      <p style={{
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        margin: 0,
        marginBottom: 14
      }}>
        {event.summary}
      </p>

      {/* Stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        paddingTop: 12,
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={16} color="var(--text-muted)" />
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {event.postCount >= 1000000 
              ? `${(event.postCount / 1000000).toFixed(1)}M` 
              : `${(event.postCount / 1000).toFixed(0)}K`} posts
          </span>
        </div>
        
        {event.hashtag && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Hash size={16} color="var(--accent)" />
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent)'
            }}>
              {event.hashtag}
            </span>
          </div>
        )}
        
        <div style={{ marginLeft: 'auto' }}>
          <button style={{
            background: 'none',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const DayDetail = ({ dayData, onViewMonth }: DayDetailProps) => {
  const date = new Date(dayData.date);
  const totalPosts = dayData.events.reduce((sum, e) => sum + e.postCount, 0);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Day Header */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px 16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12
        }}>
          <div>
            <h2 style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {format(date, 'EEEE')}
            </h2>
            <p style={{
              fontSize: 16,
              color: 'var(--text-secondary)',
              margin: '4px 0 0 0'
            }}>
              {format(date, 'MMMM d, yyyy')}
            </p>
          </div>
          
          <button
            onClick={onViewMonth}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View Month
          </button>
        </div>

        {/* Day Stats */}
        <div style={{
          display: 'flex',
          gap: 16
        }}>
          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '12px 16px',
            borderRadius: 12,
            flex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4
            }}>
              <TrendingUp size={18} color="var(--accent)" />
              <span style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                Total Engagement
              </span>
            </div>
            <span style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              {totalPosts >= 1000000 
                ? `${(totalPosts / 1000000).toFixed(1)}M` 
                : `${(totalPosts / 1000).toFixed(1)}K`}
            </span>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '12px 16px',
            borderRadius: 12,
            flex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4
            }}>
              <Flame size={18} color="var(--viral-high)" />
              <span style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                Viral Events
              </span>
            </div>
            <span style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              {dayData.events.length}
            </span>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          margin: '0 0 12px 0'
        }}>
          Top Viral Moments
        </h3>
        
        {dayData.events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            rank={event.trendingRank} 
          />
        ))}
      </div>
    </div>
  );
};
