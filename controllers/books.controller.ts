import { NextFunction, Request, Response } from "express";
import Book from "../models/Book.model";
import ErrorHandler from "../utils/ErrorHandler";

import cloudinary from "cloudinary";
import userModel from "../models/user.model";
import mongoose from "mongoose";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import { generateLast12MonthsBooksData } from "../utils/analyic.generator";
import BookModel from "../models/Book.model";
 // مسار النموذج Book

// get all books only for admin
export const getBooks = async (req: Request, res: Response) => {
  try {
    // جلب جميع الكتب وربط التصنيفات (categories)
    const books = await Book.find().populate("category", "catTitle catDesc");
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching books",
      error: error instanceof Error ? error.message : error,
    });
  }
};




export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, author, description, category, price, discountPrice, status, coverImage, chapters } = req.body;

  try {
    // تحقق من القيم الأساسية المطلوبة
    if (!title || !author || !description || !category || !price || !coverImage) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // التحقق من وجود الفصول
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({ message: "Chapters must be provided and should not be empty" });
    }

    // التحقق من دور المستخدم
    if (req.user?.role !== "teacher") {
      return next(new ErrorHandler("You are not authorized to upload a book", 403));
    }

    // تحميل صورة الغلاف إلى Cloudinary
    let coverImageData = null;
    if (coverImage) {
      const myCloud = await cloudinary.v2.uploader.upload(coverImage, {
        folder: "books", // يمكن تغيير اسم المجلد حسب الحاجة
      });
      coverImageData = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    // إنشاء كائن جديد للكتاب مع بيانات صورة الغلاف المحملة
    const newBook = new Book({
      title,
      author,
      description,
      category,
      price,
      discountPrice,
      status: status !== undefined ? status : true, // الحالة الافتراضية true إذا لم تقدم
      coverImage: coverImageData,
      chapters, // تضمين الفصول
      addedBy: req.user?._id, // معرف المستخدم
    });

    // حفظ الكتاب في قاعدة البيانات
    await newBook.save();
    
    return res.status(201).json({
      message: "Book created successfully",
      book: newBook,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating book",
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
};








// دالة لحذف كتاب
export const deleteBook = async (req: Request, res: Response) => {
  const { id } = req.params; // الحصول على الـ ID من الـ URL

  try {
    // التحقق إذا كان الكتاب موجودًا
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // حذف الكتاب
    await book.deleteOne({ _id: id });

    // إعادة استجابة بنجاح
    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting book",
      error: error instanceof Error ? error.message : error,
    });
  }
};



// تحديث كتاب
export const updateBook = async (req: Request, res: Response) => {
  const { id } = req.params; // الحصول على الـ ID من المعاملات في الـ URL
  const updateData = req.body; // البيانات المحدثة من الطلب

  try {
    // البحث عن الكتاب وتحديثه بالبيانات الجديدة
    const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
      new: true, // يعيد الكتاب بعد التحديث مباشرة
      runValidators: true, // التحقق من صحة البيانات
    });

    // إذا لم يتم العثور على الكتاب
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // إعادة الكتاب المحدث كاستجابة
    return res.status(200).json({
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating book",
      error: error instanceof Error ? error.message : error,
    });
  }
};


// دالة لجلب كتاب معين بالـ ID


export const getBookById = async (req: Request, res: Response) => {
  const { id } = req.params; // الحصول على معرف الكتاب من URL

  try {
    const book = await Book.findById(id).populate("category", "catTitle catDesc");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching book",
      error: error instanceof Error ? error.message : error,
    });
  }
};


//relatedBook
export const getRelatedBooks = async (req: Request, res: Response) => {
  const { id } = req.params; // معرف الكتاب الحالي

  try {
    // العثور على الكتاب الحالي
    const currentBook = await Book.findById(id);
    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // جلب الكتب ذات الصلة من نفس التصنيف، باستثناء الكتاب الحالي
    const relatedBooks = await Book.find({
      category: currentBook.category,
      _id: { $ne: id }, // استبعاد الكتاب الحالي
    }).limit(5); // تحديد عدد الكتب المسترجعة

    return res.status(200).json(relatedBooks);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching related books",
      error: error instanceof Error ? error.message : error,
    });
  }
};




export const getUserBooks = async (req: Request, res: Response) => {
  const { userId } = req.params;
  console.log("UserId from request params:", userId); // سجل الـ userId

  try {
    // التحقق من وجود المستخدم
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // جلب الكتب التي أضافها هذا المستخدم
    const books = await Book.find({ addedBy: userId });

    // التحقق من وجود الكتب
    if (!books || books.length === 0) {
      return res.status(404).json({ message: "Books not found" });
    }

    console.log("Books found:", books); // سجل الكتب التي تم العثور عليها
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching user books",
      error: error instanceof Error ? error.message : error,
    });
  }
};








export const getPurchasedBooks = async (req: Request, res: Response) => {
  try {
    // الحصول على بيانات المستخدم من الجلسة
    const user = req.user;

    // التحقق من وجود المستخدم في الجلسة
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // البحث عن المستخدم باستخدام البريد الإلكتروني
    const foundUser = await userModel.findOne({ email: user.email });
    console.log("User Books:", foundUser?.books);

    // التحقق من وجود المستخدم
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }


    const bookIds = foundUser.books.map((book) => {
      console.log("Book ID:", book._id);  // إضافة هذا السطر لفحص البيانات
      return new mongoose.Types.ObjectId(book._id);
    });
    

    const purchasedBooks = await Book.find({
      _id: { $in: bookIds },
    }).populate("category", "catTitle catDesc"); // تأكد من أن category موجود في الـ Book
    

    // التحقق من وجود نتائج
    if (purchasedBooks.length === 0) {
      return res.status(404).json({ message: "No books found for this user" });
    }

    // إرجاع النتائج
    return res.status(200).json(purchasedBooks);
  } catch (error) {
    console.error("Error fetching purchased books:", error);
    return res.status(500).json({
      error: "Failed to fetch purchased books",
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const getBooksAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const books = await generateLast12MonthsBooksData(BookModel);
      res.status(201).json({
        success: true,
        books,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);




