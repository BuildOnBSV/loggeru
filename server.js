
Tail = require('tail').Tail;
let bsv = require('bsv');
const crypto = require('crypto');
const datapay = require('datapay');

const algorithm = 'aes-256-gcm';

function encrypt(text, password) {
  var passwordf = Buffer.from(password, 'hex');
  var iv = crypto.randomBytes(16);
  var cipher = crypto.createCipheriv(algorithm, passwordf, iv)
  var encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex');
  var tag = cipher.getAuthTag();
  return {
    content: encrypted.toString('hex'),
    tag: tag.toString('hex'),
    iv: iv.toString('hex')
  };
}

// function decrypt(content, password, myAuthTag, myIv) {
//   var passwordf = Buffer.from(password, 'hex');
//   var myIvf = Buffer.from(myIv, 'hex');
//   var decipher = crypto.createDecipheriv(algorithm, passwordf, myIvf)
//   decipher.setAuthTag(Buffer.from(myAuthTag, 'hex'))
//   var dec = decipher.update(content, 'hex', 'utf8')
//   dec += decipher.final('utf8')
//   return dec;
// }

var myprivateKey = process.env.KEY;
var tag = process.env.TAG;
var file = process.env.FILE;
var regex = process.env.REGEX;
var encryption = process.env.ENCRYPTION;

tail = new Tail(file);

tail.on("line", function(myData) {
  var re = new RegExp(regex);
  if (re.test(myData)) {
    console.log(myData);
    if (encryption) {
      try{
      var encryptedObject = encrypt(myData, encryption);
      var myData = encryptedObject.content;
      var myAuthTag = encryptedObject.tag;
      var myIv = encryptedObject.iv;
      var metadata = '{"a":"' + myAuthTag.toString('hex') + '","i":"' + myIv.toString('hex') + '"}';
    }catch{
      console.log("Encryption failed. Maybe the key is not correct?");
      var metadata = 0;
    }
      //console.log(decrypt(myData, encryption, myAuthTag, myIv));
    } else {
      var metadata = 0;
    }

    var config = {
      safe: true,
      data: ["l", tag, file, regex, myData, metadata],
      pay: {
        key: myprivateKey
      }
    }
    try {
      datapay.send(config, function(err, res) {
        if (err){
          console.log('error');
          console.log(JSON.stringify(err));
          throw err;
        }
        console.log('success');
        console.log(JSON.stringify(res));
      })
    } catch {
      throw Error('Payment failed');
    }
  } else {
    //pass
  }

});

tail.on("error", function(error) {
  console.log('ERROR: ', error);
});
