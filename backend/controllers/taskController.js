import Task from '../models/Task.js';
import Project from '../models/Project.js';

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private (Admin for the project)
const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, status, projectId, assignedTo } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (project.adminId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('Not authorized to create tasks in this project');
    }

    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      status,
      projectId,
      assignedTo: assignedTo || null,
    });

    const createdTask = await task.save();
    
    // Populate assignedTo to return full details
    const populatedTask = await Task.findById(createdTask._id).populate('assignedTo', 'name email');
    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (!project.members.includes(req.user._id) && project.adminId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view tasks in this project');
    }

    const tasks = await Task.find({ projectId: req.params.projectId }).populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (status, assignment, etc.)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const project = await Project.findById(task.projectId);
    
    // Check if user is admin of project OR the assigned user (assigned user can only update status)
    const isAdmin = project.adminId.toString() === req.user._id.toString() || req.user.role === 'Admin';
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isAssigned) {
      res.status(403);
      throw new Error('Not authorized to update this task');
    }

    // Only Admin can update fields other than status
    if (!isAdmin && isAssigned) {
      // Member trying to update
      task.status = req.body.status || task.status;
    } else if (isAdmin) {
      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
      task.dueDate = req.body.dueDate || task.dueDate;
      task.priority = req.body.priority || task.priority;
      task.status = req.body.status || task.status;
      if (req.body.assignedTo !== undefined) {
         task.assignedTo = req.body.assignedTo ? req.body.assignedTo : null;
      }
    }

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id).populate('assignedTo', 'name email');
    res.json(populatedTask);
  } catch (error) {
    next(error);
  }
};

export { createTask, getTasksByProject, updateTask };
