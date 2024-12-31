import express from 'express';
import { createBookOrderStripe, createOrderBook, getAllOrders, getBookWithOrders, getOrdersBook, getUserOrdersStripe, newPaymentStripe, sendStripePublishableKey } from "../controllers/orderbook.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";


const orderbookRouter =  express.Router();

orderbookRouter.post("/create-order-book",isAuthenticated, createOrderBook);
orderbookRouter.get("/get-order-book",isAuthenticated, getOrdersBook);
orderbookRouter.post("/create-order-book", isAuthenticated ,createBookOrderStripe);
orderbookRouter.get("/get-with-order/:bookId", isAuthenticated,getBookWithOrders);







// إنشاء طلب جديد
orderbookRouter.post("/create-order-book", isAuthenticated ,createBookOrderStripe);

// استرجاع جميع الطلبات (خاص بالمسؤول)
orderbookRouter.get("/admin/order",isAuthenticated, authorizeRoles("admin"), getAllOrders);

// استرجاع الطلبات الخاصة بالمستخدم
orderbookRouter.get("/my-orders", isAuthenticated, getUserOrdersStripe);

// إرسال Stripe Publishable Key
orderbookRouter.get("/stripe/key", sendStripePublishableKey);

// إنشاء عملية دفع جديدة
orderbookRouter.post("/payment", isAuthenticated, newPaymentStripe);




export default orderbookRouter;
