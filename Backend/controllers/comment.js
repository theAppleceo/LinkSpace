
import Post from '../models/posts.js';
import Comment from '../models/comments.js';
import leoProfanity from 'leo-profanity';

export const postComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId).populate({
            path: "comments", populate: {
                path: "author",
            },
        })
            .populate("owner");
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const { comment } = req.body;

        if (leoProfanity.check(comment)) {
            console.log("Profanity detected!");
            return res.status(400).json({ error: 'inappropriate or violent statement' });
        } else {

            const newComment = new Comment({ comment });
            newComment.author = req.user._id;
            post.comments.push(newComment);

            await newComment.save();
            await post.save();
            await newComment.populate('author');

            res.status(201).json({ comment: newComment, message: 'Comment created successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const deleteComment = async (req, res) => {
    try {
        let { postId, commentId } = req.params;

        // Remove the comment reference from the post's comments array
        await Post.findByIdAndUpdate(postId, { $pull: { comments: commentId } });

        // Delete the actual comment 
        const deletedComment = await Comment.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json({ message: 'comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};