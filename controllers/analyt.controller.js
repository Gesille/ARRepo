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
exports.getPostsAnalytics = exports.getOrdersAnalytics = exports.getAllAnalyticsbooks = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const Book_model_1 = __importDefault(require("../models/Book.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const Orderbook_Model_1 = __importDefault(require("../models/Orderbook.Model"));
const post_model_1 = __importDefault(require("../models/post.model"));
const analyic_generator_1 = require("../utils/analyic.generator");
const postanalyic_generator_1 = require("../utils/postanalyic.generator");
// Get all analytics --- only for admin
exports.getAllAnalyticsbooks = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookCount = yield Book_model_1.default.countDocuments();
        const userCount = yield user_model_1.default.countDocuments();
        const orderCount = yield Orderbook_Model_1.default.countDocuments();
        const categoryCount = yield Category_model_1.default.countDocuments();
        res.status(200).json({
            success: true,
            data: {
                bookCount,
                userCount,
                orderCount,
                categoryCount,
            },
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get order analytics --- only for admin
exports.getOrdersAnalytics = (0, catchAsyncError_1.CatchAsyncError)((re, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield (0, analyic_generator_1.generateLast12MonthsBooksData)(Orderbook_Model_1.default);
        res.status(201).json({
            success: true,
            orders,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get post analytics --- only for admin
exports.getPostsAnalytics = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield (0, postanalyic_generator_1.generateLast12MonthsPostData)(post_model_1.default);
        res.status(201).json({
            success: true,
            posts,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
