const AWS = require("aws-sdk")

//---------------------s3 link---------------------------//
AWS.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1"
  })
  
  let uploadImage = async (image) => {
    return new Promise(function (resolve, reject) {
      // this function will upload file to aws and return the link
      let s3 = new AWS.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws
  
      var uploadParams = {
        ACL: "public-read",
        Bucket: "classroom-training-bucket",  //HERE
        Key: "abc/" + image.originalname, //HERE 
        Body: image.buffer
      }
      s3.upload(uploadParams, function (err, data) {
        if (err) {
          return reject({ "error": err })
        }
        console.log(data)
        console.log("image uploaded succesfully")
        return resolve(data.Location)
      })
    })
  }
  
  const profileImage = async function (req, res) {
    try {
      let images = req.images
      if (images && images.length > 0) {
        let uploadedImageURL = await uploadImage(images[0])
        res.status(201).send({ msg: "image uploaded succesfully", data: uploadedImageURL })
      }
      else {
        res.status(400).send({ msg: "No image found" })
      }
  
    }
    catch (err) {
      res.status(500).send({ msg: err })
    }
  }

  
module.exports = {uploadImage };