import express from "express";
import {
  deleteCourse,
  editCourse,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCommentsForCourses,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
 
  uploadCourse,
} from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  addAnswer,
  addQusetion,
  addReplyToReview,
  addReview,
} from "../controllers/course.controller";
import { updateAccessToken } from "../controllers/user.controller";

const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("teacher"),
  uploadCourse
);

courseRouter.get("/get-all-comments",isAuthenticated,authorizeRoles("teacher"), getAllCommentsForCourses);

courseRouter.put(
  "/edit-course/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("teacher"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);

courseRouter.put("/add-question", isAuthenticated, addQusetion);

courseRouter.put("/add-answer", isAuthenticated, addAnswer);

courseRouter.put("/add-review/:id", isAuthenticated, addReview);

courseRouter.put(
  "/add-reply",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  addReplyToReview
);

courseRouter.get(
  "/get-all-course",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCourses
);

courseRouter.get(
  "/get-admin-courses",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllCourses
);

courseRouter.delete(
  "/delete-course/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  deleteCourse
);

courseRouter.post("/getVdoCipherOTP", generateVideoUrl);



export default courseRouter;
