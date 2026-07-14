import { useEffect, useState } from 'react';
import axios from 'axios';
import { Book, Edit3, Trash2, Plus, X, User, Calendar, FileText, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CourseTeacher = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    chap_name: '',
    sj_id: '',
    chap_id: '',
    chap_desc: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (chap_id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/teacher/courses/${chap_id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete course');
    }
  };

  const openEditModal = (course) => {
    setIsEditing(true);
    setFormData({
      chap_id: course.chap_id,
      chap_name: course.chap_name,
      sj_id: course.sj_id,
      chap_desc: course.chap_desc || ''
    });
    setIsModalOpen(true);
  };
  
  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({ chap_name: '', sj_id: '', chap_id: '', chap_desc: '' });
    setIsModalOpen(true);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      
      const [coursesRes, subjectsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/teacher/courses/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/teacher/subjects/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setCourses(coursesRes.data.courses || []);
      setSubjects(subjectsRes.data.subjects || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      
      if (isEditing) {
        await axios.put(`http://localhost:8000/api/teacher/courses/${formData.chap_id}/`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('http://localhost:8000/api/teacher/courses/', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Success
      setIsModalOpen(false);
      setFormData({ chap_name: '', sj_id: '', chap_id: '', chap_desc: '' });
      fetchData(); // Refresh the list
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.error || err.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('header.courses', 'Courses')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('course.subtitle', 'Manage courses for your subjects')}</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full sm:w-auto justify-center bg-zense-navy dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          {t('course.addCourse', 'Add Course')}
        </button>
      </div>

      {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}

      {/* Course List */}
      {loading ? (
        <div className="text-sm text-slate-400">{t('common.loading', 'Loading...')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.length === 0 && !error && (
            <div className="col-span-full text-center text-slate-500 dark:text-slate-400 py-10">{t('course.noCourses', 'No courses found. Add a new course to get started.')}</div>
          )}
          {courses.map((course) => (
            <div key={course.chap_id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{course.chap_name}</h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-zense-navy dark:text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-md">
                      {course.chap_id}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <Book size={14} className="text-slate-400 dark:text-slate-500" />
                  <span>{course.sj_name}</span>
                  <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                  <span>Code: {course.sj_id}</span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 min-h-[40px]">
                  {course.chap_desc || t('course.noDescription', 'No description provided.')}
                </p>
                
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <User size={16} className="text-slate-400 dark:text-slate-500" />
                    <span>{course.teacher_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                    <span>{course.chap_datetime ? course.chap_datetime.split(' ')[0] : 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <HelpCircle size={20} className="text-zense-navy dark:text-blue-400 mb-2" />
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{course.questions_count}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('course.questionsBank', 'Questions Bank')}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <FileText size={20} className="text-zense-navy dark:text-blue-400 mb-2" />
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{course.total_exams}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('course.totalExams', 'Total Exams')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => navigate('/teacher/questions', { state: { filterCourseId: course.chap_id } })} className="flex-1 bg-zense-navy dark:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors">
                    {t('course.viewCourse', 'View Course')}
                  </button>
                  <button onClick={() => openEditModal(course)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(course.chap_id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg mx-4 shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isEditing ? t('course.editCourse', 'Edit Course') : t('course.addNewCourse', 'Add New Course')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isEditing ? t('course.updateDetails', 'Update course details') : t('course.createDetails', 'Create a new course for your students')}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {submitError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="chap_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('course.courseName', 'Course Name')}
                  </label>
                  <input
                    type="text"
                    id="chap_name"
                    name="chap_name"
                    value={formData.chap_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-white"
                    placeholder={t('course.courseNamePlaceholder', 'e.g. Chapter 1: Introduction')}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sj_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('course.subject', 'Subject')}
                    </label>
                    <div className="relative">
                      <select
                        id="sj_id"
                        name="sj_id"
                        value={formData.sj_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none bg-white dark:bg-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 text-slate-800 dark:text-white"
                        required
                        disabled={isEditing}
                      >
                        <option value="" disabled>{t('course.selectSubject', 'Select subject')}</option>
                        {subjects.map(sub => (
                          <option key={sub.sj_id} value={sub.sj_id}>{sub.sj_name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject Code (รหัสวิชา)
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                      {formData.sj_id || 'e.g., MATH'}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="chap_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('course.courseCode', 'Course Code')}
                  </label>
                  <input
                    type="text"
                    id="chap_id"
                    name="chap_id"
                    value={formData.chap_id}
                    onChange={handleInputChange}
                    placeholder={t('course.courseCodePlaceholder', 'e.g. MATH101')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    required
                    disabled={isEditing}
                  />
                </div>
                
                <div>
                  <label htmlFor="chap_desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('course.description', 'Description (Optional)')}
                  </label>
                  <textarea
                    id="chap_desc"
                    name="chap_desc"
                    value={formData.chap_desc}
                    onChange={handleInputChange}
                    placeholder={t('course.descriptionPlaceholder', 'Brief description of the course...')}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zense-navy dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-70 flex justify-center"
                >
                  {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTeacher;
