import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';


const router = express.Router();

// status and stats routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// users routes
router.post('/users', UsersController.postNew);

export default router;
