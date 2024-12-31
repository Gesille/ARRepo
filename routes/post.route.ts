import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { addComment, createPost, deleteComment, deletePost, featurePost, getPost, getPostComments, getPosts} from '../controllers/post.controller';
import increaseVisit from '../middleware/increaseVisit';


const postRouter = express.Router();


postRouter.post("/create-post",isAuthenticated, createPost);

postRouter.get("/get-post",isAuthenticated,getPosts);
postRouter.get("/get-post-filter", isAuthenticated, getPosts); 
postRouter.post("/add-comment", isAuthenticated,addComment);
postRouter.get('/comment/:postId',isAuthenticated,getPostComments);
postRouter.delete('/delete-comment/:commentId',isAuthenticated, deleteComment);
postRouter.get("/single-post-page/:slug",isAuthenticated,increaseVisit,getPost);



postRouter.delete("/delete-post/:id",isAuthenticated, deletePost);

postRouter.patch("/feature",isAuthenticated, featurePost);

export default postRouter;