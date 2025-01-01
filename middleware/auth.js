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
exports.authorizeRoles = exports.isAuthenticated = void 0;
const catchAsyncError_1 = require("./catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const user_controller_1 = require("../controllers/user.controller");
// التوثيق (Authentication)
exports.isAuthenticated = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    try {
        // التحقق من التوكن باستخدام verify
        const decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN);
        // التحقق من صلاحية التوكن
        if (decoded.exp && decoded.exp <= Date.now() / 1000) {
            console.log("Access token expired, updating...");
            yield (0, user_controller_1.updateAccessToken)(req, res, next); // تحديث التوكن إذا كان منتهي
        }
        else {
            // الحصول على المستخدم بناءً على ID المخزن في التوكن
            const user = yield user_model_1.default.findById(decoded.id);
            if (!user) {
                return next(new ErrorHandler_1.default("User not found", 400));
            }
            req.user = user;
            next();
        }
    }
    catch (error) {
        console.log("Error verifying token:", error);
        return next(new ErrorHandler_1.default("Invalid or expired access token", 400));
    }
}));
// التحقق من الدور (Role Authorization)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            return next(new ErrorHandler_1.default("User role is not defined", 400));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler_1.default(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
