import { Router } from 'express';
import { getUsers, getUsersForAssignment } from '../controllers/userController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.use(protect);

// Any logged-in user can fetch the list for task assignment
router.get('/assignable', getUsersForAssignment);

// Admin only: full user list with all details
router.get('/', restrictTo('ADMIN'), getUsers);

export default router;
