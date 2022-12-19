
const express = require("express");
const router = express.Router()

const userController = require("../controllers/userController")

router.post("/login", userLogin);


router.all("/*",function(req,res){
    res.status(404).send({msg:"invalid http request"})
})
module.exports = router;