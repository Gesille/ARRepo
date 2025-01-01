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
exports.deleteAddress = exports.updateAddress = exports.getAddress = exports.createAddress = void 0;
const Address_model_1 = __importDefault(require("../models/Address.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// طريقة لإنشاء عنوان جديد
const createAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, contact, area, city, state, landmark, pincode } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // نفترض أن userId يتم تمريره من المصادقة
        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        // التحقق من أن المستخدم موجود في قاعدة البيانات
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // التحقق من وجود الحقول المطلوبة
        if (!name || !contact || !area || !city || !state || !landmark || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }
        // إنشاء السجل الجديد
        const newAddress = yield Address_model_1.default.create({
            user: userId, // إضافة userId إلى البيانات
            name,
            contact,
            area,
            city,
            state,
            landmark,
            pincode,
        });
        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: newAddress,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to add address',
            error: error.message, // إضافة تفاصيل الخطأ لتحسين التصحيح
        });
    }
});
exports.createAddress = createAddress;
const getAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // افتراض أن `userId` يأتي من المصادقة
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        // البحث عن جميع العناوين المرتبطة بالمستخدم وتعبئة معلومات المستخدم
        const addresses = yield Address_model_1.default.find({ user: userId }).populate('user');
        if (addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No addresses found',
            });
        }
        res.status(200).json({
            success: true,
            data: addresses,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch addresses',
            error: error.message, // إضافة تفاصيل الخطأ لتحسين التصحيح
        });
    }
});
exports.getAddress = getAddress;
const updateAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // الحصول على userId من المستخدم المصادق عليه
        const { name, contact, area, city, state, landmark, pincode } = req.body;
        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        // التحقق من وجود العنوان بناءً على userId وبيانات إضافية مثل "name"
        const address = yield Address_model_1.default.findOneAndUpdate({ user: userId, name: name });
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found for this user',
            });
        }
        // تحديث بيانات العنوان
        address.contact = contact || address.contact;
        address.area = area || address.area;
        address.city = city || address.city;
        address.state = state || address.state;
        address.landmark = landmark || address.landmark;
        address.pincode = pincode || address.pincode;
        yield address.save(); // حفظ التعديلات
        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: address,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address',
            error: error.message,
        });
    }
});
exports.updateAddress = updateAddress;
const deleteAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { addressId } = req.params; // الحصول على addressId من المعلمات
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        // التحقق من وجود العنوان في قاعدة البيانات
        const address = yield Address_model_1.default.findOneAndDelete({ _id: addressId, user: userId });
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
            error: error.message,
        });
    }
});
exports.deleteAddress = deleteAddress;
