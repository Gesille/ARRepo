import { Schema, model, Document, Types } from "mongoose";

// تعريف واجهة لتحديد هيكل البيانات
interface IComment extends Document {
  user: Types.ObjectId;  // ربط المستخدم بـ ObjectId من نوع `User`
  post: Types.ObjectId;  // ربط المقال بـ ObjectId من نوع `Post`
  desc: string;  // نص التعليق
}

// إنشاء مخطط `commentSchema`
const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",  // ربط بـ User
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",  // ربط بـ Post
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// تصدير الموديل
const CommentModel = model<IComment>("Comment", commentSchema);

export default CommentModel;
