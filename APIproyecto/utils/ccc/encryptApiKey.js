const crypto = require('crypto');
const { encrypt } = require('./ccc');


const secretKey = crypto.randomBytes(32);
console.log('Clave secreta (guárdala en .env):', secretKey.toString('hex'));


const apiKey = '376635a2a15525fb5b00a5b6ac0f2861'; 
const encryptedApiKey = encrypt(apiKey, secretKey);
console.log('Clave API cifrada (guárdala en .env):', encryptedApiKey);
