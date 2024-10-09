import express from 'express';
import {signupUser, signinUser , updateUser, logoutUser, followeOrUnfollowUser,getUserProfile,getSuggestedUsers} from '../controller/userController.js'
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router()

router.get("/suggested", protectRoute, getSuggestedUsers);
router.get('/profile/:userId',protectRoute,getUserProfile)
router.post('/signup',signupUser)
router.post('/login',signinUser)
router.post('/logout',logoutUser)
router.post('/follow/:id',protectRoute,followeOrUnfollowUser)
router.put('/update/:id',protectRoute,updateUser)


export default router