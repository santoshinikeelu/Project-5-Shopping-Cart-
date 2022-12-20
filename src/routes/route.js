const express = require("express");
const router = express.Router()
const { authentication } = require("../middleware/auth")

const userController = require("../controllers/userController")
// const productController = require("../controllers/productController")

router.post("/register",userController.createUser);
router.post("/login", userController.userLogin);
router.get("/user/:userId",authentication,userController.getUser)
router.put("/user/:userId",authentication,userController.updateuserDetails)

// ------------------------Product-------------------------//

// router.delete("/products/:productId", productController.deleteProductById);


router.all("/*", function (req, res) {
    res.status(404).send({ msg: "invalid http request" })
})
module.exports = router;