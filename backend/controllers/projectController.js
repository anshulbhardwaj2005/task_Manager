import Project from '../models/Project.js';
import User from '../models/User.js';

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = new Project({
      name,
      description,
      adminId: req.user._id,
      members: [req.user._id], // Admin is a member by default
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    // Return projects where user is a member
    const projects = await Project.find({ members: req.user._id }).populate('adminId', 'name email').populate('members', 'name email');
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('adminId', 'name email')
      .populate('members', 'name email role');

    if (project) {
      // Check if user is member
      if (!project.members.some(member => member._id.toString() === req.user._id.toString()) && project.adminId._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this project');
      }
      res.json(project);
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   PUT /api/projects/:id/members
// @access  Private/Admin
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);

    if (project) {
      if (project.adminId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Only project admin can add members');
      }

      const user = await User.findOne({ email });
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }

      if (project.members.includes(user._id)) {
        res.status(400);
        throw new Error('User is already a member');
      }

      project.members.push(user._id);
      await project.save();
      
      const updatedProject = await Project.findById(req.params.id).populate('members', 'name email role');
      res.json(updatedProject);
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

export { createProject, getProjects, getProjectById, addMember };
