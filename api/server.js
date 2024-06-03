// @see https://github.com/typicode/json-server/tree/v0?tab=readme-ov-file#module
require('dotenv').config();
const fs = require('fs');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { SERVER_PORT, JWT_SECRET_KEY, JWT_EXP_TIME } = process.env;

const server = jsonServer.create();
const router = jsonServer.router('./db.json');
const middlewares = jsonServer.defaults();

const db = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'));

function getUser({ email, password }) {
  return db.users.find(
    (user) => user.email === email && user.password === password
  );
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: JWT_EXP_TIME,
  });
}

function checkIfLogged(req, res, next) {
  if (!req.user) {
    console.log('<< 401 UNAUTHORIZED');
    const status = 401;
    const message =
      "Vous n'êtes pas autorisé à visiter cette page. Merci de vous connecter.";

    res.status(status).json({ status, message });
  } else {
    next();
  }
}

server.use(
  cors({
    // whitelist des origines
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ],
  })
);

server.use(jsonServer.bodyParser);

// Mount on `/api`
server.get('/', function (req, res) {
  res.redirect('/api');
});

server.use('/api', middlewares);

// Add user to req if token exists and is valid
server.use((req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    const [, token] = authorization.split(' ');
    try {
      const jwtContent = jwt.verify(token, JWT_SECRET_KEY);
      req.user = jwtContent;
    } catch (err) {
      console.log('Invalid token', err);
    }
  }

  next();
});

// Login route
server.post('/api/login', function (req, res) {
  const { email, password } = req.body;

  // on vérifie si l'utilisateur est dans la BDD
  const user = getUser({ email, password });

  if (!user) {
    const status = 401;
    const message = 'Identifiants incorrects. Merci de ré-essayer.';

    return res.status(status).json({ status, message });
  }

  // l'utilisateur est authentifié…
  // on génère le token
  const accessToken = createToken({ id: user.id });
  // on combine les infos utilisateur et le token
  const data = {
    ...user,
    accessToken,
  };
  // on supprime le mot de passe dans les données renvoyées
  delete data.password;
  // on retourne les infos utilisateur (sans le password)
  return res.status(200).json(data);
});

// Favorites route
server.get('/api/favorites', checkIfLogged, function (req, res) {
  console.log('>> GET /favorites', req.user);

  const db = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'));

  const user = db.users.find((u) => u.id === req.user.id);

  const favorites = db.favorites.filter((f) => f.userId === user.id);
  console.log(favorites);
  const favoritesID = favorites.map((f) => f.rentalId);
  console.log(favoritesID);
  const rentals = db.rentals.filter((r) => favoritesID.includes(r.id));
  // console.log(rentals);

  const rentalsWithFavorites = rentals.map((r) => {
    return {
      ...r,
      favorites: db.favorites.filter((f) => f.rentalId === r.id),
    };
  });

  res.status(200).json({
    favorites: rentalsWithFavorites,
  });
});

server.use('/api', router);

server.listen(SERVER_PORT, () => {
  console.log(`JSON Server is running on http://localhost:${SERVER_PORT}`);
});

// Export the Server API
module.exports = server;
