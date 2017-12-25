var app = require('./server/server-config');
var mongoDB = require('./bdmgd/conexion');
var mail = require('./util-implements/mail/configuracion/conf');

/*
conectMGDB();
var contador = 0;

function conectMGDB() {
    contador = contador + 1;

    mongoDB.conectar().then((mdb) => {
        if (mdb.error == true) {
      
            setTimeout(() => {  
                    conectMGDB();
                    mail.senMail();
            }, 600000);
            mail.senMail();
            console.log('servidor de base de datos no funcionando');
        } else {
            console.log('servidor de base de datos funcionando');
        }
    });


}*/