var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cursos = Schema({
    identificador:Object,
    activo:Boolean,
    curso:Object,
    pruebasCurso:[],
    modulos:[{
    
            modulo:Object,
            pruebasModulo:[],
            clases:[
                {
                    clase:Object,
                    pruebasClase:[],
                    contenidos:[]
                }
            ]
            
    
        }
    ],
    esquema:Object

    
});
module.exports = mongoose.model('cursos', cursos);