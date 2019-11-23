#!/usr/bin/env node

const pm2 = require('pm2');
const crypto = require('crypto');
const bsv = require('bsv');
const args = require('minimist')(process.argv.slice(2));


if (!args.k) {
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
  console.log("Missing file path. Pass with -f flag. Must be an absolute path.")
  return;
} else if (!args.t) {
  console.log("Missing tag. Pass with -t flag.")
  return;
} else if (!args.r) {
  console.log("Missing regex expression to match. Pass with -r flag.")
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
      script: "loggeru-run",
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
