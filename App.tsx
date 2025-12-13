
import React, { useState, useEffect } from 'react';
import { SubjectSelection } from './components/SubjectSelection';
import { ExamSimulator } from './components/ExamSimulator';
import { GameScreen } from './components/GameScreen'; // Import GameScreen
import { ResultView } from './components/ResultView';
import { AdminPanel } from './components/AdminPanel';
import { LoginScreen } from './components/LoginScreen';
import { startExam, calculateResult, saveStudentResult, initializeDatabase, syncOfflineResults } from './services/db';
import { ExamSession, ExamResult, Subject, ExamType } from './types';
import { getCurrentUser, logoutUser, User } from './services/auth';
import { WifiOff, RefreshCw } from 'lucide-react';
import { FORCE_OFFLINE } from './services/config';

const SAVE_KEY = 'jamb_cbt_progress';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'exam' | 'result' | 'admin'>('login');
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [currentExamType, setCurrentExamType] = useState<ExamType>('JAMB');
  
  // Offline & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
      if (typeof window !== 'undefined') {
          return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
      }
      return 'light';
  });

  // Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Network Status Listeners & Auto Sync
  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        performSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
        performSync();
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const performSync = async () => {
      setIsSyncing(true);
      try {
          const count = await syncOfflineResults();
          if (count > 0) {
              setSyncMsg(`Synced ${count} offline result(s) to cloud.`);
              setTimeout(() => setSyncMsg(''), 5000);
          }
      } catch (e) {
          console.error("Sync failed", e);
      } finally {
          setIsSyncing(false);
      }
  };

  // Check for saved user session on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') {
        setCurrentScreen('admin');
      } else {
        setCurrentScreen('dashboard');
      }
    } else {
      setCurrentScreen('login');
    }
    // Initialize DB (Fetch questions from backend or cache)
    initializeDatabase().then(success => {
        if (!success && !navigator.onLine) {
            setSyncMsg("Loaded from Offline Cache");
            setTimeout(() => setSyncMsg(''), 3000);
        }
    }).catch(console.error);
  }, []);

  // Check for saved exam session
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setHasSavedSession(true);
            if (parsed.session && parsed.session.examType) {
                setCurrentExamType(parsed.session.examType);
            }
        } catch(e) {}
    }
  }, [currentScreen]);

  const handleLogin = (user: User, examType: ExamType) => {
    setCurrentUser(user);
    setCurrentExamType(examType);
    if (user.role === 'admin') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('dashboard');
    }
    // Re-initialize to ensure fresh data
    initializeDatabase().catch(console.error);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentSession(null);
    setCurrentScreen('login');
  };

  const handleStartExam = (subjects: Subject[]) => {
    localStorage.removeItem(SAVE_KEY);
    // startExam is synchronous because initializeDatabase has pre-loaded cache
    const session = startExam(subjects, currentExamType);
    setCurrentSession(session);
    setCurrentScreen('exam');
  };

  const handleResumeExam = () => {
      try {
          const savedData = localStorage.getItem(SAVE_KEY);
          if (savedData) {
              const { session, savedTimeLeft } = JSON.parse(savedData);
              const timeSpentSeconds = session.durationSeconds - savedTimeLeft;
              session.startTime = Date.now() - (timeSpentSeconds * 1000);
              setCurrentSession(session);
              setCurrentExamType(session.examType);
              setCurrentScreen('exam');
          }
      } catch (e) {
          console.error("Failed to resume exam", e);
          alert("Could not resume previous session. Starting fresh.");
          localStorage.removeItem(SAVE_KEY);
          setHasSavedSession(false);
      }
  };

  const handleSubmitExam = async (finalSession: ExamSession) => {
    localStorage.removeItem(SAVE_KEY);
    setHasSavedSession(false);
    
    // For Kids Mode, we might want to skip standard result processing or handle it differently
    // But since GameScreen handles its own logic, this is mostly for standard exams
    const result = calculateResult(finalSession);
    
    // Save Result to Backend (or Offline Queue)
    if (currentUser && currentUser.username) {
        try {
            await saveStudentResult(currentUser.username, result);
        } catch (e: any) {
            console.warn(e.message);
            setSyncMsg("Result saved offline. Will sync when online.");
            setTimeout(() => setSyncMsg(''), 5000);
        }
    }

    setExamResult(result);
    setCurrentScreen('result');
  };

  const handleReviewHistory = (result: ExamResult) => {
      if (!result.session) {
          alert("Detailed review data is not available for this record.");
          return;
      }
      setExamResult(result);
      setCurrentScreen('result');
  };

  const handleRestart = () => {
    setCurrentSession(null);
    setExamResult(null);
    setCurrentScreen('dashboard');
  };

  if (!currentUser || currentScreen === 'login') {
    return (
        <>
            {(FORCE_OFFLINE || !isOnline) && (
                <div className="bg-red-600 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-2">
                    <WifiOff size={12}/> {FORCE_OFFLINE ? 'STANDALONE MODE' : 'You are currently offline. Some features are disabled.'}
                </div>
            )}
            <LoginScreen 
                onLogin={handleLogin} 
                theme={theme} 
                toggleTheme={toggleTheme}
                isOnline={isOnline}
            />
        </>
    );
  }

  return (
    <div className="font-sans text-gray-900 dark:text-gray-100 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
      
      {/* NETWORK STATUS BAR */}
      {(FORCE_OFFLINE || !isOnline || isSyncing || syncMsg) && (
          <div className={`text-xs font-bold text-center py-1 flex items-center justify-center gap-2 transition-colors ${
              (FORCE_OFFLINE || !isOnline) ? 'bg-red-600 text-white' : 
              (isSyncing || syncMsg) ? 'bg-blue-600 text-white' : 'bg-transparent'
          }`}>
              {(FORCE_OFFLINE || !isOnline) ? (
                  <><WifiOff size={12}/> {FORCE_OFFLINE ? 'STANDALONE MODE (OFFLINE)' : 'OFFLINE MODE'} - Results will save locally.</>
              ) : (
                  <><RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} /> {syncMsg || "Syncing data..."}</>
              )}
          </div>
      )}

      {currentScreen === 'dashboard' && (
        <SubjectSelection 
          user={currentUser}
          examType={currentExamType}
          setExamType={setCurrentExamType}
          onStartExam={handleStartExam} 
          hasSavedSession={hasSavedSession}
          onResume={handleResumeExam}
          onLogout={handleLogout}
          onReview={handleReviewHistory}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {currentScreen === 'exam' && currentSession && (
        currentExamType === 'KIDS' ? (
             <GameScreen 
                session={currentSession}
                onSubmit={handleSubmitExam}
                onExit={handleRestart}
             />
        ) : (
            <ExamSimulator 
            session={currentSession} 
            user={currentUser}
            onSubmit={handleSubmitExam} 
            theme={theme}
            toggleTheme={toggleTheme}
            />
        )
      )}

      {currentScreen === 'result' && examResult && (
        <ResultView 
          result={examResult} 
          onRestart={handleRestart}
          onHome={handleRestart}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {currentScreen === 'admin' && (
        <AdminPanel 
          onBack={handleLogout} 
          theme={theme}
          toggleTheme={toggleTheme}
          isOnline={isOnline}
        /> 
      )}
    </div>
  );
};

export default App;
