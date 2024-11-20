const controller = {};
const User = require("../models/account.model");
const { createToken, verifyToken } = require("../utils/jwl.tools");
const { sendJsonResponse, parseRequestBody } = require("../utils/http.helpers");
const { registerAccountValidator } = require("../validators/createAccount.validator");
const { trackFailedLogin, resetFailedLogins, applyDelay } = require("../middlewares/loginProtection.middleware");

const xss = require('xss');
const { sanitizeObject } = require('../middlewares/sanitize.middleware'); // Asegúrate de importar la función de sanitización
controller.register = async (req, res) => {
  try {
    // Parseamos y sanitizamos el cuerpo de la solicitud
    const sanitizedBody = sanitizeObject(await parseRequestBody(req));

    // Validamos los datos
    const errors = registerAccountValidator(sanitizedBody);
    if (errors.length > 0) {
      return sendJsonResponse(res, 400, { errors });
    }

    const {
      username,
      email,
      password, // Se asigna al campo virtual "password"
      year_nac,
      genere,
      movie_genere,
      avatar,
      role,
    } = sanitizedBody;

    // Verificamos si el usuario ya existe
    const user = await User.findOne({ email });
    if (user) {
      return sendJsonResponse(res, 409, { error: "Ya existe esta cuenta" });
    }

    // Creamos un nuevo usuario
    const newUser = new User({
      username,
      email,
      password,
      year_nac,
      genere,
      movie_genere,
      avatar,
      role, // Establecemos el rol proporcionado
    });

    await newUser.save();

    // Enviamos la respuesta de éxito
    sendJsonResponse(res, 201, { message: "Se ha creado correctamente tu usuario" });
  } catch (error) {
    // Manejo de errores
    sendJsonResponse(res, 500, { error: error.message });
  }
};


controller.login = async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Aplica un retraso si hay intentos fallidos previos
    await applyDelay(ip);

    // Parseamos y sanitizamos el cuerpo de la solicitud
    const sanitizedBody = sanitizeObject(await parseRequestBody(req));
    const { email, password } = sanitizedBody;

    // Buscar el usuario por correo
    const user = await User.findOne({ email });
    if (!user) {
      trackFailedLogin(ip); // Registrar intento fallido
      return sendJsonResponse(res, 404, { error: "El usuario no se ha encontrado" });
    }

    // Comparar la contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      trackFailedLogin(ip); // Registrar intento fallido
      return sendJsonResponse(res, 401, { error: "Contraseña incorrecta" });
    }

    // Restablecer intentos fallidos en caso de éxito
    resetFailedLogins(ip);

    // Generar el token de sesión
    const token = await createToken(user._id);

    // Manejar la lista de tokens para mantener solo las últimas 5 sesiones
    let _tokens = [...user.tokens];
    const _verifyPromise = _tokens.map(async (_t) => {
      const status = await verifyToken(_t);
      return status ? _t : null;
    });

    _tokens = (await Promise.all(_verifyPromise)).filter(Boolean).slice(0, 4);
    _tokens = [token, ..._tokens];
    user.tokens = _tokens;

    // Guardar los cambios del usuario
    await user.save();

    // Responder con éxito
    sendJsonResponse(res, 200, {
      message: "Inicio de sesión exitoso",
      token,
      role: user.role,
    });
  } catch (error) {
    sendJsonResponse(res, 500, { error: error.message });
  }
};



controller.logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const payload = await verifyToken(token);

    if (!payload) {
      return sendJsonResponse(res, 401, { error: "Token inválido o expirado" });
    }

    const userId = payload.sub;
    const user = await User.findById(userId);

    if (!user) {
      return sendJsonResponse(res, 404, { error: "Usuario no encontrado" });
    }

    // Eliminar el token de la lista de tokens del usuario
    user.tokens = user.tokens.filter(t => t !== token);
    await user.save();

    return sendJsonResponse(res, 200, {
      message: 'Se ha cerrado sesión correctamente'
    });
  } catch (error) {
    return sendJsonResponse(res, 500, { error: error.message });
  }
};

controller.checkEmailExists = async (req, res) => {
  try {
    // Parsear y sanitizar el cuerpo de la solicitud
    const { email } = await parseRequestBody(req);

    if (!email) {
      return sendJsonResponse(res, 400, { error: "El campo 'email' es requerido." });
    }

    // Verificar si existe un usuario con el email
    const user = await User.findOne({ email });

    if (user) {
      return sendJsonResponse(res, 200, { exists: true, message: "El correo ya está registrado." });
    } else {
      return sendJsonResponse(res, 200, { exists: false, message: "El correo no está registrado." });
    }
  } catch (error) {
    sendJsonResponse(res, 500, { error: error.message });
  }
};

controller.checkUsernameExists = async (req, res) => {
  try {
    // Parsear y sanitizar el cuerpo de la solicitud
    const { username } = await parseRequestBody(req);

    if (!username) {
      return sendJsonResponse(res, 400, { error: "El campo 'username' es requerido." });
    }

    // Verificar si existe un usuario con el nombre de usuario
    const user = await User.findOne({ username });

    if (user) {
      return sendJsonResponse(res, 200, { exists: true, message: "El nombre de usuario ya está registrado." });
    } else {
      return sendJsonResponse(res, 200, { exists: false, message: "El nombre de usuario no está registrado." });
    }
  } catch (error) {
    sendJsonResponse(res, 500, { error: error.message });
  }
};


module.exports = controller;

