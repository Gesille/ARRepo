import express,{NextFunction, Request, Response} from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
require("dotenv").config();
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRoute from "./routes/notification.route";
import analyicsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import { rateLimit } from 'express-rate-limit'
import categoryRouter from "./routes/categories.route";
import bookRouter from "./routes/book.route";
import OrderItem from "./models/OrderItem.Model";

import Itemrouter from "./routes/orderItem.route";
import router from "./routes/orderbook.route";
import orderbookRouter from "./routes/orderbook.route";
import addressrouter from "./routes/address.route";

import postRouter from "./routes/post.route";



//body parser
app.use(express.json());

//cookie parser
app.use(cookieParser());

//cors => cross origin resource sharing 
app.use(cors({
    origin:['http://localhost:3000'],
    credentials: true, 
}));




//api requests limit
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

//routes
app.use("/api/v1",userRouter,orderRouter,courseRouter,notificationRoute,analyicsRouter,layoutRouter,categoryRouter,bookRouter,orderbookRouter,Itemrouter,addressrouter,postRouter);



//testing api
app.get("/test",( req:Request , res:Response , next : NextFunction) =>{
res.status(200).json({
    success:true,
    message:"API is working!",
  });
});

//unknoun route
app.all("*", (req:Request , res:Response , next:NextFunction) =>{
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode =404;
    next(err);
});

//middleware calls
app.use(limiter);

app.use(ErrorMiddleware);