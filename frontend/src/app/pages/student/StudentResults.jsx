import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../utils/api';

const StudentResults = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_exams: 0,
    average_score: 0,
    passed: 0,
    failed: 0
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/api/student/results-page/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setStats(response.data.stats);
        setResults(response.data.detailed_results);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const getBadgeConfig = (percentage) => {
    if (percentage >= 80) return { text: t('studentResults.excellent', 'Excellent'), color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle size={14} /> };
    if (percentage >= 50) return { text: t('studentResults.passed', 'Passed'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <CheckCircle size={14} /> };
    return { text: t('studentResults.failed', 'Failed'), color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle size={14} /> };
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        {t('common.loading', 'Loading...')}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans text-slate-800 dark:text-slate-200">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('studentResults.examResults', 'Exam Results')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('studentResults.trackPerformance', 'Track your performance and progress')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('studentResults.totalExams', 'Total Exams')}</h3>
            <div className="text-blue-500"><FileText size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total_exams}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('studentResults.averageScore', 'Average Score')}</h3>
            <div className="text-emerald-500"><TrendingUp size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.average_score}%</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('studentResults.passed', 'Passed')}</h3>
            <div className="text-emerald-500"><CheckCircle size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.passed}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('studentResults.failed', 'Failed')}</h3>
            <div className="text-red-500"><XCircle size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.failed}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">{t('studentResults.detailedResults', 'Detailed Results')}</h2>

      {/* Detailed Results List */}
      <div className="space-y-6">
        {results.map((result, index) => {
          const badge = getBadgeConfig(result.percentage);
          return (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{result.exam_name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{result.subject_name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('studentResults.completedOn', 'Completed on {{date}}', { date: result.completed_on })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${badge.color}`}>
                    {badge.icon}
                    {badge.text}
                  </span>
                  <span className={`text-2xl font-bold ${result.percentage >= 50 ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                    {result.percentage}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('studentResults.questions', 'Questions')}</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white">{result.total_questions}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('studentResults.correct', 'Correct')}</div>
                  <div className="text-lg font-bold text-emerald-500">{result.correct}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('studentResults.incorrect', 'Incorrect')}</div>
                  <div className="text-lg font-bold text-red-500">{result.incorrect}</div>
                </div>
              </div>

              <div className="relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('studentResults.scoreProgress', 'Score Progress')}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{result.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`${getProgressColor(result.percentage)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${result.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}

        {results.length === 0 && !loading && (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
            {t('studentResults.noResults', 'No exam results found.')}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResults;
