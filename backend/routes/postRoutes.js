import express from 'express';
import {getPost,newPost,updatePost,deletePost,likeOrUnlikePost,replyPost,getFeedPost,getUserPosts} from '../controller/postController.js'
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router()

router.get("/user/:userId", getUserPosts);
router.get('/feed',protectRoute,getFeedPost)
router.post('/',protectRoute,newPost)
router.get('/:id',protectRoute,getPost)
router.put('/:id',protectRoute,updatePost)
router.delete('/:id',protectRoute,deletePost)
router.put('/like/:id',protectRoute,likeOrUnlikePost)
router.post('/reply/:id',protectRoute,replyPost)

export default router