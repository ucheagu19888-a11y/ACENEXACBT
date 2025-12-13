
import { Question, Subject, ExamSession, ExamResult, ExamType } from '../types';
import { getApiUrl, FORCE_OFFLINE } from './config';

// Global Cache to maintain synchronous feel for Exam Engine where possible
let GLOBAL_QUESTION_BANK: Question[] = [];
const CACHE_KEY_QUESTIONS = 'jamb_cbt_questions_cache';
const CACHE_KEY_OFFLINE_RESULTS = 'jamb_cbt_offline_results';

// --- MOCK DATA FOR OFFLINE/PREVIEW MODE ---
const MOCK_QUESTIONS: Question[] = [
    { id: 'm1', subject: 'Mathematics', examType: 'JAMB', text: 'If 2x + 4 = 12, what is the value of x?', optionA: '2', optionB: '4', optionC: '6', optionD: '8', correctOption: 'B', explanation: '2x = 8, so x = 4' },
    { id: 'm2', subject: 'English', examType: 'JAMB', text: 'From the options, choose the word opposite in meaning to: ARROGANT', optionA: 'Humble', optionB: 'Proud', optionC: 'Rude', optionD: 'Tall', correctOption: 'A', explanation: 'Humble is the opposite of Arrogant' },
    { id: 'm3', subject: 'Physics', examType: 'JAMB', text: 'Which of these is a derived unit?', optionA: 'Meter', optionB: 'Kilogram', optionC: 'Newton', optionD: 'Second', correctOption: 'C', explanation: 'Newton is derived from kg*m/s^2' },
    { id: 'm4', subject: 'Chemistry', examType: 'JAMB', text: 'What is the atomic number of Carbon?', optionA: '6', optionB: '12', optionC: '14', optionD: '8', correctOption: 'A', explanation: 'Carbon has 6 protons' },
    { id: 'm5', subject: 'Biology', examType: 'JAMB', text: 'Which organelle is known as the powerhouse of the cell?', optionA: 'Nucleus', optionB: 'Mitochondria', optionC: 'Ribosome', optionD: 'Golgi body', correctOption: 'B', explanation: '' },
    { id: 'm6', subject: 'Economics', examType: 'JAMB', text: 'Scarcity in economics refers to:', optionA: 'Hoarding of goods', optionB: 'Limited resources vs unlimited wants', optionC: 'Poverty', optionD: 'High prices', correctOption: 'B', explanation: '' },
    { id: 'm7', subject: 'Government', examType: 'JAMB', text: 'The rule of law implies that:', optionA: 'Lawyers rule', optionB: 'The president is above the law', optionC: 'Everyone is subject to the law', optionD: 'Police can arrest anyone', correctOption: 'C', explanation: '' },
    { id: 'm8', subject: 'Literature', examType: 'JAMB', text: 'A poem of fourteen lines is called a:', optionA: 'Sonnet', optionB: 'Ballad', optionC: 'Ode', optionD: 'Elegy', correctOption: 'A', explanation: '' },
    { id: 'm9', subject: 'CRS', examType: 'JAMB', text: 'Who denied Jesus three times?', optionA: 'Judas', optionB: 'Peter', optionC: 'James', optionD: 'John', correctOption: 'B', explanation: '' },
    { id: 'm10', subject: 'Civic Education', examType: 'WAEC', text: 'Which of the following is a core democratic value?', optionA: 'Dictatorship', optionB: 'Liberty', optionC: 'Censorship', optionD: 'Nepotism', correctOption: 'B', explanation: '' },
    { id: 'm11', subject: 'Agricultural Science', examType: 'JAMB', text: 'Soil texture refers to:', optionA: 'Color of soil', optionB: 'pH of soil', optionC: 'Size of soil particles', optionD: 'Fertility', correctOption: 'C', explanation: '' },
    { id: 'm12', subject: 'Geography', examType: 'JAMB', text: 'The earth rotates from:', optionA: 'East to West', optionB: 'West to East', optionC: 'North to South', optionD: 'South to North', correctOption: 'B', explanation: '' },
    { id: 'm13', subject: 'Commerce', examType: 'JAMB', text: 'Trade between two countries is called:', optionA: 'Domestic trade', optionB: 'Bilateral trade', optionC: 'Internal trade', optionD: 'Retail trade', correctOption: 'B', explanation: '' },
    { id: 'm14', subject: 'Financial Accounting', examType: 'JAMB', text: 'Assets = Liabilities + ?', optionA: 'Capital', optionB: 'Expense', optionC: 'Revenue', optionD: 'Debtors', correctOption: 'A', explanation: '' },
    { id: 'm15', subject: 'History', examType: 'JAMB', text: 'Nigeria became a republic in:', optionA: '1960', optionB: '1963', optionC: '1979', optionD: '1999', correctOption: 'B', explanation: '' },
    
    // KIDS MATHS QUESTIONS
    { id: 'k1', subject: 'Mathematics', examType: 'KIDS', text: 'What is 5 + 3?', optionA: '6', optionB: '7', optionC: '8', optionD: '9', correctOption: 'C', explanation: '5 plus 3 is 8.' },
    { id: 'k2', subject: 'Mathematics', examType: 'KIDS', text: 'Which shape has 3 sides?', optionA: 'Square', optionB: 'Circle', optionC: 'Triangle', optionD: 'Rectangle', correctOption: 'C', explanation: 'A triangle has three sides.' },
    { id: 'k3', subject: 'Mathematics', examType: 'KIDS', text: '10 - 4 = ?', optionA: '5', optionB: '6', optionC: '7', optionD: '4', correctOption: 'B', explanation: '10 minus 4 equals 6.' },
    { id: 'k4', subject: 'Mathematics', examType: 'KIDS', text: 'Which number is larger: 15 or 51?', optionA: '15', optionB: '51', optionC: 'They are equal', optionD: '0', correctOption: 'B', explanation: '51 has 5 tens, 15 has 1 ten.' },
    { id: 'k5', subject: 'Mathematics', examType: 'KIDS', text: 'What comes next: 2, 4, 6, __?', optionA: '7', optionB: '9', optionC: '8', optionD: '10', correctOption: 'C', explanation: 'We are counting by 2s.' },
    { id: 'k6', subject: 'Mathematics', examType: 'KIDS', text: 'How many fingers do you have on one hand?', optionA: '4', optionB: '5', optionC: '6', optionD: '10', correctOption: 'B', explanation: 'One hand typically has 5 fingers.' },
    { id: 'k7', subject: 'Mathematics', examType: 'KIDS', text: '2 x 3 = ?', optionA: '5', optionB: '6', optionC: '23', optionD: '1', correctOption: 'B', explanation: '2 times 3 is 6.' },
    { id: 'k8', subject: 'Mathematics', examType: 'KIDS', text: 'If you have 2 apples and get 2 more, how many do you have?', optionA: '2', optionB: '3', optionC: '4', optionD: '5', correctOption: 'C', explanation: '2 + 2 = 4.' },
    { id: 'k9', subject: 'Mathematics', examType: 'KIDS', text: 'What time is it when the big hand is on 12 and small hand is on 3?', optionA: '3 o\'clock', optionB: '12 o\'clock', optionC: '6 o\'clock', optionD: '9 o\'clock', correctOption: 'A', explanation: 'It is 3:00.' },
    { id: 'k10', subject: 'Mathematics', examType: 'KIDS', text: 'Which is an even number?', optionA: '1', optionB: '3', optionC: '4', optionD: '5', correctOption: 'C', explanation: 'Numbers ending in 0, 2, 4, 6, 8 are even.' },
    { id: 'k11', subject: 'Mathematics', examType: 'KIDS', text: 'Double of 5 is?', optionA: '10', optionB: '15', optionC: '55', optionD: '20', correctOption: 'A', explanation: '5 + 5 = 10.' },
    { id: 'k12', subject: 'Mathematics', examType: 'KIDS', text: 'Half of 10 is?', optionA: '2', optionB: '5', optionC: '4', optionD: '6', correctOption: 'B', explanation: '10 divided by 2 is 5.' },
];

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

