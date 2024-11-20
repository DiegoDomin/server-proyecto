const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,32})/;

function registerAccountValidator(data) {
  const errors = [];

  if (!data.username || typeof data.username !== 'string' || data.username.length < 2 || data.username.length > 30) {
    errors.push({
      field: "username",
      message: "El nombre de usuario debe tener entre 2 y 30 caracteres.",
    });
  }

  if (!data.email || !/\S+@\S+\.\S+/.test(data.email) || data.email.length < 5 || data.email.length > 35) {
    errors.push({
      field: "email",
      message: "El correo electrónico debe ser válido y tener entre 5 y 35 caracteres.",
    });
  }

  if (!data.password || !passRegex.test(data.password)) {
    errors.push({
      field: "password",
      message: "La contraseña debe tener entre 8 y 32 caracteres, incluyendo mayúsculas, minúsculas y números.",
    });
  }

  if (!data.year_nac) {
    errors.push({ field: "year_nac", message: "El campo 'year_nac' es obligatorio." });
  }

  if (!data.genere || data.genere.length < 2 || data.genere.length > 15) {
    errors.push({
      field: "genere",
      message: "El género debe tener entre 2 y 15 caracteres.",
    });
  }

  if (!data.movie_genere || !Array.isArray(data.movie_genere) || data.movie_genere.length < 3) {
    errors.push({
      field: "movie_genere",
      message: "Debe seleccionar al menos 3 géneros de películas.",
    });
  }

  if (!data.avatar) {
    errors.push({ field: "avatar", message: "El campo 'avatar' es obligatorio." });
  }

  return errors;
}

module.exports = { registerAccountValidator };
