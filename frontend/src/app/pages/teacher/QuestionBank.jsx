import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Edit3, Trash2, Plus, X, Check, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { renderTextWithMath, ImageUploadField } from '../../component/QuestionComponents';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Delete Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    chap_id: '',
    qt_diff_lv: 'Medium',
    qt_detail: '',
    qt_image_url: '',
    shared_text: '',
    shared_image_url: '',
    choices: [
      { choice_detail: '', choice_image_url: '', choice_correct: false },
      { choice_detail: '', choice_image_url: '', choice_correct: false }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrMode, setOcrMode] = useState('text');

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsOcrLoading(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    formDataObj.append('mode', ocrMode);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/teacher/math-ocr/', formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const latex = res.data.latex;
      setFormData(prev => ({
        ...prev,
        qt_detail: prev.qt_detail ? prev.qt_detail + '\n\n' + latex : latex
      }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to process image');
    } finally {
      setIsOcrLoading(false);
      e.target.value = null;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');

      const [questionsRes, coursesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/teacher/questions/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/teacher/courses/', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setQuestions(questionsRes.data.questions || []);
      setCourses(coursesRes.data.courses || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChoiceChange = (index, field, value) => {
    const updatedChoices = [...formData.choices];
    updatedChoices[index][field] = value;

    // If setting a choice as correct, we might want to uncheck others if it's single choice, 
    // but the UI allows checkboxes so it might be multiple choice. We'll allow multiple.

    setFormData({ ...formData, choices: updatedChoices });
  };

  const addChoice = () => {
    setFormData({
      ...formData,
      choices: [...formData.choices, { choice_detail: '', choice_image_url: '', choice_correct: false }]
    });
  };

  const removeChoice = (index) => {
    if (formData.choices.length <= 2) return;
    const updatedChoices = formData.choices.filter((_, i) => i !== index);
    setFormData({ ...formData, choices: updatedChoices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');

      if (editingId) {
        await axios.put(`http://localhost:8000/api/teacher/questions/${editingId}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('http://localhost:8000/api/teacher/questions/', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        chap_id: '', qt_diff_lv: 'Medium', qt_detail: '', qt_image_url: '',
        shared_text: '', shared_image_url: '',
        choices: [
          { choice_detail: '', choice_image_url: '', choice_correct: false },
          { choice_detail: '', choice_image_url: '', choice_correct: false }
        ]
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.error || err.message || 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.qt_detail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse ? q.chap_id === selectedCourse : true;
    return matchesSearch && matchesCourse;
  });

  const handleEditQuestion = (q) => {
    setEditingId(q.qt_id);
    setFormData({
      chap_id: q.chap_id || '',
      qt_diff_lv: q.qt_diff_lv || 'Medium',
      qt_detail: q.qt_detail || '',
      qt_image_url: q.qt_image_url || '',
      shared_text: q.shared_text || '',
      shared_image_url: q.shared_image_url || '',
      choices: q.choices.length > 0 ? q.choices.map(c => ({
        choice_id: c.choice_id,
        choice_detail: c.choice_detail || '',
        choice_image_url: c.choice_image_url || '',
        choice_correct: c.choice_correct || false
      })) : [
        { choice_detail: '', choice_image_url: '', choice_correct: false },
        { choice_detail: '', choice_image_url: '', choice_correct: false }
      ]
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (qtId) => {
    setQuestionToDelete(qtId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/teacher/questions/${questionToDelete}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete question');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Question Bank</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your exam questions</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/teacher/questions/bulk')}
            className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Bulk Input
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                chap_id: '', qt_diff_lv: 'Medium', qt_detail: '', qt_image_url: '',
                shared_text: '', shared_image_url: '',
                choices: [
                  { choice_detail: '', choice_image_url: '', choice_correct: false },
                  { choice_detail: '', choice_image_url: '', choice_correct: false }
                ]
              });
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none justify-center bg-zense-navy hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white min-w-[200px]"
        >
          <option value="">All Courses</option>
          {courses.map(c => (
            <option key={c.chap_id} value={c.chap_id}>{c.chap_name}</option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Question List */}
      {loading ? (
        <div className="text-sm text-slate-400">Loading questions...</div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.length === 0 && !error && (
            <div className="text-center text-slate-500 py-10">No questions found.</div>
          )}

          {filteredQuestions.map((q) => (
            <div key={q.qt_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">{renderTextWithMath(q.qt_detail)}</h3>
                  {q.qt_image_url && (
                    <img src={q.qt_image_url} alt="Question" className="mt-2 max-w-sm rounded-lg border border-slate-200" />
                  )}
                  {q.shared_text && (
                    <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      <span className="font-semibold block mb-1">Scenario:</span>
                      {renderTextWithMath(q.shared_text)}
                      {q.shared_image_url && <img src={q.shared_image_url} alt="Scenario" className="mt-2 max-w-sm rounded-lg" />}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {q.chap_name}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${q.qt_diff_lv.toLowerCase() === 'easy' ? 'bg-green-50 text-green-700' :
                      q.qt_diff_lv.toLowerCase() === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                      {q.qt_diff_lv}
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {q.choices.length} choices
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditQuestion(q)} className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDeleteClick(q.qt_id)} className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {q.choices.map((c, idx) => (
                  <div key={c.choice_id || idx} className={`flex items-center p-3 rounded-xl border ${c.choice_correct ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                    {c.choice_correct && <Check size={18} className="text-green-600 mr-2" />}
                    <span className={`text-sm ${c.choice_correct ? 'text-green-800 font-medium' : 'text-slate-600 ml-6'}`}>
                      {String.fromCharCode(65 + idx)}. {renderTextWithMath(c.choice_detail)}
                    </span>
                    {c.choice_image_url && (
                      <div className="ml-auto">
                        <ImageIcon size={16} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
                <p className="text-sm text-slate-500 mt-1">Create a new multiple-choice question with unlimited choices</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="add-question-form" onSubmit={handleSubmit}>
                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {submitError}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                      <select
                        name="chap_id"
                        value={formData.chap_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                        required
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
                        name="qt_diff_lv"
                        value={formData.qt_diff_lv}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                        required
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
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
                          onClick={() => document.getElementById('ocr-upload').click()}
                          className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors shadow-sm"
                          disabled={isOcrLoading}
                        >
                          {isOcrLoading ? 'Scanning...' : '✨ แปลงรูปด้วย AI'}
                        </button>
                      </div>
                      <input
                        type="file"
                        id="ocr-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleOcrUpload}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <textarea
                        name="qt_detail"
                        value={formData.qt_detail}
                        onChange={handleInputChange}
                        placeholder={ocrMode === 'math' ? "Enter your question (use $math$ or $$math$$ for LaTeX)" : "Enter your question text"}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                        required
                      />
                      <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 overflow-y-auto max-h-[110px] text-sm">
                        <div className="text-xs font-semibold text-slate-400 mb-1">PREVIEW</div>
                        {renderTextWithMath(formData.qt_detail)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <ImageUploadField
                      label="Question Image (optional)"
                      value={formData.qt_image_url}
                      onChange={(val) => setFormData(prev => ({ ...prev, qt_image_url: val }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-slate-700">Answer Choices (Minimum 2)</label>
                    </div>

                    <div className="space-y-3">
                      {formData.choices.map((choice, index) => (
                        <div key={index} className={`p-4 rounded-xl border ${choice.choice_correct ? 'border-green-300 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={choice.choice_correct}
                              onChange={(e) => handleChoiceChange(index, 'choice_correct', e.target.checked)}
                              className="mt-3 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-500 w-6">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={choice.choice_detail}
                                    onChange={(e) => handleChoiceChange(index, 'choice_detail', e.target.value)}
                                    placeholder={ocrMode === 'math' ? `Choice ${String.fromCharCode(65 + index)} (use $math$ for LaTeX)` : `Choice ${String.fromCharCode(65 + index)}`}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    required
                                  />
                                  <div className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm overflow-x-auto whitespace-nowrap min-h-[38px] flex items-center">
                                    {choice.choice_detail ? renderTextWithMath(choice.choice_detail) : <span className="text-slate-400 text-xs">Preview</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="pl-8">
                                <ImageUploadField
                                  value={choice.choice_image_url}
                                  onChange={(val) => handleChoiceChange(index, 'choice_image_url', val)}
                                  placeholder="Choice Image URL (optional)"
                                />
                              </div>
                            </div>
                            {formData.choices.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeChoice(index)}
                                className="mt-2 text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={addChoice}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 border-dashed w-full justify-center"
                      >
                        <Plus size={16} /> Add Choice
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-question-form" disabled={isSubmitting} className="px-6 py-2.5 bg-zense-navy hover:bg-blue-900 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex-1">
                {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Question')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Question</h2>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setQuestionToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionBank;
