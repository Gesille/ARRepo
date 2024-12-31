import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem extends Document {
  bookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  payment_info:object;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Orderbook", required: true },
    quantity: { type: Number, required: true },
    payment_info:{
      type:Object
  },
  },
  

  { timestamps: true }
);

const OrderItem = mongoose.model<IOrderItem>("OrderItem", OrderItemSchema);
export default OrderItem;
