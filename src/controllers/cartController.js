const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");

const { isEmpty, isValidName, isValidEmail, isValidPhone, isValidStreet, isValidPincode, isValidCity } = require("../validator/validator");

const { isValidObjectId } = require("mongoose");    


const createCart = async function(req,res){
    try{
        // check userId
        let userId = req.params.userId

        if (!userId || userId == "") {
          return res.status(400).send({ status: false, msg: "please enter userId" })
        }
        if (!isValidObjectId(userId)) {
          return res.status(400).send({ status: false, msg: "invalid  userId" })
        }
        let userIdDetail = await userModel.findById({_id: userId})
        if (!userIdDetail) {
          return res.status(400).send({ status: false, msg: " userId is not present" })
        }

        // Authorization
        if (req.userId != userId) {
         return res.status(401).send({ status: false, message: "You're not Authorized" })
        }

        // check body
        let cartData = req.body
        if (Object.keys(cartData).length === 0 ) {
            return res.status(400).send({ status: false, message: "pls provided body" })
        }
        
        let { items } = cartData;
        if(!items){
            return res.status(400).send({status:false,message:"pls provide items"})
        }
        if(!items[0].productId){
            return res.status(400).send({status:false,message:"productId is mandatory"})
        }
        if (!isValidObjectId(items[0].productId)) {
            return res.status(400).send({ status: false, message: "Invalid productid" });
        }
        if (items.length > 1) return res.status(400).send({ status: false, message: "only allow one product at a time" });

            
        if (items.length !== 0) {
            let productId = items[0].productId;
           let findProductId = await productModel.findById({ _id: productId, isDeleted: false });
            
            if (!findProductId) {
                return res.status(404).send({ status: false, message: "product doesn't exists,  give another productId" });
            }    
        }

         // check for cart created or not with the user
         let findCartId = await cartModel.findOne({ userId: userId });

        // if cart not created (for new user)
        if (!findCartId) {
            if ((!items[0].quantity) || items[0].quantity == 0) items[0].quantity = 1
            if (items) {

                let productId = items[0].productId;
                let findProduct = await productModel.findById(productId).select({ price: 1, _id: 0 });

                let newProduct = {
                    totalPrice: items[0].quantity * findProduct.price,
                    totalItems: items.length,
                    items: items,
                    userId: userId,
                };

                let createCart = await cartModel.create(newProduct);
                res.status(201).send({
                    status: true, message: "Cart Created successfully", data: createCart,
                });
            }
        }

        // if cart already created (for user) than
        if (findCartId) {

            let cartId = findCartId._id.toString();
            let productId = items[0].productId;
            if ((!items[0].quantity) || items[0].quantity == 0) items[0].quantity = 1

            let findProduct = await productModel.findById(productId).select({ price: 1, _id: 0 });
            // if old product quantity and price increment
            let updateCart = await cartModel.findOneAndUpdate(
                { _id: cartId, "items.productId": productId },
                {   
                    
                    $inc: {
                        "items.$.quantity": 1,
                        totalPrice: items[0].quantity * findProduct.price,
                    },
                },
                { new: true });
                // If new productId
            if (!updateCart) updateCart = await cartModel.findByIdAndUpdate(
                cartId,
                {
                    $push: { items: items },
                    $inc: {
                        totalPrice: items[0].quantity * findProduct.price,
                        totalItems: 1,
                    },
                },
                { new: true }
            );

            if (updateCart) return res.status(200).send({
                status: true, message: "add to cart successfull", data: updateCart,
            });
       }
    }catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}
//============================< UPDATE CART >==============================//

const updateCart = async function(req,res){
    try{
const userId = req.params.userId
if(!isValidObjectId(userId)){
    return res.status(400).send({status:false,message:"please put a valid userId"})
}
const Data = req.body
const {productId,cartId,removeProduct} = Data 


if(productId){
    if(!isValidObjectId(productId)){
        return res.status(400).send({status:false,message:"please put a valid productId"})
    }
    const productDetails = await productModel.findById(productId)
    if(!productDetails){
        return res.status(404).send({status:false,message:"product not found"})
    }
    if(productDetails.isDeleted==true){
        return res.status(400).send({status:false,message:"product is already deleted"})
    }
}
if(cartId){
    if(!isValidObjectId(cartId)){
        return res.status(400).send({status:false,message:"please put a valid cartId"})
    }
    const cartDetails = await cartModel.findById(cartId)
    if(cartDetails.items.length==0){
        return res.status(404).send({status:false,message:"empty cart"})
    }
    if(cartDetails.isDeleted==true){
        return res.status(400).send({status:false,message:"cart is already deleted"})
    }
}
//let items = Data
if(removeProduct==1 ){
    const cartDetails = await cartModel.findById(cartId)
      items = cartDetails.items
    if(Object.keys(items).length==0){
        return res.status(400).send({status:false,msg:"empty cart"})
    }}
    
    let findProduct = await productModel.findById(productId).select({ price: 1, _id: 0 });

    
    // if old product quantity and price increment
    let updateCart = await cartModel.findOneAndUpdate(
        { _id: cartId, "items.productId": productId },
        {   
            
            $inc: {
                "items.$.quantity": -1,
                totalPrice: items[0].quantity * findProduct.price,
            },
        },
        { new: true });
        return res.status(200).send({status:true,message:"cart updated sccessfully",data:updateCart})

}
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}

//==================< GETCART DATA >==========================//

const getCartData = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isEmpty(userId)) {
            return res.status(400).send({ status: false, message: "UserId is missing" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId" });
        }

        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        let findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            return res.status(404).send({ status: false, message: "cart is not found" })
        }

        return res.status(200).send({ status: true, message: "Success", data: findCart })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

//==================< DELETE CART >==========================//

const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId

        if (!isEmpty(userId)) {
            return res.status(400).send({ status: false, message: "UserId is missing in params" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId" });
        }

        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }

        let items = [];
        let totalPrice = 0
        let totalItems = 0
        const cartGet = await cartModel.findOneAndUpdate({ userId: userId }, { items: items, totalPrice: totalPrice, totalItems: totalItems }, { new: true });
        return res.status(200).send({ status: true, message: 'Success', data: cartGet });
    }

    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports = { createCart, getCartData, deleteCart, updateCart }