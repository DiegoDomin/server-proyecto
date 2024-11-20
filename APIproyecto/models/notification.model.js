const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  avatar: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'CommentUser' }, // Agregar el campo parentId

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
