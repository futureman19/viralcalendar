import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame, Grid3X3, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from 'date-fns';
import { YearlyView } from './YearlyView';
import type { DayData, CalendarViewMode } from '../types';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onViewMonth: (date: Date) => void;
  hasViralContent: (date: Date) => boolean;
  getViralIntensity: (date: Date) => 'high' | 'medium' | 'low' | 'none';
  getTopHashtag: (date: Date) => string | undefined;
  getDayData: (date: Date) => DayData | undefined;
}

export const Calendar = ({ 
  selectedDate, 
  onSelectDate, 
  onViewMonth,
  hasViralContent,
  getViralIntensity,
  getTopHashtag,
  getDayData
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('monthly');

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(today);
  };

  const getIntensityColor = (intensity: 'high' | 'medium' | 'low' | 'none') => {
    switch (intensity) {
      case 'high': return 'var(--viral-high)';
      case 'medium': return 'var(--viral-medium)';
      case 'low': return 'var(--viral-low)';
      default: return 'transparent';
    }
  };

  const handleSelectMonth = (date: Date) => {
    setCurrentMonth(date);
    setViewMode('monthly');
  };

  // Monthly View
  const MonthlyView = () => (
    <>
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
        
        <button
          onClick={() => onViewMonth(currentMonth)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: 18,
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 8
          }}
        >
          {format(currentMonth, 'MMMM yyyy')}
        </button>
        
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

      {/* Weekday Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '12px 8px 8px',
        gap: 4
      }}>
        {weekDays.map((day, i) => (
          <div key={i} style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-muted)',
            padding: '8px 0'
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        padding: '0 8px 16px',
        flex: 1,
        overflow: 'auto'
      }}>
        {calendarDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasContent = hasViralContent(day);
          const intensity = getViralIntensity(day);
          const topHashtag = getTopHashtag(day);

          return (
            <button
              key={index}
              onClick={() => onSelectDate(day)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                border: isToday ? '2px solid var(--accent)' : '1px solid transparent',
                borderRadius: 12,
                cursor: 'pointer',
                opacity: isCurrentMonth ? 1 : 0.3,
                transition: 'all 0.2s',
                padding: 4
              }}
            >
              <span style={{
                fontSize: 15,
                fontWeight: isToday || isSelected ? 700 : 500,
                color: isSelected ? 'white' : 'var(--text-primary)'
              }}>
                {format(day, 'd')}
              </span>
              
              {hasContent && (
                <div style={{
                  position: 'absolute',
                  bottom: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Flame 
                    size={12} 
                    color={getIntensityColor(intensity)} 
                    fill={getIntensityColor(intensity)}
                  />
                  {topHashtag && (
                    <span style={{
                      fontSize: 7,
                      color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      padding: '0 2px'
                    }}>
                      {topHashtag.slice(0, 8)}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Jump to Today */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <button
          onClick={jumpToToday}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Jump to Today
        </button>
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
          <Flame size={12} color="var(--viral-high)" fill="var(--viral-high)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>2M+ posts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flame size={12} color="var(--viral-medium)" fill="var(--viral-medium)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>500K+ posts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flame size={12} color="var(--viral-low)" fill="var(--viral-low)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>100K+ posts</span>
        </div>
      </div>
    </>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* View Mode Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          fontWeight: 500,
          marginRight: 8
        }}>
          View Mode:
        </span>
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 8,
          padding: 4,
          gap: 4
        }}>
          <button
            onClick={() => setViewMode('monthly')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: viewMode === 'monthly' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'monthly' ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <CalendarDays size={16} />
            <span>Monthly</span>
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: viewMode === 'yearly' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'yearly' ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Grid3X3 size={16} />
            <span>Yearly</span>
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'monthly' ? (
        <MonthlyView />
      ) : (
        <YearlyView
          currentDate={currentMonth}
          selectedDate={selectedDate}
          onChangeYear={setCurrentMonth}
          onSelectMonth={handleSelectMonth}
          hasViralContent={hasViralContent}
          getViralIntensity={getViralIntensity}
          getDayData={getDayData}
        />
      )}
    </div>
  );
};
