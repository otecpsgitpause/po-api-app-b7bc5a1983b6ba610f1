var jwt = require('jsonwebtoken');
var cryptoImpl = require('../util-implements/cryptojs-implement');

//var function method
var token = {
    authenticate: function(req, res) {

        let method={
            headerAut:function(){
                return new Promise((resolve,reject)=>{
                    let keyApp = req.body.data;
                    cryptoImpl.decode(keyApp).then(dec=>{
                        let j=JSON.parse(dec);
                        let keyApp=j.keyApp;
                        if(keyApp=='34532345456dfdfghsadsfdfs'){
                            var user = {
                                username: 'test',
                                email: 'test'
                            }
                            var token = jwt.sign(user, 'mikey', {
                                expiresIn: 7000
                            });
                            cryptoImpl.encode(token).then(cryToken => {
                                res.json({
                                    success: true,
                                    token: cryToken
        
                                })
                            });
                        }else{
                            res.json({
                                success:false
                            })
                        }
                        
                    })
                    
                })
                
            }
        }

        method.headerAut();

    

/*

        cryptoImpl.decode(req.body.data).then(decode => {
            queryIdent.sistema.identificationSistema(decode).then(r => {
                if (r.error == false) {
                    var user = {
                        username: 'test',
                        email: 'test'
                    }
                    var token = jwt.sign(user, 'mikey', {
                        expiresIn: 7000
                    });
                    cryptoImpl.encode(token).then(cryToken => {
                        res.json({
                            success: true,
                            token: cryToken

                        })
                    });

                } else {
                    let t = "Hello mister hacker I hope you entertain with this system a pleasure to fix any bug";
                    cryptoImpl.encode(t).then(r => {
                        res.json({
                            data: r.split('').reverse() + r + r.split('').reverse().join(r) + r.split('').reverse() + r.split('').reverse() + r.split('').reverse() + r + r.split('').reverse() + r + r.split('').reverse() + r.split('').reverse() + r.split('').reverse() + r + r.split('').reverse() + r + r.split('').reverse() + r + r + r.split('').reverse() + r + r.split('').reverse() + r + r.split('').reverse() + r + r + r.split('').reverse()
                        })
                    })

                }
            });

        }).catch(() => {
            let t = "hi sr hacker i never you look and i dont interestin in you bye good day";
            cryptoImpl.encode(t).then(r => {
                res.json({
                    data: r.split('').reverse() + r + r.split('').reverse().join(r) + r.split('').reverse() + r.split('').reverse() + r.split('').reverse() + r + r.split('').reverse() + r + r.split('').reverse() + r.split('').reverse() + r.split('').reverse() + r + r.split('').reverse() + r + r.split('').reverse() + r + r + r.split('').reverse() + r + r.split('').reverse() + r + r.split('').reverse() + r + r + r.split('').reverse()
                })
            })
        })

*/
    }
};

module.exports=token;