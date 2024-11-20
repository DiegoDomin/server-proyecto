// middlewares/authorization.middlewares.js
const { verifyToken } = require('../utils/jwl.tools');
const User = require('../models/account.model');
const { sendJsonResponse } = require('../utils/http.helpers');

const authenticate = async (req, res, requiredRoles = []) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendJsonResponse(res, 401, { error: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return sendJsonResponse(res, 401, { error: 'Token inválido' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return sendJsonResponse(res, 401, { error: 'Usuario no encontrado' });
    }

    // Verificación de roles permitidos
    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      return sendJsonResponse(res, 403, { error: 'No tiene permisos para acceder a esta ruta' });
    }

    req.user = user; // Asignación de usuario autenticado en `req.user`
    return true; // Indicar que la autenticación fue exitosa
  } catch (error) {
    sendJsonResponse(res, 500, { error: error.message });
    return false;
  }
};

module.exports = authenticate;
