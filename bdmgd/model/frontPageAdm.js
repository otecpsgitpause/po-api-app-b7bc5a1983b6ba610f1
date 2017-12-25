var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var frontPageAdm = Schema({
   
    imagenes:{
        slider:[]
    },
    alertasMensajes:[],
    posiciones:[]

    
});
module.exports = mongoose.model('frontpageadm', frontPageAdm);