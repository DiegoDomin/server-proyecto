
const axios = require("axios");

const { BASE_URL, API_KEY } = require('./sA/apiConfig');


const User = require('../models/account.model');

const genreMap = {
    "accion": 28,
    "aventura": 12,
    "animacion": 16,
    "comedia": 35,
    "crimen": 80,
    "documental": 99,
    "drama": 18,
    "familia": 10751,
    "fantasia": 14,
    "historia": 36,
    "terror": 27,
    "musica": 10402,
    "misterio": 9648,
    "romance": 10749,
    "suspenso": 53,
    "belica": 10752,
    "western": 37
    // Agrega más géneros según necesites
  };

const getMovies=async()=>{

    try {
        const response = await axios.get(`${BASE_URL}discover/movie?api_key=${API_KEY}&language=es-MX`);
        return response.data;

    } catch (error) {
     
        throw new Error("Error occurred while creating the form. Please try again.");
    }
}


const hideMovie = async (movieId) => {
  try {
    const movie = await Movie.findOne({ id: movieId });
    if (!movie) {
      throw new Error('Película no encontrada');
    }

    movie.isHidden = true;
    await movie.save();

    return { message: 'Película ocultada exitosamente' };
  } catch (error) {
    throw new Error(error.message);
  }
};



//buscar PELICULAS
// Buscar películas
const normalizeString = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const searchMovieByTitle = async (title, userId, sortBy = 'relevancia', genre = null) => {
  const normalizedTitle = normalizeString(title);

  try {
    // 1. Realizar la búsqueda inicial en TMDB
    const response = await axios.get(`${BASE_URL_API}search/movie`, {
      params: {
        api_key: API_KEY,
        language: 'es-MX',
        query: normalizedTitle
      }
    });

    let movies = response.data.results;

    // 2. Filtrar por género si se proporciona
    if (genre) {
      const genreId = genreMap[genre.toLowerCase()];
      if (genreId) {
        movies = movies.filter(movie => movie.genre_ids.includes(genreId));
      } else {
        throw new Error("Género no encontrado.");
      }
    }

    // 3. Ordenar por el criterio especificado
    if (sortBy === 'release_date.desc') {
      movies.sort((a, b) => new Date(b.release_date || '1970-01-01') - new Date(a.release_date || '1970-01-01'));
    } else if (sortBy === 'release_date.asc') {
      movies.sort((a, b) => new Date(a.release_date || '1970-01-01') - new Date(b.release_date || '1970-01-01'));
    }

    // 4. Obtener detalles de películas en paralelo
    const movieIds = movies.map(movie => movie.id);
    const detailedMoviesPromises = movieIds.map(movieId => 
      axios.get(`${BASE_URL_API}movie/${movieId}`, {
        params: {
          api_key: API_KEY,
          language: 'es-MX',
          append_to_response: 'videos'
        }
      })
    );
    const detailedMoviesResponses = await Promise.all(detailedMoviesPromises);
    const detailedMovies = detailedMoviesResponses.map(res => res.data);

    // 5. Obtener todas las calificaciones de los usuarios para las películas en una sola consulta
    const usersWithRatings = await User.find({ 'ratings.movieId': { $in: movieIds.map(String) } }, 'ratings');

    // 6. Crear un mapa de calificaciones promedio por película
    const ratingsMap = {};
    movieIds.forEach(movieId => {
      const ratingsForMovie = usersWithRatings.flatMap(user => {
        const ratings = user.ratings.filter(r => r.movieId === String(movieId));
        return ratings.map(r => r.rating);
      });
      const averageRating = ratingsForMovie.length > 0 ? 
        ratingsForMovie.reduce((sum, rating) => sum + rating, 0) / ratingsForMovie.length : null;
      ratingsMap[movieId] = averageRating;
    });

    // 7. Construir el resultado final
    const moviesWithGenresAndRatings = detailedMovies.map(detailedMovie => {
      // Obtener los nombres de los géneros
      const genres = detailedMovie.genres.map(genre => genre.name);

      // Mapear el nombre de género al ID usando genreMap
      const genreIds = detailedMovie.genres.map(genre => genreMap[genre.name.toLowerCase()]).filter(id => id !== undefined);

      return {
        id: detailedMovie.id,
        poster: detailedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${detailedMovie.poster_path}` : null,
        title: detailedMovie.title,
        duracion: detailedMovie.runtime,
        fecha_lanzamiento: detailedMovie.release_date || 'sin fecha',
        genero: genres.join(", "),
        descripcion: detailedMovie.overview,
        trailer: detailedMovie.videos.results.length > 0 ? `https://www.youtube.com/watch?v=${detailedMovie.videos.results[0].key}` : null,
        genreIds: genreIds,
        averageRating: ratingsMap[detailedMovie.id] // Usar el promedio de calificaciones calculado
      };
    });

    // 8. Guardar la búsqueda reciente del usuario
    await User.findByIdAndUpdate(userId, {
      $push: {
        recentSearches: {
          $each: [{ query: normalizedTitle }],
          $position: 0,
          $slice: 5
        }
      }
    });

    return moviesWithGenresAndRatings;
  } catch (error) {
    console.error(error);
    throw new Error("Ocurrió un error al buscar la película. Por favor, inténtalo de nuevo.");
  }
};




