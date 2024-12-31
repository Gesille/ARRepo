import { Request, Response, NextFunction } from "express";
import Post from "../models/post.model";


const increaseVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const slug = req.params.slug;

  // تحديث عدد الزيارات (visit) بمقدار 1
  await Post.findOneAndUpdate({ slug }, { $inc: { visit: 1 } });

  // متابعة التنفيذ إلى الميدل وير التالي
  next();
};

export default increaseVisit;
