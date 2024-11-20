// const httpError = require('http-errors');

// const authorization = async (req, res, next) => {
//     try {
//         // Verificar si el usuario está autenticado y su información está adjunta a la solicitud
//         if (!req.user) {
//             throw httpError(401, 'Usuario no autenticado');
//         }

//         // Verificar el rol del usuario para autorización
//         if (req.user.role !== 'admin') {
//             throw httpError(403, 'Acceso denegado. Permiso de administrador requerido.');
//         }

//         // Si pasa la verificación de autorización, continuar con la siguiente función de middleware o controlador
//         next();
//     } catch (error) {
//         next(error);
//     }
// };

// module.exports = authorization;
