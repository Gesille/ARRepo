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
exports.newPaymentStripe = exports.sendStripePublishableKey = exports.getUserOrdersStripe = exports.getAllOrders = exports.createBookOrderStripe = exports.getBookWithOrders = exports.getOrdersBook = exports.createOrderBook = void 0;
const Book_model_1 = __importDefault(require("../models/Book.model"));
const OrderItem_Model_1 = __importDefault(require("../models/OrderItem.Model"));
const mongoose_1 = __importDefault(require("mongoose"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const notification_Model_1 = __importDefault(require("../models/notification.Model"));
const Orderbook_Model_1 = __importDefault(require("../models/Orderbook.Model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const path_1 = __importDefault(require("path"));
const Book_model_2 = __importDefault(require("../models/Book.model"));
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
exports.createOrderBook = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { bookId, payment_info } = req.body;
        // التحقق من وجود معلومات الدفع
        if (payment_info && "id" in payment_info) {
            const paymentIntentId = payment_info.id;
            const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== "succeeded") {
                return next(new ErrorHandler_1.default("Payment not authorized!", 400));
            }
        }
        // العثور على المستخدم
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        // التحقق مما إذا كان المستخدم قد طلب الكتاب مسبقًا
        const bookExistsInUser = user.books.some((book) => book.toString() === bookId);
        if (bookExistsInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this book", 400));
        }
        // التحقق من وجود الكتاب
        const book = yield Book_model_2.default.findById(bookId);
        if (!book) {
            return next(new ErrorHandler_1.default("Book not found", 404));
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
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user.email) {
                yield (0, sendMail_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
        // إضافة الكتاب إلى بيانات المستخدم
        user.books.push(book._id);
        yield user.save();
        // إنشاء إشعار للمستخدم
        yield notification_Model_1.default.create({
            userId: user._id,
            title: "New Order",
            message: `You have successfully purchased the book "${book.title}"`,
        });
        yield book.save();
        // إرسال الاستجابة النهائية
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: orderData,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
const getOrdersBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // استخراج userId من الطلب
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // استخدام تجميع (aggregation) للربط بين Orderbook و User و Address
        const orders = yield Orderbook_Model_1.default.aggregate([
            { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } }, // تصفية الطلبات الخاصة بالمستخدم
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
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});
exports.getOrdersBook = getOrdersBook;
const getBookWithOrders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { bookId } = req.params;
        if (!bookId || !mongoose_1.default.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ success: false, message: "Invalid book ID" });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login to access this resource.",
            });
        }
        const book = yield Book_model_1.default.findById(bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }
        // استرجاع الطلبات
        const orders = yield Orderbook_Model_1.default.find({ userId, ordered: false })
            .populate("userId") // جلب تفاصيل المستخدم
            .populate("address"); // تضمين معلومات العنوان
        const orderItems = yield OrderItem_Model_1.default.find({ orderId: (_b = orders[0]) === null || _b === void 0 ? void 0 : _b._id, bookId }).populate("bookId");
        return res.status(200).json({
            success: true,
            message: "Book and orders fetched successfully",
            book,
            orders,
            orderItems,
        });
    }
    catch (error) {
        console.error("Error:", error);
        next(new ErrorHandler_1.default("Failed to fetch book, orders, or order items", 500));
    }
});
exports.getBookWithOrders = getBookWithOrders;
// Create Order for Books
exports.createBookOrderStripe = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { books, payment_info, address } = req.body;
        // التحقق من صحة الدفع
        if (payment_info && "id" in payment_info) {
            const paymentIntentId = payment_info.id;
            const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== "succeeded") {
                return next(new ErrorHandler_1.default("Payment not authorized!", 400));
            }
        }
        // التحقق من وجود المستخدم
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return next(new ErrorHandler_1.default("User not found!", 404));
        }
        // إنشاء طلب جديد
        const newOrder = yield Orderbook_Model_1.default.create({
            userId,
            address,
            ordered: true,
        });
        // إضافة الكتب إلى الطلب
        const orderItems = yield Promise.all(books.map((book) => __awaiter(void 0, void 0, void 0, function* () {
            const bookDetails = yield Book_model_1.default.findById(book.bookId);
            if (!bookDetails) {
                return next(new ErrorHandler_1.default(`Book not found: ${book.bookId}`, 404));
            }
            return OrderItem_Model_1.default.create({
                bookId: book.bookId,
                userId,
                orderId: newOrder._id,
                quantity: book.quantity,
                payment_info,
            });
        })));
        // إرسال بريد تأكيد
        const mailData = {
            order: {
                _id: newOrder._id.toString().slice(0, 6),
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                books: orderItems.map((item) => ({
                    title: item.bookId.title,
                    quantity: item.quantity,
                })),
            },
        };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation-books.ejs"), { order: mailData });
        res.status(201).json({
            success: true,
            message: "Order created successfully!",
            order: newOrder,
            items: orderItems,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// استرجاع جميع الطلبات - خاص بالمسؤول فقط
exports.getAllOrders = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield Orderbook_Model_1.default.find()
            .populate("userId", "name email") // جلب تفاصيل المستخدم
            .populate({
            path: "address",
            model: "Address", // جلب العنوان
        });
        res.status(200).json({
            success: true,
            orders,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// استرجاع الطلبات الخاصة بمستخدم معين
exports.getUserOrdersStripe = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return next(new ErrorHandler_1.default("User not authenticated!", 401));
        }
        const orders = yield Orderbook_Model_1.default.find({ userId })
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// إرسال Stripe Publishable Key
exports.sendStripePublishableKey = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
}));
// إنشاء عملية دفع جديدة للكتب
exports.newPaymentStripe = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount } = req.body;
        const myPayment = yield stripe.paymentIntents.create({
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
