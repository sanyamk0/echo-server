const mongoose = require("mongoose");

const connect = async () => {
  let dbConnection = null;
  try {
    if (!dbConnection) {
      await mongoose.connect(process.env.MONGO_URI);
      dbConnection = mongoose.connection;
      console.log("Connected to Database");
    }
    return dbConnection;
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = connect;
