function createCommentValidator(data) {
    const errors = [];
  

  
    if (!data.commentText || typeof data.commentText !== 'string' || data.commentText.length < 1 || data.commentText.length > 200) {
        errors.push({
        field: "commentText",
        message: "El comentario debe tener entre 1 y 200 caracteres.",
      });
    }
  
    return errors;
  }
  
  module.exports = { createCommentValidator };
  