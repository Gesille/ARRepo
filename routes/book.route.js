"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const books_controller_1 = require("../controllers/books.controller");
const analyt_controller_1 = require("../controllers/analyt.controller");
const bookRouter = express_1.default.Router();
// جلب جميع الكتب
bookRouter.get("/getbook", user_controller_1.updateAccessToken, auth_1.isAuthenticated, books_controller_1.getBooks);
// إنشاء كتاب جديد
bookRouter.post("/createbook", user_controller_1.updateAccessToken, auth_1.isAuthenticated, books_controller_1.createBook);
// جلب الكتب التي اشتراها المستخدم (مسار ثابت)
bookRouter.get("/books/purchased", auth_1.isAuthenticated, books_controller_1.getPurchasedBooks);
bookRouter.get("/analytics/books", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("teacher"), books_controller_1.getBooksAnalytics);
bookRouter.get("/analytics/orders", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("teacher"), analyt_controller_1.getOrdersAnalytics);
// جلب الكتب الخاصة بمستخدم معين
bookRouter.get("/users/books/:userId", auth_1.isAuthenticated, books_controller_1.getUserBooks);
// جلب كتاب محدد باستخدام المعرف (ID)
bookRouter.get("/books/:id", auth_1.isAuthenticated, books_controller_1.getBookById);
// حذف كتاب
bookRouter.delete('/books/:id', books_controller_1.deleteBook);
// تحديث كتاب
bookRouter.put("/books-update/:id", books_controller_1.updateBook);
// جلب الكتب ذات الصلة
bookRouter.get("/books/:id/related", books_controller_1.getRelatedBooks);
exports.default = bookRouter;
