import { Request, Response } from "express";
import Category from "../models/Category.model";
import mongoose from "mongoose";

// إنشاء تصنيف جديد
export const createCategory = async (req: Request, res: Response) => {
  const { catTitle, catDesc } = req.body;

  if (!catTitle.trim() || !catDesc.trim()) {
    return res.status(400).json({ message: "Title and description are required" });
  }

  try {
    const newCategory = new Category({ catTitle, catDesc });
    await newCategory.save();
    return res.status(201).json({ message: "Category created successfully", category: newCategory });
  } catch (error:any) {
    return res.status(500).json({ message: "Error creating category", error: error.message || error });
  }
};

// جلب جميع التصنيفات
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories);
  } catch (error:any) {
    return res.status(500).json({ message: "Error fetching categories", error: error.message || error });
  }
};

// تعديل تصنيف
export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { catTitle, catDesc } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.catTitle = catTitle || category.catTitle;
    category.catDesc = catDesc || category.catDesc;

    await category.save();
    return res.status(200).json({ message: "Category updated successfully", category });
  } catch (error:any) {
    return res.status(500).json({ message: "Error updating category", error: error.message || error });
  }
};

// حذف تصنيف
export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.deleteOne({ _id: id });

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error:any) {
    return res.status(500).json({ message: "Error deleting category", error: error.message || error });
  }
};




// دالة لجلب تصنيف واحد عن طريق ID
export const getCategoryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  // التحقق من صحة معرف التصنيف
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    // البحث عن التصنيف بواسطة المعرف
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(category);
  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching category",
      error: error.message || error,
    });
  }
};
