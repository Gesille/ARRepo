import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import BookModel from "../models/Book.model";
import userModel from "../models/user.model";
import CategoryModel from "../models/Category.model";
import OrderbookModel from "../models/Orderbook.Model";
import PostModel from "../models/post.model";
import { generateLast12MonthsBooksData } from "../utils/analyic.generator";
import { generateLast12MonthsPostData } from "../utils/postanalyic.generator";



// Get all analytics --- only for admin
export const getAllAnalyticsbooks = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookCount = await BookModel.countDocuments();
      const userCount = await userModel.countDocuments();
      const orderCount = await OrderbookModel.countDocuments();
      const categoryCount = await CategoryModel.countDocuments();

      res.status(200).json({
        success: true,
        data: {
          bookCount,
          userCount,
          orderCount,
          categoryCount,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);



//get order analytics --- only for admin
export const getOrdersAnalytics = CatchAsyncError(
  async (re: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsBooksData(OrderbookModel);
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);



// Get post analytics --- only for admin
export const getPostsAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const posts = await generateLast12MonthsPostData(PostModel);
      res.status(201).json({
        success: true,
        posts,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);