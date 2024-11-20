// routes/users.router.js
const AccountController = require("../controllers/account.controller");
const movieController = require("../controllers/movieData.controller");
const userLoginController = require("../controllers/userLogin.controller");
const authenticate = require("../middlewares/authorization.middlewares");
const notificationController = require("../controllers/commentUser.controller");
const { sendJsonResponse } = require('../utils/http.helpers');

const routes = {
  'POST /register': async (req, res) => {
    await AccountController.register(req, res)
  },
  'POST /login': async (req, res) => {
    await AccountController.login(req, res)
  },
  'POST /check-email': async (req, res) => {
    await AccountController.checkEmailExists(req, res);
  },
  'POST /check-username': async (req, res) => {
    await AccountController.checkUsernameExists(req, res);
  },
  'POST /logout': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await AccountController.logout(req, res);
  },
  'GET /home': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await userLoginController.getUserData(req, res);
  },
  'GET /home/createMovies': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await movieController.getAllMovies(req, res);
  },
  'GET /user/notifications': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    return await notificationController.getNotifications(req, res);
  },
  'PATCH /user/notifications/:id': async (req, res) => {
    if (!(await authenticate(req, res, ['user', 'admin','superAdmin']))) return;
    req.params = { id: req.url.split('/')[2] };
    return await notificationController.markAsRead(req, res);
  },
  'POST /user/admin/home/movies': async (req, res) => {
    if (!(await authenticate(req, res, ['admin','superAdmin']))) return;
    return await movieController.movieData(req, res);
  },
  'DELETE /user/admin/home/movies/:id': async (req, res) => {
    if (!(await authenticate(req, res, ['admin','superAdmin']))) return;
    req.params = { id: req.url.split('/').pop() };
    return await movieController.deleteMovie(req, res);
  },
  'GET /user/admin/home/:id': async (req, res) => {
    if (!(await authenticate(req, res, ['user','admin','superAdmin']))) return;
    return await movieController.getMovieByAdminId(req, res);
  },
  'GET /user/home/movies/actors/search/:actorName': async (req, res) => {
    if (!(await authenticate(req, res, ['admin','superAdmin']))) return;
    req.params = { actorName: req.url.split('/')[6] };
    return await movieController.searchActorsByName(req, res);
  }
};

async function userRouter(req, res) {
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
    req.params = params; // Asigna los parámetros extraídos de la URL
    await matchedRoute(req, res);
  } else {
    sendJsonResponse(res, 404, { error: 'Ruta no encontrada' });
  }
}


module.exports = userRouter;
