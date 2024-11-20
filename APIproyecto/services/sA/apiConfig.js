const { decrypt } = require('../../utils/ccc/ccc');

const encryptedApiKey = process.env.ENCRYPTED_API_KEY;
const secretKey = Buffer.from(process.env.SECRET_KEY, 'hex');


const apiKey = decrypt(encryptedApiKey, secretKey);


module.exports = {
    BASE_URL: process.env.BASE_URL_API, 
    API_KEY: apiKey,
};
