import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { renderTextWithMath, ImageUploadField } from '../../component/QuestionComponents';

const BulkQuestionInput = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ocrMode, setOcrMode] = useState('text');
  const [ocrLoadingId, setOcrLoadingId] = useState(null);

  const [sharedScenario, setSharedScenario] = useState({ text: '', image_url: '' });

  // We start with one empty question
  const [questions, setQuestions] = useState([{
    id: 1, // temporary local id
    chap_id: '',
    qt_diff_lv: 'Medium',
    qt_detail: '',
    qt_image_url: '',
    choices: [
      { choice_detail: '', choice_image_url: '', choice_correct: false },
      { choice_detail: '', choice_image_url: '', choice_correct: false }
    ]
  }]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const res = await axios.get('http://localhost:8000/api/teacher/courses/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    // By default, inherit course and difficulty from the last question if available
    const lastQ = questions[questions.length - 1];
    setQuestions([
      ...questions,
      {
        id: newId,
        chap_id: lastQ ? lastQ.chap_id : '',
        qt_diff_lv: lastQ ? lastQ.qt_diff_lv : 'Medium',
        qt_detail: '',
        qt_image_url: '',
        choices: [
          { choice_detail: '', choice_image_url: '', choice_correct: false },
          { choice_detail: '', choice_image_url: '', choice_correct: false }
        ]
      }
    ]);
  };

  const removeQuestion = (qId) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId, field, value) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const addChoice = (qId) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          choices: [...q.choices, { choice_detail: '', choice_image_url: '', choice_correct: false }]
        };
      }
      return q;
    }));
  };

  const removeChoice = (qId, choiceIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.choices.length > 2) {
        return {
          ...q,
          choices: q.choices.filter((_, idx) => idx !== choiceIndex)
        };
      }
      return q;
    }));
  };

  const updateChoice = (qId, choiceIndex, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newChoices = [...q.choices];
        newChoices[choiceIndex][field] = value;
        return { ...q, choices: newChoices };
      }
      return q;
    }));
  };

  const handleOcrUpload = async (e, qId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setOcrLoadingId(qId);
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    formDataObj.append('mode', ocrMode);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/teacher/math-ocr/', formDataObj, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const latex = res.data.latex;
      setQuestions(questions.map(q => {
        if (q.id === qId) {
          return { ...q, qt_detail: q.qt_detail ? q.qt_detail + '\n\n' + latex : latex };
        }
        return q;
      }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to process image');
    } finally {
      setOcrLoadingId(null);
      e.target.value = null;
    }
  };

  // Metrics calculation
  const isQuestionComplete = (q) => {
    return q.chap_id && q.qt_detail && q.choices.every(c => c.choice_detail.trim() !== '') && q.choices.some(c => c.choice_correct);
  };

  const completedCount = questions.filter(isQuestionComplete).length;
  const incompleteCount = questions.length - completedCount;
  const totalChoices = questions.reduce((sum, q) => sum + q.choices.length, 0);

  const handleSaveAll = async () => {
    if (completedCount === 0) {
      setError('Please complete at least one question before saving.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const validQuestions = questions.filter(isQuestionComplete).map(({ id, ...rest }) => rest);

      await axios.post('http://localhost:8000/api/teacher/questions/bulk/', {
        questions: validQuestions,
        shared_group: {
          shared_text: sharedScenario.text,
          shared_image_url: sharedScenario.image_url
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate('/teacher/questions');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <button onClick={() => navigate('/teacher/questions')} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                <ArrowLeft size={14} /> Back to Bank
              </button>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Bulk Question Input</h1>
            <p className="text-sm text-slate-500">Add multiple questions in a single session</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/questions')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSubmitting || completedCount === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              Save All ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl">
            {error}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-blue-700">{questions.length}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Total Questions</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-red-500">{incompleteCount}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Incomplete</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-slate-700">{totalChoices}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Total Choices</div>
          </div>
        </div>
      </div>

      {/* Global Shared Scenario */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="p-6 bg-white rounded-xl border border-blue-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Shared Scenario (Optional)</h2>
            <p className="text-sm text-slate-500">This scenario will be applied to all questions added below.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <textarea
                value={sharedScenario.text}
                onChange={(e) => setSharedScenario(prev => ({...prev, text: e.target.value}))}
                placeholder={ocrMode === 'math' ? "Scenario text (use $math$ or $$math$$ for LaTeX)" : "Scenario text"}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
             />
             <div className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 overflow-y-auto max-h-[85px] text-sm">
                <div className="text-xs font-semibold text-slate-400 mb-1">PREVIEW</div>
                {renderTextWithMath(sharedScenario.text)}
             </div>
          </div>
          <div>
            <ImageUploadField 
              label="Scenario Image (optional)" 
              value={sharedScenario.image_url} 
              onChange={(val) => setSharedScenario(prev => ({...prev, image_url: val}))} 
              placeholder="Scenario Image URL (optional)" 
            />
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {questions.map((q, index) => {
          const complete = isQuestionComplete(q);
          return (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${complete ? 'bg-zense-navy' : 'bg-slate-400'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Question {index + 1}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${complete ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                      {complete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                    <select
                      value={q.chap_id}
                      onChange={(e) => updateQuestion(q.id, 'chap_id', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                    >
                      <option value="" disabled>Select course</option>
                      {courses.map(c => (
                        <option key={c.chap_id} value={c.chap_id}>{c.chap_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Difficulty Level</label>
                    <select
                      value={q.qt_diff_lv}
                      onChange={(e) => updateQuestion(q.id, 'qt_diff_lv', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Question Text</label>
                    <div className="flex items-center gap-2">
                      <select 
                        value={ocrMode} 
                        onChange={(e) => setOcrMode(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      >
                        <option value="math">LaTeX</option>
                        <option value="text">Text ปกติ</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => document.getElementById(`ocr-upload-${q.id}`).click()}
                        className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors shadow-sm"
                        disabled={ocrLoadingId === q.id}
                      >
                        {ocrLoadingId === q.id ? 'Scanning...' : '✨ แปลงรูปด้วย AI'}
                      </button>
                    </div>
                    <input 
                      type="file" 
                      id={`ocr-upload-${q.id}`}
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleOcrUpload(e, q.id)} 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                      value={q.qt_detail}
                      onChange={(e) => updateQuestion(q.id, 'qt_detail', e.target.value)}
                      placeholder={ocrMode === 'math' ? "Enter your question (use $math$ or $$math$$ for LaTeX)" : "Enter your question text"}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                    />
                    <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 overflow-y-auto max-h-[110px] text-sm">
                      <div className="text-xs font-semibold text-slate-400 mb-1">PREVIEW</div>
                      {renderTextWithMath(q.qt_detail)}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <ImageUploadField 
                    label="Question Image (optional)" 
                    value={q.qt_image_url} 
                    onChange={(val) => updateQuestion(q.id, 'qt_image_url', val)} 
                    placeholder="https://example.com/image.jpg" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">Answer Choices (Minimum 2)</label>
                    <button 
                      onClick={() => addChoice(q.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Choice
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {q.choices.map((choice, cIndex) => (
                      <div key={cIndex} className={`flex items-start gap-4 p-3 rounded-xl border ${choice.choice_correct ? 'border-green-300 bg-green-50/50' : 'border-slate-100 bg-white'}`}>
                        <div className="pt-2 pl-2">
                          <input
                            type="checkbox"
                            checked={choice.choice_correct}
                            onChange={(e) => updateChoice(q.id, cIndex, 'choice_correct', e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-400 w-5">
                              {String.fromCharCode(65 + cIndex)}
                            </span>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1">
                              <input
                                type="text"
                                value={choice.choice_detail}
                                onChange={(e) => updateChoice(q.id, cIndex, 'choice_detail', e.target.value)}
                                placeholder={ocrMode === 'math' ? `Choice ${String.fromCharCode(65 + cIndex)} (use $math$ for LaTeX)` : `Choice ${String.fromCharCode(65 + cIndex)}`}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                              />
                              <div className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm overflow-x-auto whitespace-nowrap min-h-[38px] flex items-center">
                                {choice.choice_detail ? renderTextWithMath(choice.choice_detail) : <span className="text-slate-400 text-xs">Preview</span>}
                              </div>
                            </div>
                          </div>
                          <div className="pl-7">
                            <ImageUploadField 
                              value={choice.choice_image_url} 
                              onChange={(val) => updateChoice(q.id, cIndex, 'choice_image_url', val)} 
                              placeholder="Image URL (optional)" 
                            />
                          </div>
                        </div>
                        {q.choices.length > 2 && (
                          <div className="pt-1">
                            <button 
                              onClick={() => removeChoice(q.id, cIndex)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={20} /> Add Another Question
        </button>
      </div>
      
      {/* Bottom Sticky Bar for smaller screens or just extra convenience */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 lg:hidden">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="text-sm text-slate-600">
            <span className="font-bold">{completedCount}</span> of {questions.length} questions completed
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/teacher/questions')}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSubmitting || completedCount === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Save All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkQuestionInput;
