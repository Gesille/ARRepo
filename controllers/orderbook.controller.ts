import { NextFunction, Request, Response } from "express";
import Order from "../models/Orderbook.Model";
import Book, { IBook } from "../models/Book.model";

import OrderItem, { IOrderItem } from "../models/OrderItem.Model";
import mongoose from "mongoose";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import NotificationModel from "../models/notification.Model";
import Address from "../models/Address.model";
import Orderbook from "../models/Orderbook.Model";
import userModel from "../models/user.model";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import path from "path";
import BookModel from "../models/Book.model";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


export const createOrderBook = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookId, payment_info } = req.body as { bookId: string; payment_info: any };

      // التحقق من وجود معلومات الدفع
      if (payment_info && "id" in payment_info) {
        const paymentIntentId = payment_info.id;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
          return next(new ErrorHandler("Payment not authorized!", 400));
        }
      }

      // العثور على المستخدم
      const user = await userModel.findById(req.user?._id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // التحقق مما إذا كان المستخدم قد طلب الكتاب مسبقًا
      const bookExistsInUser = user.books.some(
        (book: any) => book.toString() === bookId
      );

      if (bookExistsInUser) {
        return next(new ErrorHandler("You have already purchased this book", 400));
      }

      // التحقق من وجود الكتاب
      const book = await BookModel.findById(bookId);
      if (!book) {
        return next(new ErrorHandler("Book not found", 404));
      }

      // إعداد بيانات الطلب
      const orderData = {
        bookId: book._id,
        userId: user._id,
        payment_info,
      };

      // إعداد البريد الإلكتروني لتأكيد الطلب
      const mailData = {
        order: {
          _id: book._id.toString().slice(0, 6),
          name: book.title,
          price: book.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user.email) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      // إضافة الكتاب إلى بيانات المستخدم
      user.books.push(book._id);
      await user.save();

      // إنشاء إشعار للمستخدم
      await NotificationModel.create({
        userId: user._id,
        title: "New Order",
        message: `You have successfully purchased the book "${book.title}"`,
      });

     
      await book.save();

      // إرسال الاستجابة النهائية
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: orderData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);






export const getOrdersBook = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // استخراج userId من الطلب

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // استخدام تجميع (aggregation) للربط بين Orderbook و User و Address
    const orders = await Orderbook.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // تصفية الطلبات الخاصة بالمستخدم
      {
        $lookup: {
          from: "users", // اسم مجموعة المستخدمين في قاعدة البيانات
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user", // تفكيك المصفوفة الناتجة من $lookup
      },
      {
        $lookup: {
          from: "addresses", // اسم مجموعة العناوين في قاعدة البيانات
          localField: "address",
          foreignField: "_id",
          as: "address",
        },
      },
      {
        $unwind: "$address", // تفكيك المصفوفة الناتجة من $lookup
      },
      {
        $project: {
          id: "$_id",
          userName: "$user.name", // اختيار الحقل name من المستخدم
          userEmail: "$user.email", // اختيار الحقل email من المستخدم
          address: {
            name: "$address.name", // اختيار الحقل name من العنوان
            contact: "$address.contact", // اختيار الحقل contact من العنوان
            city: "$address.city", // اختيار الحقل city من العنوان
          },
          dateOfOrder: 1, // الاحتفاظ بحقل تاريخ الطلب
        },
      },
    ]);

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};










export const getBookWithOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId } = req.params;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: "Invalid book ID" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login to access this resource.",
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // استرجاع الطلبات
    const orders = await Orderbook.find({ userId, ordered: false })
      .populate("userId") // جلب تفاصيل المستخدم
      .populate("address"); // تضمين معلومات العنوان

    const orderItems = await OrderItem.find({ orderId: orders[0]?._id, bookId }).populate("bookId");

    return res.status(200).json({
      success: true,
      message: "Book and orders fetched successfully",
      book,
      orders,
      orderItems,
    });
  } catch (error) {
    console.error("Error:", error);
    next(new ErrorHandler("Failed to fetch book, orders, or order items", 500));
  }
};






// Create Order for Books
export const createBookOrderStripe = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { books, payment_info, address } = req.body;

      // التحقق من صحة الدفع
      if (payment_info && "id" in payment_info) {
        const paymentIntentId = payment_info.id;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
          return next(new ErrorHandler("Payment not authorized!", 400));
        }
      }

      // التحقق من وجود المستخدم
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("User not found!", 404));
      }

      // إنشاء طلب جديد
      const newOrder = await Orderbook.create({
        userId,
        address,
        ordered: true,
      });

      // إضافة الكتب إلى الطلب
      const orderItems = await Promise.all(
        books.map(async (book: { bookId: string; quantity: number }) => {
          const bookDetails = await Book.findById(book.bookId);
          if (!bookDetails) {
            return next(new ErrorHandler(`Book not found: ${book.bookId}`, 404));
          }

          return OrderItem.create({
            bookId: book.bookId,
            userId,
            orderId: newOrder._id,
            quantity: book.quantity,
            payment_info,
          });
        })
      );

      // إرسال بريد تأكيد
      const mailData = {
        order: {
          _id: newOrder._id.toString().slice(0, 6),
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          books: orderItems.map((item: any) => ({
            title: item.bookId.title,
            quantity: item.quantity,
          })),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation-books.ejs"),
        { order: mailData }
      );

    

      res.status(201).json({
        success: true,
        message: "Order created successfully!",
        order: newOrder,
        items: orderItems,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// استرجاع جميع الطلبات - خاص بالمسؤول فقط
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await Orderbook.find()
        .populate("userId", "name email") // جلب تفاصيل المستخدم
        .populate({
          path: "address",
          model: "Address", // جلب العنوان
        });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// استرجاع الطلبات الخاصة بمستخدم معين
export const getUserOrdersStripe = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("User not authenticated!", 401));
      }

      const orders = await Orderbook.find({ userId })
        .populate({
          path: "address",
          model: "Address",
        })
        .populate({
          path: "items",
          populate: {
            path: "bookId",
            model: "Book", // جلب تفاصيل الكتاب
          },
        });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// إرسال Stripe Publishable Key
export const sendStripePublishableKey = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      
    });
 
  }
);

// إنشاء عملية دفع جديدة للكتب
export const newPaymentStripe = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;

      const myPayment = await stripe.paymentIntents.create({
        amount,
        currency: "USD",
        metadata: {
          company: "Online-Library",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.status(201).json({
        success: true,
        client_secret: myPayment.client_secret,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);









  

  
  












