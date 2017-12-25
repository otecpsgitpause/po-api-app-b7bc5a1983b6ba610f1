var crypto = require('crypto-js');

const cryptoFunction = {
    encrypto: function(data) {
        var jData = JSON.stringify(data);
        console.log(jData);
        var tdes = crypto.TripleDES.encrypt(jData, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ');
        var rbd = crypto.Rabbit.encrypt(tdes.toString(), 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ');
        return rbd.toString();
    },
    encode: function(d) {
        let k, ena, enb, hashCode;
        hashCode = '64ad0e99145bab8e4f952843a71971e9becfd5aed7e7719e6420c03e3f88332f';

        return new Promise((resolve, reject) => {
            k = crypto.enc.Base64.parse(hashCode).toString();
            ena = crypto.TripleDES.encrypt(d, k);
            enb = crypto.Rabbit.encrypt(ena.toString(), k);
            resolve(enb.toString());
        }).catch(() => {
            //throw reject;
            console.log('fallo en el encode');
        })
    },
    decode: function(d) {
        let k, dna, dnb;
        hashCode = '64ad0e99145bab8e4f952843a71971e9becfd5aed7e7719e6420c03e3f88332f';
        return new Promise((resolve, reject) => {
            k = crypto.enc.Base64.parse(hashCode).toString();
            dnb = crypto.Rabbit.decrypt(d, k);
            dna = crypto.TripleDES.decrypt(dnb.toString(crypto.enc.Utf8), k);
            resolve(dna.toString(crypto.enc.Utf8));
        }).catch((reason) => {
            throw reason;
            console.log('fallo en el decode');
        })
    },
    generateCode: function() {
        let p = 'moco clave';
        return new Promise((resolve, reject) => {
            var salt = crypto.lib.WordArray.random(128 / 8);
            let code = crypto.PBKDF2(p, salt, { keySize: 512 / 32, iterations: 1000 });
            resolve(code.toString());
        })
    }

}

module.exports = cryptoFunction;