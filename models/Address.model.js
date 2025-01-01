"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// تعريف المخطط باستخدام Mongoose
const AddressSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User", // تأكد من أن اسم الموديل صحيح
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    contact: {
        type: String,
        required: true,
        validate: {
            validator: (value) => /^\d{10}$/.test(value), // التحقق من رقم الهاتف
            message: "Contact number must be exactly 10 digits.",
        },
    },
    area: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    landmark: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
        validate: {
            validator: (value) => /^\d{6}$/.test(value), // التحقق من الرمز البريدي
            message: "Pincode must be exactly 6 digits.",
        },
    },
    type: {
        type: String,
        required: true,
        enum: ["home", "work", "other"], // قيم محددة
        default: "home",
    },
});
// تصدير الموديل
const Address = mongoose_1.default.model("Address", AddressSchema);
exports.default = Address;
