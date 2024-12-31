import ImageKit from "imagekit";
import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import userModel from "../models/user.model";
import Post from "../models/post.model";
import ErrorHandler from "../utils/ErrorHandler";
import slugify from "slugify";
import UserInteraction from "../models/Interaction.model";
import CommentModel from "../models/comment.model";


// جلب المنشورات مع دعم التصفية والفرز
// جلب المنشورات مع دعم التصفية والفرز
export const getPosts = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const { cat, author, search, sort, featured } = req.query;

  try {
    const query: any = {};

    // تصفية المنشورات بناءً على الفئة
    if (cat) query.category = cat;

    // البحث في العنوان
    if (search) query.title = { $regex: search, $options: "i" };

    // البحث عن المنشورات بواسطة الكاتب
    if (author) {
      const user = await userModel.findOne({ username: author }).select("_id");
      if (!user) {
        return res.status(404).json({ message: "Author not found!" });
      }
      query.user = user._id;
    }

    // تصفية المنشورات المميزة
    if (featured) query.isFeatured = true;

    // كائن الترتيب
    let sortObj: { [key: string]: 1 | -1 } = { createdAt: -1 };
    switch (sort) {
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      case "popular":
        sortObj = { visit: -1 };
        break;
      case "trending":
        sortObj = { visit: -1 };
        query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        break;
      default:
        break;
    }

    // جلب البيانات مع استخدام populate لجلب اسم المستخدم
    const posts = await Post.find(query)
      .populate("user", "name") // جلب اسم المستخدم فقط
      .sort(sortObj)
      .limit(limit)
      .skip((page - 1) * limit);

    const totalPosts = await Post.countDocuments(query);
    const hasMore = page * limit < totalPosts;

    res.status(200).json({ posts, hasMore });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts",
      error: error instanceof Error ? error.message : error,
    });
  }
};


// جلب منشور واحد
export const getPost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate("user", "name img");

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching post",
      error: error instanceof Error ? error.message : error,
    });
  }
};



export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  const { title, desc, category, content, coverImage } = req.body;

  try {
    if (!title || !desc || !category || !content) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category, and content are required.",
      });
    }

    // التحقق من دور المستخدم
    if (req.user?.role !== "teacher" && req.user?.role !== "admin") {
      return next(new ErrorHandler("You are not authorized to create a post", 403));
    }

    // إنشاء slug
    const slug = slugify(title, { lower: true, strict: true });

    // تحميل صورة الغلاف إلى Cloudinary
    let coverImageData = null;
    if (coverImage) {
      const myCloud = await cloudinary.v2.uploader.upload(coverImage, {
        folder: "posts",
      });
      coverImageData = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    // تحميل الصور داخل المحتوى
    const updatedContent = await uploadContentImages(content);

    // إنشاء المنشور
    const newPost = new Post({
      title,
      desc,
      category,
      content: updatedContent,
      img: coverImageData?.url || null,
      user: req.user?._id,
      slug,
    });

    await newPost.save();

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
};

// دالة لتحميل الصور داخل المحتوى
const uploadContentImages = async (content: string) => {
  const imageRegex = /<img[^>]+src="([^">]+)"/g;
  let updatedContent = content;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const imageUrl = match[1];
    if (imageUrl) {
      try {
        const uploadedImage = await cloudinary.v2.uploader.upload(imageUrl, {
          folder: "posts/content_images",
        });

        // استبدال الرابط القديم برابط الصورة المحملة
        updatedContent = updatedContent.replace(imageUrl, uploadedImage.secure_url);
      } catch (err) {
        console.error(`Error uploading image from content: ${imageUrl}`, err);
      }
    }
  }

  return updatedContent;
};



// حذف منشور
export const deletePost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated!" });
    }

    const role = req.user?.role || "user";

    if (role === "admin") {
      await Post.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Post has been deleted" });
    }

    const deletedPost = await Post.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!deletedPost) {
      return res.status(403).json({ message: "You can delete only your posts!" });
    }

    res.status(200).json({ message: "Post has been deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting post",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// تحديد منشور كمميز
export const featurePost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const postId = req.body.postId;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required!" });
    }
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated!" });
    }

    const role = req.user?.role || "user";

    if (role !== "admin") {
      return res.status(403).json({ message: "You cannot feature posts!" });
    }

    
const post = await Post.findById(new mongoose.Types.ObjectId(postId));

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    // تحديث المنشور وتبديل حالة "isFeatured"
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { isFeatured: !post.isFeatured },
      { new: true }
    );

    // حفظ التفاعل في سجل خاص إذا كنت ترغب
    // يمكنك إضافة هذه السطر لحفظ سجل التفاعل (مثال فقط)
    await UserInteraction.create({
      userId: userId,
      postId: postId,
      interactionType: post.isFeatured ? "unfeature" : "feature", // يمكن أن تتغير التسمية حسب التفاعل
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: "Error updating post feature",
      error: error instanceof Error ? error.message : error,
    });
  }
};



export const addComment = async (req: Request, res: Response) => {
    try {
        const { postId, desc } = req.body;  // استخراج postId و desc من الطلب
        const userId = req.user?._id;  // نفترض أن userId يتم تمريره من المصادقة

        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // التحقق من وجود المستخدم
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // التحقق من وجود postId و desc
        if (!postId || !desc) {
            return res.status(400).json({
                success: false,
                message: 'postId and desc are required',
            });
        }

        // إنشاء تعليق جديد باستخدام النموذج الصحيح
        const newComment = await CommentModel.create({
            user: userId,  // ObjectId الخاص بالمستخدم
            post: postId,  // ObjectId الخاص بالمنشور
            desc,
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: newComment,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message,
        });
    }
};



export const getPostComments = async (req: Request, res: Response) => {
  try {
      const { postId } = req.params;

      // التحقق من وجود postId
      if (!postId) {
          return res.status(400).json({
              success: false,
              message: 'Post ID is required',
          });
      }

      // جلب التعليقات المرتبطة بالـ postId
      const comments = await CommentModel.find({ post: postId })
          .populate('user', 'name avatar') // جلب تفاصيل المستخدم مع التعليق
          .sort({ createdAt: -1 }); // ترتيب التعليقات حسب تاريخ الإنشاء

      return res.status(200).json({
          success: true,
          data: comments,
      });
  } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({
          success: false,
          message: 'Failed to fetch comments',
          error: (error as Error).message,
      });
  }
};




export const deleteComment = async (req: Request, res: Response) => {
  try {
      const { commentId } = req.params;  // الحصول على commentId من المعلمات
      const userId = req.user?._id;  // الحصول على userId من المستخدم المصادق عليه

      // التحقق من وجود userId
      if (!userId) {
          return res.status(400).json({
              success: false,
              message: 'User ID is required',
          });
      }

      // التحقق من وجود التعليق في قاعدة البيانات
      const comment = await CommentModel.findOne({ _id: commentId, user: userId });
      if (!comment) {
          return res.status(404).json({
              success: false,
              message: 'Comment not found or not authorized to delete',
          });
      }

      await CommentModel.findByIdAndDelete(commentId);  // حذف التعليق

      res.status(200).json({
          success: true,
          message: 'Comment deleted successfully',
      });
  } catch (error: any) {
      console.error(error);
      res.status(500).json({
          success: false,
          message: 'Failed to delete comment',
          error: error.message,
      });
  }
};