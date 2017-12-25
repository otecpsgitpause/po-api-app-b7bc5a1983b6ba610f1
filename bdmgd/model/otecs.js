var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var otecs = Schema({
    otec: Object,
    identificador:Object,
    clientes:[
        {
            cliente:Object,
            estado:Boolean
        }
    ],
    usuarios:[
        {
            usuario:Object,
            rol:Object,
            estado:Boolean
        }
    ]
});
module.exports = mongoose.model('otecs', otecs);