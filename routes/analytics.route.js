"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analytics_controller_1 = require("../controllers/analytics.controller");
const analyt_controller_1 = require("../controllers/analyt.controller");
const analyicsRouter = express_1.default.Router();
analyicsRouter.get("/get-users-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getUsersAnalytics);
analyicsRouter.get("/get-courses-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getCoursesAnalytics);
analyicsRouter.get("/get-orders-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getOrdersAnalytics);
analyicsRouter.get("/get-book-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analyt_controller_1.getAllAnalyticsbooks);
analyicsRouter.get("/get-post-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analyt_controller_1.getPostsAnalytics);
exports.default = analyicsRouter;
