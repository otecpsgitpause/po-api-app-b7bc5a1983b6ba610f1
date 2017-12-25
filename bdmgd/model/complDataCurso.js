var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var complementodatacurso = Schema({
    areas:[]
});
module.exports = mongoose.model('complementodatacurso', complementodatacurso);