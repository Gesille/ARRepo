"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// إنشاء مخطط `postSchema`
const postSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId, // ربط المستخدم بـ ObjectId
        ref: "User", // ربط بـ User
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
}, { timestamps: true });
// تصدير الموديل
const Post = mongoose_1.default.model("Post", postSchema);
exports.default = Post;
