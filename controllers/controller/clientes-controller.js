var crypto = require('../../util-implements/cryptojs-implement');

//model
var mgdCursos = require('../../bdmgd/model/cursos');
var mgdClientesOtec = require('../../bdmgd/model/clientesOtec');
//library extern 
var _ = require('lodash');
var moment = require('moment');
var ntpClient = require('ntp-client');



var cliente = {
    cliente: {
        login: login,
        informarTiempo: informartiempo,
        getPruebaTest: getPruebaTest,
        informarInicioPrueba: informarInicioPrueba,
        finalPrueba: finalPrueba,
        reviewPruebaContestada: reviewPruebaContestada,
        terminarPrueba:terminarPrueba,
        resultadoPrueba:resultadoPrueba

    }
};

function resultadoPrueba(req,res){


    try{

        let data = req.body.data;
        let prueba = data.p;
        let cliente = data.u;
        let identificador = cliente.i;
        let curso = prueba.prueba.cod_curso; 
        
        mgdClientesOtec.findOne({"cliente.email":cliente.cliente.email,"identificador.key":identificador},(err,resCliente)=>{
            if(err==null && resCliente!=null){
                
                let idxCurso = _.findIndex(resCliente.cursosSuscrito,(o)=>{
                    return o.curso.data.cod_curso==curso;
                })
                let cursoItem = resCliente.cursosSuscrito[idxCurso];

                if(cursoItem.pruebasContestadas.length>0){

                    let idxPC = _.findIndex(cursoItem.pruebasContestadas,(o)=>{
                        return o.prueba.codPrueba==prueba.prueba.codPrueba;
                    });
                    
                    let pruebaContestada= cursoItem.pruebasContestadas[idxPC];

                    if(idxPC!=-1){
                       let idxResult=  Object.keys(pruebaContestada).indexOf('resultados');
                        if(idxResult!=-1){
                            //entregamos los resultados
                            method.respuesta({resPrueba:pruebaContestada,error:false,mensaje:null});
                        }else{
                            //hacer calculo
                            let respuestas = null;
                             if(Object.keys(pruebaContestada).indexOf('respuestas')!=-1){
                             respuestas = pruebaContestada.respuestas;
                             }
                            
                            let preguntas = pruebaContestada.preguntas;
                            let pruebaItems= pruebaContestada.prueba;
                            let resultados={
                                buenas:0,
                                malas:0,
                                totalPreguntas:0,
                                porcentajes:{
                                    buenas:0,
                                    malas:0,
                              
                                },
                                aprovada:null
                            };
                            resultados.totalPreguntas=pruebaContestada.preguntas.length;
                            console.log({respuesta:respuestas,preguntas:preguntas,pruebaItem:pruebaItems});
                            if(respuestas!=null){
                                    preguntas.forEach((pregunta,idxp)=>{
                               respuestas.forEach((respuesta,idxR)=>{
                                   if(Number.parseInt(pregunta.p.numero)==Number.parseInt(respuesta.p)){
                                     if(respuesta.c=='true' || respuesta.c==true){
                                         resultados.buenas= resultados.buenas+1;
                                     }else{
                                         resultados.malas= resultados.malas+1;
                                     }
                                   }else{
                                     resultados.malas= resultados.malas+1;
                                   }
                               })
                            })
                            
                            }else{
                                resultados.buenas=0;
                                resultados.malas=pruebaContestada.preguntas.length;
                           
                            
                            }
                    
                            resultados.porcentajes.buenas=((resultados.buenas*100)/preguntas.length);
                            resultados.porcentajes.malas=((resultados.malas*100)/preguntas.length);
                            if(Number.parseInt( resultados.porcentajes.buenas)> Number.parseInt(70) || Number.parseInt( resultados.porcentajes.buenas)== Number.parseInt(70)){
                                resultados.aprovada=true;
                            }else{
                                resultados.aprovada=false;
                            }

                            //actualizamos
                            resCliente.cursosSuscrito[idxCurso].pruebasContestadas[idxPC].resultados=resultados;
                            mgdClientesOtec.update({"cliente.email":cliente.cliente.email,"identificador.key":identificador},{
                                $set:{
                                    "cursosSuscrito":resCliente.cursosSuscrito
                                }
                            },(err,raw)=>{
                                if(err==null){
                                    method.respuesta({resPrueba:resCliente.cursosSuscrito[idxCurso].pruebasContestadas[idxPC],error:false,mensaje:null});
                                }else{
                                    method.respuesta({resPrueba:null,error:true,mensaje:'No se pudieron obtener los resultados'});
                                }
                            })

                            //entregamos resultados
                        }

                  


                    }else{
                        //entregamos resultados negativo
                        method.respuesta({resPrueba:null,error:true,mensaje:'No se pudieron obtener los resultados'});
                    }


                }else{
                    //entregamos resultado negativo
                    method.respuesta({resPrueba:null,error:true,mensaje:'No se pudieron obtener los resultados'});
                }

    
            }else{
                //entregamos resultado negativo
                method.respuesta({resPrueba:null,error:true,mensaje:'No se pudieron obtener los resultados'});
            }
        })
        
        
    }catch(e){

        method.respuesta({resPrueba:null,error:true,mensaje:null});

    }

    var method = {
        respuesta: (item) => {
            let strgData = JSON.stringify({ data: { resPrueba: item.resPrueba, error: item.error, mensaje: item.mensaje } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true
                })
            })
        }

    }


}

