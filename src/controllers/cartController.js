const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const { isEmpty, isValidName, isValidEmail, isValidPhone, isValidStreet, isValidPincode, isValidCity } = require("../validator/validator");
const { isValidObjectId } = require("mongoose");

const createCart = async function (req, res) {
    try {
        // check userId
        let userId = req.params.userId

        if (!userId || userId == "") {
            return res.status(400).send({ status: false, msg: "please enter userId" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "invalid  userId" })
        }
        let userIdDetail = await userModel.findById({ _id: userId })
        if (!userIdDetail) {
            return res.status(400).send({ status: false, msg: " userId is not present" })
        }

        // Authorization
        // if (req.userId != userId) {
        //     return res.status(401).send({ status: false, message: "You're not Authorized" })
        // }

        // check body
        let cartData = req.body
        if (Object.keys(cartData).length === 0) {
            return res.status(400).send({ status: false, message: "pls provided body" })
        }
        let { items } = cartData;
        if (!items) {
            return res.status(400).send({ status: false, message: "pls provide items" })
        }
        if (!items[0].productId) {
            return res.status(400).send({ status: false, message: "productId is mandatory" })
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
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
//============================< UPDATE CART >==============================//

const updateCart = async function (req, res) {

    userId = req.params.userId;

    // validation for userId
    if (!isValidObjectId(userId))
        return res.status(400).send({ status: false, message: "userid is invalid " });

    // searching the user Id
    const searchUser = await userModel.findById({ _id: userId, isDeleted: false });
    if (!searchUser)
        return res.status(404).send({ status: false, message: "User not found" });

    const data = req.body;
    let { cartId, productId, removeProduct } = data;
    // console.log(cartId);

    // checking body for empty or not
    if (Object.keys(data).length === 0) {
        return res.status(400).send({ status: false, message: "please provide updation details." });
    }
    // validation for productId
    if (productId) {
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "productid is invalid" });
    } else {
        return res.status(400).send({ status: false, message: "Please provide productId" });
    }

    const searchProduct = await productModel.findOne({
        _id: productId,
        isDeleted: false,
    });
    if (!searchProduct)
        return res.status(404).send({ status: false, message: `Product not found.` });

    // validation for cartId
    if (!cartId)
        return res.status(400).send({ status: false, message: "Please provide cartId" });

    if (!isValidObjectId(cartId))
        return res.status(400).send({ status: false, message: `cartId is invalid.` });

    //checking cart details available or not
    const searchCart = await cartModel.findOne({ _id: cartId });
    if (!searchCart)
        return res.status(404).send({ status: false, message: `Cart does not exists with this provided cartId: ${cartId}`, });

    //check for the empty items i.e., cart is now empty
    if (searchCart.items.length == 0)
        return res.status(400).send({ status: false, message: "Your cart is empty." });

    // validatiion for removeProduct
    if (!removeProduct)
      return res.status(400).send({ status: false, message: "removeProduct is required" });

    if (![0, 1].includes(removeProduct))
        return res.status(400).send({ status: false, message: "removeProduct is required, it can be only be '0' & '1'", });

    let cart = searchCart.items;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].productId == productId) {
            const priceChange = cart[i].quantity * searchProduct.price;

            // directly remove a product from the cart ireespective of its quantity
            if (removeProduct === 0) {
                let flag = 0;
                for (let i = 0; i < searchCart.items.length; i++) {
                    if (searchCart.items[i].productId == productId) {
                        //    console.log(removeProduct)
                        let updateCart = await cartModel.findByIdAndUpdate(
                            cartId,
                            {
                                $pull: { items: { productId: productId } },
                                $inc: {
                                    totalPrice: -searchProduct.price,
                                    totalItems: -1,
                                },
                            },
                            { new: true }
                        );
                        res.status(200).send({status: true, message: "product remove from cart successfully", data: updateCart});
                        flag = 1;
                        break;
                    }
                }
                if (flag === 0) {
                    console.log("after flag");
                }
            }
            // decrement the product quantity from the cart by (1)
            if (removeProduct === 1) {
                let flag = 0;
                for (let i = 0; i < searchCart.items.length; i++) {

                    if (searchCart.items[i].productId == productId) {
                        // for quantity is greaterthan 1
                        if (searchCart.items[i].quantity > 1) {
                            searchCart.items[i].quantity = searchCart.items[i].quantity - 1;

                            let updateCart = await cartModel.findByIdAndUpdate(cartId, {
                                $set: { items: searchCart.items }, $inc: { totalPrice: -searchProduct.price }
                            }, { new: true }
                            );
                            res.status(200).send({status: true,message: "product remove from cart successfully",data: updateCart,});
                            flag = 1;
                            break;
                        }
                        // for quantity isequal 1
                        if (searchCart.items[i].quantity == 1) {
                            let updateCart = await cartModel.findByIdAndUpdate(cartId, {
                                $pull: { items: { productId: productId } },
                                $inc: { totalPrice: -searchProduct.price, totalItems: -searchCart.items[i].quantity }
                            },
                                { new: true }
                            );
                            res.status(200).send({ status: true, message: "product remove from cart successfully", data: updateCart });
                        }
                    }

                }
            }

        }
    }
}
//==================< GETCART DATA >==========================//

// const getCartData = async function (req, res) {
//     // try {
//         let userId = req.params.userId

//         if (!isEmpty(userId)) {
//             return res.status(400).send({ status: false, message: "UserId is missing" })
//         }

//         if (!isValidObjectId(userId)) {
//             return res.status(400).send({ status: false, msg: "Invalid userId" });
//         }

//         let findUser = await userModel.findOne({ _id: userId })
//         if (!findUser) {
//             return res.status(404).send({ status: false, message: "User not found" })
//         }
       
//         let findCart = await cartModel.findOne({ userId: userId })
//         .populate({path: "items", populate: { path: "productId",select: ["title", "price", "productImage"] } });
//         console.log(findCart)
//         if (!findCart) {
//             return res.status(404).send({ status: false, message: "cart is not found" })
//         }

//         return res.status(200).send({ status: true, message: "Success", data: findCart })

    // } catch (error) {
    //     return res.status(500).send({ status: false, msg: error.message })
    // }
// }

const getCart = async function (req, res) {
    try {
      let userId = req.params.userId;
  
      if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: "invalid userID" });
      }
      let checkUserId = await userModel.findOne({
        _id: userId
      });
      if (!checkUserId) {
        return res.status(404).send({ status: false, message: "user not found" });
      }
      let fetchData = await cartModel
        .findOne({
          userId: userId
        })
        .populate({
          path: "items",
          populate: {
            path: "productId",
            model:"products",
            select: ["title", "price", "productImage"],
          }
        }).select("-items._id");

      if (!fetchData) {
        return res.status(404).send({ status: false, message: "cart not found" });
      }
      if (fetchData.items.length == 0) {
        return res.status(200).send({
          status: true,
          message: "Success",
          data: fetchData,
        });
      }
      return res
        .status(200)
        .send({ status: true, message: "Success", data: fetchData });
    } catch (err) {
      return res.status(500).send({ status: false, msg: err.message });
    }
  };

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


module.exports = { createCart, getCart, deleteCart, updateCart }