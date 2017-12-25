var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var peticionesCurso = Schema({
    peticiones:[],
    concretadas:[],
    identificador:String
});
module.exports = mongoose.model('peticionescurso', peticionesCurso);