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
exports.ROLES = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv").config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
exports.ROLES = {
    USER: "user",
    ADMIN: "admin",
    TEACHER: "teacher",
};
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "Please enter valid email",
        },
        unique: true,
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 character"],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        enum: Object.values(exports.ROLES),
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    courses: [
        {
            courseId: String,
        },
    ],
    books: [
        { bookId: String }
    ]
}, { timestamps: true });
//Mash Password before saving
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password")) {
            next();
        }
        //10 round is to hard
        this.password = yield bcryptjs_1.default.hash(this.password, 10);
        next();
    });
});
//sign access token
userSchema.methods.SignAccessToken = function () {
    const accessTokenSecret = process.env.ACCESS_TOKEN;
    if (!accessTokenSecret) {
        throw new Error('ACCESS_TOKEN is not defined');
    }
    return jsonwebtoken_1.default.sign({ id: this._id }, accessTokenSecret, { expiresIn: "5m" });
};
//signrefresh token
userSchema.methods.SignRefreshToken = function () {
    const refreshTokenSecret = process.env.REFRESH_TOKEN;
    if (!refreshTokenSecret) {
        throw new Error('REFRESH_TOKEN is not defined');
    }
    return jsonwebtoken_1.default.sign({ id: this._id }, refreshTokenSecret, { expiresIn: "3d" });
};
//compare password
userSchema.methods.comparePassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(enteredPassword, this.password);
    });
};
userSchema.methods.hasRole = function (roles) {
    return roles.includes(this.role);
};
const userModel = mongoose_1.default.model("User", userSchema);
exports.default = userModel;
