const userModel = require('../models/userModel')
const bcrypt = require("bcrypt")
const {uploadFile} = require("../aws/awsConfig");
const { isEmpty,isValidName,isValidEmail,isValidPhone,isValidStreet,isValidPincode,isValidCity  } = require("../validator/validator");
const jwt = require("jsonwebtoken");

const createUser = async function (req, res) {
    try {
      let data = req.body;
      let files = req.files;
      //console.log(files)
  
      if (Object.keys(data).length == 0) {
        return res.status(400).send({ status: "false", message: "All fields are mandatory" });
      }
  
      let { fname, lname, email, phone, password, address, profileImage } = data;
      if (!isEmpty(fname)) {
        return res.status(400).send({status: "false", message: "fname must be present"});
      }
      if (!isEmpty(lname)) {
        return res.status(400).send({status: "false", message: "lname must be present"});
      }
      if (!isEmpty(email)) {
        return res.status(400).send({status: "false", message: "email must be present"});
      }
      if (!isEmpty(phone)) {
        return res.status(400).send({status: "false", message: "phone number must be present"});
      }
      if (!isEmpty(password)) {
        return res.status(400).send({status: "false", message: "password must be present"});
      }
      if (!isEmpty(address)) {
        return res.status(400).send({status: "false", message: "Address must be present"});
      }
      if (!isValidName(lname)) {
        return res.status(400).send({status: "false", message: "last name must be in alphabetical order"});
      }
      if (!isValidPhone(phone)) {
        return res.status(400).send({ status: "false", message: "Provide a valid phone number" });
      }
      if( password.length < 8 || password.length > 15){
        return res.status(400).send({ status: false, message: "Length of password is not correct" })
      }
      if (!isValidName(fname)) {
        return res.status(400).send({status: "false",message: "first name must be in alphabetical order"});
      }
  
      // ------- Address Validation  --------
      if (address) {
        data.address = JSON.parse(data.address);
        if(address.shipping) {
          if (!isEmpty(address.shipping.street)) {
            return res.status(400).send({status: "false", message: "street must be present"});
          }
          if (!isEmpty(address.shipping.city)) {
            return res.status(400).send({ status: "false", message: "city must be present" });
          }
          if (!isEmpty(address.shipping.pincode)) {
            return res.status(400).send({ status: "false", message: "pincode must be present" });
          }
          if (!isValidStreet(address.shipping.street)) {
            return res.status(400).send({status: "false",message: "street should include no. & alphabets only"});
          }
          if (!isValidName(address.shipping.city)) {
            return res.status(400).send({status: "false",message: "city should include alphabets only"});
          }
          if (!isValidpincode(address.shipping.pincode)) {
            return res.status(400).send({status: "false",message: "pincode should be digits only"});
          }
        }
        if (address.billing) {
          if (!isEmpty(address.billing.street)) {
            return res.status(400).send({status: "false", message: "street must be present"});
          }
          if (!isEmpty(address.billing.city)) {
            return res.status(400).send({status: "false", message: "city must be present"});
          }
          if (!isEmpty(address.billing.pincode)) {
            return res.status(400).send({status: "false", message: "pincode must be present"});
          }
          if (!isValidStreet(address.billing.street)) {
            return res.status(400).send({status: "false",message: "street should include no. and alphabets only"});
          }
          if (!isValidName(address.billing.city)) {
            return res.status(400).send({status: "false",message: "city should be in alphabetical order"});
          }
          if (!isValidpincode(address.billing.pincode)) {
            return res.status(400).send({status: "false",message: "pincode should be digits only"});
          }
        }
      }
      const saltRounds = await bcrypt.genSalt(10);
      console.log(saltRounds)
      const hash = await bcrypt.hash(password, saltRounds);
      data.password = hash;
  
      let checkEmail = await userModel.findOne({ email});
      if (checkEmail) {
        return res.status(400).send({status: "false", message: "Email is already in use"});
      }
      let checkPhone = await userModel.findOne({phone });
      if (checkPhone) {
        return res.status(400).send({status: "false", message: "Phone number is already in use"});
      }
  
      if(files.length===0){
        return res.status(400).send({ status : false, message : "Profile Image is mandatory"})
      }
      if(files.fieldname=='profileImage'){
        return res.status(400).send({ status : false, message : "file name should be profile image"})
      }
  
      // console.log(files)
      let profileImgUrl = await uploadFile(files[0])
          data.profileImage = profileImgUrl
  
      let savedUser = await userModel.create(data);
      return res.status(201).send({
        status: true,message: "user has been created successfully",data: savedUser});
      } catch (error) {
      return res.status(500).send({ status: "false", msg: error.message });
    }
  };
//=============user login
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


module.exports = {createUser,userLogin,getUser};