function terminarPrueba(req,res){

    try{
        let data = req.body.data;
        let respuestas = data.p.respuestas;
        let cliente= data.p.prueba.cliente;
        let identificador= data.p.prueba.i;
        let pruebaActiva= data.p.prueba.pruebaActiva;
        let pruebaCodigo=data.p.pruebaCodigo;
        let preguntas = data.p.preguntas;

        console.log({data:data,respuestas:respuestas,cliente:cliente,indentificador:identificador,pruebaActiva:pruebaActiva,preguntas:preguntas});
        mgdClientesOtec.findOne({"cliente.email":cliente.email,"identificador.key":identificador},(err,resCliente)=>{
           
            if(err==null && resCliente!=null){
               let idxCurso= _.findIndex(resCliente.cursosSuscrito,(o)=>{
                   return o.curso.data.cod_curso==pruebaCodigo.prueba.cod_curso;
               })

               if(idxCurso!=-1){
                    let curso = resCliente.cursosSuscrito[idxCurso];
                    let obInsert={
                        item:null,
                        prueba:null,
                        type:null,
                        idxs:null,
                        respuestas:respuestas,
                        preguntas:preguntas,
                        temPruebaInit:resCliente.temPruebaInit

                    }


                    var pruebaMethod={
                        insert:(objeto)=>{
                            if(curso.pruebasContestadas.length==0){

                                curso.pruebasContestadas.push(objeto);
                                resCliente.cursosSuscrito[idxCurso]=curso;
                                mgdClientesOtec.update({"cliente.email":cliente.email,"identificador.key":identificador},{
                                    $set:{
                                        "cursosSuscrito":resCliente.cursosSuscrito,
                                        "temPruebaInit":null
                                    }
                                },(error,raw)=>{
                                    mgdClientesOtec.findOne({"cliente.email":cliente.email,"identificador.key":identificador},(err,resCliente)=>{
                                        if(err==null && resCliente!=null){
                                            if(error==null){
                                                console.log({actualizacion:raw});
                                                pruebaMethod.respuesta({ curso:resCliente.cursosSuscrito[idxCurso], error:false, mensaje:'Se a registrado su prueba con exito' });
                                                
                                               
                                            }else{
                                                console.log({actualizacion:raw,mensaje:'no actualizo nada'});
                                                pruebaMethod.respuesta({ curso:resCliente.cursosSuscrito[idxCurso], error:true, mensaje:'No se pudo registrar la prueba' });
                                            }
                                           
                                        }else{
                                            pruebaMethod.respuesta({ curso:null, error:true, mensaje:'No se pudo obtener la lista de cursos' });
                                        }
                                    
                                   
                                })
                                
                                })




                          
                            }else{
                                let idxPrueba= _.findIndex(curso.pruebasContestadas,(o)=>{
                                    return o.prueba.codPrueba==pruebaCodigo.prueba.codPrueba;
                                })

                                if(idxPrueba==-1){
                                    curso.pruebasContestadas.push(objeto);
                                    resCliente.cursosSuscrito[idxCurso]=curso;
                                    mgdClientesOtec.update({"cliente.email":cliente.email,"identificador.key":identificador},{
                                        $set:{
                                            "cursosSuscrito":resCliente.cursosSuscrito,
                                            "temPruebaInit":null
                                        }
                                    },(error,raw)=>{
                                        mgdClientesOtec.findOne({"cliente.email":cliente.email,"identificador.key":identificador},(err,resCliente)=>{
                                            if(err==null && resCliente!=null){
                                                if(error==null){
                                                    console.log({actualizacion:raw});
                                                    pruebaMethod.respuesta({ curso:resCliente.cursosSuscrito[idxCurso], error:false, mensaje:null });
                                                    
                                                   
                                                }else{
                                                    console.log({actualizacion:raw,mensaje:'no actualizo nada'});
                                                    pruebaMethod.respuesta({ curso:resCliente.cursosSuscrito[idxCurso], error:true, mensaje:'No se pudo registrar la prueba' });
                                                }
                                               
                                            }else{
                                                pruebaMethod.respuesta({ curso:null, error:true, mensaje:'No se pudo obtener la lista de cursos' });
                                            }
                                        
                                       
                                    })
                                    
                                    })
                                }else{
                                    pruebaMethod.respuesta({ curso:resCliente.cursosSuscrito[idxCurso], error:true, mensaje:'La prueba ya se encuntra registrada' });
                                }
                            
                            }
                            
                          
                        },
                        respuesta: (item) => {
                            let strgData = JSON.stringify({ data: { curso: item.curso, error: item.error, mensaje: item.mensaje } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true
                                })
                            })
                        }
                    }


                    curso.esquema.modulos.forEach((modulo,idxM)=>{
                        modulo.pruebas.forEach((pb,idxpb)=>{
                            if(pb.prueba.codPrueba==pruebaCodigo.prueba.codPrueba){
                                obInsert.item=modulo.modulo;
                                obInsert.prueba=pb.prueba;
                                obInsert.type='modulo';
                                let idxs={
                                    idxCurso:idxCurso,
                                    idxModulo:idxM,
                                    idxPrueba:idxpb
                                }
                                obInsert.idxs=idxs;
                                let indexPrueba= idxpb+1;
                                if(modulo.pruebas.length==indexPrueba){
                                    curso.esquema.modulos[idxM].completado=true;
                                }
                                curso.esquema.modulos[idxM].pruebas[idxpb].completado=true;

                                pruebaMethod.insert(obInsert); 
                            }
                        })
                        modulo.clases.forEach((clase,idxcla)=>{
                            clase.pruebas.forEach((pb,idxpc)=>{
                                if(pb.prueba.codPrueba==pruebaCodigo.prueba.codPrueba){
                                    obInsert.item={modulo:modulo.modulo, clase:clase.clase};
                                    obInsert.prueba=pb.prueba;
                                    obInsert.type='clase';
                                    let idxs={
                                        idxCurso:idxCurso,
                                        idxModulo:idxM,
                                        idxClase:idxcla,
                                        idxPrueba:idxpc
                                    }
                                    obInsert.idxs=idxs;
                                    let indexPrueba= idxpc+1;
                                    if(clase.pruebas.length==indexPrueba){
                                        curso.esquema.modulos[idxM].clases[idxcla].completado=true;
                                    }
                                    curso.esquema.modulos[idxM].clases[idxcla].pruebas[idxpc].completado=true;
                                    pruebaMethod.insert(obInsert);
                                }
                            })
                        })
                    })

                    curso.esquema.pruebas.forEach((pb,idxpb)=>{
                        if(pb.prueba.codPrueba==pruebaCodigo.prueba.codPrueba){
                            obInsert.item=curso.esquema.curso;
                            obInsert.prueba=pb.prueba;
                            obInsert.type='curso';
                            let idxs={
                                idxCurso:idxCurso,
                                idxPrueba:idxpb
                            }
                            obInsert.idxs=idxs;
                            let indexPrueba= idxpb+1;
                            if(curso.esquema.pruebas.length==indexPrueba){
                                curso.esquema.completado=true;
                                fechaHoy().then((fecha)=>{
                                    curso.terminoCurso.fecha=fecha;
                                })
                                
                            }
                            curso.esquema.pruebas[idxpb].completado=true;
                            pruebaMethod.insert(obInsert);
                        }
                    })

            



               }

               
            }
        })



    }catch(e){
        pruebaMethod.respuesta({ curso:null, error:true, mensaje:'Hubo un error al registrar la prueba' });
        
    }
  




    
}

function login(req, res) {

    try {

        let data = req.body.data;
        let identificador = req.body.ident;
        console.log({ data: data, identificador: identificador });
        mgdClientesOtec.find({ "identificador.key": identificador, "cliente.email": data.user }, (err, resCliente) => {
            if (err == null && resCliente.length != 0) {
                console.log({ clienteAuth: resCliente[0] });
                //resCliente[0].cursosSuscrito
                let temPruebas = resCliente[0].temPruebaInit;
                let pruebaEjecut = false
                let codPrueba = null;
                let codClase = null;
                let codModulo = null;
                let codCurso = null;
                let type = null;
                //console.log({pruebaTemPruebaEnLogin:Object.keys(resCliente[0].temPruebaInit)});
                try {
                    if (Object.keys(temPruebas).length > 0) {
                        pruebaEjecut = true;

                        if (temPruebas.p.prueba.tipoCodigoItem == 'cod_clases_item') {
                            type = "clase";
                            codClase = temPruebas.p.prueba.cod_item;
                            codCurso = temPruebas.p.prueba.cod_curso;
                            codPrueba = temPruebas.p.prueba.codPrueba;
                        }
                    }
                } catch (e) {
                    pruebaEjecut = false;
                }
                fechaHoy().then((fecha)=>{
                    let cliente = { cliente: resCliente[0].cliente, i: resCliente[0].identificador.key, rol: resCliente[0].rol, pruebaActiva:resCliente[0].temPruebaInit,fechaHoy:fecha };
                    let strgData = JSON.stringify({ data: { client: cliente, i: true } });
                    crypto.encode(strgData).then((enc) => {
                        res.json({
                            d: enc,
                            success: true,
                            pet: true
                        })
                    })
                })
               
            } else {
                let strgData = JSON.stringify({ data: { client: null, i: false } });
                crypto.encode(strgData).then((enc) => {
                    res.json({
                        d: enc,
                        success: true,
                        pet: true
                    })
                })
            }
        });


    } catch (e) {
        let strgData = JSON.stringify({ data: { client: null, i: false } });
        crypto.encode(strgData).then((enc) => {
            res.json({
                d: enc,
                success: true,
                pet: true
            })
        })
    }

}

