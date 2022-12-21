const productModel = require('../models/productModel')
const aws = require('../aws/awsConfig')
const validation = require('../validator/validator')

const { isValidPrice, isValidFile, isValidStyle, isValidObjectId } = validation


//======================================> CREATE PRODUCT <=====================================//

const createProduct = async (req, res) => {
    try {
        let data = req.body
        let files = req.files

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: "false", message: "Please enter the data in request body" });
        }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = data;

        if (!title) {
            return res.status(400).send({ status: false, message: "Title is mandatory " });
        }

        const checkTitle = await productModel.findOne({ title })
        if (checkTitle) {
            return res.status(400).send({ status: false, message: "This title already exist, provide a new title" })
        }

        if (!description) {
            return res.status(400).send({ status: false, message: "Description is mandatory " });
        }
        if (!price) {
            return res.status(400).send({ status: false, message: "Price is mandatory " });
        }

        if (!isValidPrice(price)) {
            return res.status(400).send({ status: false, message: "Price is not present in correct format" })
        }

        if (!currencyId) {
            return res.status(400).send({ status: false, message: "Currency Id is mandatory " });
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, msg: " Please provide the currencyId as `INR` " });
        }

        if (!currencyFormat) {
            return res.status(400).send({ status: false, message: "Currency Format is mandatory " });
        }

        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "Please provide the currencyformat as `₹` " });
        }

        if (isFreeShipping) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) {
                return res.status(400).send({ status: false, message: "isFreeShipping should either be True, or False." });
            }
        }

        if (files && files.length > 0) {
            if (!isValidFile(files[0].originalname))
                return res.status(400).send({ status: false, message: `Enter format jpeg/jpg/png only.` });

            let uploadedFileURL = await aws.uploadFile(files[0]);
            data.productImage = uploadedFileURL;
        } else {
            return res.status(400).send({ message: "Files are required " });
        }
        if (!isValidStyle(style)) {
            return res.status(400).send({ status: false, message: "Style is not in correct format" })
        }

        if (!(installments || typeof installments == Number)) {
            return res.status(400).send({ status: false, message: "Installments should be in correct format" })
        }

        const document = await productModel.create(data);
        res.status(201).send({ status: true, message: "Success", data: document });
    } catch (err) {
        res.status(500).send({ staus: false, message: err.message });
    }
};

//==================================================== getProductById =================================================//

const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId;

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "ProductId not valid" });
        }

        const productCheck = await productModel.findById({ _id: productId })
        if (!productCheck) {
            return res.status(404).send({ status: false, message: "This product is not found" })
        }

        if (productCheck.isDeleted == true) {
            return res.status(404).send({ status: false, message: "This product has been deleted" })
        }

        let getProducts = await productModel.findOne({ _id: productId, isDeleted: false }).select({ deletedAt: 0 })
        return res.status(200).send({ status: true, message: "Success", data: getProducts })


    } catch (err) {
        return res.status(500).send({ satus: false, err: err.message });
    }
};

//===========================
const getProductsByFilter = async function (req, res) {
    try {
        let obj = req.query
        let filter = { isDeleted: false }
        let { size, name, priceLessThan, priceGreaterThan, priceSort } = obj

        if (Object.keys(obj).length === 0) {
            return res.status(400).send({ status: false, message: "Please give some parameters." })
        }

        if (Object.keys(obj).length != 0) {

            if (size) {
                if (!validSize(size)) {
                    return res.status(400).send({ status: false, message: "Size is not valid" })
                }
                filter['availableSizes'] = { $in: size }
            }

            if (name) {
                filter['title'] = { $regex: name }
            }

            if (priceLessThan) {
                if (!validPrice(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "Price is not valid" })
                }
                filter['price'] = { $lt: priceLessThan }
            }

            if (priceGreaterThan) {
                if (!validPrice(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "Not a valid Price" })
                }
                filter['price'] = { $gt: priceGreaterThan }
            }

            if (priceSort) {
                if (!(priceSort == 1 || priceSort == -1)) {
                    return res.status(400).send({ status: false, message: "Price can be sorted with the value 1 or -1 only" })
                }
            }
        }
        let productDetails = await productModel.find(filter).sort({ price: priceSort })
        if (productDetails.length === 0) {
            return res.status(404).send({ status: false, message: "no data found" })
        }
        return res.status(200).send({ status: true, message: 'Success', data: productDetails })

    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
}

//======================================> UPDATE <=====================================//

const updateProducts = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "This productId is not valid" })
        }

        const existingProduct = await productModel.findById({ _id: productId })
        if (!existingProduct) {
            return res.status(404).send({ status: false, message: "This product is not found" })
        }

        if (existingProduct.isDeleted == true) {
            return res.status(404).send({ status: false, message: "This product has been deleted" })
        }

        let data = req.body
        let files = req.files

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: "false", message: "Please enter the data to update" });
        }

        if (data.title) {
            if (!isEmpty(data.title)) {
                return res.status(400).send({ status: false, message: "Title is not valid" })
            }
        }

        const titleCheck = await productModel.findOne({ title: data.title })
        if (titleCheck) {
            return res.status(400).send({ status: false, message: "This title is already existing" })
        }

        if (data.price) {
            if (!isValidPrice(data.price)) {
                return res.status(400).send({ status: false, message: "Price is not present in correct format" })
            }
        }

        if (files) {
            if (files && files.length > 0) {
                let productImg = await uploadFile(files[0]);
                data.productImage = productImg;
            }
        }

        if (data.isFreeShipping) {
            if (!(data.isFreeShipping == "true" || data.isFreeShipping == "false")) {
                return res.status(400).send({ status: false, message: "Please enter a boolean value for isFreeShipping" })
            }
        }

        if (data.style) {
            if (!isEmpty(data.style)) {
                return res.status(400).send({ status: false, message: "Style is not valid" })
            }

            if (!isValidStyle(data.style)) {
                return res.status(400).send({ status: false, message: "Style is not in correct format" })
            }
        }

        if (data.availableSizes) {
            if (data.availableSizes) {
                let size = data.availableSizes.toUpperCase().split(",")
                data.availableSizes = size;
            }
        }

        if (data.installments) {
            if (!(data.installments || typeof data.installments == Number)) {
                return res.status(400).send({ status: false, message: "Installments should in correct format" })
            }
        }

        const updateProduct = await productModel.findByIdAndUpdate({ _id: productId }, data, { new: true })
        return res.status(200).send({ status: true, message: "Product Updated Successfully", data: updateProduct })

    } catch (error) {
        return res.status(500).send({ status: "false", message: error.message })

    }
}


//=======================================
const deleteProductById = async function (req, res) {
    try {

        let productId = req.params.productId;

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid product id" })
        }

        let checkProductId = await productModel.findById({ _id: productId })
        if (!checkProductId) {
            return res.status(404).send({ status: false, message: "Product Id dosen't exists." });
        }

        if (checkProductId.isDeleted === true) {
            return res.status(400).send({ status: false, message: "Product already deleted." });
        }

        let deleteProduct = await productModel.findByIdAndUpdate(productId, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true });
        res.status(200).send({ status: true, message: "Product Successfully Deleted." })
    } catch (error) {
        res.status(500).send({ status: false, error: error.message });
    }
}

module.exports = { createProduct, getProductById, getProductsByFilter,updateProducts, deleteProductById }
