const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require("fs");

const shell = require("shelljs");

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    } else {
        return next();
    }
});

app.use(bodyParser.json({limit: '50mb', extended: true}));

parseImage = (img) => {
    return new Promise((resolve) => {
        shell.exec('alpr -c us ' + img + ' -n 1', (code, stdout, stderr) => {
            if (code === 0 && stderr === '') {
                var str = stdout.replace('plate0: 1 results', '');
                str = str.replace('-', '').trim();
                var position = str.indexOf('confidence');
                str = str.replace(str.slice(position, str.length), '').trim();
                if (str === 'No license plates found')
                    resolve(false);
                else
                    resolve(str);
            }
        });
    });
}

makeid = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.post('/upload', (req, res) => {
    let imgName = "captured.jpg";
    fs.writeFile(imgName, req.body.base64, 'base64', async (err) => {
        if (err === null) {
            let lpr = await parseImage(imgName);
            if (!lpr) {
                res.status(400).send({ status: false, message: "Can not found number" });
            } else {
                res.status(200).send({ status: true, lpr: lpr });
            }
        } else {
            res.status(400).send({ status: false, message: err });
        }
    });
});

app.listen(10010, function () {
    console.log('app listening at port %s', 10010);
});