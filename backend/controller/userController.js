import User from "../model/useModel.js"
import bcrypt from 'bcryptjs'
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookies.js";
import mongoose from "mongoose";
import {v2 as cloudinary} from 'cloudinary';

const getUserProfile = async (req, res) => {
    const userId = req.params.userId
    try {
        // console.log(userId)
        let user = null;
        if(mongoose.Types.ObjectId.isValid(userId)){
            user = await User.findById(userId).select("-password -updateAt");
        }else{
            user = await User.findOne({username:userId}).select("-password -updateAt")
        }
        
        if(!user) {
            return res.status(400).json({error:"user not found"})
        }
        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({error : error.message})
    }
}

const signupUser = async (req,res)=> {
    try {
        const {name,email,username,password} = req.body;
        const user = await User.findOne({$or:[{email},{username}]})

        if(user){
            return res.status(400).json({error:"user already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password,salt)

        const newUser = new User(
            {
                name,
                email,
                username,
                password: hashPassword
            }
        )
        await newUser.save()

        if(newUser){
            // console.log(newUser)
            generateTokenAndSetCookie(newUser.id,res)
            res.status(201).json({
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
			});
        }else{
            res.status(400).json({error:"Invalid data "})
        }
        
    } catch (error) {
        console.log(error)
        return res.status(500).json(error.message)
    }
}

const signinUser = async (req,res)=> {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid username or password" });

        if (user.isFrozen) {
            user.isFrozen = false;
            await user.save();
        }

        generateTokenAndSetCookie(user._id, res);

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log("Error in loginUser: ", error.message);
        return res.status(500).json({ error: error.message });
    }
}

const logoutUser = (req,res)=> {
    try {
        res.cookie("jwt","",{maxAge:1})
        return res.status(200).json("logout success")
    } catch (error) {
        return res.status(500).json({error:error.message})
    }
}

const followeOrUnfollowUser = async (req,res)=> {
    console.log('follow')
    try {
        const id = new mongoose.Types.ObjectId(req.params.id)
        console.log(id)
        console.log(req.user._id)
        const userToModify = await User.findById(id)
        const currentUser = await User.findById(req.user._id)

        if (id.equals(req.user._id)){
            return res.status(400).json({error: "you can't follow or unfollow yourshelf"})
        }
        if(!userToModify || !currentUser) return res.status(400).json({error:"user not found"})
        
        const isFollowing = currentUser.following.includes(id)
        if(isFollowing){
            // Unfollow user 
            await User.findByIdAndUpdate(req.user._id,{ $pull: {following: id}})
            await User.findByIdAndUpdate(id,{ $pull: {followers:req.user._id}})
            return res.status(200).json("unfollowed")
            
        }else{
            await User.findByIdAndUpdate(req.user._id,{ $push: {following: id}})
            await User.findByIdAndUpdate(id,{ $push: {followers:req.user._id}})
            return res.status(200).json("followed")
        }
        
    } catch (error) {
        return res.status(500).json({error:error.message})
    }
}

const updateUser = async (req,res)=> {
    let {name, email, username , password , profilePic , bio} = req.body
    const userId = req.user._id
    try {
        let user = await User.findById(userId)
        if(!user) return res.status(404).json({error:"user not found"})

        if(req.params.id !== userId.toString()) return res.status(400).json({error:"cannot update other profile"}) 
        
        if(password){
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(password,salt)
            user.password = hashPassword
        }

        if(profilePic){
            if(user.profilePic){
                await cloudinary.uploader.destroy(user.profilePic.split('/').pop().split('.')[0])
            }
            const uploadResponse = await cloudinary.uploader.upload(profilePic)
            profilePic = uploadResponse.secure_url
        }

        user.name = name || user.name
        user.email = email || user.email
        user.bio = bio || user.bio
        user.profilePic = profilePic || user.profilePic
        user.username = username || user.username

        user = await user.save()

        console.log(user)

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
        });
        
    } catch (error) {
        return res.status(500).json({error:error.message})
    }
}

const getSuggestedUsers = async (req, res) => {
	try {
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user._id;

		const usersFollowedByYou = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export {signupUser, signinUser , updateUser, logoutUser,followeOrUnfollowUser,getUserProfile,getSuggestedUsers}