import { Router } from "express";
import { analyzeOrdersForChart, createOrderItem, getOrderItems, updateOrderItem } from "../controllers/orderItem.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const Itemrouter = Router();

Itemrouter.post("/create-order-item",isAuthenticated ,createOrderItem);
Itemrouter.get("/get-order-item",isAuthenticated,getOrderItems);
Itemrouter.get("/analyze-orders",isAuthenticated,authorizeRoles("admin"), analyzeOrdersForChart);

Itemrouter.patch("/order-items/:orderId/:bookId", updateOrderItem);
export default Itemrouter;
