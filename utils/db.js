const mongoose = require("mongoose");
const db_connect = async () => {
  try {
    if (process.env.mode === "pro") {
      await mongoose.connect(process.env.db_production_url);
      console.log("poduction database connect");
    } else {
      await mongoose.connect(process.env.db_local_url);
      console.log("local database connect");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = db_connect;
