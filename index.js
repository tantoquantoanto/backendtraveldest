const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = 4042;
const path = require("path");

require("dotenv").config();

const server = express();
server.use("/uploads", express.static(path.join(__dirname, "./uploads")))


server.use(express.json());
server.use(cors());

const usersRoutes = require("./routes/users");
const loginRoutes = require("./routes/login");
const destinationsRoutes = require("./routes/destinations")
const reviewsRoutes = require("./routes/reviews")
const emailRoutes = require("./routes/emails")
const githubRoutes = require("./routes/gitHub")
const googleRoutes = require("./routes/google")
const badRequestHandler = require("./middlewares/badRequestHandler");
const unauthorizedHandler = require("./middlewares/unauthorizedHandler");
const notFoundHandler = require("./middlewares/notFoundHandler");
const genericErrorHandler = require("./middlewares/genericErrorHandler")


server.use("/", usersRoutes);
server.use("/", loginRoutes);
server.use("/", destinationsRoutes);
server.use("/", reviewsRoutes);
server.use("/", emailRoutes);
server.use("/", githubRoutes);
server.use("/", googleRoutes);
server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);


mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Db Connection error"));

db.once("open", () => {
  console.log("Db Connected successfully");
});

server.listen(PORT, () => {
  console.log(`Server up and running on ${PORT}`);
});
