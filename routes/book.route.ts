import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { updateAccessToken } from '../controllers/user.controller';
import { 
  createBook, 
  deleteBook, 
  getBooks, 
  updateBook, 
  getBookById, 
  getRelatedBooks, 
  getUserBooks, 
  getPurchasedBooks,
  getBooksAnalytics, 
  
} from '../controllers/books.controller'; 
import { getOrdersAnalytics } from '../controllers/analyt.controller';

const bookRouter = express.Router();

// جلب جميع الكتب
bookRouter.get("/getbook", updateAccessToken, isAuthenticated, getBooks);

// إنشاء كتاب جديد
bookRouter.post("/createbook", updateAccessToken, isAuthenticated, createBook);

// جلب الكتب التي اشتراها المستخدم (مسار ثابت)
bookRouter.get("/books/purchased", isAuthenticated, getPurchasedBooks);

bookRouter.get("/analytics/books",isAuthenticated,authorizeRoles("teacher"), getBooksAnalytics);

bookRouter.get("/analytics/orders",isAuthenticated,authorizeRoles("teacher"), getOrdersAnalytics);


// جلب الكتب الخاصة بمستخدم معين
bookRouter.get("/users/books/:userId", isAuthenticated, getUserBooks);

// جلب كتاب محدد باستخدام المعرف (ID)
bookRouter.get("/books/:id", isAuthenticated, getBookById);

// حذف كتاب
bookRouter.delete('/books/:id', deleteBook);

// تحديث كتاب
bookRouter.put("/books-update/:id", updateBook);

// جلب الكتب ذات الصلة
bookRouter.get("/books/:id/related", getRelatedBooks);

export default bookRouter;
