"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// إنشاء مخطط `commentSchema`
const commentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User", // ربط بـ User
        required: true,
    },
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Post", // ربط بـ Post
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
}, { timestamps: true });
// تصدير الموديل
const CommentModel = (0, mongoose_1.model)("Comment", commentSchema);
exports.default = CommentModel;