const getGenreId = (genreName) => {
  const genreId = genreMap[genreName.toLowerCase()];
  if (!genreId) {
    throw new Error("Género no encontrado.");
  }
  return genreId;
};


const getMoviesCategory = async (categoryName, limit = 10) => {
  try {
    const categoryId = getGenreId(categoryName);

    // Realizar una solicitud a la API sin campos adicionales innecesarios
    const response = await axios.get(`${BASE_URL_API}discover/movie`, {
      params: {
        api_key: API_KEY,
        language: 'es-MX',
        with_genres: categoryId,
        page: 1,
        include_adult: false,
        sort_by: 'popularity.desc',
        'vote_count.gte': 1000,
        'vote_average.gte': 5,
        with_watch_monetization_types: 'flatrate',
        // No necesitamos 'append_to_response' ya que no utilizaremos 'credits' ni 'videos'
      },
    });

    const movies = response.data.results.slice(0, limit);

    // Mapear y procesar los datos recibidos
    const moviesWithDetails = movies.map((movie) => {
      return {
        id: movie.id,
        poster: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        // 'duracion' no está disponible en la respuesta de 'discover/movie'
        // Si es necesario, se requeriría una solicitud adicional por película para obtener 'runtime'
      };
    });

    // Reordenar aleatoriamente las películas si es necesario
    return moviesWithDetails.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error(error);
    throw new Error(`No se ha podido encontrar películas en la categoría: ${categoryName}`);
  }
};



//mas bisots/recientess
const getMoviesBySortType = async (sortType, limit = 10) => {
  try {
    // Realizar una única solicitud para obtener películas ordenadas
    const response = await axios.get(`${BASE_URL_API}discover/movie`, {
      params: {
        api_key: API_KEY,
        language: 'es-MX',
        sort_by: sortType,
        page: 1,
        include_adult: false,
        'vote_count.gte': 500,
        'vote_average.gte': 3,
        with_watch_monetization_types: 'flatrate',
      },
    });

    const movies = response.data.results.slice(0, limit);

    // Obtener detalles de las películas en paralelo, limitando el número de solicitudes simultáneas
    const MAX_CONCURRENT_REQUESTS = 5;
    const movieDetails = [];

    for (let i = 0; i < movies.length; i += MAX_CONCURRENT_REQUESTS) {
      const movieBatch = movies.slice(i, i + MAX_CONCURRENT_REQUESTS);
      const detailsPromises = movieBatch.map((movie) =>
        axios.get(`${BASE_URL_API}movie/${movie.id}`, {
          params: {
            api_key: API_KEY,
            language: 'es-MX',
            append_to_response: 'videos,credits',
          },
        })
      );
      const detailsResponses = await Promise.all(detailsPromises);
      movieDetails.push(...detailsResponses.map((res) => res.data));
    }

    // Mapear y procesar los datos recibidos
    const moviesWithDetails = movieDetails.map((detailedMovie) => {
      // Obtener nombres y fotos de los actores (limitar a los primeros 5)
      const actors = detailedMovie.credits.cast.slice(0, 5).map((actor) => ({
        name: actor.name,
        profilePhoto: actor.profile_path
          ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
          : null,
      }));

      return {
        id: detailedMovie.id,
        poster: detailedMovie.poster_path
          ? `https://image.tmdb.org/t/p/w500${detailedMovie.poster_path}`
          : null,
        title: detailedMovie.title,
        duracion: detailedMovie.runtime,
        fecha_lanzamiento: detailedMovie.release_date,
        genero: detailedMovie.genres.map((genre) => genre.name).join(', '),
        descripcion: detailedMovie.overview,
        trailer:
          detailedMovie.videos.results.length > 0
            ? `https://www.youtube.com/watch?v=${detailedMovie.videos.results[0].key}`
            : null,
        actors: actors,
      };
    });

    return moviesWithDetails;
  } catch (error) {
    console.error('Error in getMoviesBySortType:', error);
    throw new Error('No se ha podido encontrar las películas.');
  }
};