function informartiempo(req, res) {
    console.log({ informarTiempo: req.body });

    try{
        

        let user = req.body.data.u;
        let time = req.body.data.tiempo.tiempo;
        let clase = req.body.data.tiempo.clase;
        let curso = req.body.data.tiempo.curso;
        let identificadorApp = req.body.IdentificadorApp;
        let identificador = req.body.ident;
        let cnt = req.body.data.tiempo.cnt;
    
        console.log({ user: user, time: time, clase: clase, curso: curso, identificadorApp: identificadorApp, identificador: identificador, cnt: cnt });
        mgdClientesOtec.findOne({ "cliente.rut": user.cliente.rut, "identificador.key": identificador }, (err, resEstudiante) => {
            if (err == null && resEstudiante != null) {
                let cursosSuscritos = resEstudiante.cursosSuscrito;
                let idxCurso = _.findIndex(cursosSuscritos, (o) => {
                    return o.curso.data.cod_curso == curso
                })
                if (idxCurso != -1) {
                    let cursoUpdate = resEstudiante.cursosSuscrito[idxCurso];
                    cursoUpdate.esquema.modulos[cnt.im].clases[cnt.ic].clase.horasClaseSegundos = time;
                    resEstudiante.cursosSuscrito[idxCurso] = cursoUpdate;
                    mgdClientesOtec.update({ "cliente.rut": user.cliente.rut, "identificador.key": identificador }, {
                        $set: {
                            "cursosSuscrito": resEstudiante.cursosSuscrito
                        }
                    }, (err, raw) => {
                        if (err == null) {
                            mgdClientesOtec.findOne({ "cliente.rut": user.cliente.rut, "identificador.key": identificador }, (err, resEstudianteUpdate) => {
                                if (err == null && resEstudianteUpdate != null) {
                                    method.respuesta({ curso: resEstudianteUpdate.cursosSuscrito[idxCurso], error: false, mensaje: 'Tiempo actualizado con exito' });
                                } else {
                                    method.respuesta({ curso: resEstudiante.cursosSuscrito[idxCurso], error: true, mensaje: 'Ocurrio un error al realizarce la actualización del tiempo' });
                                }
                            })
                        } else {
                            method.respuesta({ curso: null, error: true, mensaje: 'Ocurrio un error al realizarce la actualización del tiempo' });
                        }
                    })
                }
            } else {
                method.respuesta({ curso: null, error: true, mensaje: 'Usuario no encontrado' });
            }
        })



    }catch(e){
        method.respuesta({ curso: null, error: true, mensaje: 'Ocurrio un error al realizarce la actualización del tiempo' });
    }


    var method = {
        respuesta: (item) => {
            let strgData = JSON.stringify({ data: { curso: item.curso, error: item.error, mensaje: item.mensaje } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true
                })
            })
        }

    }
    /*
    mgdClientesOtec.find({ "cliente.rut": user.cliente.rut, "identificador.key": identificador }, (err, resEstudiante) => {
        if (resEstudiante.length != 0) {
            /**
             * Informar tiempo en el esquema
             */
    /*    console.log({ resEstudiante: resEstudiante[0].cursosSuscrito });
        let indexCurso = _.findIndex(resEstudiante[0].cursosSuscrito, function (o) { return o.curso.data.cod_curso == curso; });
        console.log({ indexCurso: indexCurso });
        if (indexCurso != -1) {

            if (time == 0) {
                resEstudiante[0].cursosSuscrito[indexCurso].esquema.modulos[Number.parseInt(cnt.im)].clases[Number.parseInt(cnt.ic)].completado = true;
                resEstudiante[0].cursosSuscrito[indexCurso].esquema.modulos[Number.parseInt(cnt.im)].clases[Number.parseInt(cnt.ic)].clase.horasClaseSegundos = time;
            } else {
                resEstudiante[0].cursosSuscrito[indexCurso].esquema.modulos[Number.parseInt(cnt.im)].clases[Number.parseInt(cnt.ic)].clase.horasClaseSegundos = time;
            }


            mgdClientesOtec.update({ "cliente.rut": user.cliente.rut, "identificador.key": identificador }, {
                $set: {
                    "cursosSuscrito": resEstudiante[0].cursosSuscrito
                }
            }, (err, rawTimeRes) => {
                if (err == null) {
                    console.log({ actualizacion: rawTimeRes });
                    mgdClientesOtec.findOne({ "cliente.rut": user.cliente.rut, "identificador.key": identificador }, (err, resCursoUser) => {
                        if (resCursoUser.length != 0) {
                            let strgData = JSON.stringify({ data: { curso: resCursoUser.cursosSuscrito, u: true } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true,
                                    pet: true
                                })
                            })
                        }

                    })
                } else {
                    let strgData = JSON.stringify({ data: { curso: [], u: false } });
                    crypto.encode(strgData).then((enc) => {
                        res.json({
                            d: enc,
                            success: true,
                            pet: true
                        })
                    })
                }
            })
        } else {
            let strgData = JSON.stringify({ data: { curso: [], u: false } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true,
                    pet: true
                })
            })
        }


    }
});
console.log({ user: user, time: time, clase: clase, identificadorApp: identificadorApp, identificador: identificador });
*/
}

function dataHoraPMethod(prueba) {
    return new Promise((resolve, reject) => {
        console.log("EJECUTANDO OBTENCIÓN DE HORA Metodo Privado");
        console.log({ laPruebita: prueba });
        let server = ['cl.pool.ntp.org', 'south-america.pool.ntp.org', 'ntp.shoa.cl'];
        let sendHora = false;
        let segundosPrueba = prueba.prueba.duracion.split(':');
        let calSP = ((segundosPrueba[0] * 60) * 60) + (segundosPrueba[1] * 60);
        for (let serve of server) {
            ntpClient.getNetworkTime(serve, 123, (err, data) => {
                if (err == null && sendHora == false) {
                    let jData = {
                        fecha: moment(data).format('MM-DD-YYYY'),
                        hInicio: moment(data).format('HH:mm:ss').split(':'),
                        hFinal: moment(data).seconds(calSP).format('HH:mm:ss').split(':'),
                        hIniciosp:moment(data).format('HH:mm:ss'),
                        hFinalsp:moment(data).seconds(calSP).format('HH:mm:ss'),
                        segundosPrueba: calSP
                    }
                    resolve(jData);
                    sendHora = true;
                } else {
                    sendHora = false;
                }
                console.log({ ntpClient: { servidor: serve, err: err, data: data, horaMoment: moment(data).format('HH:mm:ss') } });
            })
        }
    })
}

function fechaHoy(){
    return new Promise((resolve,reject)=>{
        let jData;
        let server = ['cl.pool.ntp.org', 'south-america.pool.ntp.org', 'ntp.shoa.cl'];
       
            ntpClient.getNetworkTime(server[2], 123, (err, data) => {
                jData = {
                    fechaHoy: moment(data).format('MM-DD-YYYY'),
                    horahoy: moment(data).format('HH:mm:ss').split(':'),
                    horahoyses:moment(data).format('HH:mm:ss')
    
                }
                resolve(jData);
            })
    })


}



