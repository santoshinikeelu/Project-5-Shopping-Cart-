const express = require("express");
const router = express.Router()
const { authentication } = require("../middleware/auth")

const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")

// ------------------------< USERS >-------------------------//

router.post("/register",userController.createUser);
router.post("/login", userController.userLogin);
router.get("/user/:userId",authentication,userController.getUser)
router.put("/user/:userId",authentication,userController.updateuserDetails)

// ------------------------< PRODUCTS >-------------------------//
router.post("/products",productController.createProduct);
router.get("/products/:productId", productController.getProductById);
router.get("/products",productController.getProductsByFilter);
router.put("/products/:productId",productController.updateProducts)
router.delete("/products/:productId", productController.deleteProductById);


// ------------------------< Cart >---------------------------------//

router.post("/users/:userId/cart",cartController.createCart)//authentication
router.put("/users/:userId/cart",cartController.updateCart)
router.get("/users/:userId/cart",cartController.getCart)
router.delete("/users/:userId/cart",cartController.deleteCart)

// ------------------------< Order >---------------------------------//



router.all("/*", function (req, res) {
    res.status(404).send({ msg: "invalid http request" })
})
module.exports = router;