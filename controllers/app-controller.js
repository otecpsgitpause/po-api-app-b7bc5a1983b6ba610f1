'use strict'
//controllers
var clientes = require('./controller/clientes-controller');
var cursos = require('./controller/cursos-controller');
var ntpClient = require('ntp-client');
var moment = require('moment');
var crypto = require('../util-implements/cryptojs-implement');

var app={

        cursos:{
            sendCursos:cursos.sendCurso,
            subscribed:cursos.subscribed
        },
        cliente:{
            login:clientes.login,
            informarTiempo:clientes.informarTiempo,
            getPruebaTest:clientes.getPruebaTest,
            informarInicionPrueba:clientes.informarInicioPrueba,
            finalPrueba:clientes.finalPrueba,
            reviewPruebaContestada:clientes.reviewPruebaContestada,
            terminarPrueba:clientes.terminarPrueba,
            resultadoPrueba:clientes.resultadoPrueba,
            resultadoTerminoCurso:clientes.resultadoTerminoCurso,
            updateEsquema:clientes.updateEsquema,
            getCurso:clientes.getCurso,
            responderPregunta:clientes.responderPregunta
        },
        complement:{
            hora:hora
        }



}

function hora(req,res){
    console.log("EJECUTANDO OBTENCIÓN DE HORA");
    let server= ['cl.pool.ntp.org','south-america.pool.ntp.org','ntp.shoa.cl'];
    let sendHora=false;
    for(let serve of server){
        ntpClient.getNetworkTime(serve,123,(err,data)=>{
            if(err==null && sendHora==false){
                let horaArr = moment(data).format('HH:mm:ss').split(':');
                let secHoraCal= (((Number.parseInt(horaArr[0])*60)*60)+(Number.parseInt(horaArr[1])*60))+Number.parseInt(horaArr[2]);
                let jHora= {
                    fecha:moment(data).format('MM-DD-YYYY'),
                    horaSplit:moment(data).format('HH:mm:ss').split(':'),
                    hora:moment(data).format('HH:mm:ss'),
                    horaInSec:secHoraCal
                }
                let strgData = JSON.stringify({ data: { hora:jHora,  } });
                crypto.encode(strgData).then((enc) => {
                    res.json({
                        d: enc,
                        success: true,
                        pet: true
                    })
                })
                sendHora=true;
            }else{
                sendHora=false;
            }
            console.log({ntpClient:{servidor:serve,err:err,data:data,horaMoment:moment(data).format('HH:mm:ss')}});
        })
    }
   
}


module.exports=app;  
