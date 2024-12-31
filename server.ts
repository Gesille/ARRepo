import { app } from "./app";
import { initSocketServer } from "./socketServer";
import connectDB from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
require("dotenv").config();
console.log(process.env.ACCESS_TOKEN); // تحقق من القيم
console.log(process.env.REFRESH_TOKEN);
const server = http.createServer(app);

// تهيئة Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
});

// تهيئة خادم Socket.IO
initSocketServer(server);

// تشغيل الخادم
server.listen(process.env.PORT, () => {
    console.log(`Server is connected with port ${process.env.PORT}`);
    connectDB();
});