function getPruebaTest(req, res) {

    try {
        let data = req.body.data;
        let prueba = data.p;
        let identificador = data.u.i;
        let cliente = data.u.cliente;
        console.log({ cliente: cliente });
        mgdClientesOtec.findOne({ "cliente.email": cliente.email, "identificador.key": identificador }, (err, resCliente) => {
            if (err == null && resCliente != null) {
                mgdCursos.findOne({ "curso.cod_curso": prueba.cod_curso }, (err, resCurso) => {
                    fechaHoy().then((fechaHoyItem)=>{
                        if (err == null && resCurso != null) {
                            resCurso.modulos.forEach((m, idxm) => {
                                m.pruebasModulo.forEach((pm, pmidx) => {
                                    if (pm.prueba.codPrueba == prueba.codPrueba) {
                                        if (resCliente.temPruebaInit == null) {
                                        
                                            method.setPruebaActivate({ email: cliente.email, identificador: identificador, prueba: { prueba: pm, idx: { idxp: pmidx, idxModulo: idxm }, type: 'modulo',fecha:fechaHoyItem } });
                                        } else {
                                            method.respuesta({ prueba: { prueba: pm, idx: { idxp: pmidx, idxModulo: idxm }, type: 'modulo',fecha:fechaHoyItem }, error: false, mensaje: null, temPruebaInit: resCliente.temPruebaInit });
                                        }
    
                                    }
                                })
                                m.clases.forEach((cla, idxCla) => {
                                    cla.pruebasClase.forEach((pcla, pIdxCla) => {
                                        if (pcla.prueba.codPrueba == prueba.codPrueba) {
                                            if (resCliente.temPruebaInit == null) {
                                                method.setPruebaActivate({ email: cliente.email, identificador: identificador, prueba: { prueba: pcla, idx: { idxp: pIdxCla, idxClase: idxCla, idxModulo: idxm }, type: 'clase',fecha:fechaHoyItem } });
                                            } else {
                                                method.respuesta({ prueba: { prueba: pcla, idx: { idxp: pIdxCla, idxClase: idxCla, idxModulo: idxm }, type: 'clase',fecha:fechaHoyItem }, error: false, mensaje: null, temPruebaInit: resCliente.temPruebaInit });
                                            }
    
                                        }
                                    })
                                })
                            })
                            resCurso.pruebasCurso.forEach((pcur, idxpcur) => {
                                if (pcur.prueba.codPrueba == prueba.codPrueba) {
                                    if (resCliente.temPruebaInit == null) {
                                        method.setPruebaActivate({ email: cliente.email, identificador: identificador, prueba: { prueba: pcur, idx: { idxp: idxpcur }, type: 'curso',fecha:fechaHoyItem } });
                                    } else {
                                        method.respuesta({ prueba: { prueba: pcur, idx: { idxp: idxpcur }, type: 'curso',fecha:fechaHoyItem }, error: false, mensaje: null, temPruebaInit: resCliente.temPruebaInit });
                                    }
    
                                }
                            })
                        } else {
                            method.respuesta({ prueba: null, error: true, mensaje: null,temPruebaInit:null });
                        }
    
                    }).catch(()=>{
                        method.respuesta({ prueba: null, error: true, mensaje: null,temPruebaInit:null });
                    })
                    
        

                })
            } else {
                method.respuesta({ prueba: null, error: true, mensaje: null,temPruebaInit:null });
            }
        })

        console.log({ getPruebaTest: data });

    } catch (e) {
        method.respuesta({ prueba: null, error: true, mensaje: null,temPruebaInit:null })
    }
    var method = {
        respuesta: (item) => {
            let strgData = JSON.stringify({ data: { prueba: item.prueba, error: item.error, mensaje: item.mensaje, temPruebaInit: item.temPruebaInit } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true
                })
            })
        },
        setPruebaActivate: (item) => {
     
            dataHoraPMethod(item.prueba.prueba).then((time) => {

                let prueba = {
                    prueba: item.prueba.prueba.prueba,
                    tiempo: time
                }
                
            
                mgdClientesOtec.update({ "cliente.email": item.email, "identificador.key": item.identificador }, {
                    $set: {
                        "temPruebaInit": prueba
                    }
                }, (err, raw) => {
                    if (err == null) {
                        method.respuesta({ prueba: item.prueba, error: false, mensaje: null, temPruebaInit: prueba });
                    }else{
                        method.respuesta({ prueba: null, error: false, mensaje: null, temPruebaInit: null });
                    }
                })
           
            })

            /*
            mgdClientesOtec.update({"cliente.email":item.email,"identificador.key":item.identificador},{
                $set:{
                    "temPruebaInit":null
                }
            },(err,raw)=>{

            })*/
        }

    }

    /*
        try {
            let data = req.body.data.p;
            let curso = data.c;
            let prueba = data.p.p;
            let im = data.p.im;
            let ic = data.p.ic;
            let identificador = req.body.ident;
            let type = req.body.data.p.p.type;
            let cliente = req.body.data.u.cliente;
            console.log({ dataConMuchoMoco: cliente });
            console.log({ pruebaReview: prueba });
            console.log({ dataCursoReview: curso });
            console.log({ tipoPrueba: type });
    
    
            mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (err, resDataClient) => {
                if (err == null && resDataClient.length) {
                    let idxCurso = _.findIndex(resDataClient[0].cursosSuscrito, (o) => {
                        return o.curso.data.cod_curso == curso;
                    })
    
                    let cursoFinds = resDataClient[0].cursosSuscrito[idxCurso];
                    let idxPrueba = 0;
                    if (cursoFinds.pruebasContestadas.length > 0) {
                        if (type == 'curso') {
                            idxPrueba = _.findIndex(cursoFinds.pruebasContestadas, (o) => {
                                return o.prueba.codPrueba == prueba;
                            });
                            console.log({ getPruebaTestTypePrueba: type });
                        }
                        else if (type == 'modulo') {
                            idxPrueba = _.findIndex(cursoFinds.pruebasContestadas, (o) => {
                                return o.prueba.codPrueba == prueba;
                            });
                        } else if (type == 'clase') {
                            idxPrueba = _.findIndex(cursoFinds.pruebasContestadas, (o) => {
                                return o.prueba.prueba.codPrueba == prueba;
                            });
                        }
    
    
                        if (idxPrueba == -1) {
                            console.log('ENVIANDO PRUEBA PORFAVOR');
                            sendPrueba.envioPrueba();
                        } else {
                            let strgData = JSON.stringify({ data: { prueba: null, p: false, m: "prueba ya respondida", temPrueba: null } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true,
                                    pet: true
                                })
                            })
                        }
    
                    } else {
                        sendPrueba.envioPrueba();
                    }
    
    
                }
            })
    
            let sendPrueba = {
                envioPrueba: () => {
                    mgdCursos.find({ "curso.cod_curso": curso, "identificador.key": identificador }, (err, resCurso) => {
    
                        var findPruebas = {
                            curso: () => {
                                let indexPrueba = _.findIndex(resCurso[0].pruebasCurso, (o) => {
                                    return o.prueba.codPrueba == prueba;
                                })
                                let pruebaItem = resCurso[0].pruebasCurso[indexPrueba];
                                mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (errCliente, resCliente) => {
                                    console.log({ respuestaDeResCliente: resCliente, errResCliente: errCliente });
                                    if (errCliente == null && resCliente.length > 0) {
                                        let indexObject = Object.keys(resCliente[0]._doc).indexOf('temPruebaInit');
                                        console.log({ objetosDeResCliente: Object.keys(resCliente[0]) });
                                        if (indexObject != -1) {
                                            if (resCliente[0].temPruebaInit != null) {
                                                let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: resCliente[0].temPruebaInit, horas: resCliente[0].temPruebaInit, hInitp: null } });
                                                crypto.encode(strgData).then((enc) => {
                                                    res.json({
                                                        d: enc,
                                                        success: true,
                                                        pet: true
                                                    })
                                                })
                                            } else {
                                                dataHoraPMethod(pruebaItem).then((h) => {
                                                    let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: resCliente[0].temPruebaInit, horas: null, hInitp: h } });
                                                    crypto.encode(strgData).then((enc) => {
                                                        res.json({
                                                            d: enc,
                                                            success: true,
                                                            pet: true
                                                        })
                                                    })
                                                })
    
                                            }
                                            console.log({ resClienteMasMoco: resCliente[0] });
    
                                        } else {
                                            console.log({ resClienteMasMoco: resCliente[0] });
                                            let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: null } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        }
                                    }
                                })
                            },
                            modulo: () => {
                                let indexPrueba = _.findIndex(resCurso[0].modulos[Number.parseInt(im)].pruebasModulo, (o) => {
                                    return o.prueba.codPrueba == prueba;
                                })
                                let pruebaItem = resCurso[0].modulos[Number.parseInt(im)].pruebasModulo[indexPrueba];
    
    
                                mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (errCliente, resCliente) => {
                                    console.log({ respuestaDeResCliente: resCliente, errResCliente: errCliente });
                                    if (errCliente == null && resCliente.length > 0) {
                                        let indexObject = Object.keys(resCliente[0]._doc).indexOf('temPruebaInit');
                                        console.log({ objetosDeResCliente: Object.keys(resCliente[0]) });
                                        if (indexObject != -1) {
                                            if (resCliente[0].temPruebaInit != null) {
                                                let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: resCliente[0].temPruebaInit, horas: resCliente[0].temPruebaInit, hInitp: null } });
                                                crypto.encode(strgData).then((enc) => {
                                                    res.json({
                                                        d: enc,
                                                        success: true,
                                                        pet: true
                                                    })
                                                })
                                            } else {
                                                dataHoraPMethod(pruebaItem).then((h) => {
                                                    let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: resCliente[0].temPruebaInit, horas: null, hInitp: h } });
                                                    crypto.encode(strgData).then((enc) => {
                                                        res.json({
                                                            d: enc,
                                                            success: true,
                                                            pet: true
                                                        })
                                                    })
                                                })
    
                                            }
                                            console.log({ resClienteMasMoco: resCliente[0] });
    
                                        } else {
                                            console.log({ resClienteMasMoco: resCliente[0] });
                                            let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: null } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        }
                                    }
                                })
    
                            },
                            clase: () => {
                                console.log({ codPrueba: prueba, arrayPruebasClase: resCurso[0].modulos[Number.parseInt(im)].clases[Number.parseInt(ic)].pruebasClase });
                                let indexPrueba = _.findIndex(resCurso[0].modulos[Number.parseInt(im)].clases[Number.parseInt(ic)].pruebasClase, (o) => {
                                    return o.prueba.codPrueba == prueba;
                                })
                                console.log({ indexObtenido: indexPrueba });
                                let pruebaItem = resCurso[0].modulos[Number.parseInt(im)].clases[Number.parseInt(ic)].pruebasClase[indexPrueba];
    
    
                                mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (errCliente, resCliente) => {
                                    console.log({ respuestaDeResCliente: resCliente, errResCliente: errCliente });
                                    if (errCliente == null && resCliente.length > 0) {
                                        let indexObject = Object.keys(resCliente[0]._doc).indexOf('temPruebaInit');
                                        console.log({ objetosDeResCliente: Object.keys(resCliente[0]) });
                                        if (indexObject != -1) {
                                            if (resCliente[0].temPruebaInit != null) {
                                                let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: resCliente[0].temPruebaInit, horas: resCliente[0].temPruebaInit, hInitp: null } });
                                                crypto.encode(strgData).then((enc) => {
                                                    res.json({
                                                        d: enc,
                                                        success: true,
                                                        pet: true
                                                    })
                                                })
                                            } else {
                                                dataHoraPMethod(pruebaItem).then((h) => {
                                                    let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: resCliente[0].temPruebaInit, horas: null, hInitp: h } });
                                                    crypto.encode(strgData).then((enc) => {
                                                        res.json({
                                                            d: enc,
                                                            success: true,
                                                            pet: true
                                                        })
                                                    })
                                                })
    
                                            }
                                            console.log({ resClienteMasMoco: resCliente[0] });
    
                                        } else {
                                            console.log({ resClienteMasMoco: resCliente[0] });
                                            let strgData = JSON.stringify({ data: { prueba: pruebaItem, p: true, m: null, temPrueba: null } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        }
                                    }
                                })
                            }
    
                        }
    
                        if (type == 'curso') {
                            findPruebas.curso();
    
                        } else if (type == 'modulo') {
                            findPruebas.modulo();
    
                        } else if (type == 'clase') {
    
                            findPruebas.clase();
    
                        }
    
    
                    })
                }
            }
    
            console.log({ dataItemgetPruebatest: req.body.data.p.p })
        } catch (e) {
            let strgData = JSON.stringify({ data: { prueba: null, p: false, m: "No se pudo cargar la prueba", temPrueba: null } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true,
                    pet: true
                })
            })
        }
    */

}

