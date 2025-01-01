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
exports.getCategoryById = exports.deleteCategory = exports.updateCategory = exports.getCategories = exports.createCategory = void 0;
const Category_model_1 = __importDefault(require("../models/Category.model"));
const mongoose_1 = __importDefault(require("mongoose"));
// إنشاء تصنيف جديد
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { catTitle, catDesc } = req.body;
    if (!catTitle.trim() || !catDesc.trim()) {
        return res.status(400).json({ message: "Title and description are required" });
    }
    try {
        const newCategory = new Category_model_1.default({ catTitle, catDesc });
        yield newCategory.save();
        return res.status(201).json({ message: "Category created successfully", category: newCategory });
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating category", error: error.message || error });
    }
});
exports.createCategory = createCategory;
// جلب جميع التصنيفات
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield Category_model_1.default.find();
        return res.status(200).json(categories);
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching categories", error: error.message || error });
    }
});
exports.getCategories = getCategories;
// تعديل تصنيف
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { catTitle, catDesc } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
    }
    try {
        const category = yield Category_model_1.default.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        category.catTitle = catTitle || category.catTitle;
        category.catDesc = catDesc || category.catDesc;
        yield category.save();
        return res.status(200).json({ message: "Category updated successfully", category });
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating category", error: error.message || error });
    }
});
exports.updateCategory = updateCategory;
// حذف تصنيف
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
    }
    try {
        const category = yield Category_model_1.default.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        yield Category_model_1.default.deleteOne({ _id: id });
        return res.status(200).json({ message: "Category deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting category", error: error.message || error });
    }
});
exports.deleteCategory = deleteCategory;
// دالة لجلب تصنيف واحد عن طريق ID
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // التحقق من صحة معرف التصنيف
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
    }
    try {
        // البحث عن التصنيف بواسطة المعرف
        const category = yield Category_model_1.default.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(category);
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching category",
            error: error.message || error,
        });
    }
});
exports.getCategoryById = getCategoryById;
