import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Send, AlertCircle, Loader2 } from 'lucide-react';
import { renderTextWithMath } from '../../component/QuestionComponents';

// Fisher-Yates shuffle
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Shuffling Logic that groups by scenario
const prepareAndShuffleQuestions = (questions) => {
  const groupsMap = new Map();
  const ungrouped = [];

  questions.forEach(q => {
    const shuffledChoices = shuffleArray(q.choices || []);
    const qProcessed = { ...q, choices: shuffledChoices };

    if (q.group && q.group.id) {
      if (!groupsMap.has(q.group.id)) {
        groupsMap.set(q.group.id, { groupInfo: q.group, questions: [] });
      }
      groupsMap.get(q.group.id).questions.push(qProcessed);
    } else {
      ungrouped.push(qProcessed);
    }
  });

  const allBlocks = [];
  groupsMap.forEach(value => {
    allBlocks.push({ type: 'group', ...value });
  });

  ungrouped.forEach(q => {
    allBlocks.push({ type: 'single', question: q });
  });

  const shuffledBlocks = shuffleArray(allBlocks);

  const finalQuestions = [];
  shuffledBlocks.forEach(block => {
    if (block.type === 'group') {
      block.questions.forEach(q => finalQuestions.push(q));
    } else {
      finalQuestions.push(block.question);
    }
  });

  return finalQuestions;
};