function informarInicioPrueba(req, res) {


    try {


        let data = req.body.data;
        let cliente = data.u.cliente;
        let prueba = data.p;
        console.log({ informarInicioPrueba: prueba });
        console.log({ dataInformarInicioPrueba: data });
        //persistencie

        mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (errCli, rescli) => {
            if (errCli == null && rescli.length > 0) {
                let indexObject = Object.keys(rescli[0]).indexOf('temPruebaInit');
                if (indexObject != -1) {
                    if (rescli[0].temPruebaInit == null) {
                        mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {
                            $set: {
                                "temPruebaInit": data
                            }
                        }, (err, rawCliente) => {
                            if (err == null) {
                                let strgData = JSON.stringify({ data: { infP: true } });
                                crypto.encode(strgData).then((enc) => {
                                    res.json({
                                        d: enc,
                                        success: true,
                                        pet: true
                                    })
                                })
                            } else {
                                let strgData = JSON.stringify({ data: { infP: false } });
                                crypto.encode(strgData).then((enc) => {
                                    res.json({
                                        d: enc,
                                        success: true,
                                        pet: true
                                    })
                                })
                            }
                        })




                    }
                } else {
                    mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {
                        $set: {
                            "temPruebaInit": data
                        }
                    }, (err, rawCliente) => {
                        if (err == null) {
                            let strgData = JSON.stringify({ data: { infP: true } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true,
                                    pet: true
                                })
                            })
                        } else {
                            let strgData = JSON.stringify({ data: { infP: false } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true,
                                    pet: true
                                })
                            })
                        }
                    })
                }
            }
        })


    } catch (e) {
        res.status(200);
    }




}

