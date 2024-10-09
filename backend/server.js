    import express from 'express';
    import dotenv from 'dotenv'
    import connectDB from './db/connectDB.js';
    import cookieParser from 'cookie-parser';
    import userRoutes from './routes/userRoutes.js'; 
    import postRoutes from './routes/postRoutes.js';
    import messagesRoutes from './routes/messagesRoutes.js';
    import {v2 as cloudinary} from 'cloudinary'
    import {app,server} from './socket/socket.js'
    import cors from 'cors'
    import path from 'path'
    
    // const app = express();
    const __dirname = path.resolve()

    dotenv.config()

    // connect database
    connectDB()

    // cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDIANARY_CLOUD_NAME,
        api_key: process.env.CLOUDIANARY_API_KEY,
        api_secret: process.env.CLOUDIANARY_API_SECRET
    })

    // Tăng giới hạn kích thước của payload JSON
    app.use(express.json({ limit: '1mb' }));
    // Tăng giới hạn kích thước của payload URL-encoded
    app.use(express.urlencoded({ limit: '1mb', extended: true }));

    // middleware
    app.use(express.json())
    app.use(express.urlencoded({extended: true}))
    app.use(cookieParser())
    app.use(cors())

    // routes
    app.use('/api/users',userRoutes)
    app.use('/api/posts',postRoutes)
    app.use('/api/messages',messagesRoutes)

    const port = process.env.PORT

    if(process.env.NODE_ENV == "production"){
        app.use(express.static(path.join(__dirname,"/frontend/dist")))

        // react app
        app.get("*",(req,res) => {
            res.sendFile(path.resolve(__dirname,"frontend","dist","index.html"))
        })
    }

    server.listen(port, ()=> console.log(port))