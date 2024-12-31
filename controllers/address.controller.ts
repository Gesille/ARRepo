import { Request, Response } from 'express';
import Address from '../models/Address.model';
import User from '../models/user.model';
import mongoose from 'mongoose';
// طريقة لإنشاء عنوان جديد
export const createAddress = async (req: Request, res: Response) => {
    try {
        const { name, contact, area, city, state, landmark, pincode } = req.body;
        const userId = req.user?._id; // نفترض أن userId يتم تمريره من المصادقة

        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // التحقق من أن المستخدم موجود في قاعدة البيانات
        const user = await User.findById(userId);
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
        const newAddress = await Address.create({
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
    } catch (error:any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to add address',
            error: error.message, // إضافة تفاصيل الخطأ لتحسين التصحيح
        });
    }
};

export const getAddress = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id; // افتراض أن `userId` يأتي من المصادقة

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // البحث عن جميع العناوين المرتبطة بالمستخدم وتعبئة معلومات المستخدم
        const addresses = await Address.find({ user: userId }).populate('user');

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
    } catch (error:any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch addresses',
            error: error.message, // إضافة تفاصيل الخطأ لتحسين التصحيح
        });
    }

    
};


export const updateAddress = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id; // الحصول على userId من المستخدم المصادق عليه
        const { name, contact, area, city, state, landmark, pincode } = req.body;

        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // التحقق من وجود العنوان بناءً على userId وبيانات إضافية مثل "name"
        const address = await Address.findOneAndUpdate({ user: userId, name: name });

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

        await address.save(); // حفظ التعديلات

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: address,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address',
            error: error.message,
        });
    }
};


   



export const deleteAddress = async (req: Request, res: Response) => {
    try {
        const { addressId } = req.params;  // الحصول على addressId من المعلمات
        const userId = req.user?._id;

        // التحقق من وجود userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // التحقق من وجود العنوان في قاعدة البيانات
        const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
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
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
            error: error.message,
        });
    }
};

