import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { createOrder, getAllOrders, newPayment, sendStripePublishableKey } from '../controllers/order.controller';

const orderRouter = express.Router();

orderRouter.post("/create-order",isAuthenticated,createOrder);

orderRouter.get("/get-order",isAuthenticated,authorizeRoles("admin", "teacher"),getAllOrders);

orderRouter.post("/payment",isAuthenticated,newPayment);

orderRouter.get("/payment/stripepublishablrkey",sendStripePublishableKey);



export default orderRouter;