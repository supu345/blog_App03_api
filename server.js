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

// if (process.env.mode === "production") {
//   app.use(cors());
// } else {
//   app.use(
//     cors({
//       origin: [
//         "http://localhost:5173",
//         "http://localhost:5174",
//         "http://localhost:3000",
//       ],
//     })
//   );
// }

app.use(
  cors({
    origin:
      process.env.mode === "pro"
        ? [
            process.env.CLIENT_CUSTOMER_PRODUCTION_URL,
            process.env.CLIENT_CUSTOMER_SECONDARY_URL,
          ]
        : [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://blog-app03-client.vercel.app",
            "https://daily-news-client.vercel.app",
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/", require("./routes/authRoutes"));
app.get("/", (req, res) => res.send("Hello World!"));
app.use("/", require("./routes/newsRoute"));
const port = process.env.port;

db_connect();

app.listen(port, () => console.log(`server is running on port ${port}!`));
