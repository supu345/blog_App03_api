const express = require("express");
const app = express();
const dotenv = require("dotenv");
const body_parser = require("body-parser");
const cors = require("cors");
const db_connect = require("./utils/db");
const paginate = require("express-paginate");
dotenv.config();

app.use(body_parser.json());
app.use(paginate.middleware(10, 50));

if (process.env.mode === "production") {
  app.use(cors());
} else {
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ],
    })
  );
}

app.use("/", require("./routes/authRoutes"));
app.get("/", (req, res) => res.send("Hello World!"));
app.use("/", require("./routes/newsRoute"));
const port = process.env.port;

db_connect();

app.listen(port, () => console.log(`server is running on port ${port}!`));
