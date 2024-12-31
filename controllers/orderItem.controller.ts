import { NextFunction, Request, Response } from "express";
import OrderItem from "../models/OrderItem.Model";
import Order from "../models/Orderbook.Model";
import Book from "../models/Book.model";
import mongoose from "mongoose";
import Address from "../models/Address.model";
import Orderbook from "../models/Orderbook.Model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

export const createOrderItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id; // المستخدم
    const { bookId, quantity } = req.body; // الكتاب، الكمية

    // التأكد من أن المستخدم موجود
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // التأكد من وجود الكتاب والكمية
    if (!bookId) {
      return res
        .status(400)
        .json({ error: "Book ID and quantity are required BOOK" });
    }
    if (!quantity) {
      return res
        .status(400)
        .json({ error: "Book ID and quantity are required quantity" });
    }

    // البحث عن الكتاب في قاعدة البيانات
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // البحث عن طلب مفتوح للمستخدم
    let order = await Order.findOne({ userId, ordered: false });

    // إذا لم يكن هناك طلب مفتوح، قم بإنشاء طلب جديد
    if (!order) {
      order = await Order.create({ userId, ordered: false });
    }

    // التحقق إذا كان الكتاب موجودًا بالفعل في الطلب
    const existingOrderItem = await OrderItem.findOne({
      orderId: order._id,
      bookId: bookId,
    });

    if (existingOrderItem) {
      // إذا كان الكتاب موجودًا، قم بتحديث الكمية فقط
      existingOrderItem.quantity += quantity;
      await existingOrderItem.save();
      return res.status(200).json(existingOrderItem); // إرجاع العنصر المحدث
    } else {
      // إذا لم يكن الكتاب موجودًا، قم بإضافته كعنصر جديد في الطلب
      const newOrderItem = await OrderItem.create({
        userId,
        bookId,
        orderId: order._id,
        quantity,
      });
      return res.status(201).json(newOrderItem); // إرجاع العنصر الجديد
    }
  } catch (error) {
    console.error("Error creating order item:", error);
    res.status(500).json({ error: "Failed to create order item" });
  }
};



export const updateOrderItem = async (req: Request, res: Response) => {
  try {
    const { orderId, bookId } = req.params;
    const { quantity, addressId } = req.body; // الكمية الجديدة والعنوان

    // التأكد من أن الكمية موجودة
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Quantity should be greater than 0" });
    }

    // التحقق من صحة معرف العنوان
    if (addressId) {
      const address = await Address.findById(addressId);
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
    }

    // البحث عن الطلب
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // تحديث العنوان إذا تم تمريره
    if (addressId) {
      order.address = addressId;
      await order.save();
    }

    // البحث عن العنصر في الطلب
    const orderItem = await OrderItem.findOne({
      orderId: order._id,
      bookId,
    });

    if (!orderItem) {
      return res.status(404).json({ error: "Order item not found" });
    }

    // تحديث الكمية
    orderItem.quantity = quantity;
    await orderItem.save();

    return res.status(200).json(orderItem); // إرجاع العنصر المحدث
  } catch (error) {
    console.error("Error updating order item:", error);
    res.status(500).json({ error: "Failed to update order item" });
  }
};



export const getOrderItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const orderItems = await OrderItem.find({ userId });
    if (orderItems.length === 0) {
      return res.status(404).json({ error: "No order items found" });
    }

    // تحقق من صلاحية معرفات الكتب
    const validOrderItems = orderItems.filter((item) =>
      mongoose.Types.ObjectId.isValid(item.bookId)
    );
    if (validOrderItems.length !== orderItems.length) {
      return res.status(400).json({ error: "Some book IDs are invalid in order items" });
    }

    const bookIds = validOrderItems.map((item) => item.bookId);
    const books = await Book.find({ _id: { $in: bookIds } });

    // تحقق من وجود الكتب
    const missingBooks = bookIds.filter(
      (id) => !books.some((book) => book._id.toString() === id.toString())
    );

    if (missingBooks.length > 0) {
      return res.status(404).json({
        error: "Some book IDs are missing in the database",
        missingBooks,
      });
    }

    // احصل على العنوان من الطلبات
    const orders = await Orderbook.find({ userId }).populate("address");
    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0]; // نأخذ أول طلب (يفترض أن يكون هناك طلب واحد للمستخدم)

    // دمج الطلبات مع بيانات الكتب والعنوان
    const orderItemsWithBooksAndAddress = validOrderItems.map((item) => {
      const book = books.find((b) => b._id.toString() === item.bookId.toString());
      return {
        ...item.toObject(),
        book: {
          title: book?.title,
          author: book?.author,
          coverImage: book?.coverImage,
          price: book?.price,
          discountPrice: book?.discountPrice,
          category: book?.category?.name,
        },
        order: {
          address: order?.address ? order.address : "No address available",
        },
      };
    });

    res.status(200).json(orderItemsWithBooksAndAddress);
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ error: "Failed to fetch order items" });
  }
};



export const analyzeOrdersForChart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // استرجاع جميع الطلبات
      const orders = await Orderbook.find();
      if (orders.length === 0) {
        return res.status(404).json({ success: false, message: "No orders found." });
      }

      const totalOrders = orders.length;
      const salesData: { [key: string]: number } = {};
      
      // تحليل الطلبات
      for (const order of orders) {
        const orderItems = await OrderItem.find({ orderId: order._id }).populate("bookId");

        for (const item of orderItems) {
          const book = await Book.findById(item.bookId);
          const totalItemSales = item.quantity * (book?.price || 0);

          // تجميع المبيعات لكل كتاب
          if (salesData[book?._id.toString()]) {
            salesData[book?._id.toString()] += totalItemSales;
          } else {
            salesData[book?._id.toString()] = totalItemSales;
          }
        }
      }

      // إعداد البيانات للرسم
      const chartData = Object.keys(salesData).map(async (bookId) => {
        const book = await Book.findById(bookId);
        return {
          title: book?.title,
          sales: salesData[bookId],
        };
      });

      // الانتظار حتى يتم الانتهاء من جميع العمليات
      const results = await Promise.all(chartData);

      res.status(200).json({
        success: true,
        totalOrders,
        salesData: results,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


