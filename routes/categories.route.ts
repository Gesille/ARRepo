import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from '../controllers/categories.controller';
import { updateAccessToken } from '../controllers/user.controller';


const categoryRouter = express.Router();

categoryRouter.post("/create-category",updateAccessToken,authorizeRoles("admin"),isAuthenticated,createCategory);

categoryRouter.get("/getcategories",updateAccessToken,isAuthenticated,getCategories)

categoryRouter.put("/update-category/:id",isAuthenticated,authorizeRoles("admin"),updateCategory)

categoryRouter.delete("/delete-category/:id",isAuthenticated,authorizeRoles("admin"),deleteCategory)

categoryRouter.get("/categories/:id",isAuthenticated, getCategoryById);

export default categoryRouter;