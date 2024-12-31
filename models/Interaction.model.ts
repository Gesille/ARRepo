import mongoose, { Schema, Document } from 'mongoose';

interface IUserInteraction extends Document {
  userId: mongoose.Types.ObjectId;  // يجب أن تستخدم mongoose.Types.ObjectId هنا
  postId: mongoose.Types.ObjectId;  // نفس الشيء هنا
  interactionType: string;
}

const UserInteractionSchema = new Schema<IUserInteraction>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,  // هنا يتم تحديد type بشكل صحيح
    ref: 'User',  // إشارة إلى النموذج المستخدم
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,  // تحديد النوع ObjectId بشكل صحيح
    ref: 'Post',  // إشارة إلى النموذج المستخدم
    required: true,
  },
  interactionType: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const UserInteraction = mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);

export default UserInteraction;
