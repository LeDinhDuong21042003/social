import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { sendMessage,getMessage, getConversations ,deleteConversations } from '../controller/messageController.js';

const router = express.Router();

router.post('/',protectRoute,sendMessage)
router.get('/conversations',protectRoute,getConversations)
router.get('/conversations/:userId2',protectRoute,getConversations)
router.delete('/conversations/:conversationId',protectRoute,deleteConversations)
router.get('/:otherUserId',protectRoute,getMessage)

export default router