import mongoose, { Document, Model, Schema } from "mongoose";

// تعريف واجهة لتحديد هيكل البيانات
interface IPost extends Document {
  user: mongoose.Types.ObjectId;  // ربط المستخدم بـ ObjectId
  img?: string;
  title: string;
  slug: string;
  desc?: string;
  category: string;
  content: string;
  isFeatured: boolean;
  visit: number;
}

// إنشاء مخطط `postSchema`
const postSchema: Schema<IPost> = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,  // ربط المستخدم بـ ObjectId
      ref: "User",  // ربط بـ User
      required: true,
    },
    img: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    desc: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "general",
    },
    content: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    visit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// تصدير الموديل
const Post: Model<IPost> = mongoose.model<IPost>("Post", postSchema);
export default Post;
