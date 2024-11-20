const Mongose = require('mongoose');
const envconfig = require('./env.config')
const debug=require('debug')("app:databse")

const uri = envconfig.MONGO_URI;


const connect = async () => {
    try{
        await Mongose.connect(uri); //la uri que hicimos anteriormente
        debug("Connection to database TheMovieDb started");

    } catch(error){
        console.error(error);
        debug("Cannot connect to database");
        process.exit(1); //terminamos el proceso
    }

}


/*
    desconeccion a la base de datos 
*/

const disconnect = async () => {
    try{
        await Mongose.disconnect(uri); //la uri que hicimos anteriormente
        debug("Connection to database end");

    } catch(error){
        debug("Desconnection to database end");

        process.exit(1); //terminamos el proceso
    }

}

//exponerlos 

module.exports = {
    connect,
    disconnect
}