import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Calendar, AlertCircle, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  
  // Form states
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchProjectData();
    fetchUsers();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching project data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/tasks', { ...newTask, projectId: id });
      setTasks([...tasks, data]);
      setIsTaskModalOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '' });
    } catch (error) {
      console.error('Error creating task', error);
      alert('Failed to create task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/projects/${id}/members`, { email: newMemberEmail });
      setProject(data);
      setIsMemberModalOpen(false);
      setNewMemberEmail('');
    } catch (error) {
      console.error('Error adding member', error);
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/tasks/${editingTask._id}`, editingTask);
      setTasks(tasks.map(t => t._id === data._id ? data : t));
      setIsEditTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task', error);
      alert('Failed to update task');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!project) return <div>Project not found</div>;

  const isAdmin = project.adminId._id === user._id || user.role === 'Admin';

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>
          <div className="flex space-x-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsMemberModalOpen(true)}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Member
                </button>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-900">Team Members</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.members.map(member => (
              <span key={member._id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {member.name} {member._id === project.adminId._id ? '(Admin)' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex overflow-x-auto pb-4 space-x-4">
        {columns.map(status => (
          <div key={status} className="bg-gray-100 rounded-lg p-4 min-w-[320px] w-80 flex-shrink-0">
            <h3 className="font-semibold text-gray-700 mb-4">{status}</h3>
            <div className="space-y-3">
              {tasks.filter(t => t.status === status).map(task => (
                <div key={task._id} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <button onClick={() => { setEditingTask(task); setIsEditTaskModalOpen(true); }} className="text-gray-400 hover:text-gray-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  {task.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                  
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    
                    {task.dueDate && (
                      <span className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                  
                  {task.assignedTo && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center">
                      <div className="h-5 w-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2 font-medium">
                        {task.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      {task.assignedTo.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsTaskModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateTask}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Task</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assign To</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}>
                        <option value="">Unassigned</option>
                        {project.members.map(member => (
                          <option key={member._id} value={member._id}>{member.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">Add Task</button>
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditTaskModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsEditTaskModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateTask}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Task</h3>
                  <div className="space-y-4">
                    {isAdmin ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" rows="3" value={editingTask.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})}></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={editingTask.dueDate ? editingTask.dueDate.substring(0, 10) : ''} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={editingTask.priority} onChange={e => setEditingTask({...editingTask, priority: e.target.value})}>
                              <option>Low</option>
                              <option>Medium</option>
                              <option>High</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Assign To</label>
                          <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={editingTask.assignedTo?._id || ''} onChange={e => setEditingTask({...editingTask, assignedTo: e.target.value})}>
                            <option value="">Unassigned</option>
                            {project.members.map(member => (
                              <option key={member._id} value={member._id}>{member.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">You can only change the status of this task.</p>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})}>
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">Save Changes</button>
                  <button type="button" onClick={() => setIsEditTaskModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsMemberModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddMember}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add Team Member</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Email</label>
                    <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Enter user's email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">Add Member</button>
                  <button type="button" onClick={() => setIsMemberModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
