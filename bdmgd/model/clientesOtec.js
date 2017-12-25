var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var clientesOtec = Schema({
    identificador:Object,
    rol: Object,
    cliente: Object,
    cursosSuscrito: [{
        esquema:Object,
        curso: {
            data:Object

        },
        avances: [],
        pruebasContestadas: [
          
        ],
        

        fechaInscripcion: Object,
        terminoCurso:{
            fecha:""
        }

    }],
    temPruebaInit:Object






});
module.exports = mongoose.model('clientesOtec', clientesOtec);