"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBooksAnalytics = exports.getPurchasedBooks = exports.getUserBooks = exports.getRelatedBooks = exports.getBookById = exports.updateBook = exports.deleteBook = exports.createBook = exports.getBooks = void 0;
const Book_model_1 = __importDefault(require("../models/Book.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const analyic_generator_1 = require("../utils/analyic.generator");
const Book_model_2 = __importDefault(require("../models/Book.model"));
// مسار النموذج Book
// get all books only for admin
const getBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // جلب جميع الكتب وربط التصنيفات (categories)
        const books = yield Book_model_1.default.find().populate("category", "catTitle catDesc");
        return res.status(200).json(books);
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching books",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.getBooks = getBooks;
const createBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "teacher") {
            return next(new ErrorHandler_1.default("You are not authorized to upload a book", 403));
        }
        // تحميل صورة الغلاف إلى Cloudinary
        let coverImageData = null;
        if (coverImage) {
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(coverImage, {
                folder: "books", // يمكن تغيير اسم المجلد حسب الحاجة
            });
            coverImageData = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        // إنشاء كائن جديد للكتاب مع بيانات صورة الغلاف المحملة
        const newBook = new Book_model_1.default({
            title,
            author,
            description,
            category,
            price,
            discountPrice,
            status: status !== undefined ? status : true, // الحالة الافتراضية true إذا لم تقدم
            coverImage: coverImageData,
            chapters, // تضمين الفصول
            addedBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, // معرف المستخدم
        });
        // حفظ الكتاب في قاعدة البيانات
        yield newBook.save();
        return res.status(201).json({
            message: "Book created successfully",
            book: newBook,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error creating book",
            error: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
});
exports.createBook = createBook;
// دالة لحذف كتاب
const deleteBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // الحصول على الـ ID من الـ URL
    try {
        // التحقق إذا كان الكتاب موجودًا
        const book = yield Book_model_1.default.findById(id);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        // حذف الكتاب
        yield book.deleteOne({ _id: id });
        // إعادة استجابة بنجاح
        return res.status(200).json({ message: "Book deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error deleting book",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.deleteBook = deleteBook;
// تحديث كتاب
const updateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // الحصول على الـ ID من المعاملات في الـ URL
    const updateData = req.body; // البيانات المحدثة من الطلب
    try {
        // البحث عن الكتاب وتحديثه بالبيانات الجديدة
        const updatedBook = yield Book_model_1.default.findByIdAndUpdate(id, updateData, {
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
    }
    catch (error) {
        return res.status(500).json({
            message: "Error updating book",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.updateBook = updateBook;
// دالة لجلب كتاب معين بالـ ID
const getBookById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // الحصول على معرف الكتاب من URL
    try {
        const book = yield Book_model_1.default.findById(id).populate("category", "catTitle catDesc");
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        return res.status(200).json(book);
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching book",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.getBookById = getBookById;
//relatedBook
const getRelatedBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // معرف الكتاب الحالي
    try {
        // العثور على الكتاب الحالي
        const currentBook = yield Book_model_1.default.findById(id);
        if (!currentBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        // جلب الكتب ذات الصلة من نفس التصنيف، باستثناء الكتاب الحالي
        const relatedBooks = yield Book_model_1.default.find({
            category: currentBook.category,
            _id: { $ne: id }, // استبعاد الكتاب الحالي
        }).limit(5); // تحديد عدد الكتب المسترجعة
        return res.status(200).json(relatedBooks);
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching related books",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.getRelatedBooks = getRelatedBooks;
const getUserBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    console.log("UserId from request params:", userId); // سجل الـ userId
    try {
        // التحقق من وجود المستخدم
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // جلب الكتب التي أضافها هذا المستخدم
        const books = yield Book_model_1.default.find({ addedBy: userId });
        // التحقق من وجود الكتب
        if (!books || books.length === 0) {
            return res.status(404).json({ message: "Books not found" });
        }
        console.log("Books found:", books); // سجل الكتب التي تم العثور عليها
        return res.status(200).json(books);
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching user books",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.getUserBooks = getUserBooks;
const getPurchasedBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // الحصول على بيانات المستخدم من الجلسة
        const user = req.user;
        // التحقق من وجود المستخدم في الجلسة
        if (!user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // البحث عن المستخدم باستخدام البريد الإلكتروني
        const foundUser = yield user_model_1.default.findOne({ email: user.email });
        console.log("User Books:", foundUser === null || foundUser === void 0 ? void 0 : foundUser.books);
        // التحقق من وجود المستخدم
        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const bookIds = foundUser.books.map((book) => {
            console.log("Book ID:", book._id); // إضافة هذا السطر لفحص البيانات
            return new mongoose_1.default.Types.ObjectId(book._id);
        });
        const purchasedBooks = yield Book_model_1.default.find({
            _id: { $in: bookIds },
        }).populate("category", "catTitle catDesc"); // تأكد من أن category موجود في الـ Book
        // التحقق من وجود نتائج
        if (purchasedBooks.length === 0) {
            return res.status(404).json({ message: "No books found for this user" });
        }
        // إرجاع النتائج
        return res.status(200).json(purchasedBooks);
    }
    catch (error) {
        console.error("Error fetching purchased books:", error);
        return res.status(500).json({
            error: "Failed to fetch purchased books",
            details: error instanceof Error ? error.message : error,
        });
    }
});
exports.getPurchasedBooks = getPurchasedBooks;
exports.getBooksAnalytics = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const books = yield (0, analyic_generator_1.generateLast12MonthsBooksData)(Book_model_2.default);
        res.status(201).json({
            success: true,
            books,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
