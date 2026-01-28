import { useMemo } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subYears, addYears } from 'date-fns';
import type { DayData } from '../types';

interface YearlyViewProps {
  currentDate: Date;
  selectedDate: Date;
  onChangeYear: (date: Date) => void;
  onSelectMonth: (date: Date) => void;
  hasViralContent: (date: Date) => boolean;
  getViralIntensity: (date: Date) => 'high' | 'medium' | 'low' | 'none';
  getDayData: (date: Date) => DayData | undefined;
}

const getIntensityColor = (intensity: 'high' | 'medium' | 'low' | 'none') => {
  switch (intensity) {
    case 'high': return 'var(--viral-high)';
    case 'medium': return 'var(--viral-medium)';
    case 'low': return 'var(--viral-low)';
    default: return 'transparent';
  }
};

const MonthMiniCalendar = ({ 
  monthDate, 
  selectedDate,
  onSelectDate,
  hasViralContent,
  getViralIntensity
}: {
  monthDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  hasViralContent: (date: Date) => boolean;
  getViralIntensity: (date: Date) => 'high' | 'medium' | 'low' | 'none';
}) => {
  const days = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthDate]);

  const monthName = format(monthDate, 'MMM');
  const hasAnyViralContent = days.some(day => hasViralContent(day));
  
  // Get highest intensity for the month
  const monthIntensity = useMemo(() => {
    let maxIntensity: 'high' | 'medium' | 'low' | 'none' = 'none';
    for (const day of days) {
      const intensity = getViralIntensity(day);
      if (intensity === 'high') return 'high';
      if (intensity === 'medium') maxIntensity = 'medium';
      if (intensity === 'low' && maxIntensity === 'none') maxIntensity = 'low';
    }
    return maxIntensity;
  }, [days, getViralIntensity]);

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 12,
      padding: 12,
      border: '1px solid var(--border)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onClick={() => onSelectDate(monthDate)}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--accent)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-primary)'
        }}>
          {monthName}
        </span>
        {hasAnyViralContent && (
          <Flame 
            size={14} 
            color={getIntensityColor(monthIntensity)} 
            fill={getIntensityColor(monthIntensity)}
          />
        )}
      </div>
      
      {/* Mini day grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2
      }}>
        {days.slice(0, 28).map((day) => {
          const hasContent = hasViralContent(day);
          const intensity = getViralIntensity(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              style={{
                aspectRatio: '1',
                borderRadius: 3,
                backgroundColor: isSelected 
                  ? 'var(--accent)' 
                  : hasContent 
                    ? getIntensityColor(intensity) 
                    : isToday
                      ? 'var(--text-muted)'
                      : 'var(--bg-tertiary)',
                opacity: isSelected || hasContent || isToday ? 1 : 0.3,
                minWidth: 0
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const YearlyView = ({
  currentDate,
  selectedDate,
  onChangeYear,
  onSelectMonth,
  hasViralContent,
  getViralIntensity,
  getDayData
}: YearlyViewProps) => {
  const months = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [currentDate]);

  const yearStats = useMemo(() => {
    let totalEvents = 0;
    let totalPosts = 0;
    let activeDays = 0;
    
    months.forEach(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      days.forEach(day => {
        const data = getDayData(day);
        if (data?.hasViralContent) {
          activeDays++;
          totalEvents += data.events.length;
          totalPosts += data.events.reduce((sum, e) => sum + e.postCount, 0);
        }
      });
    });
    
    return { totalEvents, totalPosts, activeDays };
  }, [months, getDayData]);

  const navigateYear = (direction: 'prev' | 'next') => {
    onChangeYear(direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1));
  };

  const jumpToCurrentYear = () => {
    onChangeYear(new Date());
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Year Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)'
      }}>
        <button
          onClick={() => navigateYear('prev')}
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
        
        <button
          onClick={jumpToCurrentYear}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: 20,
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: 8
          }}
        >
          {format(currentDate, 'yyyy')}
        </button>
        
        <button
          onClick={() => navigateYear('next')}
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

      {/* Year Stats */}
      <div style={{
        display: 'flex',
        gap: 16,
        padding: '12px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Flame size={14} color="var(--viral-high)" fill="var(--viral-high)" />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {yearStats.activeDays} active days
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {yearStats.totalEvents} events
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {yearStats.totalPosts >= 1000000 
              ? `${(yearStats.totalPosts / 1000000).toFixed(1)}M` 
              : `${(yearStats.totalPosts / 1000).toFixed(0)}K`} posts
          </span>
        </div>
      </div>

      {/* Months Grid */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12
        }}>
          {months.map((month) => (
            <MonthMiniCalendar
              key={month.toISOString()}
              monthDate={month}
              selectedDate={selectedDate}
              onSelectDate={onSelectMonth}
              hasViralContent={hasViralContent}
              getViralIntensity={getViralIntensity}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        padding: '12px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'var(--viral-high)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>High</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'var(--viral-medium)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Medium</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'var(--viral-low)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Low</span>
        </div>
      </div>
    </div>
  );
};
