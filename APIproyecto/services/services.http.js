/*No se si funcionara xd */

const http = require('http');
const movieServices = require('./movie.services'); 

const server = http.createServer(async (req, res) => {
  
  if (req.url === '/movies' && req.method === 'GET') {
    try {
      const movies = await movieServices.getMovies();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(movies));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else if (req.url.startsWith('/search') && req.method === 'GET') {
    // Ruta para buscar películas
    const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const title = query.get('title') || '';
    const genre = query.get('genre') || null;
    const sortBy = query.get('sortBy') || 'relevancia';

    try {
      const movies = await movieServices.searchMovieByTitle(title, sortBy, genre);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(movies));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else if (req.url.startsWith('/genre') && req.method === 'GET') {
    // Ruta para obtener películas por género
    const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const genre = query.get('genre') || '';
    const limit = parseInt(query.get('limit'), 10) || 10;

    try {
      const movies = await movieServices.getMoviesByGenre(genre, limit);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(movies));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    // Ruta no encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
  }
});


const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});


//Tengo q darle en la consola node server.js para levantarlo y probar si me tira data xd
/*
http://localhost:3000/movies
http://localhost:3000/search?title=batman&genre=accion
http://localhost:3000/genre?genre=comedia&limit=5
*/