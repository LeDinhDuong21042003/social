import { response } from "express";
import Conversation from "../model/conversationModel.js";
import Message from "../model/messageModel.js";
import { getRecipientSocketId, io } from './../socket/socket.js';
import cloudinary from 'cloudinary'

const sendMessage = async (req,res) => {
    try {
        const {recipientId , message} = req.body 
        let img = req.body.img
        const senderId = req.user._id
        let firstConversation = false

        let conversation = await Conversation.findOne({
            participants:{ $all: [senderId , recipientId] }
        })

        if(!conversation){
            firstConversation = true
            conversation = new Conversation({
                participants: [senderId,recipientId],
                lastMessage : {
                    text : message,
                    sender: senderId
                }
            })
            await conversation.save();
        }

        if(img){
            const uploadedResponse = await cloudinary.uploader.upload(img)
            img = uploadedResponse.secure_url
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            text: message,
            img : img || ""
        })

        await Promise.all([
            newMessage.save(),
            conversation.updateOne({
                lastMessage: {
                    text : message,
                    sender: senderId
                }
            }),
        ])

        const recipientSocketId =  getRecipientSocketId(recipientId);
        if(recipientSocketId){
            io.to(recipientSocketId).emit("newMessage",newMessage)
        }
        // const responseNewMessage ={...newMessage,firstMessage : true}
        const messageJson = newMessage.toJSON()
        messageJson.firstMessage = true
        if(firstConversation){
            return res.status(200).json(messageJson)
        }
        return res.status(201).json(newMessage)

    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

const getMessage = async (req, res) => {
    const otherUserId = req.params.otherUserId
    const userId = req.user._id
    try {
        const conversation = await Conversation.findOne({
            participants: { $all:[userId,otherUserId]}
        })

        if(!conversation){
            return res.status(404).json({error:"conversation is not found"})
        }

        const messages = await Message.find({
            conversationId: conversation._id
        }).sort({createdAt:1})

        return res.status(200).json(messages)
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

const getConversations = async (req, res) => {
    const userId = req.user._id
    const userId2 = req.params.userId2
    try {

        if(userId2){
            const conversation = await Conversation.findOne({ participants: { $all: [userId, userId2] } })
            console.log(conversation)
            return res.status(200).json({conversation:conversation})
        }

        const conversations = await Conversation.find({participants:userId}).populate({
            path : "participants",
            select : "username profilePic"
        })

        conversations.forEach(conversation => {
            conversation.participants = conversation.participants.filter(
                participant => participant._id.toString() !== userId.toString()
            )
        })
        return res.status(200).json(conversations)
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

const deleteConversations = async (req, res) => {
    try {
        const conversationId = req.params.conversationId
        await Conversation.findByIdAndDelete(conversationId);
        return res.status(200).json("delete successfully")
    } catch (error) {
        return res.status(500).json({error:error})
    }
}

export {sendMessage,getMessage,getConversations,deleteConversations}