const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { isValidObjectId} = require('../validator/validator')

//------------------------Authentication------------------------------
const authentication = function (req, res, Next) {
  try {
    const token = req.headers["bearer Header"];
    if (!token) {
      return res.status(400).send({ status: false, message: "Token must be present." });
    }

    jwt.verify(token, 'group3Project5', function (error, decoded) { //callback function

      if (error) {
        return res.status(401).send({ status: false, message: error.message });
      }
      else {
        req.decodedToken = decoded
        Next()
      }
    })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }

}

module.exports = {authentication, authorization};
