"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderbook_controller_1 = require("../controllers/orderbook.controller");
const auth_1 = require("../middleware/auth");
const orderbookRouter = express_1.default.Router();
orderbookRouter.post("/create-order-book", auth_1.isAuthenticated, orderbook_controller_1.createOrderBook);
orderbookRouter.get("/get-order-book", auth_1.isAuthenticated, orderbook_controller_1.getOrdersBook);
orderbookRouter.post("/create-order-book", auth_1.isAuthenticated, orderbook_controller_1.createBookOrderStripe);
orderbookRouter.get("/get-with-order/:bookId", auth_1.isAuthenticated, orderbook_controller_1.getBookWithOrders);
// إنشاء طلب جديد
orderbookRouter.post("/create-order-book", auth_1.isAuthenticated, orderbook_controller_1.createBookOrderStripe);
// استرجاع جميع الطلبات (خاص بالمسؤول)
orderbookRouter.get("/admin/order", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), orderbook_controller_1.getAllOrders);
// استرجاع الطلبات الخاصة بالمستخدم
orderbookRouter.get("/my-orders", auth_1.isAuthenticated, orderbook_controller_1.getUserOrdersStripe);
// إرسال Stripe Publishable Key
orderbookRouter.get("/stripe/key", orderbook_controller_1.sendStripePublishableKey);
// إنشاء عملية دفع جديدة
orderbookRouter.post("/payment", auth_1.isAuthenticated, orderbook_controller_1.newPaymentStripe);
exports.default = orderbookRouter;
