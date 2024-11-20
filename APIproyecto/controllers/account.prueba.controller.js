const bcrypt = require("bcrypt"); //esto me ayuda a la seguridad de fuerza bruta
const controller = {};
const User = require("../models/account.model");
const { createToken, verifyToken } = require("../utils/jwl.tools");
const { sendJsonResponse, parseRequestBody } = require("../utils/http.helpers");
const { loginAccountValidator } = require("../validators/loginAccount.validator");

const failedLoginAttempts = {}; // Controlar intentos fallidos por IP
const LOGIN_ATTEMPT_LIMIT = 5; // Límite de intentos permitidos
const ATTEMPT_RESET_TIME = 15 * 60 * 1000; // Tiempo para resetear intentos (15 minutos)

controller.register = async (req, res) => {
  try {
    // Pasearemos el cuerpo de la solicitud para obtener los datos
    const body = await parseRequestBody(req);

    const {
      username,
      email,
      password,
      year_nac,
      genere,
      movie_genere,
      avatar,
      role,
    } = body;

    // Verificamos si el usuario ya existe
    const user = await User.findOne({ email });
    if (user) {
      return sendJsonResponse(res, 409, { error: "Ya existe esta cuenta" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creamos un nuevo usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword, // Guardamos la contraseña hasheada
      year_nac,
      genere,
      movie_genere,
      avatar,
      role, // Establecemos el rol proporcionado
    });

    await newUser.save();

    // Enviamos la respuesta de éxito
    sendJsonResponse(res, 201, {
      message: "Se ha creado correctamente tu usuario",
    });
  } catch (error) {
    // Manejo de errores
    sendJsonResponse(res, 500, { error: error.message });
  }
};



controller.login = async (req, res) => {
  try {
    const { email, password } = await parseRequestBody(req);

    // Validar los datos usando el validador
    const errors = loginAccountValidator({ email, password });
    if (errors.length > 0) {
      return sendJsonResponse(res, 400, { errors });
    }

    // Protección contra fuerza bruta
    const ip = req.ip || req.connection.remoteAddress;

    // Inicializar intentos fallidos para la IP si no existe
    if (!failedLoginAttempts[ip]) {
      failedLoginAttempts[ip] = { count: 0, lastAttempt: Date.now() };
    }

    const { count, lastAttempt } = failedLoginAttempts[ip];

    // Reiniciar intentos si ha pasado suficiente tiempo
    if (Date.now() - lastAttempt > ATTEMPT_RESET_TIME) {
      failedLoginAttempts[ip] = { count: 0, lastAttempt: Date.now() };
    } else if (count >= LOGIN_ATTEMPT_LIMIT) {
      return sendJsonResponse(res, 429, {
        error: 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.',
      });
    }

    // Buscar al usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      // Incrementar el contador de intentos fallidos y registrar el intento
      failedLoginAttempts[ip].count += 1;
      failedLoginAttempts[ip].lastAttempt = Date.now();
      return sendJsonResponse(res, 404, { error: 'El usuario no se ha encontrado' });
    }

    // Verificar la contraseña
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      // Incrementar el contador de intentos fallidos y registrar el intento
      failedLoginAttempts[ip].count += 1;
      failedLoginAttempts[ip].lastAttempt = Date.now();
      return sendJsonResponse(res, 401, { error: 'Contraseña incorrecta' });
    }

    // Generar el token de sesión
    const token = await createToken(user._id);

    // Manejar tokens de sesión para mantener las últimas 5 sesiones
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

    // Resetear el contador de intentos fallidos tras un login exitoso
    failedLoginAttempts[ip] = { count: 0, lastAttempt: Date.now() };

    // Enviar respuesta exitosa
    sendJsonResponse(res, 200, {
      message: 'Se ha iniciado sesión correctamente',
      token,
      role: user.role,
    });
  } catch (error) {
    // Manejo de errores
    sendJsonResponse(res, 500, { error: error.message });
  }
};


controller.logout = async (req, res, next) => {
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
    user.tokens = user.tokens.filter((t) => t !== token);

    await user.save();

    // Enviamos la respuesta de éxito
    sendJsonResponse(res, 200, {
      message: "Se ha cerrado sesión correctamente",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = controller;

