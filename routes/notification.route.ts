import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { getNotifications, updateNotifiction } from '../controllers/notification.controller';

const notificationRoute = express.Router();

notificationRoute.get("/get-all-notification",isAuthenticated,authorizeRoles("admin"),getNotifications);

notificationRoute.put("/update-notification/:id",isAuthenticated,authorizeRoles("admin"),updateNotifiction)


export default notificationRoute;