function finalPrueba(req, res) {
    /**
     * CUANDO TERMINA LA PRUEBA ESTE METODO ACTUALIZA LA BASE DE DATOS
     */

    console.log({ datafinalizaPrueba: req.body.data });

    try {
        let data = req.body.data;
        let respuestas = data.p.anw;
        let prueba = data.p.prueba;
        let cliente = data.u.cliente;


        if (respuestas != '' || respuestas != null) {
            console.log("ENTRE EN EL IF ");
            if (Object.keys(respuestas).length > 0) {
                mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (err, resCliente) => {
                    if (err == null && resCliente.length > 0) {
                        let inxCursoSus = _.findIndex(resCliente[0].cursosSuscrito, (o) => {
                            return o.curso.data.cod_curso == prueba.prueba.cod_curso;
                        })
                        let curso = resCliente[0].cursosSuscrito[inxCursoSus];


                        let pruebaContestada = {
                            prueba: prueba.prueba,
                            totalPreguntas: prueba.preguntasAlternativas.length,
                            totalRespuestas: 0,
                            totalBuena: 0,
                            minibuena: 0,
                            aprovada: false,
                            porcentajeBuena: 0
                        }
                        let pruebasRespondidas = [];

                        let respuestasCliente = respuestas.respuesta[0].respuesta;
                        prueba.preguntasAlternativas.forEach((pregunta, idxPreguntaAlt) => {
                            let idxPregunta = _.findIndex(respuestasCliente, (o) => {
                                return o.p == pregunta.p.numero;
                            })
                            if (idxPregunta == -1) {
                                respuestasCliente.push({ p: pregunta.p.numero, rest: 'false' });
                            }
                        })
                        let totalBuenas = [];
                        respuestasCliente.forEach((respuestaItem) => {
                            if (respuestaItem.rest == 'true') {
                                totalBuenas.push(true);
                            }
                            console.log({ resCli: respuestaItem });
                        })

                        let minBuenas = Math.trunc((prueba.preguntasAlternativas.length * 60) / 100);
                        let porcentaje = Math.trunc((totalBuenas.length * 100) / prueba.preguntasAlternativas.length);
                        pruebaContestada.totalRespuestas = respuestasCliente.length;
                        pruebaContestada.totalBuena = totalBuenas.length;
                        pruebaContestada.minibuena = minBuenas;
                        if (totalBuenas.length >= minBuenas) {
                            pruebaContestada.aprovada = true;
                        }
                        pruebaContestada.porcentajeBuena = porcentaje;
                        if (curso.pruebasContestadas.length > 0) {
                            let idxPrueba = _.findIndex(curso.pruebasContestadas, (o) => {
                                return o.prueba.codPrueba == pruebaContestada.prueba.codPrueba;
                            })
                            if (idxPrueba == -1) {
                                resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas.push(pruebaContestada);
                            } else {
                                resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas[idxPrueba] = pruebaContestada;
                            }
                        } else {
                            resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas.push(pruebaContestada);
                        }

                        mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {
                            $set: {
                                "cursosSuscrito": resCliente[0].cursosSuscrito,
                                "temPruebaInit": null
                            }
                        }, (err, rawUpdate) => {
                            console.log({ errMoco: err, rawUpdate: rawUpdate });
                            if (err == null) {
                                actualizaEstadoPruebaPMethod({ curso: resCliente[0].cursosSuscrito[inxCursoSus], prueba: prueba.prueba }).then((resChangeStateTest) => {
                                    resCliente[0].cursosSuscrito[inxCursoSus] = resChangeStateTest;
                                    mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {
                                        $set: {
                                            "cursosSuscrito": resCliente[0].cursosSuscrito,
                                            "temPruebaInit": null
                                        }
                                    }, (err, rawUpdatePrueba) => {
                                        if (err == null) {
                                            let strgData = JSON.stringify({ data: { compPrueba: true } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                            console.log('todo actualizado');
                                        } else {
                                            let strgData = JSON.stringify({ data: { compPrueba: false } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        }
                                    })


                                })
                            }
                        })

                    }
                })
            } else {

                let pruebaContestada = {
                    prueba: prueba.prueba,
                    totalPreguntas: prueba.preguntasAlternativas.length,
                    totalRespuestas: 0,
                    totalBuena: 0,
                    minibuena: 0,
                    aprovada: false,
                    porcentajeBuena: 0
                }
                let pruebasRespondidas = [];
                let totalBuenas = [];
                let minBuenas = Math.trunc((prueba.preguntasAlternativas.length * 60) / 100);

                pruebaContestada.minibuena = minBuenas;
                pruebaContestada.porcentajeBuena = 0;
                console.log('no hay respuestas con mas mantecol');
                mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (err, resCliente) => {
                    if (err == null && resCliente.length > 0) {
                        let inxCursoSus = _.findIndex(resCliente[0].cursosSuscrito, (o) => {
                            return o.curso.data.cod_curso == prueba.prueba.cod_curso;
                        })
                        let curso = resCliente[0].cursosSuscrito[inxCursoSus];





                        if (Object.keys(resCliente[0]._doc).indexOf('pruebasContestadas') != -1) {
                            let inxPruebaExistente = _.findIndex(resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas, (o) => {
                                return o.prueba.prueba.codPrueba == pruebaContestada.prueba.codPrueba;
                            })
                            if (inxPruebaExistente == -1) {
                                resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas.push(pruebaContestada);
                                actualizaEstadoPruebaPMethod({ curso: resCliente[0].cursosSuscrito[inxCursoSus], prueba: prueba.prueba }).then((resChangeStateTest) => {
                                    resCliente[0].cursosSuscrito[inxCursoSus] = resChangeStateTest;
                                    mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                                        $set: {
                                            "cursosSuscrito": resCliente[0].cursosSuscrito,
                                            "temPruebaInit": null
                                        }
                                    }, (err, updatePruebaRescliente) => {
                                        if (err == null) {



                                            let strgData = JSON.stringify({ data: { compPrueba: true } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        } else {
                                            let strgData = JSON.stringify({ data: { compPrueba: false } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        }
                                    })

                                })
                            } else {
                                resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas[inxPruebaExistente] = pruebaContestada;
                                actualizaEstadoPruebaPMethod({ curso: resCliente[0].cursosSuscrito[inxCursoSus], prueba: prueba.prueba }).then((resChangeStateTest) => {
                                    resCliente[0].cursosSuscrito[inxCursoSus] = resChangeStateTest;
                                    mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                                        $set: {
                                            "cursosSuscrito": resCliente[0].cursosSuscrito,
                                            "temPruebaInit": null
                                        }
                                    }, (err, updatePruebaRescliente) => {
                                        if (err == null) {



                                            let strgData = JSON.stringify({ data: { compPrueba: true } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        } else {
                                            let strgData = JSON.stringify({ data: { compPrueba: false } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        }
                                    })

                                })
                            }
                            mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                                $set: {
                                    "cursosSuscrito": resCliente[0].cursosSuscrito,
                                    "temPruebaInit": null
                                }
                            }, (err, updatePruebaRescliente) => {
                                if (err == null) {



                                    let strgData = JSON.stringify({ data: { compPrueba: true } });
                                    crypto.encode(strgData).then((enc) => {
                                        res.json({
                                            d: enc,
                                            success: true,
                                            pet: true
                                        })
                                    })
                                } else {
                                    let strgData = JSON.stringify({ data: { compPrueba: false } });
                                    crypto.encode(strgData).then((enc) => {
                                        res.json({
                                            d: enc,
                                            success: true,
                                            pet: true
                                        })
                                    })
                                }
                            })

                        } else {



                            pruebasRespondidas.push(pruebaContestada);
                            resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas = pruebasRespondidas
                            mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                                $set: {
                                    "cursosSuscrito": resCliente[0].cursosSuscrito,
                                    "temPruebaInit": null
                                }
                            }, (err, updatePruebaRescliente) => {
                                if (err == null) {
                                    let strgData = JSON.stringify({ data: { compPrueba: true } });
                                    crypto.encode(strgData).then((enc) => {
                                        res.json({
                                            d: enc,
                                            success: true,
                                            pet: true
                                        })
                                    })
                                } else {
                                    let strgData = JSON.stringify({ data: { compPrueba: false } });
                                    crypto.encode(strgData).then((enc) => {
                                        res.json({
                                            d: enc,
                                            success: true,
                                            pet: true
                                        })
                                    })
                                }
                            })
                        }
                    }
                })

            }
        } else {
            console.log('NO HAY RESPUESTAS QUE LAMENTABLE');
            mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (err, resCliente) => {
                if (err == null && resCliente.length > 0) {

                    let inxCursoSus = _.findIndex(resCliente[0].cursosSuscrito, (o) => {
                        return o.curso.data.cod_curso == prueba.prueba.cod_curso;
                    })
                    let curso = resCliente[0].cursosSuscrito[inxCursoSus];


                    let pruebaContestada = {
                        prueba: prueba.prueba,
                        totalPreguntas: prueba.preguntasAlternativas.length,
                        totalRespuestas: 0,
                        totalBuena: 0,
                        minibuena: 0,
                        aprovada: false,
                        porcentajeBuena: 0
                    }
                    let pruebasRespondidas = [];

                    let respuestasCliente = respuestas.respuesta[0].respuesta;
                    prueba.preguntasAlternativas.forEach((pregunta, idxPreguntaAlt) => {
                        let idxPregunta = _.findIndex(respuestasCliente, (o) => {
                            return o.p == pregunta.p.numero;
                        })
                        if (idxPregunta == -1) {
                            respuestasCliente.push({ p: pregunta.p.numero, rest: 'false' });
                        }
                    })
                    let totalBuenas = [];
                    respuestasCliente.forEach((respuestaItem) => {
                        if (respuestaItem.rest == 'true') {
                            totalBuenas.push(true);
                        }
                        console.log({ resCli: respuestaItem });
                    })

                    let minBuenas = Math.trunc((prueba.preguntasAlternativas.length * 60) / 100);
                    let porcentaje = Math.trunc((totalBuenas.length * 100) / prueba.preguntasAlternativas.length);
                    pruebaContestada.totalRespuestas = respuestasCliente.length;
                    pruebaContestada.totalBuena = totalBuenas.length;
                    pruebaContestada.minibuena = minBuenas;
                    if (totalBuenas.length >= minBuenas) {
                        pruebaContestada.aprovada = true;
                    }
                    pruebaContestada.porcentajeBuena = porcentaje;



                    if (Object.keys(resCliente[0]._doc).indexOf('pruebasContestadas') != -1) {
                        let inxPruebaExistente = _.findIndex(resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas, (o) => {
                            return o.prueba.prueba.codPrueba == pruebaContestada.prueba.codPrueba;
                        })
                        if (inxPruebaExistente == -1) {
                            resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas.push(pruebaContestada);
                            actualizaEstadoPruebaPMethod({ curso: resCliente[0].cursosSuscrito[inxCursoSus], prueba: prueba.prueba }).then((resChangeStateTest) => {
                                resCliente[0].cursosSuscrito[inxCursoSus] = resChangeStateTest;
                                mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                                    $set: {
                                        "cursosSuscrito": resCliente[0].cursosSuscrito,
                                        "temPruebaInit": null
                                    }
                                }, (err, updatePruebaRescliente) => {
                                    if (err == null) {



                                        let strgData = JSON.stringify({ data: { compPrueba: true } });
                                        crypto.encode(strgData).then((enc) => {
                                            res.json({
                                                d: enc,
                                                success: true,
                                                pet: true
                                            })
                                        })
                                    } else {
                                        let strgData = JSON.stringify({ data: { compPrueba: false } });
                                        crypto.encode(strgData).then((enc) => {
                                            res.json({
                                                d: enc,
                                                success: true,
                                                pet: true
                                            })
                                        })
                                    }
                                })

                            })
                        } else {
                            resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas[inxPruebaExistente] = pruebaContestada;
                            actualizaEstadoPruebaPMethod({ curso: resCliente[0].cursosSuscrito[inxCursoSus], prueba: prueba.prueba }).then((resChangeStateTest) => {
                                resCliente[0].cursosSuscrito[inxCursoSus] = resChangeStateTest;
                                mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                                    $set: {
                                        "cursosSuscrito": resCliente[0].cursosSuscrito,
                                        "temPruebaInit": null
                                    }
                                }, (err, updatePruebaRescliente) => {
                                    if (err == null) {



                                        let strgData = JSON.stringify({ data: { compPrueba: true } });
                                        crypto.encode(strgData).then((enc) => {
                                            res.json({
                                                d: enc,
                                                success: true,
                                                pet: true
                                            })
                                        })
                                    } else {
                                        let strgData = JSON.stringify({ data: { compPrueba: false } });
                                        crypto.encode(strgData).then((enc) => {
                                            res.json({
                                                d: enc,
                                                success: true,
                                                pet: true
                                            })
                                        })
                                    }
                                })

                            })
                        }
                        mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                            $set: {
                                "cursosSuscrito": resCliente[0].cursosSuscrito,
                                "temPruebaInit": null
                            }
                        }, (err, updatePruebaRescliente) => {
                            if (err == null) {



                                let strgData = JSON.stringify({ data: { compPrueba: true } });
                                crypto.encode(strgData).then((enc) => {
                                    res.json({
                                        d: enc,
                                        success: true,
                                        pet: true
                                    })
                                })
                            } else {
                                let strgData = JSON.stringify({ data: { compPrueba: false } });
                                crypto.encode(strgData).then((enc) => {
                                    res.json({
                                        d: enc,
                                        success: true,
                                        pet: true
                                    })
                                })
                            }
                        })

                    } else {



                        pruebasRespondidas.push(pruebaContestada);
                        resCliente[0].cursosSuscrito[inxCursoSus].pruebasContestadas = pruebasRespondidas
                        mgdClientesOtec.update({ "cliente.rut": cliente.rut }, {

                            $set: {
                                "cursosSuscrito": resCliente[0].cursosSuscrito,
                                "temPruebaInit": null
                            }
                        }, (err, updatePruebaRescliente) => {
                            if (err == null) {
                                let strgData = JSON.stringify({ data: { compPrueba: true } });
                                crypto.encode(strgData).then((enc) => {
                                    res.json({
                                        d: enc,
                                        success: true,
                                        pet: true
                                    })
                                })
                            } else {
                                let strgData = JSON.stringify({ data: { compPrueba: false } });
                                crypto.encode(strgData).then((enc) => {
                                    res.json({
                                        d: enc,
                                        success: true,
                                        pet: true
                                    })
                                })
                            }
                        })
                    }

                }
            })
        }


    } catch (e) {
        console.log("ocurrio un error al informar el termino de la prueba");
    }

}

