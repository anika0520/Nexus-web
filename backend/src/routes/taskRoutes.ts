import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  patchTaskStatus,
} from '../controllers/taskController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', patchTaskStatus);

export default router;
