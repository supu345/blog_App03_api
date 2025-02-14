const express = require("express");
const app = express();
const dotenv = require("dotenv");
const body_parser = require("body-parser");
const cors = require("cors");
const db_connect = require("./utils/db");
const paginate = require("express-paginate");

dotenv.config();

// const allowedOrigins =
//   process.env.mode === "pro"
//     ? [
//         process.env.CLIENT_CUSTOMER_PRODUCTION_URL,
//         process.env.CLIENT_CUSTOMER_SECONDARY_URL,
//       ]
//     : [
//         "http://localhost:5173",
//         "http://localhost:5174",
//         "http://localhost:3000",
//       ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true); // Allow requests with no origin
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       } else {
//         return callback(new Error("CORS policy: Origin not allowed"));
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://daily-news-client.vercel.app",
      "https://blog-app03-client.vercel.app",
    ],
    credentials: true,
  })
);
app.use(body_parser.json());
app.use(paginate.middleware(10, 50));
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/newsRoute"));

const port = process.env.port || 5000;

db_connect();

app.listen(port, () =>
  console.log(`Server is running on port ${port} in mode ${process.env.mode}`)
);