function reviewPruebaContestada(req, res) {

    try {
        let data = req.body.data;
        let cliente = data.u.cliente;
        let dataContPrueba = data.p;
        let prueba = data.p.p;
        let idxccCurso = data.p.idxCurso;
        console.log({ prueba: prueba });

        mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (err, resCliente) => {
            if (err == null, resCliente.length > 0) {



                //modelo
                let curso = resCliente[0].cursosSuscrito[idxccCurso];
                let cursoSuscritoArray = resCliente[0].cursosSuscrito;
                let pruebasContestadas = curso.pruebasContestadas;
                let esquema = curso.esquema;
                let pruebaCompletada = {
                    idxCurso: idxccCurso,
                    idxModulo: null,
                    idxClase: null,
                    idxPrueba: null,
                    cursoSuscritoArray: cursoSuscritoArray,
                    cursoUpdate: resCliente[0].cursosSuscrito[idxccCurso],
                    cliente: cliente.rut,
                }

                //avance esquema model

                console.log({ pruebaComplet: pruebaCompletada });



                var method = {

                    curso: () => {
                        if (pruebasContestadas.length > 0) {
                            pruebasContestadas.forEach((pruebaCont) => {
                                esquema.pruebas.forEach((pruebaCurs, idxPrueba) => {
                                    if (pruebaCont.prueba.codPrueba == pruebaCurs.prueba.codPrueba) {
                                        if (pruebaCurs.completado == true) {

                                            let strgData = JSON.stringify({ data: { compPruebaCompletada: true } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        } else {
                                            pruebaCompletada.idxPrueba = idxPrueba;
                                            method.actualizaEstadoPrueba(pruebaCompletada);
                                        }
                                    } else {
                                        let strgData = JSON.stringify({ data: { compPruebaCompletada: false } });
                                        crypto.encode(strgData).then((enc) => {
                                            res.json({
                                                d: enc,
                                                success: true,
                                                pet: true
                                            })
                                        })
                                    }
                                })
                            })
                        } else {

                            let strgData = JSON.stringify({ data: { compPruebaCompletada: false } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true,
                                    pet: true
                                })
                            })
                        }

                    },
                    modulo: () => {



                        if (pruebasContestadas.length > 0) {
                            pruebasContestadas.forEach((pruebaCont) => {
                                esquema.modulos.forEach((modulo, idxModulo) => {
                                    modulo.pruebas.forEach((pruebaM, idxPruebaM) => {
                                        if (pruebaCont.prueba.codPrueba == pruebaM.prueba.codPrueba) {
                                            if (pruebaM.completado == true) {

                                                let strgData = JSON.stringify({ data: { compPruebaCompletada: true } });
                                                crypto.encode(strgData).then((enc) => {
                                                    res.json({
                                                        d: enc,
                                                        success: true,
                                                        pet: true
                                                    })
                                                })
                                            } else {

                                                pruebaCompletada.idxModulo = idxModulo;
                                                pruebaCompletada.idxPrueba = idxPruebaM;
                                                method.actualizaEstadoPrueba(pruebaCompletada);
                                            }
                                        } else {
                                            let strgData = JSON.stringify({ data: { compPruebaCompletada: false } });
                                            crypto.encode(strgData).then((enc) => {
                                                res.json({
                                                    d: enc,
                                                    success: true,
                                                    pet: true
                                                })
                                            })
                                        }
                                    })
                                })

                            })
                        } else {

                            let strgData = JSON.stringify({ data: { compPruebaCompletada: false } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true,
                                    pet: true
                                })
                            })
                        }



                    },
                    clase: () => {
                        if (pruebasContestadas.length > 0) {
                            pruebasContestadas.forEach((pruebaCont) => {
                                esquema.modulos.forEach((modulo, idxModulo) => {
                                    modulo.clases.forEach((clase, idxClase) => {
                                        clase.pruebas.forEach((pruebaCla, idxPrueba) => {
                                            if (prueba.prueba.codPrueba == pruebaCont.prueba.codPrueba) {
                                                if (pruebaCla.completado == true) {

                                                    let strgData = JSON.stringify({ data: { compPruebaCompletada: true } });
                                                    crypto.encode(strgData).then((enc) => {
                                                        res.json({
                                                            d: enc,
                                                            success: true,
                                                            pet: true
                                                        })
                                                    })
                                                } else {

                                                    pruebaCompletada.idxModulo = idxModulo;
                                                    pruebaCompletada.idxClase = idxClase;
                                                    pruebaCompletada.idxPrueba = idxPruebaM;
                                                    method.actualizaEstadoPrueba(pruebaCompletada);
                                                }
                                            } else {
                                                let strgData = JSON.stringify({ data: { compPruebaCompletada: false } });
                                                crypto.encode(strgData).then((enc) => {
                                                    res.json({
                                                        d: enc,
                                                        success: true,
                                                        pet: true
                                                    })
                                                })
                                            }
                                        })
                                    })
                                })
                            })
                        } else {

                            let strgData = JSON.stringify({ data: { compPruebaCompletada: false } });
                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true,
                                    pet: true
                                })
                            })
                        }
                    },
                    actualizaEstadoPrueba: (data) => {

                        let objeto = data;
                        if (prueba.type == 'curso') {
                            data.cursoUpdate.esquema.pruebas[data.idxPrueba].completado = true;
                            data.cursoSuscritoArray[data.idxCurso] = data.cursoUpdate;
                            mgdClientesOtec.update({ "cliente.rut": data.cliente }, {
                                $set: {
                                    "cursosSuscrito": data.cursoSuscritoArray,
                                    "temPruebaInit": null
                                }
                            }, (err, resUpdateCli) => {
                                if (err == null) {
                                    let strgData = JSON.stringify({ data: { compPruebaCompletada: true } });
                                    crypto.encode(strgData).then((enc) => {
                                        res.json({
                                            d: enc,
                                            success: true,
                                            pet: true
                                        })
                                    })

                                }
                            })
                        } else if (prueba.type == 'modulo') {
                            data.cursoUpdate.esquema.modulos[data.idxModulo].pruebas[data.idxPrueba].completado = true;
                            data.cursoSuscritoArray[data.idxCurso] = data.cursoUpdate;
                            mgdClientesOtec.update({ "cliente.rut": data.cliente }, {
                                $set: {
                                    "cursosSuscrito": data.cursoSuscritoArray,
                                    "temPruebaInit": null
                                }
                            }, (err, resUpdateCli) => {
                                if (err == null) {
                                    let strgData = JSON.stringify({ data: { compPruebaCompletada: true } });
                                    crypto.encode(strgData).then((enc) => {
                                        res.json({
                                            d: enc,
                                            success: true,
                                            pet: true
                                        })
                                    })

                                }
                            })


                        } else if (prueba.type == 'clase') {
                            data.cursoUpdate.esquema.modulos[data.idxModulo].clases[data.idxClase].pruebas[data.idxPrueba].completado = true;
                            data.cursoSuscritoArray[data.idxCurso] = data.cursoUpdate;
                            mgdClientesOtec.update({ "cliente.rut": data.cliente }, {
                                $set: {
                                    "cursosSuscrito": data.cursoSuscritoArray,
                                    "temPruebaInit": null
                                }
                            }, (err, resUpdateCli) => {
                                if (err == null) {
                                    let strgData = JSON.stringify({ data: { compPruebaCompletada: true } });
                                    crypto.encode(strgData).then((enc) => {
                                        res.json({
                                            d: enc,
                                            success: true,
                                            pet: true
                                        })
                                    })

                                }
                            })
                        }
                    },
                    actualizarEstadoItemEsquema: () => {
                        console.log('actualizar estado item esquema');
                        mgdClientesOtec.find({ "cliente.rut": cliente.rut }, (err, resClienteItem) => {
                            if (err == null && resClienteItem.length > 0) {
                                let curso = resClienteItem[0].cursosSuscrito[idxccCurso];
                                let avances = curso.avances;
                                curso.esquema.modulos.forEach((modulo, idxModulo) => {
                                    let idxIncomPMod = _.findIndex(modulo.pruebas, (o) => {
                                        o.completado == false;
                                    });
                                    if (idxIncomPMod == -1) {
                                        if (modulo.completado == false) {
                                            resClienteItem[0].cursosSuscrito[idxccCurso].esquema.modulos[idxModulo].completado = true;
                                            mgdClientesOtec.update({ "cliente.rut": pruebaCompletada.cliente }, {
                                                $set: {
                                                    "cursosSuscrito": resClienteItem[0].cursosSuscrito
                                                }
                                            }, (err, resUpdateMod) => {
                                                if (err == null) {
                                                    let moduloUpdate = {
                                                        codItem: modulo.modulo.cod_modulo_curso,
                                                        item: modulo.modulo,
                                                        type: 'modulo'
                                                    }
                                                    if (avances.length > 0) {
                                                        let idxAvance = _.findIndex(curso.avances, (o) => {
                                                            return o.codItem == modulo.modulo.cod_modulo_curso;
                                                        })

                                                        if (idxAvance == -1) {

                                                            method.registrarAvancesItemEsquema(moduloUpdate).then(updateCursos => {
                                                                resClienteItem = updateCursos;
                                                            });

                                                        }
                                                    } else {
                                                        method.registrarAvancesItemEsquema(moduloUpdate).then(updateCursos => {
                                                            resClienteItem = updateCursos;
                                                        });
                                                    }

                                                }
                                                //mgdClientesOtec.update({"cliente.rut":pruebaCompletada.cliente})
                                            })
                                        }
                                    }
                                    modulo.clases.forEach((clase, idxClase) => {
                                        //revisa si existe una prueba que este incompleta
                                        let idxIncomPCla = _.findIndex(clase.pruebas, (o) => {
                                            return o.completado == false;
                                        })
                                        if (idxIncomPCla == -1) {
                                            if (clase.completado == false) {
                                                resClienteItem[0].cursosSuscrito[idxccCurso].esquema.modulos[idxModulo].clases[idxClase].completado = true;
                                                mgdClientesOtec.update({ "cliente.rut": pruebaCompletada.cliente }, {
                                                    $set: {
                                                        "cursosSuscrito": resClienteItem[0].cursosSuscrito
                                                    }
                                                }, (err, updateClase) => {
                                                    let claseUpdate = {
                                                        codItem: clase.clase.cod_clases,
                                                        item: clase.clase,
                                                        type: 'clase'
                                                    }
                                                    if (err == null) {
                                                        method.registrarAvancesItemEsquema(claseUpdate).then(updateCursos => {
                                                            resClienteItem = updateCursos;
                                                        });
                                                    }
                                                })
                                            }
                                        }
                                    })
                                    let idxImcomMod = _.findIndex(curso.esquema.modulos, (o) => {
                                        return o.completado == false;
                                    });
                                    if (idxImcomMod == -1) {
                                        if (curso.completado == false) {
                                            resClienteItem[0].cursosSuscrito[idxccCurso].completado = true;
                                            mgdClientesOtec.update({ "cliente.rut": pruebaCompletada.cliente }, {
                                                $set: {
                                                    "cursosSuscrito": resClienteItem[0].cursosSuscrito
                                                }
                                            }, (err, updateCurso) => {
                                                if (err == null) {
                                                    let cursoUpdate = {
                                                        codItem: curso.curso.data.cod_curso,
                                                        item: curso.curso.data,
                                                        type: 'curso'
                                                    }
                                                    method.registrarAvancesItemEsquema(cursoUpdate).then(updateCursos => {
                                                        resClienteItem = updateCursos
                                                        //actualizar termino curso

                                                    })
                                                }
                                            })
                                        }
                                    }
                                })



                            }
                        });
                    },
                    registrarAvancesItemEsquema: (dataItem) => {
                        return new Promise((resolve, reject) => {
                            mgdClientesOtec.find({ "cliente.rut": pruebaCompletada.cliente }, (err, resClienteA) => {
                                let avances = resClienteA.cursosSuscrito[idxccCurso].avances;
                                avances.push(dataItem);
                                if (dataItem.type = 'curso') {
                                    resClienteA.cursosSuscrito[idxccCurso].terminoCurso.fecha = moment().format('MM-DD-YYYY');
                                }
                                mgdClientesOtec.update({ "cliente.rut": pruebaCompletada.cliente }, {
                                    $set: {
                                        "cursosSuscrito": resClienteA.cursosSuscrito
                                    }
                                }, (err, rawItemupdate) => {
                                    if (err == null) {
                                        mgdClientesOtec.find({ "cliente.rut": pruebaCompletada.cliente }, (err, resClienteUpdateItem) => {
                                            if (err == null && resClienteUpdateItem.length > 0) {

                                                resolve(resClienteUpdateItem);
                                            }
                                        })
                                    }
                                })
                            })

                        })
                    }

                }

                if (prueba.type == 'curso') {
                    console.log('EJECUTANDOSE CURSO');
                    method.curso();
                    method.actualizarEstadoItemEsquema();
                } else if (prueba.type == 'modulo') {
                    method.modulo();
                    method.actualizarEstadoItemEsquema();
                } else if (prueba.type == 'clase') {
                    method.clase();
                    method.actualizarEstadoItemEsquema();
                }
            }
        })
        /*
        mgdClientesOtec.find({"cliente.rut":cliente.rut},(err,resCliente)=>{
            if(err==null,rescliente.length>0){
                let curso= resCliente[0].cursosSuscrito[dataPrueba.p.idxCurso];
                let pruebasContestadas= curso.pruebasContestadas;
                let esquema=curso.esquema;
                pruebasContestadas.forEach((pruebaCont)=>{
                    esquema.modulos.forEach()
                     pruebaCont.prueba.codPrueba
                })
            }
        })*/
        console.log('revisa si las pruebas han sido contestadas');
        console.log({ dataObtenidaReviewPruebaContestada: data });
    } catch (e) {
        let strgData = JSON.stringify({ data: { compPruebaCompletada: false } });
        crypto.encode(strgData).then((enc) => {
            res.json({
                d: enc,
                success: true,
                pet: true
            })
        })
    }


}

