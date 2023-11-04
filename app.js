const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.error(`DBError: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Middleware for authentication
function authenticationToken(request, response, next) {
  const authHeader = request.headers["authorization"];
  if (!authHeader) {
    return response.status(401).send("Invalid JWT Token");
  }

  const jwtToken = authHeader.split(" ")[1];
  if (!jwtToken) {
    return response.status(401).send("Invalid JWT Token");
  }

  jwt.verify(jwtToken, "MY_SECRET_CODE", (error, payload) => {
    if (error) {
      return response.status(401).send("Invalid JWT Token");
    }
    // If the token is valid, proceed with the next middleware or route.
    next();
  });
}

// Route for user login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  if (!dbUser) {
    return response.status(400).send("Invalid user");
  }

  const isMatchedPassword = await bcrypt.compare(password, dbUser.password);

  if (isMatchedPassword) {
    const payload = { username: username };
    const jwtToken = jwt.sign(payload, "MY_SECRET_CODE");
    response.send({ jwtToken });
  } else {
    response.status(400).send("Invalid password");
  }
});
