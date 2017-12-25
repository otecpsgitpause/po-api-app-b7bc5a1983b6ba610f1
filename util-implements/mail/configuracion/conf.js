var nodemailer = require('nodemailer');

var mail = {
    senMail: sendMail
}

function sendMail() {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'sendmailotecpausa@gmail.com',
            pass: 'geometria_1'
        }
    });

    var mailOptions = {
        from: 'sendmailotecpausa@gmail.com',
        to: 'rpemcampos@gmail.com',
        subject: 'otecpausa base de datos fail mdb',
        text: 'el servidor de base de datos no funciona '
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            //console.log(error);
            //res.send(500, err.message);
        } else {
            //console.log("Email sent");
            //res.status(200).jsonp(req.body);
        }
    });
}

module.exports = mail;