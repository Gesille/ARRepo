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
exports.analyzeOrdersForChart = exports.getOrderItems = exports.updateOrderItem = exports.createOrderItem = void 0;
const OrderItem_Model_1 = __importDefault(require("../models/OrderItem.Model"));
const Orderbook_Model_1 = __importDefault(require("../models/Orderbook.Model"));
const Book_model_1 = __importDefault(require("../models/Book.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const Address_model_1 = __importDefault(require("../models/Address.model"));
const Orderbook_Model_2 = __importDefault(require("../models/Orderbook.Model"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const createOrderItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // المستخدم
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
        const book = yield Book_model_1.default.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }
        // البحث عن طلب مفتوح للمستخدم
        let order = yield Orderbook_Model_1.default.findOne({ userId, ordered: false });
        // إذا لم يكن هناك طلب مفتوح، قم بإنشاء طلب جديد
        if (!order) {
            order = yield Orderbook_Model_1.default.create({ userId, ordered: false });
        }
        // التحقق إذا كان الكتاب موجودًا بالفعل في الطلب
        const existingOrderItem = yield OrderItem_Model_1.default.findOne({
            orderId: order._id,
            bookId: bookId,
        });
        if (existingOrderItem) {
            // إذا كان الكتاب موجودًا، قم بتحديث الكمية فقط
            existingOrderItem.quantity += quantity;
            yield existingOrderItem.save();
            return res.status(200).json(existingOrderItem); // إرجاع العنصر المحدث
        }
        else {
            // إذا لم يكن الكتاب موجودًا، قم بإضافته كعنصر جديد في الطلب
            const newOrderItem = yield OrderItem_Model_1.default.create({
                userId,
                bookId,
                orderId: order._id,
                quantity,
            });
            return res.status(201).json(newOrderItem); // إرجاع العنصر الجديد
        }
    }
    catch (error) {
        console.error("Error creating order item:", error);
        res.status(500).json({ error: "Failed to create order item" });
    }
});
exports.createOrderItem = createOrderItem;
const updateOrderItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, bookId } = req.params;
        const { quantity, addressId } = req.body; // الكمية الجديدة والعنوان
        // التأكد من أن الكمية موجودة
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: "Quantity should be greater than 0" });
        }
        // التحقق من صحة معرف العنوان
        if (addressId) {
            const address = yield Address_model_1.default.findById(addressId);
            if (!address) {
                return res.status(404).json({ error: "Address not found" });
            }
        }
        // البحث عن الطلب
        const order = yield Orderbook_Model_1.default.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        // تحديث العنوان إذا تم تمريره
        if (addressId) {
            order.address = addressId;
            yield order.save();
        }
        // البحث عن العنصر في الطلب
        const orderItem = yield OrderItem_Model_1.default.findOne({
            orderId: order._id,
            bookId,
        });
        if (!orderItem) {
            return res.status(404).json({ error: "Order item not found" });
        }
        // تحديث الكمية
        orderItem.quantity = quantity;
        yield orderItem.save();
        return res.status(200).json(orderItem); // إرجاع العنصر المحدث
    }
    catch (error) {
        console.error("Error updating order item:", error);
        res.status(500).json({ error: "Failed to update order item" });
    }
});
exports.updateOrderItem = updateOrderItem;
const getOrderItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const orderItems = yield OrderItem_Model_1.default.find({ userId });
        if (orderItems.length === 0) {
            return res.status(404).json({ error: "No order items found" });
        }
        // تحقق من صلاحية معرفات الكتب
        const validOrderItems = orderItems.filter((item) => mongoose_1.default.Types.ObjectId.isValid(item.bookId));
        if (validOrderItems.length !== orderItems.length) {
            return res.status(400).json({ error: "Some book IDs are invalid in order items" });
        }
        const bookIds = validOrderItems.map((item) => item.bookId);
        const books = yield Book_model_1.default.find({ _id: { $in: bookIds } });
        // تحقق من وجود الكتب
        const missingBooks = bookIds.filter((id) => !books.some((book) => book._id.toString() === id.toString()));
        if (missingBooks.length > 0) {
            return res.status(404).json({
                error: "Some book IDs are missing in the database",
                missingBooks,
            });
        }
        // احصل على العنوان من الطلبات
        const orders = yield Orderbook_Model_2.default.find({ userId }).populate("address");
        if (orders.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        const order = orders[0]; // نأخذ أول طلب (يفترض أن يكون هناك طلب واحد للمستخدم)
        // دمج الطلبات مع بيانات الكتب والعنوان
        const orderItemsWithBooksAndAddress = validOrderItems.map((item) => {
            var _a;
            const book = books.find((b) => b._id.toString() === item.bookId.toString());
            return Object.assign(Object.assign({}, item.toObject()), { book: {
                    title: book === null || book === void 0 ? void 0 : book.title,
                    author: book === null || book === void 0 ? void 0 : book.author,
                    coverImage: book === null || book === void 0 ? void 0 : book.coverImage,
                    price: book === null || book === void 0 ? void 0 : book.price,
                    discountPrice: book === null || book === void 0 ? void 0 : book.discountPrice,
                    category: (_a = book === null || book === void 0 ? void 0 : book.category) === null || _a === void 0 ? void 0 : _a.name,
                }, order: {
                    address: (order === null || order === void 0 ? void 0 : order.address) ? order.address : "No address available",
                } });
        });
        res.status(200).json(orderItemsWithBooksAndAddress);
    }
    catch (error) {
        console.error("Error fetching order items:", error);
        res.status(500).json({ error: "Failed to fetch order items" });
    }
});
exports.getOrderItems = getOrderItems;
exports.analyzeOrdersForChart = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // استرجاع جميع الطلبات
        const orders = yield Orderbook_Model_2.default.find();
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found." });
        }
        const totalOrders = orders.length;
        const salesData = {};
        // تحليل الطلبات
        for (const order of orders) {
            const orderItems = yield OrderItem_Model_1.default.find({ orderId: order._id }).populate("bookId");
            for (const item of orderItems) {
                const book = yield Book_model_1.default.findById(item.bookId);
                const totalItemSales = item.quantity * ((book === null || book === void 0 ? void 0 : book.price) || 0);
                // تجميع المبيعات لكل كتاب
                if (salesData[book === null || book === void 0 ? void 0 : book._id.toString()]) {
                    salesData[book === null || book === void 0 ? void 0 : book._id.toString()] += totalItemSales;
                }
                else {
                    salesData[book === null || book === void 0 ? void 0 : book._id.toString()] = totalItemSales;
                }
            }
        }
        // إعداد البيانات للرسم
        const chartData = Object.keys(salesData).map((bookId) => __awaiter(void 0, void 0, void 0, function* () {
            const book = yield Book_model_1.default.findById(bookId);
            return {
                title: book === null || book === void 0 ? void 0 : book.title,
                sales: salesData[bookId],
            };
        }));
        // الانتظار حتى يتم الانتهاء من جميع العمليات
        const results = yield Promise.all(chartData);
        res.status(200).json({
            success: true,
            totalOrders,
            salesData: results,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
