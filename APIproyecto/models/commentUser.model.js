const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const xss = require('xss');

const commentSchema = new Schema({
    movieId: {
        type: Number,
        required: true
    },
    
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    commentText: {
        type: String,
        required: true
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'CommentUser' // Referencia a otro comentario en el mismo esquema
    },
  

}, { timestamps: true });

commentSchema.pre('save', function (next) {
    if (this.isModified('commentText')) {
      this.commentText = xss(this.commentText); // Sanitiza el texto del comentario
    }
    next();
  });

const Comment = mongoose.model('CommentUser', commentSchema);
module.exports = Comment;
