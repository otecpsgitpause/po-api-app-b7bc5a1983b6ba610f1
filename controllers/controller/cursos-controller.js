//model
var mgdCursos = require('../../bdmgd/model/cursos');
var mgdClientesOtec = require('../../bdmgd/model/clientesOtec');
var crypto = require('../../util-implements/cryptojs-implement');
var cursos={
    cursos:{
        sendCurso:sendCurso,
        subscribed:subscribed
    }
};


function subscribed(req,res){
    try{
        let data = req.body.data;
        mgdClientesOtec.find({"identificador.key":data.i,"cliente.rut":data.cliente.rut},(err,resSuscribCurso)=>{
            if(err==null && resSuscribCurso.length!=0){
                
                console.log({cursosSuscrito:resSuscribCurso[0].cursosSuscrito});
               let susCurso= {subCourse:resSuscribCurso[0].cursosSuscrito};
               let strgData = JSON.stringify({ data: { subsCli:susCurso  } });
               crypto.encode(strgData).then((enc) => {
                   res.json({
                       d: enc,
                       success:true
                   })
               })
            }else{
                let susCurso= {subCourse:[]};
                let strgData = JSON.stringify({ data: { subsCli:susCurso  } });
                crypto.encode(strgData).then((enc) => {
                    res.json({
                        d: enc,
                        success:true
                    })
                }) 
            }
        })

    }catch(e){
        console.log('error con mantecol');
        let susCurso= {subCourse:[]};
   let strgData = JSON.stringify({ data: { subsCli: susCurso } });
        crypto.encode(strgData).then((enc) => {
            res.json({
                d: enc,
                success:true
            })
        })
    }
    
    console.log({subscribedReq:req.body.data});
}

function sendCurso(req,res){
    
    console.log({sendCurso:req.body});

    try{


    
        let strgData = JSON.stringify({ data: { cursos: [] } });
        crypto.encode(strgData).then((enc) => {
            res.json({
                d: enc,
                success:true
            })
        })


    }catch(e){
        let strgData = JSON.stringify({ data: { cursos: [] } });
        crypto.encode(strgData).then((enc) => {
            res.json({
                d: enc,
                success:true
            })
        })
    }
 

    
}


module.exports= cursos.cursos;