
const controller = {};//encargado de contener la informacion
const Movie = require("../models/movieData.model");
const movieServices = require('../services/movies.services');
const User = require('../models/account.model');
const { parseRequestBody, sendJsonResponse } = require('../utils/http.helpers');
const { addMovieValidator } = require('../validators/addMovie.validator');
const { sanitizeObject } = require('../middlewares/sanitize.middleware'); // Asegúrate de tener esta función disponible
const httpError = require("http-errors");

const xss = require('xss'); // Asegúrate de tenerlo instalado

controller.movieData = async (req, res) => {
    try {
        const movieData = await parseRequestBody(req);

        // Sanitiza los datos antes de usarlos
        movieData.title = xss(movieData.title);
        movieData.synopsis = xss(movieData.synopsis);
        movieData.duration = xss(movieData.duration);

        // Valida los datos de entrada
        const errors = addMovieValidator(movieData);
        if (errors.length > 0) {
            return sendJsonResponse(res, 400, { errors });
        }

        const newMovie = new Movie({
            title: movieData.title,
            synopsis: movieData.synopsis,
            duration: movieData.duration,
            actors: movieData.actors,
            coverPhoto: movieData.coverPhoto,
            categories: movieData.categories,
        });

        const movieSave = await newMovie.save();

        if (!movieSave) {
            return sendJsonResponse(res, 500, { error: "No se ha podido guardar la película" });
        }

        sendJsonResponse(res, 200, { message: "Se ha creado la película" });
    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};


controller.searchActorsByName = async (req, res) => {
  try {
    // Obtener el nombre del actor desde los parámetros de la URL
    const actorName = req.params.actorName;

    // Llamar al servicio para buscar actores por nombre
    const actors = await movieServices.searchActorsByNameAPI(actorName);

    if (!actors || actors.length === 0) {
      return sendJsonResponse(res, 404, { error: "No se encontraron actores con el nombre especificado." });
    }

    // Enviar los actores encontrados como respuesta
    sendJsonResponse(res, 200, { actors });
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};

controller.editMovie = async (req, res) => {
  try {
    // Obtenemos el ID de la película desde `req.params`
    const movieId = req.params.id;

    // Parseamos el cuerpo de la solicitud
    const movieData = await parseRequestBody(req);

    if (!movieData || typeof movieData !== 'object') {
      return sendJsonResponse(res, 400, { error: 'Cuerpo de la solicitud inválido o ausente' });
    }

    // Inicializamos `updatedData` y agregamos solo los campos presentes
    const updatedData = {};

    if (movieData.title) {
      updatedData.title = xss(movieData.title);
    }

    if (movieData.synopsis) {
      updatedData.synopsis = xss(movieData.synopsis);
    }

    if (movieData.coverPhoto) {
      updatedData.coverPhoto = xss(movieData.coverPhoto);
    }

    // Validamos que al menos un campo actualizable esté presente
    if (Object.keys(updatedData).length === 0) {
      return sendJsonResponse(res, 400, { error: 'No hay campos válidos para actualizar' });
    }

    // Verificamos si la película existe en la base de datos
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendJsonResponse(res, 404, { error: 'Película no encontrada' });
    }

    // Actualizamos la película
    Object.assign(movie, updatedData);
    await movie.save();

    // Enviamos una respuesta de confirmación
    sendJsonResponse(res, 200, { message: 'Película actualizada exitosamente' });
  } catch (error) {
    // Enviamos una respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};



// Eliminar una película por su ID
controller.deleteMovie = async (req, res) => {
  try {
    // Obtenemos el ID de la película desde `req.params`
    const movieId = req.params.id;

    // Verificamos si la película existe en la base de datos
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendJsonResponse(res, 404, { error: 'Película no encontrada' });
    }

    // Eliminamos la película
    await Movie.findByIdAndDelete(movieId);

    // Enviamos una respuesta de éxito
    sendJsonResponse(res, 200, { message: 'Película eliminada exitosamente' });
  } catch (error) {
    // Enviamos una respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};


controller.getRatedMovies = async (req, res) => {
  try {
    const userId = req.user._id; // Asegurarse de que el middleware de autenticación asigna correctamente el usuario en req.user
    const ratedMovies = await movieServices.getRatedMoviesAPI(userId);

    // Responder con las películas calificadas
    sendJsonResponse(res, 200, { ratedMovies });
  } catch (error) {
    console.error("Error en controller.getRatedMovies:", error.message, error.stack);

    // Enviar una respuesta de error
    sendJsonResponse(res, 500, { error: "Error al obtener las películas calificadas. Por favor, inténtelo de nuevo." });
  }
};
// Obtener todas las películas desde un servicio externo
controller.findAll = async (req, res) => {
  try {
    // Obtenemos todas las películas a través del servicio
    const movies = await movieServices.getMoviesAPI();

    // Verificamos si se han encontrado películas
    if (!movies || movies.length === 0) {
      return sendJsonResponse(res, 500, { error: "No se han encontrado películas" });
    }

    // Enviamos la respuesta con las películas encontradas
    sendJsonResponse(res, 200, { data: movies });
  } catch (error) {
    // Enviamos la respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};



controller.getMovieByAdminId = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID de la película

    // Buscar la película por su campo id (auto-incremental)
    const movie = await Movie.findOne({ id: parseInt(id, 10) });

    // Verificar si la película existe
    if (!movie) {
      return sendJsonResponse(res, 404, { error: 'Película no encontrada' });
    }

    // Respuesta exitosa con los datos de la película
    sendJsonResponse(res, 200, movie);
  } catch (error) {
    // Manejar errores de forma directa
    sendJsonResponse(res, 500, { error: error.message });
  }
};

controller.getAllMovies = async (req, res) => {
  try {
    // Obtener todas las películas
    const movies = await Movie.find();

    // Enviar respuesta exitosa con las películas encontradas
    sendJsonResponse(res, 200, { data: movies });
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};






// Obtener las películas más vistas por usuario
controller.getMostViewedMovies = async (req, res) => {
  try {
    // Obtener el usuario autenticado desde req.user (supone que un middleware de autenticación lo configuró)
    const userId = req.user._id;

    // Buscar al usuario en la base de datos
    const user = await User.findById(userId);
    if (!user) {
      return sendJsonResponse(res, 404, { error: 'Usuario no encontrado' });
    }

    const limit = 2; // Puedes ajustar este valor según tus necesidades
    const mostViewedMovies = await movieServices.getMostViewedMoviesAPI(limit);

    // Enviar respuesta con las películas más vistas
    sendJsonResponse(res, 200, { moviesMostViews: mostViewedMovies });
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};


// Obtener las películas más recientes
controller.getMostRecentMovies = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    const limit = 2;
    const mostRecentMovies = await movieServices.getMostRecentMoviesAPI(limit);
    sendJsonResponse(res, 200, { moviesRecent: mostRecentMovies });
  } catch (error) {
    sendJsonResponse(res, 500, { error: error.message });
  }
};






// Buscar película por título

controller.searchMovieByTitle = async (req, res) => {
  try {
    // Obtener el ID del usuario autenticado desde req.user
    const userId = req.user._id;

    // Buscar al usuario en la base de datos
    const user = await User.findById(userId);
    if (!user) {
      return sendJsonResponse(res, 404, { error: 'Usuario no encontrado' });
    }

    // Extraer el título desde los parámetros de la URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const title = req.params.title;
    const sortBy = url.searchParams.get("sortBy");
    const genre = url.searchParams.get("genre");

    // Buscar películas por título y filtros adicionales
    const movies = await movieServices.searchMovieByTitleAPI(title, userId, sortBy, genre);

    if (!movies || movies.length === 0) {
      return sendJsonResponse(res, 404, { error: "No se encontraron películas con el título especificado." });
    }

    // Enviar las películas encontradas como respuesta
    sendJsonResponse(res, 200, { moviesA: movies });
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};








// Obtener película por ID con detalles
controller.getMovieById = async (req, res) => {
  try {
    // Obtener el ID de la película desde los parámetros de la URL y el ID del usuario autenticado
    const movieId = req.params.id;
    const userId = req.user._id;

    // Buscar al usuario en la base de datos
    const user = await User.findById(userId);
    if (!user) {
      return sendJsonResponse(res, 404, { error: 'Usuario no encontrado' });
    }

    // Obtener los detalles de la película por ID
    const movieDetails = await movieServices.fetchMovieByIdAPI(movieId);
    if (!movieDetails || movieDetails.length === 0) {
      return sendJsonResponse(res, 404, { error: "No se encontraron películas." });
    }

    // Enviar los detalles de la película en la respuesta
    sendJsonResponse(res, 200, movieDetails);
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};







  //Eliminar pelicula
  controller.deleteById = async (req, res) => {
    try {
      // Obtener el identificador de la película desde los parámetros de la URL
      const identifier = req.params.identifier;
  
      // Intentar eliminar la película por su ID
      const movieDeleteById = await Movie.findByIdAndDelete(identifier);
  
      if (!movieDeleteById) {
        return sendJsonResponse(res, 500, { error: "No se ha podido eliminar la película" });
      }
  
      // Enviar respuesta de éxito
      sendJsonResponse(res, 200, { message: "Se ha eliminado correctamente la película" });
    } catch (error) {
      // Enviar respuesta de error
      sendJsonResponse(res, 500, { error: error.message });
    }
  };


// Obtener promedio de calificación de una película
controller.getMovieAverageRating = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Encuentra todos los usuarios que han calificado esta película
    const users = await User.find({ 'ratings.movieId': movieId });

    // Recoge la calificación más reciente de cada usuario para esta película
    const latestRatings = users.flatMap(user => {
      const ratingsForMovie = user.ratings.filter(r => r.movieId === movieId);
      if (ratingsForMovie.length > 0) {
        const latestRating = ratingsForMovie[ratingsForMovie.length - 1].rating;
        return [latestRating];
      }
      return [];
    });

    // Verificar si hay calificaciones
    if (latestRatings.length === 0) {
      return sendJsonResponse(res, 404, { message: 'No hay calificaciones para esta película' });
    }

    // Calcula el promedio de las calificaciones
    const averageRating = latestRatings.reduce((sum, rating) => sum + rating, 0) / latestRatings.length;

    // Devuelve solo el promedio de calificación
    return sendJsonResponse(res, 200, { averageRating });
  } catch (error) {
    console.error("Error en getMovieAverageRating:", error.message);
    sendJsonResponse(res, 500, { error: "Error al obtener el promedio de calificación de la película" });
  }
};






// Obtener películas calificadas POR USUARIO
controller.rateMovie = async (req, res) => {
  try {
    // Obtener datos del cuerpo de la solicitud
    const { movieId, rating } = await parseRequestBody(req);
    const userId = req.user._id; // Se asume que `req.user` se ha agregado previamente por autenticación

    // Buscar al usuario en la base de datos
    const user = await User.findById(userId);
    if (!user) {
      return sendJsonResponse(res, 404, { error: 'Usuario no encontrado' });
    }

    // Verificar si el usuario ya ha calificado esta película
    const existingRating = user.ratings.find(r => r.movieId === movieId);

    // Actualizar o agregar la calificación
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      user.ratings.push({ movieId, rating });
    }

    // Guardar los cambios en el usuario
    await user.save();

    // Responder con un mensaje de éxito
    sendJsonResponse(res, 200, { message: 'Calificación guardada correctamente' });
  } catch (error) {
    console.error("Error en rateMovie:", error.message);
    sendJsonResponse(res, 500, { error: 'Error al guardar la calificación' });
  }
};



controller.getTopRatedMoviesOverall = async (req, res) => {
  try {
    // Obtener todas las calificaciones de todos los usuarios
    const users = await User.find();
    const movieRatings = {};

    // Recopilar calificaciones por película
    users.forEach(user => {
      user.ratings.forEach(rating => {
        if (!movieRatings[rating.movieId]) {
          movieRatings[rating.movieId] = [];
        }
        movieRatings[rating.movieId].push(rating.rating);
      });
    });

    // Calcular el promedio de calificaciones para cada película
    const averageRatings = Object.keys(movieRatings).map(movieId => {
      const ratings = movieRatings[movieId];
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      return { movieId, averageRating };
    });

    // Ordenar las películas por calificación promedio de mayor a menor
    averageRatings.sort((a, b) => b.averageRating - a.averageRating);

    // Limitar a las top N películas
    const topN = 10;
    const topRatedMovieIds = averageRatings.slice(0, topN).map(item => item.movieId);

    // Obtener detalles de las películas mejor calificadas
    const moviesWithDetails = await Promise.all(
      topRatedMovieIds.map(async (movieId) => {
        const movieDetails = await movieServices.fetchMovieByIdAPI(movieId);
        const averageRating = averageRatings.find(rating => rating.movieId === movieId).averageRating;
        return {
          id: movieDetails.id,
          poster: movieDetails.poster,
          title: movieDetails.title,
          duracion: movieDetails.duracion,
          fecha_lanzamiento: movieDetails.fecha_lanzamiento,
          genero: movieDetails.genero,
          descripcion: movieDetails.descripcion,
          trailer: movieDetails.trailer,
          averageRating
        };
      })
    );

    // Enviar las películas mejor calificadas
    sendJsonResponse(res, 200, { topRatedMovies: moviesWithDetails });
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};






 // Agregar una película a la lista de deseos del usuario
 controller.addToWishlist = async (req, res) => {
  try {
    // Obtener el userId del token de autenticación y movieId del cuerpo de la solicitud
    const userId = req.user.id;
    const { movieId } = await parseRequestBody(req);

    // Agregar la película a la lista de deseos
    const result = await movieServices.addToWishlistAPI(userId, movieId);

    // Enviar la respuesta de éxito
    sendJsonResponse(res, 200, result);
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { message: error.message });
  }
};
 



  //obtener Wathclist

  controller.getWishlist = async (req, res) => {
    try {
      // Obtener el userId del token de autenticación
      const userId = req.user.id;
  
      // Obtener la lista de deseos del usuario
      const wishlist = await movieServices.getWishlistAPI(userId);
  
      // Enviar la respuesta con la lista de deseos
      sendJsonResponse(res, 200, { wishlist });
    } catch (error) {
      // Enviar respuesta de error
      sendJsonResponse(res, 500, { message: error.message });
    }
  };
  

// Buscar actores por nombre
controller.searchMovieByTitle = async (req, res) => {
  try {
    // Obtener el ID del usuario autenticado desde req.user
    const userId = req.user._id;

    // Buscar al usuario en la base de datos
    const user = await User.findById(userId);
    if (!user) {
      return sendJsonResponse(res, 404, { error: 'Usuario no encontrado' });
    }

    // Extraer y sanitizar el título y los parámetros desde la URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sanitizedParams = sanitizeObject({
      title: req.params.title,
      sortBy: url.searchParams.get("sortBy"),
      genre: url.searchParams.get("genre"),
    });

    const title = xss(sanitizedParams.title); // Sanitiza específicamente el título
    const sortBy = xss(sanitizedParams.sortBy); // Sanitiza el parámetro de orden
    const genre = xss(sanitizedParams.genre); // Sanitiza el género

    // Buscar películas por título y filtros adicionales
    const movies = await movieServices.searchMovieByTitleAPI(title, userId, sortBy, genre);

    if (!movies || movies.length === 0) {
      return sendJsonResponse(res, 404, { error: "No se encontraron películas con el título especificado." });
    }

    // Enviar las películas encontradas como respuesta
    sendJsonResponse(res, 200, { moviesA: movies });
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};

// Obtener calificación del usuario para una película específica
controller.getUserRatingsForMovie = async (req, res) => {
  try {
    // Obtener el ID de la película desde los parámetros de la URL y el ID del usuario autenticado
    const movieId = req.params.movieId;
    const userId = req.user._id;

    // Obtener la calificación del usuario para la película especificada
    const userRating = await movieServices.getUserRatingsForMovieAPI(userId, movieId);

    if (userRating) {
      // Enviar la calificación del usuario como respuesta
      sendJsonResponse(res, 200, { userRating });
    } else {
      // Enviar un error 404 si no se encuentra la calificación
      sendJsonResponse(res, 404, { message: "No rating found for the specified movie." });
    }
  } catch (error) {
    // Enviar respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};

controller.getAverageRatingForMovie = async (req, res) => {
  try {
    const { movieId } = req.params; // Capturamos el ID de la película desde los parámetros de la URL

    // Usamos el servicio para obtener el promedio de calificaciones
    const averageRating = await movieServices.getMovieAverageRatingAPI(movieId);

    // Si no hay calificaciones, enviamos un mensaje de respuesta
    if (averageRating === null) {
      return sendJsonResponse(res, 404, { message: 'No hay calificaciones para esta película' });
    }

    // Enviamos solo el promedio de calificación en la respuesta
    return sendJsonResponse(res, 200, { averageRating });
  } catch (error) {
    console.error("Error en getAverageRatingForMovie:", error.message);
    sendJsonResponse(res, 500, { error: "Error al obtener el promedio de calificación de la película" });
  }
};


module.exports = controller;