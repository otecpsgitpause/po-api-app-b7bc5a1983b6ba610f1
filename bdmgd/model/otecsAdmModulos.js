var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var otecsAdmModulos = Schema({
    identificador:Object,
    modulos:[
        
    ]
  
});
module.exports = mongoose.model('otecsadmmodulos', otecsAdmModulos);