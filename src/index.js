const express = require("express");
const mongoose = require("mongoose")
const route = require("./routes/route.js");
const app = express();


app.use(express.json());


mongoose.connect("mongodb+srv://santoshinikeelu:santoshini@cluster0.zhokymy.mongodb.net/group3shoppingcart",{
  useNewUrlParser: true
})
  .then(() => console.log("MongoDB is connected"))
  .catch((error) => console.log(error));


app.use("/", route);

app.listen(3000, function () {
  console.log("Express App Running on Port 3000");
});