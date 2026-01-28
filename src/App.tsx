import { useCallback, useMemo, useEffect, useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { DayDetail } from './components/DayDetail';
import { MonthlyView } from './components/MonthlyView';
import { SearchView } from './components/SearchView';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { ImportDialog } from './components/ImportDialog';
import { useTheme } from './hooks/useTheme';
import { useRedditData } from './hooks/useRedditData';
import { useAdmin } from './context/AdminContext';
import type { ViewMode } from './types';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const { isAdmin, showAdminPanel, setShowAdminPanel } = useAdmin();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const {
    selectedDate,
    setSelectedDate,
    apiStatus,
    getDayData,
    hasViralContent,
    getMonthData,
    getViralIntensity,
    getTopHashtag,
    searchEvents,
    refreshCurrentDate,
    importHistoricalData,
    clearHistoricalData,
    isImporting,
    importProgress,
    historicalData
  } = useRedditData({
    useMockData: false,
    enableRealTimeUpdates: false
  });

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = isDark ? 'dark' : 'light';
  }, [isDark]);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  }, [setSelectedDate]);

  const handleViewMonth = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('month');
  }, [setSelectedDate]);

  const handleBackFromDay = useCallback(() => {
    setViewMode('calendar');
  }, [setViewMode]);

  const handleBackFromMonth = useCallback(() => {
    setViewMode('calendar');
  }, [setViewMode]);

  const handleSelectDayFromMonth = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  }, [setSelectedDate]);

  const selectedDayData = useMemo(() => {
    return getDayData(selectedDate);
  }, [getDayData, selectedDate]);

  // Generate title based on current view
  const getTitle = () => {
    switch (viewMode) {
      case 'day':
        return selectedDayData ? 'Day Details' : 'Viral Calendar';
      case 'month':
        return 'Monthly View';
      case 'search':
        return 'Search';
      default:
        return 'Viral Calendar';
    }
  };

  return (
    <div className="app-container">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onBack={
          viewMode === 'day' ? handleBackFromDay :
          viewMode === 'month' ? handleBackFromMonth :
          undefined
        }
        title={getTitle()}
        apiStatus={apiStatus}
        onRefresh={viewMode === 'calendar' ? refreshCurrentDate : undefined}
        onImport={isAdmin ? () => setShowAdminPanel(true) : () => setIsImportDialogOpen(true)}
        onAdminClick={!isAdmin ? () => setShowAdminLogin(true) : undefined}
        isAdmin={isAdmin}
        historicalCount={Object.keys(historicalData).length}
      />

      <main className="main-content">
        {viewMode === 'calendar' && (
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onViewMonth={handleViewMonth}
            hasViralContent={hasViralContent}
            getViralIntensity={getViralIntensity}
            getTopHashtag={getTopHashtag}
            getDayData={getDayData}
          />
        )}

        {viewMode === 'day' && selectedDayData && (
          <DayDetail
            dayData={selectedDayData}
            onViewMonth={() => handleViewMonth(selectedDate)}
          />
        )}

        {viewMode === 'day' && !selectedDayData && (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h2>No Viral Content</h2>
            <p>This day doesn't have any recorded viral moments.</p>
            <button onClick={handleBackFromDay} className="btn-primary">
              Back to Calendar
            </button>
          </div>
        )}

        {viewMode === 'month' && (
          <MonthlyView
            date={selectedDate}
            onChangeMonth={setSelectedDate}
            onSelectDay={handleSelectDayFromMonth}
            getMonthData={getMonthData}
          />
        )}

        {viewMode === 'search' && (
          <SearchView
            onSelectDate={handleSelectDate}
            searchEvents={searchEvents}
          />
        )}
      </main>

      {/* Simple Import Dialog for non-admins */}
      <ImportDialog
        isOpen={isImportDialogOpen && !isAdmin}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={importHistoricalData}
        onClear={clearHistoricalData}
        isImporting={isImporting}
        progress={importProgress}
        historicalCount={Object.keys(historicalData).length}
      />

      {/* Admin Login */}
      <AdminLogin
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onImport={importHistoricalData}
        onClear={clearHistoricalData}
        isImporting={isImporting}
        progress={importProgress}
        historicalCount={Object.keys(historicalData).length}
      />
    </div>
  );
}

export default App;
