import mongoose, { Document, Schema, Model, model } from "mongoose";

interface IOrder extends Document {
  
  userId: mongoose.Schema.Types.ObjectId;
  dateOfOrder: Date;
  ordered: boolean;
  address:String
}

const OrderSchema: Schema<IOrder> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dateOfOrder: { type: Date, default: Date.now },
  ordered: { type: Boolean, default: false },
  address:{
    type:Schema.Types.ObjectId,
    ref:"Address",
    default:null
  }
});

const Orderbook: Model<IOrder> = mongoose.models.Orderbook || model<IOrder>("Orderbook", OrderSchema);


export default Orderbook;









