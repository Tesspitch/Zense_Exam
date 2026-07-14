import { useEffect, useState } from 'react';
import axios from 'axios';
import { Book, Edit3, Trash2, Plus, X, User, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubjectTeacher = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    sj_name: '',
    sj_id: '',
    sj_desc: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (sj_id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/teacher/subjects/${sj_id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubjects();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  const openEditModal = (subject) => {
    setIsEditing(true);
    setFormData({
      sj_id: subject.sj_id,
      sj_name: subject.sj_name,
      sj_desc: subject.sj_desc || ''
    });
    setIsModalOpen(true);
  };
  
  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({ sj_name: '', sj_id: '', sj_desc: '' });
    setIsModalOpen(true);
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      const res = await axios.get('http://localhost:8000/api/teacher/subjects/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
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
        await axios.put(`http://localhost:8000/api/teacher/subjects/${formData.sj_id}/`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('http://localhost:8000/api/teacher/subjects/', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Success
      setIsModalOpen(false);
      setFormData({ sj_name: '', sj_id: '', sj_desc: '' });
      fetchSubjects(); // Refresh the list
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.error || err.message || 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your teaching subjects</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-zense-navy hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Subject List */}
      {loading ? (
        <div className="text-sm text-slate-400">Loading subjects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {subjects.length === 0 && !error && (
            <div className="col-span-full text-center text-slate-500 py-10">No subjects found. Add a new subject to get started.</div>
          )}
          {subjects.map((subject) => (
            <div key={subject.sj_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-xl text-zense-navy">{subject.sj_name}</h3>
                    <p className="text-sm text-zense-navy font-semibold mt-1">{subject.sj_id}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-zense-navy">
                    <Book size={20} />
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                  {subject.sj_desc || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User size={16} className="text-slate-400" />
                    <span>{subject.teacher_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{subject.sj_datetime ? subject.sj_datetime.split(' ')[0] : 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center text-center mb-4">
                  <BookOpen size={20} className="text-zense-navy mb-2" />
                  <span className="text-xl font-bold text-slate-800">{subject.courses}</span>
                  <span className="text-xs text-slate-500">Total Courses</span>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button onClick={() => navigate('/teacher/courses')} className="flex-1 bg-zense-navy text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-900 transition-colors">
                    View Subject
                  </button>
                  <button onClick={() => openEditModal(subject)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(subject.sj_id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Subject' : 'Add New Subject'}</h2>
                <p className="text-sm text-slate-500 mt-1">{isEditing ? 'Update subject details' : 'Create a new subject to organize your courses'}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
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
                  <label htmlFor="sj_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    id="sj_name"
                    name="sj_name"
                    value={formData.sj_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Mathematics"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="sj_id" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    id="sj_id"
                    name="sj_id"
                    value={formData.sj_id}
                    onChange={handleInputChange}
                    placeholder="e.g., MATH"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-100 disabled:text-slate-500"
                    required
                    disabled={isEditing}
                  />
                </div>
                
                <div>
                  <label htmlFor="sj_desc" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="sj_desc"
                    name="sj_desc"
                    value={formData.sj_desc}
                    onChange={handleInputChange}
                    placeholder="Brief description of the subject"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zense-navy hover:bg-blue-900 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-70 flex justify-center"
                >
                  {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Subject' : 'Create Subject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTeacher;
