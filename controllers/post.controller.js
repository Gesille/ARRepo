"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.getPostComments = exports.addComment = exports.featurePost = exports.deletePost = exports.createPost = exports.getPost = exports.getPosts = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const post_model_1 = __importDefault(require("../models/post.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const slugify_1 = __importDefault(require("slugify"));
const Interaction_model_1 = __importDefault(require("../models/Interaction.model"));
const comment_model_1 = __importDefault(require("../models/comment.model"));
// جلب المنشورات مع دعم التصفية والفرز
// جلب المنشورات مع دعم التصفية والفرز
const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const { cat, author, search, sort, featured } = req.query;
    try {
        const query = {};
        // تصفية المنشورات بناءً على الفئة
        if (cat)
            query.category = cat;
        // البحث في العنوان
        if (search)
            query.title = { $regex: search, $options: "i" };
        // البحث عن المنشورات بواسطة الكاتب
        if (author) {
            const user = yield user_model_1.default.findOne({ username: author }).select("_id");
            if (!user) {
                return res.status(404).json({ message: "Author not found!" });
            }
            query.user = user._id;
        }
        // تصفية المنشورات المميزة
        if (featured)
            query.isFeatured = true;
        // كائن الترتيب
        let sortObj = { createdAt: -1 };
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
        const posts = yield post_model_1.default.find(query)
            .populate("user", "name") // جلب اسم المستخدم فقط
            .sort(sortObj)
            .limit(limit)
            .skip((page - 1) * limit);
        const totalPosts = yield post_model_1.default.countDocuments(query);
        const hasMore = page * limit < totalPosts;
        res.status(200).json({ posts, hasMore });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching posts",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.getPosts = getPosts;
// جلب منشور واحد
const getPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const post = yield post_model_1.default.findOne({ slug: req.params.slug }).populate("user", "name img");
        if (!post) {
            return res.status(404).json({ message: "Post not found!" });
        }
        res.status(200).json(post);
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching post",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.getPost = getPost;
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { title, desc, category, content, coverImage } = req.body;
    try {
        if (!title || !desc || !category || !content) {
            return res.status(400).json({
                success: false,
                message: "Title, description, category, and content are required.",
            });
        }
        // التحقق من دور المستخدم
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "teacher" && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "admin") {
            return next(new ErrorHandler_1.default("You are not authorized to create a post", 403));
        }
        // إنشاء slug
        const slug = (0, slugify_1.default)(title, { lower: true, strict: true });
        // تحميل صورة الغلاف إلى Cloudinary
        let coverImageData = null;
        if (coverImage) {
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(coverImage, {
                folder: "posts",
            });
            coverImageData = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        // تحميل الصور داخل المحتوى
        const updatedContent = yield uploadContentImages(content);
        // إنشاء المنشور
        const newPost = new post_model_1.default({
            title,
            desc,
            category,
            content: updatedContent,
            img: (coverImageData === null || coverImageData === void 0 ? void 0 : coverImageData.url) || null,
            user: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            slug,
        });
        yield newPost.save();
        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: newPost,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating post",
            error: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
});
exports.createPost = createPost;
// دالة لتحميل الصور داخل المحتوى
const uploadContentImages = (content) => __awaiter(void 0, void 0, void 0, function* () {
    const imageRegex = /<img[^>]+src="([^">]+)"/g;
    let updatedContent = content;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
        const imageUrl = match[1];
        if (imageUrl) {
            try {
                const uploadedImage = yield cloudinary_1.default.v2.uploader.upload(imageUrl, {
                    folder: "posts/content_images",
                });
                // استبدال الرابط القديم برابط الصورة المحملة
                updatedContent = updatedContent.replace(imageUrl, uploadedImage.secure_url);
            }
            catch (err) {
                console.error(`Error uploading image from content: ${imageUrl}`, err);
            }
        }
    }
    return updatedContent;
});
// حذف منشور
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated!" });
        }
        const role = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || "user";
        if (role === "admin") {
            yield post_model_1.default.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "Post has been deleted" });
        }
        const deletedPost = yield post_model_1.default.findOneAndDelete({
            _id: req.params.id,
            user: userId,
        });
        if (!deletedPost) {
            return res.status(403).json({ message: "You can delete only your posts!" });
        }
        res.status(200).json({ message: "Post has been deleted" });
    }
    catch (error) {
        res.status(500).json({
            message: "Error deleting post",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.deletePost = deletePost;
// تحديد منشور كمميز
const featurePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const postId = req.body.postId;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required!" });
        }
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated!" });
        }
        const role = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || "user";
        if (role !== "admin") {
            return res.status(403).json({ message: "You cannot feature posts!" });
        }
        const post = yield post_model_1.default.findById(new mongoose_1.default.Types.ObjectId(postId));
        if (!post) {
            return res.status(404).json({ message: "Post not found!" });
        }
        // تحديث المنشور وتبديل حالة "isFeatured"
        const updatedPost = yield post_model_1.default.findByIdAndUpdate(postId, { isFeatured: !post.isFeatured }, { new: true });
        // حفظ التفاعل في سجل خاص إذا كنت ترغب
        // يمكنك إضافة هذه السطر لحفظ سجل التفاعل (مثال فقط)
        yield Interaction_model_1.default.create({
            userId: userId,
            postId: postId,
            interactionType: post.isFeatured ? "unfeature" : "feature", // يمكن أن تتغير التسمية حسب التفاعل
        });
        res.status(200).json(updatedPost);
    }
    catch (error) {
        res.status(500).json({
            message: "Error updating post feature",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.featurePost = featurePost;
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { postId, desc } = req.body; // استخراج postId و desc من الطلب
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // نفترض أن userId يتم تمريره من المصادقة
        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        // التحقق من وجود المستخدم
        const user = yield user_model_1.default.findById(userId);
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
        const newComment = yield comment_model_1.default.create({
            user: userId, // ObjectId الخاص بالمستخدم
            post: postId, // ObjectId الخاص بالمنشور
            desc,
        });
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: newComment,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message,
        });
    }
});
exports.addComment = addComment;
const getPostComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const comments = yield comment_model_1.default.find({ post: postId })
            .populate('user', 'name avatar') // جلب تفاصيل المستخدم مع التعليق
            .sort({ createdAt: -1 }); // ترتيب التعليقات حسب تاريخ الإنشاء
        return res.status(200).json({
            success: true,
            data: comments,
        });
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch comments',
            error: error.message,
        });
    }
});
exports.getPostComments = getPostComments;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { commentId } = req.params; // الحصول على commentId من المعلمات
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // الحصول على userId من المستخدم المصادق عليه
        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        // التحقق من وجود التعليق في قاعدة البيانات
        const comment = yield comment_model_1.default.findOne({ _id: commentId, user: userId });
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found or not authorized to delete',
            });
        }
        yield comment_model_1.default.findByIdAndDelete(commentId); // حذف التعليق
        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment',
            error: error.message,
        });
    }
});
exports.deleteComment = deleteComment;
