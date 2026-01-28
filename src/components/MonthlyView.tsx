import { useMemo } from 'react';
import { Calendar, Flame, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import type { DayData } from '../types';

interface MonthlyViewProps {
  date: Date;
  onChangeMonth: (date: Date) => void;
  onSelectDay: (date: Date) => void;

  getMonthData: (year: number, month: number) => DayData[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'news': return '📰';
    case 'meme': return '😂';
    case 'video': return '🎬';
    case 'tweet': return '💬';
    case 'trend': return '📈';
    default: return '📝';
  }
};

const getIntensityColor = (postCount: number) => {
  if (postCount >= 2000000) return 'var(--viral-high)';
  if (postCount >= 500000) return 'var(--viral-medium)';
  return 'var(--viral-low)';
};

export const MonthlyView = ({ 
  date, 
  onChangeMonth, 
  onSelectDay,
  getMonthData 
}: MonthlyViewProps) => {
  const monthData = useMemo(() => {
    return getMonthData(date.getFullYear(), date.getMonth());
  }, [date, getMonthData]);

  const stats = useMemo(() => {
    const totalEvents = monthData.reduce((sum, day) => sum + day.events.length, 0);
    const totalPosts = monthData.reduce((sum, day) => 
      sum + day.events.reduce((eSum, e) => eSum + e.postCount, 0), 0);
    const topDay = monthData.reduce((max, day) => {
      const dayPosts = day.events.reduce((sum, e) => sum + e.postCount, 0);
      const maxPosts = max?.events.reduce((sum, e) => sum + e.postCount, 0) || 0;
      return dayPosts > maxPosts ? day : max;
    }, monthData[0]);

    return { totalEvents, totalPosts, topDay, activeDays: monthData.length };
  }, [monthData]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    onChangeMonth(direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Month Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)'
      }}>
        <button
          onClick={() => navigateMonth('prev')}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronLeft size={24} />
        </button>
        
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0
        }}>
          {format(date, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Monthly Stats */}
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12
        }}>
          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '14px',
            borderRadius: 12
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6
            }}>
              <Calendar size={16} color="var(--accent)" />
              <span style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                Active Days
              </span>
            </div>
            <span style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              {stats.activeDays}
            </span>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '14px',
            borderRadius: 12
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6
            }}>
              <Flame size={16} color="var(--viral-high)" />
              <span style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                Viral Events
              </span>
            </div>
            <span style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              {stats.totalEvents}
            </span>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '14px',
            borderRadius: 12,
            gridColumn: 'span 2'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6
            }}>
              <TrendingUp size={16} color="var(--viral-medium)" />
              <span style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                Total Engagement
              </span>
            </div>
            <span style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              {stats.totalPosts >= 1000000 
                ? `${(stats.totalPosts / 1000000).toFixed(1)}M` 
                : `${(stats.totalPosts / 1000).toFixed(1)}K`} posts
            </span>
          </div>
        </div>
      </div>

      {/* Daily Events List */}
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
          margin: '0 0 16px 0'
        }}>
          All Viral Days
        </h3>

        {monthData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)'
          }}>
            <Calendar size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontSize: 15 }}>No viral content recorded this month</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Check back later or browse other months</p>
          </div>
        ) : (
          monthData.map((day, index) => {
            const dayDate = new Date(day.date);
            const totalPosts = day.events.reduce((sum, e) => sum + e.postCount, 0);
            const topEvent = day.events[0];
            
            return (
              <button
                key={day.date}
                onClick={() => onSelectDay(dayDate)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  animation: 'fadeIn 0.3s ease-out',
                  animationDelay: `${index * 0.05}s`
                }}
              >
                {/* Date Badge */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 56,
                  height: 56,
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 12
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    {format(dayDate, 'EEE')}
                  </span>
                  <span style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}>
                    {format(dayDate, 'd')}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4
                  }}>
                    <span style={{ fontSize: 16 }}>{getTypeIcon(topEvent?.type || 'trend')}</span>
                    <span style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {topEvent?.title || 'Viral Content'}
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {day.events.length} events • {topEvent?.hashtag || '#viral'}
                  </p>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 4
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Flame size={14} color={getIntensityColor(totalPosts)} fill={getIntensityColor(totalPosts)} />
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: getIntensityColor(totalPosts)
                    }}>
                      {totalPosts >= 1000000 
                        ? `${(totalPosts / 1000000).toFixed(1)}M` 
                        : `${(totalPosts / 1000).toFixed(0)}K`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
