// { 
//     fname: {string, mandatory},
//     lname: {string, mandatory},
//     email: {string, mandatory, valid email, unique},
//     profileImage: {string, mandatory}, // s3 link
//     phone: {string, mandatory, unique, valid Indian mobile number}, 
//     password: {string, mandatory, minLen 8, maxLen 15}, // encrypted password
//     address: {
//       shipping: {
//         street: {string, mandatory},
//         city: {string, mandatory},
//         pincode: {number, mandatory}
//       },
//       billing: {
//         street: {string, mandatory},
//         city: {string, mandatory},
//         pincode: {number, mandatory}
//       }
//     },
//     createdAt: {timestamp},
//     updatedAt: {timestamp}
//   }

const userModel = require("../models/userModel")
const { isValidObjectId } = require("../validator/validator")

const updateUser = async function (req,res){
    try{
        // check userId
       let userId = req.params.userId
       if(!userId){
        return res.status(400).send({status:false,message: "pls provided userId"})
       }
       if(isValidObjectId(userId)){
        return res.status(400).send({status:false,message: "Invalid userId"})
       }
       let checkuserId = await userModel.findOne({_id: userId, isDeleted: false})
       if(!checkuserId){
        return res.status(404).send({status:false,message: "userId not found"})
       }
       let data = req.body
       let profileImage = req,files
       if(Object.keys(data).length === 0 ){
        return res.status(400).send({status:false,message: "pls provided body"})
       }

       let { fname, lname, phone, email, password, address } = data
       let updateUser = {}
       updateUser["fname"] = fname
       updateUser["lname"] = lname
       updateUser["phone"] = phone
       updateUser["email"] = email
       updateUser["address"] = address
       if(profileImage){
        if(profileImage && profileImage.length > 0 ){
            let profileImgUrl = await uploadFile(profileImage[0])
            body.profileImage = profileImgUrl
            updateUser["profileImage"] = profileImgUrl
        }
        if(password){
            const saltRounds = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, saltRounds);
            bodyData.password = hash;
            updateUser["password"] = hash;
        }
       }
       const updateData = await userModel.findByIdAndUpdate(userId, updateUser, {new: true})
       return res.status(200).send({status:true,message:"update successfull", updateData})

    }catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}