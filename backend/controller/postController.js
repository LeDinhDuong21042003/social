import User from "../model/useModel.js"
import bcrypt from 'bcryptjs'
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookies.js";
import mongoose from "mongoose";
import Post from '../model/postModel.js'
import { v2 as cloudinary } from "cloudinary";

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if(post){
            return res.status(200).json(post)
        }
        return res.status(400).json("post is not define")
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const newPost = async (req, res) => {
    try {
		const { postedBy, text } = req.body;
		let { img } = req.body;

		if (!postedBy || !text) {
			return res.status(400).json({ error: "Postedby and text fields are required" });
		}

		const user = await User.findById(postedBy);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to create post" });
		}

		const maxLength = 500;
		if (text.length > maxLength) {
			return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
		}

		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url;
		}

		const newPost = new Post({ postedBy, text, img });
		await newPost.save();

		res.status(201).json(newPost);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log(err);
	}
}

const updatePost = async (req, res) => {
    
}

const deletePost = async (req, res) => {
    try {
        const postId = req.params.id
        const post = await Post.findById(postId)
        if(!post){
            return res.status(400).json("post not found")
        }

        if(post.postedBy.toString()!==req.user._id.toString()){
            return res.status(401).json("Unauthor to delete post")
        } 

        if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

        await Post.findByIdAndDelete(postId)
        return res.status(200).json("Post deleted successfully")

    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const likeOrUnlikePost = async (req, res) => {
    try {
        const postId = req.params.id
        const userId = req.user._id
        const post = await Post.findById(postId)
        if(!post){
            return res.status(404).json("Post not found")
        }
        const userLikePost = post.likes.includes(userId)
        if(userLikePost){
            // Unfollow user 
            await Post.findByIdAndUpdate(postId,{ $pull: {likes:userId}})
            return res.status(200).json("unliked")
            
        }else{
            await Post.findByIdAndUpdate(postId,{ $push: {likes:userId}})
            return res.status(200).json("liked")
        }

    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const replyPost = async (req, res) => {
    try {
        const text = req.body.text
        const postId = req.params.id
        const userId = req.user._id
        const userProfilePic = req.user.profilePic
        const username = req.user.username

        if(!text) return res.status(400).json("textfield is requires")

        const post = await Post.findById(postId)
        if(!post) res.status(404).json("post not found")
        const reply = {userId,text,userProfilePic,username}
        
        post.replies.push(reply)
        await post.save()

        res.status(200).json("reply was created")


    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const getFeedPost = async (req, res) => {
    // console.log("GET POST")
    try {
        const userId = req.user._id
        const user = await User.findById(userId)
        if(!user) return res.status(404).json("user not found")
        const following = user.following
        
        // console.log(typeof(following[0]))
        // console.log(following[0].type())

        const feedPost = await Post.find({postedBy:{$in:[...following,userId]}}).sort({createdAt:-1})
        // console.log(feedPost)
        return res.status(200).json(feedPost)
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const getUserPosts = async (req, res) => {
	const { userId } = req.params;
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export {getPost,newPost,updatePost,deletePost,likeOrUnlikePost,replyPost,getFeedPost,getUserPosts}