const { sendJsonResponse } = require('../utils/http.helpers');

// Middleware de validación personalizado
module.exports = (req, res, errors) => {
  if (errors && errors.length > 0) {
    return sendJsonResponse(res, 400, {
      errors: errors.map(error => ({
        field: error.field,
        message: error.message,
      })),
    });
  }
  return true; // Indica que la validación fue exitosa
};
