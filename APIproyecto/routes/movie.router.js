const movieController = require("../controllers/movieData.controller");
const authenticate = require("../middlewares/authorization.middlewares");
const commentController = require("../controllers/commentUser.controller");
const { sendJsonResponse } = require('../utils/http.helpers');

const routes = {
  'GET /moviesId/:movieId/rating-average': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getAverageRatingForMovie(req, res);
  },
  'GET /moviesId/:movieId/comments': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await commentController.getComments(req, res);
  },
  'GET /moviesId/:movieId/comments/:parentId': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await commentController.getRepliesToComment(req, res);
  },
  'PUT /moviesId/:moviedId/editComments/:id': async (req, res) => {
  if (!(await authenticate(req, res, ['user', 'admin', 'superAdmin']))) return;
  return await commentController.editComment(req, res);
  },
  'PUT /editMovie/moviesId/:id': async (req, res) => {
    if (!(await authenticate(req, res, ['admin', 'superAdmin']))) return;
    return await movieController.editMovie(req, res);
  },
  'DELETE /comments/:id': async (req, res) => {
    if (!(await authenticate(req, res, ['superAdmin']))) return;
    return await commentController.deleteComment(req, res);
  },
  'GET /moviesId/:id': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getMovieById(req, res);
  },
  'GET /search/:title': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    req.params.title = decodeURIComponent(req.params.title);
    return await movieController.searchMovieByTitle(req, res);
  },
  'GET /mostViewed': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getMostViewedMovies(req, res);
  },
  'GET /recentMovies': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getMostRecentMovies(req, res);
  },
  'POST /add': async (req, res) => {
    if (!(await authenticate(req, res, ['admin','superAdmin']))) return;
    sanitizeInput(req, res, async () => {
      return await movieController.movieData(req, res);
    });
    },
  'DELETE /delete/:identifier': async (req, res) => {
    if (!(await authenticate(req, res, ['admin','superAdmin']))) return;
    return await movieController.deleteById(req, res);
  },
  'GET /moviesAll': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.findAll(req, res);
  },
  'POST /moviesId/:id/postComment': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await commentController.postComment(req, res);
  },
  'POST /moviesId/:id/wishlist/add': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.addToWishlist(req, res);
  },
  'GET /wishlist': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getWishlist(req, res);
  },
  'GET /ratedMovies': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getRatedMovies(req, res);
  },
  'GET /moviesId/:movieId/userRatings': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getUserRatingsForMovie(req, res);
  },
  'POST /moviesId/:id/rate': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.rateMovie(req, res);
  },
   'DELETE /delete/:identifier': async (req, res) => {
    if (!(await authenticate(req, res, ['admin','superAdmin']))) return;
    return await movieController.deleteById(req, res);
  },
};




async function movieRouter(req, res) {
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean); // Dividir y limpiar la URL
  const method = req.method;
  let matchedRoute = null;
  let params = {};

  // Búsqueda de rutas
  for (const route in routes) {
    const [routeMethod, routePath] = route.split(' ');
    if (routeMethod !== method) continue;

    const routeParts = routePath.split('/').filter(Boolean);

    if (routeParts.length !== urlParts.length) continue;

    let match = true;
    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = urlParts[index];
      } else if (part !== urlParts[index]) {
        match = false;
      }
    });

    if (match) {
      matchedRoute = routes[route];
      break;
    }
  }

  if (matchedRoute) {
    req.params = params;
    await matchedRoute(req, res);
  } else {
    sendJsonResponse(res, 404, { error: 'Ruta no encontrada' });
  }
}

module.exports = movieRouter;
