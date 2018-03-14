'use strict'
var express = require('express');
var app= require('../controllers/app-controller.js');
var tokenImpl = require('../util-implements/token-implement');
var secureRouter = express.Router();

secureRouter.use(tokenImpl.tokenImpl.tokenImpl);

//9001b1  0xTU7FcVs7dfyttQ6EAG2fXvCkYYK0zZdrXZ4Mk7
secureRouter.post('/xgnto85VbsU2wJtvLD6Mysq7wG2XGcNyh3eeCpGdW0u',app.cursos.sendCursos);
//9001b2
secureRouter.post('/PI7DubTdRcpxlmq9vwdYwrT0OIn0HdkcR1Oxk0Hx2v6',app.cliente.login);
//900lb3
secureRouter.post('/zWpCaAW7Ztx3IVtLGGSCplaMnwXGW0zi1YEYxmrx2HxZ',app.cursos.subscribed);
//900lb4
secureRouter.post('/7oMLVbMxXnSYHN0hZp43YVPrhvF2sc9od5s4pb7I4Z96',app.cliente.informarTiempo);
//9001b5
secureRouter.post('/R9pmzAl6C7FQsUalBr2XlW90mpx4S8fvTxmOOH8INBPC',app.cliente.getPruebaTest);
//9001b6
secureRouter.post('/pGs8zKhyUUMruSIl4Y4tljpHqw1eGNrDZGXMewtPmjh8',app.cliente.informarInicionPrueba);
//9001b7
secureRouter.post('/TBEls8WMTk1NzeMvEfwkxWpyrInSq6ATpR32fH0CSIBO',app.complement.hora);
//9001b8
secureRouter.post('/TyMUGf7OVi9HDdc21G0VYrNWsPWdlxC8tYaHELOiJ7GZ',app.cliente.finalPrueba);
//9001b9
secureRouter.post('/79vXqTQJb/ynZxlZXZXg7KJSz9Z5u6rxM5NNXML9qVRb',app.cliente.reviewPruebaContestada);
//9001b10
secureRouter.post('/0URyoLnSvLvX3SWDj7MwfSaLj5vjLaJKJrwyXkbePTvf',app.cliente.terminarPrueba);
//9001b11
secureRouter.post('/h7iOFiEbRjpxAtnl5TyQ91PgWiYXB9RitmUCKPMlqviz',app.cliente.resultadoPrueba);
//9001b12
secureRouter.post('/455DFGDFJkdsjfskDJFKGD8FDKJkjfdgjKDFGJ894DJF',app.cliente.resultadoTerminoCurso);
//9001b13
secureRouter.post('/70XNJgdaXDoIWD2YqAKTsiyh01KUbIwqCv5AZL5puL5Q',app.cliente.updateEsquema);
//9001b14
secureRouter.post('/ip82IvDKN6ec5h6ktIcUMP8YFdEiw31ZeKurwD3XuXTr',app.cliente.getCurso);
module.exports =secureRouter; 