//mas vistos
  const getMostViewedMovies = async (limit = 10) => {
    return getMoviesBySortType('popularity.desc', limit);
  };
  
  //mas recietnes
  const getMostRecentMovies = async (limit = 10) => {
    return getMoviesBySortType('release_date.desc', limit);
  };
  



  const fetchMovieById = async (id, userId) => {
    try {
      // Ejecutar solicitudes en paralelo
      const [movieResponse, user] = await Promise.all([
        axios.get(`${BASE_URL_API}movie/${id}`, {
          params: {
            api_key: API_KEY,
            language: 'es-MX',
            append_to_response: 'videos,credits',
          },
        }),
        User.findById(userId, 'ratings'),
      ]);
  
      const movie = movieResponse.data;
  
      // Mapear actores (limitar a los primeros 5)
      const actors = movie.credits.cast.slice(0, 10).map((actor) => ({
        name: actor.name,
        profileUrl: actor.profile_path
          ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
          : null,
      }));
  
      // Buscar la calificación del usuario para esta película
      let userRating = 0;
  
      if (user && user.ratings && user.ratings.length > 0) {
        const userRatingObj = user.ratings.find((rating) => rating.movieId === id.toString());
        if (userRatingObj) {
          userRating = userRatingObj.rating;
        }
      }
  
      return {
        id: movie.id,
        poster: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        title: movie.title,
        duracion: movie.runtime,
        fecha_lanzamiento: movie.release_date,
        genero: movie.genres.map((genre) => genre.name).join(', '),
        descripcion: movie.overview,
        trailer:
          movie.videos.results.length > 0
            ? `https://www.youtube.com/watch?v=${movie.videos.results[0].key}`
            : null,
        actors: actors,
        userRating: userRating, // Incluir la calificación del usuario
      };
    } catch (error) {
      console.error('Error in fetchMovieById:', error);
      throw new Error('Error occurred while fetching movie details. Please try again.');
    }
  };
  
  



//obtener peliculas ya calificadas(usuario)
// Caché en memoria para almacenar detalles de películas
const movieDetailsCache = new Map();

const getMovieDetailsFromAPI = async (movieId) => {
  if (movieDetailsCache.has(movieId)) {
    return movieDetailsCache.get(movieId);
  }

  try {
    const response = await axios.get(`${BASE_URL_API}movie/${movieId}`, {
      params: {
        api_key: API_KEY,
        language: 'es-MX',
      },
    });
    const data = response.data;
    movieDetailsCache.set(movieId, data); // Almacenar en caché
    return data;
  } catch (error) {
    console.error(`Error fetching movie details for movieId ${movieId}:`, error);
    return null;
  }
};

//obtener peliculas ya calificadas(usuario)

