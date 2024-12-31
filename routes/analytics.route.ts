import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { getCoursesAnalytics, getOrdersAnalytics, getUsersAnalytics } from '../controllers/analytics.controller';
import { getAllAnalyticsbooks, getPostsAnalytics } from '../controllers/analyt.controller';
const analyicsRouter = express.Router();

analyicsRouter.get("/get-users-analytics",isAuthenticated,authorizeRoles("admin"),getUsersAnalytics);

analyicsRouter.get("/get-courses-analytics",isAuthenticated,authorizeRoles("admin"),getCoursesAnalytics);

analyicsRouter.get("/get-orders-analytics",isAuthenticated,authorizeRoles("admin"),getOrdersAnalytics);

analyicsRouter.get("/get-book-analytics",isAuthenticated,authorizeRoles("admin"), getAllAnalyticsbooks);

analyicsRouter.get("/get-post-analytics",isAuthenticated,authorizeRoles("admin"), getPostsAnalytics);


export default analyicsRouter;