const ExamRoom = () => {
  const { examId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState('intro'); // 'intro', 'taking', 'submitting', 'submitted'
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);

  // Fetch Exam Data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/api/student/exams/${examId}/take/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExamData(res.data);
        const shuffled = prepareAndShuffleQuestions(res.data.questions);
        setQuestions(shuffled);
        // duration in minutes
        setTimeLeft(res.data.duration * 60);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load exam data.');
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  // Timer logic
  useEffect(() => {
    if (status === 'taking' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status, timeLeft]);

  const autoSubmit = async () => {
    if (status === 'submitted' || status === 'submitting') return;
    setStatus('submitting');
    await submitExamData();
  };

  const handleManualSubmit = async () => {
    setShowConfirmModal(false);
    setStatus('submitting');
    await submitExamData();
  };

  const submitExamData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:8000/api/student/exams/${examId}/submit/`, {
        answers: answers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
      setStatus('submitted');
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting exam');
      setStatus('taking'); // allow retry if network error
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-zense-navy dark:text-blue-500" size={48} /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button onClick={() => navigate('/student/dashboard')} className="w-full py-3 bg-zense-navy dark:bg-blue-600 text-white rounded-xl font-semibold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // INTRO VIEW
  if (status === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-10 text-center border-b border-slate-100 dark:border-slate-800">
            <h1 className="text-3xl font-extrabold text-zense-navy dark:text-blue-400 mb-2">{examData.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              {examData.subject_name || "Unknown Subject"}
            </p>
          </div>
          
          <div className="p-10">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-2xl text-center border border-blue-100 dark:border-slate-700">
                <p className="text-3xl font-black text-zense-navy dark:text-blue-400 mb-1">{questions.length}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('examRoom.totalQuestions', 'Total Questions')}</p>
              </div>
              <div className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-2xl text-center border border-blue-100 dark:border-slate-700">
                <p className="text-3xl font-black text-zense-navy dark:text-blue-400 mb-1">{examData.duration} <span className="text-lg text-slate-500 font-bold">min</span></p>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('examRoom.duration', 'Duration')}</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 p-6 rounded-2xl mb-8">
              <h3 className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2 mb-3">
                <AlertTriangle size={18} />
                {t('examRoom.importantInstructions', 'Important Instructions')}
              </h3>
              <ul className="text-red-600/80 dark:text-red-400/80 text-sm space-y-2 list-disc pl-5">
                <li>{t('examRoom.instruction1', 'Once you start, the timer will begin and cannot be paused')}</li>
                <li>{t('examRoom.instruction2', 'You can navigate between questions freely')}</li>
                <li>{t('examRoom.instruction3', 'Make sure to answer all questions before submitting')}</li>
                <li>{t('examRoom.instruction4', 'The exam will auto-submit when time runs out')}</li>
              </ul>
            </div>

            <button 
              onClick={() => setStatus('taking')}
              className="w-full py-4 bg-zense-navy dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 dark:shadow-none"
            >
              {t('examRoom.startExam', 'Start Exam')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS VIEW
  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">{t('examRoom.examSubmitted', 'Exam Submitted!')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{t('examRoom.thankYou', 'Thank you for completing the exam.')}</p>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 mb-8">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('examRoom.yourScore', 'Your Score')}</p>
            <p className="text-4xl font-black text-zense-navy dark:text-blue-400">{result?.score} <span className="text-xl text-slate-400 font-bold">/ {result?.total}</span></p>
          </div>

          <button 
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-4 bg-zense-navy dark:bg-blue-600 text-white rounded-xl font-bold transition-all"
          >
            {t('examRoom.returnDashboard', 'Return to Dashboard')}
          </button>
        </div>
      </div>
    );
  }

  // EXAM TAKING VIEW
  const currentQ = questions[currentIndex];
  const isAnswered = (idx) => answers[questions[idx].id] !== undefined;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{examData?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg tracking-wider ${timeLeft < 300 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 animate-pulse' : 'bg-blue-50 text-zense-navy dark:bg-blue-900/20 dark:text-blue-400'}`}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-80 shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sticky top-24 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t('examRoom.questionNav', 'Question Navigation')}</h3>
            
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                    currentIndex === idx 
                      ? 'ring-2 ring-zense-navy dark:ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 bg-zense-navy dark:bg-blue-600 text-white' 
                      : isAnswered(idx)
                        ? 'bg-green-500 text-white dark:bg-green-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-500">{t('examRoom.answered', 'Answered')}:</span>
                <span className="text-slate-800 dark:text-white">{answeredCount} / {questions.length}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-zense-navy dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {status === 'submitting' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <Loader2 className="animate-spin text-zense-navy dark:text-blue-500 mx-auto mb-4" size={48} />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Submitting your exam...</h2>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm relative min-h-[500px] flex flex-col">
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Question {currentIndex + 1} of {questions.length}
                </h2>
                {isAnswered(currentIndex) && (
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Answered
                  </span>
                )}
              </div>

              {/* Scenario Group Info (if applicable) */}
              {currentQ.group && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-zense-navy dark:border-blue-500 p-5 rounded-r-xl">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Scenario</h4>
                  {currentQ.group.text && (
                    <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed mb-3">
                      {renderTextWithMath(currentQ.group.text)}
                    </div>
                  )}
                  {currentQ.group.image_url && (
                    <img src={currentQ.group.image_url} alt="Scenario" className="max-w-full rounded-lg max-h-64 object-contain" />
                  )}
                </div>
              )}

              {/* Question Text */}
              <div className="mb-8 flex-1">
                <div className="text-lg text-slate-800 dark:text-white mb-4 leading-relaxed font-medium">
                  {renderTextWithMath(currentQ.text)}
                </div>
                {currentQ.image_url && (
                  <img src={currentQ.image_url} alt="Question" className="max-w-full rounded-lg max-h-64 object-contain mb-6" />
                )}

                {/* Choices */}
                <div className="space-y-3">
                  {currentQ.choices.map((c, cIdx) => {
                    const isSelected = answers[currentQ.id] === c.id;
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-zense-navy bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20' 
                            : 'border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center h-6">
                          <input 
                            type="radio" 
                            name={`question-${currentQ.id}`} 
                            value={c.id}
                            checked={isSelected}
                            onChange={() => setAnswers({...answers, [currentQ.id]: c.id})}
                            className="w-5 h-5 text-zense-navy focus:ring-zense-navy dark:text-blue-500 dark:focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 mt-0.5 font-medium text-slate-700 dark:text-slate-300">
                          <span className="font-bold mr-2 text-slate-900 dark:text-white">{String.fromCharCode(65 + cIdx)}.</span>
                          {renderTextWithMath(c.text)}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                  {t('common.previous', 'Previous')}
                </button>

                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                  >
                    {t('examRoom.submitExam', 'Submit Exam')}
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-zense-navy dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors"
                  >
                    {t('common.next', 'Next')}
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('examRoom.confirmSubmit', 'Submit Exam?')}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {answeredCount < questions.length 
                ? `You still have ${questions.length - answeredCount} unanswered questions. Are you sure you want to submit?`
                : 'You have answered all questions. Are you ready to submit?'
              }
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button 
                onClick={handleManualSubmit}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-zense-navy dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors"
              >
                {t('examRoom.confirm', 'Yes, Submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamRoom;