const getRatedMovies = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.ratings || user.ratings.length === 0) {
      return [];
    }

    // Crear un objeto para almacenar las películas calificadas por el usuario
    const ratedMovies = {};

    // Iterar sobre las calificaciones del usuario
    for (const rating of user.ratings) {
      if (!ratedMovies[rating.movieId]) {
        const movieDetails = await getMovieDetailsFromAPI(rating.movieId);
        if (movieDetails) {
          ratedMovies[rating.movieId] = {
            movieId: rating.movieId,
            title: movieDetails.title,
            poster: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : null,
            releaseDate: movieDetails.release_date,
            genres: movieDetails.genres.map(genre => genre.name).join(', '),
            ratings: [] // Aquí almacenaremos las calificaciones más recientes de todos los usuarios
          };
        }
      }

      // Obtener la calificación más reciente del usuario para esta película
      if (ratedMovies[rating.movieId]) {
        const latestRating = ratedMovies[rating.movieId].ratings.length > 0 ? ratedMovies[rating.movieId].ratings[0] : null;
        if (!latestRating || rating.timestamp > latestRating.timestamp) {
          ratedMovies[rating.movieId].ratings = [{
            rating: rating.rating,
            timestamp: rating.timestamp
          }];
        }
      }
    }

    // Convertir el objeto a un array y calcular el promedio de calificaciones para cada película
    const ratedMoviesArray = Object.values(ratedMovies);

    for (const movie of ratedMoviesArray) {
      // Buscar todas las calificaciones más recientes de otros usuarios para la misma película
      const users = await User.find({ 'ratings.movieId': movie.movieId });
      const latestRatings = users.flatMap(user => {
        const ratingsForMovie = user.ratings.filter(r => r.movieId === movie.movieId);
        if (ratingsForMovie.length > 0) {
          const latestRating = ratingsForMovie[ratingsForMovie.length - 1].rating;
          return [latestRating];
        }
        return [];
      });

      // Calcular el promedio de las calificaciones más recientes
      const averageRating = latestRatings.length > 0 ? latestRatings.reduce((sum, rating) => sum + rating, 0) / latestRatings.length : null;
      movie.averageRating = averageRating;
    }


    return ratedMoviesArray;
  } catch (error) {
    console.error("Error in getRatedMovies:", error);
    throw new Error("Error occurred while fetching rated movies. Please try again.");
  }
};




  //proxiomo a estrenar
  const getUpcomingMovies = async (limit = 10) => {
    try {
      const response = await axios.get(`${BASE_URL_API}movie/upcoming`, {
        params: {
          api_key: API_KEY,
          language: 'es-MX',
          region: 'MX',
          page: 1,
        },
      });
  
      const upcomingMovies = response.data.results.slice(0, limit);
  
      // Obtener detalles adicionales en paralelo con control de concurrencia
      const MAX_CONCURRENT_REQUESTS = 5;
      const moviesWithDetails = [];
  
      for (let i = 0; i < upcomingMovies.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = upcomingMovies.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const batchPromises = batch.map(async (movie) => {
          const detailedMovieResponse = await axios.get(`${BASE_URL_API}movie/${movie.id}`, {
            params: {
              api_key: API_KEY,
              language: 'es-MX',
              append_to_response: 'videos',
            },
          });
          const detailedMovie = detailedMovieResponse.data;
  
          return {
            id: detailedMovie.id,
            poster: detailedMovie.poster_path
              ? `https://image.tmdb.org/t/p/w500${detailedMovie.poster_path}`
              : null,
            title: detailedMovie.title,
            duracion: detailedMovie.runtime,
            fecha_lanzamiento: detailedMovie.release_date || 'sin fecha',
            genero: detailedMovie.genres.map((genre) => genre.name).join(', '),
            descripcion: detailedMovie.overview,
            trailer:
              detailedMovie.videos.results.length > 0
                ? `https://www.youtube.com/watch?v=${detailedMovie.videos.results[0].key}`
                : null,
          };
        });
  
        const batchResults = await Promise.all(batchPromises);
        moviesWithDetails.push(...batchResults);
      }
  
      return moviesWithDetails;
    } catch (error) {
      console.error('Error en getUpcomingMovies:', error.message);
      throw new Error('Ocurrió un error al buscar los próximos estrenos. Por favor, inténtalo de nuevo.');
    }
  };
  


  const addToWishlist = async (userId, movieId) => {
    try {
      const movieDetails = await fetchMovieById(movieId);
      const user = await User.findById(userId);
  
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
  
      const alreadyInWishlist = user.wishlist.some(item => item.movieId === movieDetails.id);
  
      if (alreadyInWishlist) {
        throw new Error('La película ya está en la lista de deseos');
      }
  
      user.wishlist.push({
        movieId: movieDetails.id,
        title: movieDetails.title,
        poster: movieDetails.poster,
        releaseDate: movieDetails.fecha_lanzamiento, // Usar fecha de lanzamiento del objeto movieDetails
        genre: movieDetails.genero //
        
      });
  
      await user.save();
  
      return { message: 'Película añadida a la lista de deseos' };
    } catch (error) {
      throw new Error(error.message);
    }
  };
  


  //obtener watclist
  const getWishlist = async (userId) => {
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
  
      return user.wishlist;
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
  
  const searchActorsByName = async (actorName) => {
    try {
      const response = await axios.get(
        `${BASE_URL_API}search/person?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(actorName)}`
      );
  
      const actors = response.data.results.map(actor => ({
        name: actor.name,
        profileUrl: actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null
      }));
  
      return actors;
    } catch (error) {
      console.error("Error al buscar actores:", error.message);
      throw new Error("Ocurrió un error al buscar actores. Por favor, inténtalo de nuevo.");
    }
  };
  


  const getUserRatingsForMovie = async (userId, movieId) => {
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
  
      // Asegurémonos de que movieId es una cadena
      movieId = movieId.toString();
      
      
      const ratingsForMovie = user.ratings
        .filter(rating => rating.movieId.toString() === movieId);
  
  
      if (ratingsForMovie.length > 0) {
        const sortedRatings = ratingsForMovie.sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
  
        const userRatingObj = sortedRatings[0]; // Obtener la calificación más reciente
  
        return {
          userId: user._id,
          rating: userRatingObj.rating
        };
      } else {
        return null; // Si no hay calificaciones para la película
      }
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Error al obtener las calificaciones del usuario para la película');
    }
  };
  
  const getMovieAverageRating = async (movieId) => {
    try {
      // Encuentra todos los usuarios que han calificado esta película
      const users = await User.find({ 'ratings.movieId': movieId });
  
      // Recoge la calificación más reciente de cada usuario para esta película
      const latestRatings = users.flatMap(user => {
        const ratingsForMovie = user.ratings.filter(r => r.movieId === movieId);
        if (ratingsForMovie.length > 0) {
          // Obtener la calificación más reciente
          const latestRating = ratingsForMovie[ratingsForMovie.length - 1].rating;
          return [latestRating];
        }
        return [];
      });
  
      // Verificar si hay calificaciones
      if (latestRatings.length === 0) {
        return null; // No hay calificaciones para esta película
      }
  
      // Calcula el promedio de las calificaciones
      const averageRating = latestRatings.reduce((sum, rating) => sum + rating, 0) / latestRatings.length;

      return averageRating;
    } catch (error) {
      throw new Error("Error occurred while calculating the average rating.");
    }
  };

// se exportan como se deven son variables por asi asi
module.exports={
    getMoviesAPI:getMovies,
    getMoviesCategoryAPI:getMoviesCategory,
      getMostViewedMoviesAPI: getMostViewedMovies,
  getMostRecentMoviesAPI: getMostRecentMovies,
  searchMovieByTitleAPI: searchMovieByTitle,
  fetchMovieByIdAPI:fetchMovieById,
  //getMovieAverageRatingAPI:getMovieAverageRating,
  getUpcomingMoviesAPI:getUpcomingMovies,
  addToWishlistAPI:addToWishlist,
  getWishlistAPI:getWishlist,
  getRatedMoviesAPI:getRatedMovies,
  hideMovieAPI: hideMovie,
  searchActorsByNameAPI:searchActorsByName,
  getUserRatingsForMovieAPI:getUserRatingsForMovie,
  getMovieAverageRatingAPI:getMovieAverageRating
}