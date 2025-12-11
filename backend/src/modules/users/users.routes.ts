import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { createUserSchema, updateUserSchema, getUsersQuerySchema } from './users.validation.js';

const router = Router();
const usersController = new UsersController();

router.use(authenticate);

// GET /users
router.get('/', validateQuery(getUsersQuerySchema), usersController.getUsers);

// GET /users/:id
router.get('/:id', usersController.getUserById);

// POST /users
router.post('/', validateBody(createUserSchema), usersController.createUser);

// PUT /users/:id
router.put('/:id', validateBody(updateUserSchema), usersController.updateUser);

// DELETE /users/:id
router.delete('/:id', usersController.deleteUser);

export default router;
