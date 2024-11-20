const User = require('../models/account.model');
const MoviesService = require('../services/movies.services');
const { sendJsonResponse } = require('../utils/http.helpers');

const controller = {};

controller.getUserData = async (req, res) => {
  try {
    // Obtenemos el ID del usuario autenticado
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return sendJsonResponse(res, 404, { error: 'Usuario no encontrado' });
    }

    // Si el usuario no ha visto películas aleatorias, cargamos las películas por género
    let moviesByGenre = {};
    if (!user.hasSeenRandomMovies) {
      const genres = user.movie_genere;
      for (const genre of genres) {
        const movies = await MoviesService.getMoviesCategoryAPI(genre, 20);
        moviesByGenre[genre] = movies;
      }
    }

    // Enviamos la respuesta con los datos del usuario y sus películas
    sendJsonResponse(res, 200, {
      user: {
        username: user.username,
        year_nac: user.year_nac,
        genere: user.genere,
        movie_genere: user.movie_genere,
        avatar: user.avatar,
      },
      movies: moviesByGenre
    });
  } catch (error) {
    // Enviamos la respuesta de error
    sendJsonResponse(res, 500, { error: error.message });
  }
};

module.exports = controller;