import Task from '../models/Task.js';
import Project from '../models/Project.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // Find projects user is a member of
    const projects = await Project.find({ members: req.user._id });
    const projectIds = projects.map(p => p._id);

    // If user is Admin, they might want all tasks? Let's just do tasks for projects they are in.
    let taskFilter = { projectId: { $in: projectIds } };
    
    // If not admin, they only care about tasks assigned to them across these projects? 
    // Actually, dashboard typically shows project overview if they are in it. 
    // Let's filter tasks to those assigned to them AND all tasks in their projects.
    
    // Stats to gather:
    // 1. Total tasks
    // 2. Tasks by status (To Do, In Progress, Done)
    // 3. Tasks assigned to user
    // 4. Overdue tasks
    
    const allTasks = await Task.find(taskFilter);
    const myTasks = await Task.find({ assignedTo: req.user._id });

    const totalTasksCount = allTasks.length;
    
    let statusCounts = {
      'To Do': 0,
      'In Progress': 0,
      'Done': 0
    };

    let overdueTasksCount = 0;
    const now = new Date();

    allTasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Done') {
        overdueTasksCount++;
      }
    });

    res.json({
      totalTasks: totalTasksCount,
      statusCounts,
      myTasksCount: myTasks.length,
      overdueTasksCount,
      projectsCount: projects.length
    });

  } catch (error) {
    next(error);
  }
};

export { getDashboardStats };
