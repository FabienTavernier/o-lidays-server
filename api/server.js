// @see https://github.com/typicode/json-server#module
require('dotenv').config();
const fs = require('fs');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { SERVER_PORT, JWT_SECRET_KEY, JWT_EXP_TIME } = process.env;

const server = jsonServer.create();
const router = jsonServer.router('./db.json');
const middlewares = jsonServer.defaults();

const { users } = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'));

function getUser({ email, password }) {
  return users.find(
    (user) => user.email === email && user.password === password
  );
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: JWT_EXP_TIME,
  });
}

server.use(
  cors({
    // whitelist des origines
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);

server.use(jsonServer.bodyParser);

// Mount on `/api`
server.get('/', function (req, res) {
  res.redirect('/api');
});

server.use('/api', middlewares);

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

server.use('/api', router);

server.listen(SERVER_PORT, () => {
  console.log(`JSON Server is running on http://localhost:${SERVER_PORT}`);
});

// Export the Server API
module.exports = server;
