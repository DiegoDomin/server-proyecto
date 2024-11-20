const xss = require('xss');

// Middleware para sanitizar datos
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// Función recursiva para sanitizar objetos
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj); // Sanitiza strings para prevenir XSS
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject); // Itera sobre arrays y sanitiza cada elemento
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = sanitizeObject(obj[key]); // Sanitiza cada propiedad
      return acc;
    }, {});
  }
  return obj; // Devuelve el valor sin cambios si no requiere sanitización
};

// Función específica para sanitizar cadenas
const sanitizeString = (str) => xss(str.trim());

// Exportamos las funciones
module.exports = {
  sanitizeInput,  // Middleware para uso global
  sanitizeObject, // Utilidad para uso directo
  sanitizeString, // Opcional: Para casos puntuales
};
