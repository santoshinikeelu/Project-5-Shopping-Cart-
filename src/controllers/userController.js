const userModel = require('../models/userModel')
const bcrypt = require("bcrypt")

const userLogin = async function (req, res) {

    try {

        let data = req.body

        let { email, password } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Please provide email and password" });
        }

        if (!email) {
            return res.status(400).send({ status: false, message: "Email must be present" });
        }

        if (!password) {
            return res.status(400).send({ status: false, message: "Password must be present" });
        }

        let checkEmail = await userModel.findOne({ email: email });
        if (!checkEmail) {
            return res.status(401).send({ status: false, message: "Please provide a correct Email" });
        }

        let checkPassword = await bcrypt.compare(password, checkEmail.password);
        if (!checkPassword) {
            return res.status(401).send({ status: false, message: "Please provide a correct password" });
        }

        const userData = await userModel.findOne({ email: email })
        if (!userData) { return res.status(401).send({ status: false, message: "Invalid Login Credentials! You need to register first." }) }

        let token = jwt.sign({
            userId: checkEmail._id.toString(),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, //expires in 24 hr
        }, "group3Project5");
        res.setHeader("x-api-key", token);
        return res.status(200).send({ status: true, message: "User Login Successful", data: { userId: checkEmail._id, token: token }, });
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};
//==============Get User================
const getUser = async function (req, res) {
    try {
      let userId = req.params.userId;
      let userLoggedIn = req.tokenData.userId;
  
      if (!isValidObjectId(userId)) {
        return res.status(400).send({status: false, msg: "Invalid userId"});
      }
  
      if (userId != userLoggedIn) {
        return res.status(403).send({status: false, msg: "Error, authorization failed"});
      }
  
      let checkData = await userModel.findOne({ _id: userId });
      if (!checkData) {
        return res.status(404).send({status: false, message: "No data found"});
      }
  
      return res.status(200).send({
        status: true,message: "Users Profile Details",data: checkData}); 
    } catch (err) {
      return res.status(500).send({ status: false, msg: err.message });
    }
  };


module.exports = {userLogin,getUser};

