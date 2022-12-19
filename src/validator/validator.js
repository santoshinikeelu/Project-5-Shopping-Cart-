const mongoose = require("mongoose")

//------------------>>>-name_Validation-<<<-------------------<<
exports.isValidname = function (name) {
    return (typeof name === "string" && name.trim().length > 0 && name.match(/^[\D]+$/))
}

//------------------>>>-phone_Validation-<<<-------------------<<
exports.isvalidMobile = function (mobile) {
    return /^([+]\d{2})?\d{10}$/.test(mobile)
}

//------------------>>>-email_Validation-<<<--------------------<<
exports.isValidEmail = function (email) {
    return /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)
}
//------------------>>>street Validation-<<<---------------------<<
exports.isValidStreet = function (street) {
    return /^(\d{1,}) [a-zA-Z0-9\s]+(\,)? [a-zA-Z]+(\,)? [A-Z]{2} [0-9]{5,6}$/.test(street)
}
//------------------>>>-pincode_Validation-<<<---------------------<<
exports.isValidPincode = function (pin) {
    return /^[\d]{6}$/.test(pin)
}

//------------------>>>-city_Validation-<<<-------------------------<<
exports.isValidCity = function (city) {
    return /^[A-Za-z]+$/.test(city)
}

module.exports = { isValidname,isValidEmail,isValidMobile,isValidStreet,isValidPincode,isValidCity  }