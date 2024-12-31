import mongoose, { Schema, Document, Model } from "mongoose";
import { ICategory } from "./Category.model"; // Assuming Category has been defined in TypeScript


interface IChapter {
  title: string;
  content: string;
}
// Define the interface for the Book document

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  category: ICategory["_id"]; // Reference to Category ID
  price: number;
  discountPrice?: number; // Optional field
  status?: boolean; // Default is true
  coverImage: {
    public_id: string; // Cloudinary public ID
    url: string; // URL of the uploaded image
  };
  chapters: IChapter[];
  addedBy: mongoose.Schema.Types.ObjectId; // معرف المستخدم الذي أضاف الكتاب
  purchasedBy?: mongoose.Schema.Types.ObjectId[];
  createdAt?: Date; // Managed by Mongoose
  updatedAt?: Date; // Managed by Mongoose
}

// Define the schema for the Book model
const BookSchema: Schema<IBook> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category", // Reference to Category model
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
    },
    status: {
      type: Boolean,
      default: true,
    },
    coverImage: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      
    },
    chapters: [{ // New field for storing book chapters
      title: { type: String, required: true },
      content: { type: String, required: true },
    }],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    purchasedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]

  },
  { timestamps: true }
);

// Export the Book model with types
const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;
 