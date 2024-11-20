
function loginAccountValidator(data) {
  const errors = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push({ field: "email", message: "Debes de completar el campo" });
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push({ field: "password", message: "Debes de completar el campo" });
  }

  return errors;
}

module.exports = { loginAccountValidator };
