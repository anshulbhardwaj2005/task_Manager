import express from 'express';
import { createProject, getProjects, getProjectById, addMember } from '../controllers/projectController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, admin, createProject)
  .get(protect, getProjects);

router.route('/:id')
  .get(protect, getProjectById);

router.route('/:id/members')
  .put(protect, admin, addMember);

export default router;
