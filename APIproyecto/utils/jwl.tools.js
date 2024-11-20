const { SignJWT, jwtVerify } = require("jose");

// El secreto para firmar tokens, que se debería almacenar en variables de entorno
const secret = new TextEncoder().encode(
  process.env.TOKEN_SECRET || "Super Secret Value"
);
const expTime = process.env.TOKEN_EXP || "1d"; // Cambiar a "1d" para que dure un día
const tools = {};

// Función para crear un token de sesión
tools.createToken = async (id) => {
  return await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setExpirationTime(expTime)
    .setIssuedAt()
    .sign(secret);
};

// Función para verificar la validez de un token
tools.verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload; // Devuelve el payload si el token es válido
  } catch (error) {
    return false; // Devuelve false si el token no es válido
  }
};

module.exports = tools;
