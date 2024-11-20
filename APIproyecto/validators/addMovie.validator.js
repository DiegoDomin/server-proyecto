function addMovieValidator(data) {
    const errors = [];
  
    if (!data.title || typeof data.title !== 'string' || data.title.length < 1 || data.title.length > 100) {
        errors.push({ field: "title", message: "El título debe tener entre 1 y 100 caracteres." });
    }
  
    if (data.synopsis && (typeof data.synopsis !== 'string' || data.synopsis.length > 500)) {
        errors.push({ field: "synopsis", message: "La sinopsis no puede superar los 500 caracteres." });
    }
  
    if (
        !data.duration ||
        typeof data.duration !== "string" ||
        !/^\d+h \d+min$/.test(data.duration)
      ) {
        errors.push({
          field: "duration",
          message: "La duración debe estar en el formato 'Xh Ymin', por ejemplo, '2h 30min'.",
        });
      }
      
  

  
    if (!Array.isArray(data.categories) || data.categories.length < 1) {
      errors.push({ field: "categories", message: "Debe seleccionar al menos una categoría." });
    }
  
    return errors;
  }
  
  module.exports = { addMovieValidator };
  