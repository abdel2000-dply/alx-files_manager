import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthContoller from '../controllers/AuthController';


const router = express.Router();

// status and stats routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// users routes
router.post('/users', UsersController.postNew);

// Authentication routes
router.get('/connect', AuthContoller.getConnect);
router.get('/disconnect', AuthContoller.getDisconnect);
router.get('/users/me', UsersController.getMe);

export default router;
