"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const categories_controller_1 = require("../controllers/categories.controller");
const user_controller_1 = require("../controllers/user.controller");
const categoryRouter = express_1.default.Router();
categoryRouter.post("/create-category", user_controller_1.updateAccessToken, (0, auth_1.authorizeRoles)("admin"), auth_1.isAuthenticated, categories_controller_1.createCategory);
categoryRouter.get("/getcategories", user_controller_1.updateAccessToken, auth_1.isAuthenticated, categories_controller_1.getCategories);
categoryRouter.put("/update-category/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), categories_controller_1.updateCategory);
categoryRouter.delete("/delete-category/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), categories_controller_1.deleteCategory);
categoryRouter.get("/categories/:id", auth_1.isAuthenticated, categories_controller_1.getCategoryById);
exports.default = categoryRouter;
