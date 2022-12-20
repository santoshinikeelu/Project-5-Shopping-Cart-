const productModel = require('../models/productModel')
const aws = require('../aws/awsUpload')
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

        const productCheck = await productModel.findById({ _id: product })
        if (!productCheck) {
            return res.status(404).send({ status: false, message: "This product is not found" })
        }

        if (productCheck.isDeleted == true) {
            return res.status(404).send({ status: false, message: "This product has been deleted" })
        }

        let getProducts = await productModel.findOne({ _id: product, isDeleted: false }).select({ deletedAt: 0 })
        return res.status(200).send({ status: true, message: "Success", data: getProducts })


    } catch (err) {
        return res.status(500).send({ satus: false, err: err.message });
    }
};

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

        let deleteProduct = await productModel.findByIdAndUpdate(productId, { $set: { isDeleted: true, deletedAt: Date.now() }}, { new: true });
         res.status(200).send({ status: true, message: "Product Successfully Deleted.", data: deleteProduct })
    } catch (error) {
        res.status(500).send({ status: false, error: error.message });
    }
}

module.exports = { createProduct, getProductById, deleteProductById }
