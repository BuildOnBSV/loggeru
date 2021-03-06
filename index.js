
const pm2 = require('pm2');
const crypto = require('crypto');
const bsv = require('bsv');
const args = require('minimist')(process.argv.slice(2));

var help = "\n"+
      "Required flags:\n" +
      "-f filePathToWatch\n" +
      "-k bsvPrivateKey\n" +
      "-t tagYourOrganization\n" +
      "-r regexExpressionToMatch\n" +
      "\n" +
      "Optional flag:\n" +
      "-e encryptionKey\n" +
      "\n" +
      "Please note:\n" +
      "!! You must add BSV to the address before it will work. We don't store the address or private key so please so write it down. !!\n" +
      "\n" +
      "More detailed instructions available @ https://github.com/BuildOnBSV/loggeru\n"
      "\n" +
      "Use npm install -g loggeru for decryption capabilities\n"

if (!args.k) {
  console.log(help);
  let privateKey = bsv.PrivateKey.fromRandom()
  let publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
  let address = bsv.Address.fromPublicKey(publicKey)
  let password = crypto.randomBytes(32);
  console.log({
    "bsvPrivateKey": privateKey.toHex(),
    "bsvPublicKey": publicKey.toHex(),
    "address": address.toString(),
    "encryptionKey": password.toString('hex')
  })
  return;
} else if (!args.f) {
  console.log(help)
  return;
} else if (!args.t) {
  console.log(help)
  return;
} else if (!args.r) {
  console.log(help)
  return;
}
if (!args.e) {
  var encryption = '';
} else {
  var encryption = args.e;
}

pm2.connect(function(err) {
  if (err) {
    console.error(JSON.stringify(err));
    process.exit(2);
  }

  pm2.start({
      script: "server.js",
      name: "log-"+ args.f,
      env: {
        TAG: args.t,
        FILE: args.f,
        KEY: args.k,
        REGEX: args.r,
        ENCRYPTION: encryption
      },
      exec_mode  : "cluster"

    },
    function(err, apps) {
      pm2.disconnect();
      if (err) throw err
    });
});
