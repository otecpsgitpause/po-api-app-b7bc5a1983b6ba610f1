'use strict'
var jwt = require('jsonwebtoken');
process.env.SECRET_KEY = "mikey";

var tokenImpl = { tokenImpl: tokenImplements };
var mongodb= require('../bdmgd/conexion');
function tokenImplements(req, res, next) {
    var token = req.body.token || req.headers['token'];
    console.log(req.body);
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
            if (err) {
                res.status(500).json('invalid token');
            } else {
                mongodb.descontectar();
                mongodb.conectar();
                next();
            }
        })
    } else {
        res.status(200).json();
    }
}

module.exports = {
    tokenImpl
}