const apiRequest = async (endpoint: string, method: string, body?: any) => {
    // Fast fail if we are definitely offline
    if (!navigator.onLine && !FORCE_OFFLINE) {
        throw new Error("Network offline");
    }

    if (FORCE_OFFLINE) throw new Error("Offline Mode");

    const url = getApiUrl(endpoint);
    try {
        const res = await fetchWithTimeout(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        }, 3000);

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Server returned non-JSON response (Status ${res.status}). Backend may be unreachable.`);
        }

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || `API Request Failed: ${res.statusText}`);
        return data;
    } catch (err: any) {
        console.warn(`API Warning [${endpoint}]:`, err.message);
        throw err;
    }
};

// --- INITIALIZATION (WITH FALLBACKS) ---
export const initializeDatabase = async () => {
    // 1. Load Local Cache or Mock
    if (GLOBAL_QUESTION_BANK.length === 0) {
        const cached = localStorage.getItem(CACHE_KEY_QUESTIONS);
        if (cached) {
        try {
            GLOBAL_QUESTION_BANK = JSON.parse(cached);
        } catch(e){}
        } else {
        GLOBAL_QUESTION_BANK = MOCK_QUESTIONS;
        }
    }

    if (FORCE_OFFLINE) {
        console.log("Offline Mode: Database initialized from local cache/mock.");
        return true;
    }

    try {
        console.log("Attempting to fetch questions from API...");
        const questions = await apiRequest('/api/questions', 'GET');
        
        if (Array.isArray(questions) && questions.length > 0) {
            GLOBAL_QUESTION_BANK = questions;
            try {
                localStorage.setItem(CACHE_KEY_QUESTIONS, JSON.stringify(questions));
            } catch (cacheErr) {}
            console.log("Database initialized from API.");
            return true;
        }
    } catch (e) {
        console.warn("API unavailable. Using offline mode.");
        return true;
    }
    return false;
};

export const getAllQuestions = (): Question[] => {
  return GLOBAL_QUESTION_BANK;
};

export const fetchAllQuestions = async () => {
    await initializeDatabase();
    return GLOBAL_QUESTION_BANK;
};

export const deleteQuestion = async (id: string) => {
  if (!FORCE_OFFLINE) {
    try { await apiRequest(`/api/questions/${id}`, 'DELETE'); } catch (e) { console.warn("Delete failed (Offline mode)"); }
  }
  GLOBAL_QUESTION_BANK = GLOBAL_QUESTION_BANK.filter(q => q.id !== id);
  localStorage.setItem(CACHE_KEY_QUESTIONS, JSON.stringify(GLOBAL_QUESTION_BANK));
};

export const addQuestionToBank = async (q: Question) => {
  if (!FORCE_OFFLINE) {
    try {
        const saved = await apiRequest('/api/questions', 'POST', q);
        GLOBAL_QUESTION_BANK.push(saved);
        localStorage.setItem(CACHE_KEY_QUESTIONS, JSON.stringify(GLOBAL_QUESTION_BANK));
        return;
    } catch (e) {
        console.warn("Add failed (Offline mode). Saving locally.");
    }
  }
  // Local Only
  GLOBAL_QUESTION_BANK.push(q);
  localStorage.setItem(CACHE_KEY_QUESTIONS, JSON.stringify(GLOBAL_QUESTION_BANK));
};

export const addBulkQuestions = async (questions: Question[]) => {
  if (!FORCE_OFFLINE) {
    try {
        const res = await apiRequest('/api/questions/bulk', 'POST', questions);
        await initializeDatabase();
        return res.count;
    } catch (e) {
        console.warn("Bulk add failed (Offline mode). Saving locally.");
    }
  }
  // Local Only
  GLOBAL_QUESTION_BANK.push(...questions);
  localStorage.setItem(CACHE_KEY_QUESTIONS, JSON.stringify(GLOBAL_QUESTION_BANK));
  return questions.length;
};

export const resetDatabase = async (clearAll: boolean = false) => {
  if (clearAll) {
      if (!FORCE_OFFLINE) {
         try { await apiRequest('/api/questions/reset/all', 'DELETE'); } catch(e){}
      }
      GLOBAL_QUESTION_BANK = [];
      localStorage.removeItem(CACHE_KEY_QUESTIONS);
  }
};

export const getBankStats = () => {
    const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature', 'CRS', 'Agricultural Science', 'Geography', 'Commerce', 'Financial Accounting', 'Civic Education', 'Further Mathematics', 'History'];
    const stats: Record<string, { JAMB: number, WAEC: number, KIDS: number }> = {};
  
    SUBJECTS.forEach(sub => {
        const subQs = GLOBAL_QUESTION_BANK.filter(q => q.subject === sub);
        stats[sub] = {
            JAMB: subQs.filter(q => q.examType === 'JAMB').length,
            WAEC: subQs.filter(q => q.examType === 'WAEC').length,
            KIDS: subQs.filter(q => q.examType === 'KIDS').length
        };
    });
    return stats;
};

const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array]; 
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const randomizeOptions = (q: Question): Question => {
    const options = [
        { id: 'A', text: q.optionA },
        { id: 'B', text: q.optionB },
        { id: 'C', text: q.optionC },
        { id: 'D', text: q.optionD },
    ];
    
    const correctText = options.find(o => o.id === q.correctOption)?.text;
    const shuffledOpts = shuffle(options);
    const newCorrectIndex = shuffledOpts.findIndex(o => o.text === correctText);
    const keys: ('A'|'B'|'C'|'D')[] = ['A', 'B', 'C', 'D'];

    return {
        ...q,
        optionA: shuffledOpts[0].text,
        optionB: shuffledOpts[1].text,
        optionC: shuffledOpts[2].text,
        optionD: shuffledOpts[3].text,
        correctOption: keys[newCorrectIndex] || 'A'
    };
};

export const getRandomQuestions = (subject: Subject, count: number, examType: ExamType): Question[] => {
  const subjectQuestions = GLOBAL_QUESTION_BANK.filter(q => q.subject === subject && q.examType === examType);
  
  if (subjectQuestions.length === 0) {
      return Array(count).fill(null).map((_, i) => ({
          id: `error-${subject}-${i}`,
          subject,
          examType,
          text: `No ${examType} questions available for ${subject}. (Offline Mode)`,
          optionA: 'N/A', optionB: 'N/A', optionC: 'N/A', optionD: 'N/A',
          correctOption: 'A'
      }));
  }

  const result: Question[] = [];
  let pool = shuffle(subjectQuestions);
  
  while (result.length < count) {
      if (pool.length === 0) {
          if (subjectQuestions.length < count) {
             // Not enough questions, just repeat pool
             pool = shuffle(subjectQuestions);
          } else {
             break; 
          }
      }
      const q = pool.pop();
      if (q) {
          result.push({
              ...randomizeOptions(q),
              id: `${q.id}-${Date.now()}-${result.length}-${Math.random().toString(36).substr(2,5)}` 
          });
      }
  }
  return result;
};

export const startExam = (selectedElectives: Subject[], examType: ExamType): ExamSession => {
  let subjects: Subject[] = [];
  let duration = 0;
  let qCount = 40;

  if (examType === 'JAMB') {
      const electives = shuffle(selectedElectives.filter(s => s !== 'English')).slice(0, 3);
      subjects = ['English', ...electives];
      duration = 7200; 
      qCount = 40;
  } else if (examType === 'KIDS') {
      // KIDS Mode configuration
      subjects = ['Mathematics'];
      duration = 1800; // 30 minutes
      qCount = 20; // Fewer questions for kids
  } else {
      // WAEC
      subjects = [...selectedElectives];
      duration = 3000; 
      qCount = 60; 
  }
  
  const questions: Record<Subject, Question[]> = {} as any;
  
  subjects.forEach(sub => {
    questions[sub] = getRandomQuestions(sub, qCount, examType);
  });

  return {
    id: `session-${Date.now()}`,
    examType,
    subjects,
    questions,
    answers: {},
    markedForReview: [],
    startTime: Date.now(),
    durationSeconds: duration,
    isSubmitted: false
  };
};

export const calculateResult = (session: ExamSession): ExamResult => {
  let totalScore = 0;
  let totalPossible = 0;
  const subjectScores: any = {};

  session.subjects.forEach(sub => {
    let subScore = 0;
    const questions = session.questions[sub];
    questions.forEach(q => {
      if (session.answers[q.id] === q.correctOption) {
        subScore++;
      }
    });
    subjectScores[sub] = { score: subScore, total: questions.length };
    totalScore += subScore;
    totalPossible += questions.length;
  });

  const aggregateScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 400) : 0;

  return {
    id: `res-${Date.now()}`,
    totalScore,
    aggregateScore,
    subjectScores,
    session,
    timestamp: session.startTime
  };
};

// --- OFFLINE RESULT SYNC ---

interface QueuedResult {
    username: string;
    result: ExamResult;
    timestamp: number;
}

export const saveStudentResult = async (username: string, result: ExamResult) => {
    // 1. Always save to Local Queue first in offline mode
    const queue: QueuedResult[] = JSON.parse(localStorage.getItem(CACHE_KEY_OFFLINE_RESULTS) || '[]');
    queue.push({ username, result, timestamp: Date.now() });
    localStorage.setItem(CACHE_KEY_OFFLINE_RESULTS, JSON.stringify(queue));

    if (!FORCE_OFFLINE) {
        try {
            await apiRequest('/api/results', 'POST', { username, result });
            // If successful, remove from queue? Or just keep as history? 
            // For now, simpler to just keep queue as history in offline mode.
        } catch (e) {
            console.warn("Failed to save result online. Saved locally.");
            throw new Error("Result saved offline.");
        }
    } else {
        // In forced offline mode, we just save locally and return
        return;
    }
};

export const syncOfflineResults = async (): Promise<number> => {
    if (FORCE_OFFLINE) return 0;
    if (!navigator.onLine) return 0;

    const queue: QueuedResult[] = JSON.parse(localStorage.getItem(CACHE_KEY_OFFLINE_RESULTS) || '[]');
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    const remaining: QueuedResult[] = [];

    for (const item of queue) {
        try {
            await apiRequest('/api/results', 'POST', { username: item.username, result: item.result });
            syncedCount++;
        } catch (e) {
            remaining.push(item);
        }
    }

    localStorage.setItem(CACHE_KEY_OFFLINE_RESULTS, JSON.stringify(remaining));
    return syncedCount;
};

export const getStudentResults = async (username: string): Promise<ExamResult[]> => {
    if (!FORCE_OFFLINE) {
        try {
            return await apiRequest(`/api/results/${username}`, 'GET');
        } catch (e) {}
    }
    // Fallback/Offline: Read from local queue
    const queue: QueuedResult[] = JSON.parse(localStorage.getItem(CACHE_KEY_OFFLINE_RESULTS) || '[]');
    return queue.filter(q => q.username === username).map(q => q.result).sort((a,b) => b.timestamp - a.timestamp);
};

export const clearStudentResults = async (username: string) => {
    if (!FORCE_OFFLINE) {
        try { await apiRequest(`/api/results/${username}`, 'DELETE'); } catch(e){}
    }
    // Clear local
    let queue: QueuedResult[] = JSON.parse(localStorage.getItem(CACHE_KEY_OFFLINE_RESULTS) || '[]');
    queue = queue.filter(q => q.username !== username);
    localStorage.setItem(CACHE_KEY_OFFLINE_RESULTS, JSON.stringify(queue));
};
