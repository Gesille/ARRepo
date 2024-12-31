import {  Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import OrderbookModel from "../models/Orderbook.Model";


//create new order
export const newOrderBook = CatchAsyncError(async(data:any,res:Response) =>{
    const orderbook = await OrderbookModel.create(data);
    res.status(201).json({
        success:true,
        orderbook,
      })
   
})