function actualizaEstadoPruebaPMethod(data) {
    /**
     * Metodo que el estado de la prueba si es que esta está completada o no
     * PMethod = metodo privado
     */
    console.log({ actualizaEstadoPruebaPMethod: data });
    return new Promise((resolve, reject) => {
        let modulos = data.curso.esquema.modulos;
        let pruebasCurso = data.curso.esquema.pruebas;
        let prueba = data.prueba;
        console.log({ dataDelMoco: data });
        if (prueba.tipoCodigoItem == "cod_clases_item") {
            modulos.forEach((modulo, idxM) => {
                modulo.clases.forEach((clase, idxCla) => {
                    clase.pruebas.forEach((pruebaItem, idxPrue) => {
                        console.log({ pruebaEnClaseTrue: pruebaItem, pruebaRecibe: prueba });
                        if (pruebaItem.prueba.codPrueba == prueba.codPrueba) {

                            data.curso.esquema.modulos[idxM].clases[idxCla].pruebas[idxPrue].completado = true;
                            console.log({ estadoActualPrueba: data.curso.esquema.modulos[idxM].clases[idxCla].pruebas[idxPrue] });
                            resolve(data.curso);
                        }
                    })
                })
            });
        } else if (prueba.tipoCodigoItem == 'cod_modulo_curso_item') {

            modulos.forEach((modulo, idxM) => {
                modulo.pruebas.forEach((pruebaItem, idxPrueba) => {
                    if (pruebaItem.prueba.codPrueba == prueba.codPrueba) {
                        data.curso.esquema.modulos[idxM].pruebas[idxPrueba].completado = true;
                        resolve(data.curso);
                    }
                })
            })


        } else if (prueba.tipoCodigoItem == 'cod_curso_item') {
            pruebasCurso.forEach((pruebaItem, idxPrueba) => {
                if (pruebaItem.prueba.codPrueba == prueba.codPrueba) {
                    data.curso.esquema.pruebas[idxPrueba].completado = true;
                    resolve(data.curso);
                }
            })
        }

    })


}





module.exports = cliente.cliente;
