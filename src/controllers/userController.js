const userModel = require('../models/userModel')
const bcrypt = require("bcrypt")
const AWS= require("aws-sdk")
const { isValidname,isValidEmail,isValidMobile,isValidStreet,isValidPincode,isValidCity  } = require("../validator/validator")

//---------------------s3 link---------------------------//
AWS.config.update({
    accessKeyId : "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey : "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",
    region: "ap-south-1"
  })
  
  let uploadImage = async ( image) =>{
    return new Promise(function(resolve, reject) {
      // this function will upload file to aws and return the link
      let s3= new AWS.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws
   
      var uploadParams= {
          ACL: "public-read",
          Bucket: "classroom-training-bucket",  //HERE
          Key: "abc/" + image.originalname, //HERE 
          Body: image.buffer
      }
      s3.upload( uploadParams, function (err, data ){
          if(err) {
              return reject({"error": err})
          }
          console.log(data)
          console.log("image uploaded succesfully")
          return resolve(data.Location)
      })
    })
  }
  
  const profileImage = async function(req, res){
    try{
        let images= req.images
        if(images && images.length>0){
            let uploadedImageURL= await uploadImage( images[0] )
            res.status(201).send({msg: "image uploaded succesfully", data: uploadedImageURL})
        }
        else{
            res.status(400).send({ msg: "No image found" })
        }
        
    }
    catch(err){
        res.status(500).send({msg: err})
    }
  }
    

const createUser = async function(req,res){
    try{
        const data = req.body
        const images = req.images
        const { fname,lname,email,phone, password,address} = data
        if(Object.keys(data).length == 0){
            return res.status(400).send({status:false,messsage:"please provide data"})
        }
        //--------------------------fname check---------------------//
        if(!fname) return res.status(400).send({status:false,message:"fname is required "})
       if(!isValidname(fname)) return res.status(400).send({status:false,message:"please enter valid name"})
        //--------------------------lname check---------------------//
        if(!lname) return res.status(400).send({status:false,message:"lname is required "})
        if(!isValidname(lname)) return res.status(400).send({status:false,message:"please enter valid name"})

        //--------------------------email check---------------------//
        if(!email) return res.status(400).send({status:false,message:"email is required "})
        if(!isValidEmail(email)) return res.status(400).send({status:false,message:"please enter valid email"})
        const emailId = await userModel.find({email:email})
        if(emailId) return res.status(400).send({status:false,message:"emailId already exist"})




        //--------------------------phone number check---------------------//
        if(!phone) return res.status(400).send({status:false,message:"phone is required "})
        if(!isValidMobile(phone)) return res.status(400).send({status:false,message:"please enter valid mobile no."})
        const phoneNumber=await userModel.find({phone:phone})
        if(phoneNumber) return res.status(400).send({status:400,message:"mobile no. is already exists"})




        //--------------------------password check---------------------//
        if(!password) return res.status(400).send({status:false,message:"password is required "})


        //--------------------------address check---------------------//
        if(address){
            const {shipping,billing}=address
            if(!shipping && !billing)
                return res.status(400).send({status:false,message:"send shipping and billing address"})
            if(shipping,billing){
                const {street,city,pincode}={shipping,billing}
                //----------------------check street-------------//
                if(!street) return res.status(400).send({status:false,message:"please enter street"})
                if(!isValidStreet(street)) return res.status(400).send({status:false,message:"please enter valid street"})

                //----------------------check city-------------//
                if(!city) return res.status(400).send({status:false,message:"please enter city"})
                if(!isValidCity(city)) return res.status(400).send({status:false,message:"please enter valid city"})

                //----------------------check pincode-------------//
                if(!pincode) return res.status(400).send({status:false,message:"please enter pincode"})
                if(!isValidPincode(pincode)) return res.status(400).send({status:false,message:"please enter valid pincode"})
                
            }


        } 
        
        //imageurl check
        if(!images && images.length>0){
            res.status(400).send({ msg: "No file found" })
          }
          let uploadedImageURL= await uploadImage( images[0] )
          if(uploadedImageURL){
            data.profileImage = uploadedImageURL
          }
          else{
            res.status(400).send({message : "url not created"})
          }
          const UserData = await userModel.create(data)
          return res.status(201).send({status:true,message:"user created successfully",Data:UserData})



    }
    catch(err){
        return res.status(500).send({status:false,messsage:err.messsage})
    }
}
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

