var mongoose = require('mongoose');
var crypto = require('../util-implements/cryptojs-implement');
//var mail = require('../../util-implements/mail/configuracion/conf');
var conexion = {
    conectar: conectar,
    descontectar:descontectar
}
var dconect= process.env.conectString;


function conectar() {
    crypto.decode(dconect).then((dd)=>{
        return new Promise((resolve, reject) => {
            mongoose.connect(dd, { useMongoClient: true, promiseLibrary: global.Promise }, (err) => {
                if (err != null) {
    
                    resolve({ error: true });
    
                } else {
                    resolve({ error: false, type: err });
                }
            });
        })
    })
    

}

function descontectar(){
    mongoose.disconnect();
}

module.exports = conexion;