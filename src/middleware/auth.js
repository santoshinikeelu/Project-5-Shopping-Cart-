const jwt = require("jsonwebtoken");

const authentication = async function (req, res, next) {
    try {

        let bearToken = req.headers["authorization"];
        if (!bearToken) {
            return res.status(400).send({ status: false, message: "Token not present, login again " })
        };

        let token = bearToken.split(" ")[1];

        let decodedToken = jwt.verify(token, "group3Project5",function(err,decodedToken){
        if(err){
          return res.status(400).send({status:false,message:"Invalid token"})
        }else{
          req.userId = decodedToken.userId;
            next();
         }
        });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { authentication }
