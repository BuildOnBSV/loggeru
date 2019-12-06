#!/usr/bin/env node

const pm2 = require('pm2');
const crypto = require('crypto');
const bsv = require('bsv');
const args = require('minimist')(process.argv.slice(2));
var request = require('request');
const fs = require('fs');
const {
  convertArrayToCSV
} = require('convert-array-to-csv');
const converter = require('convert-array-to-csv');
const algorithm = 'aes-256-gcm';

function decryptData(content, password, myAuthTag, myIv) {
  var passwordf = Buffer.from(password, 'hex');
  var myIvf = Buffer.from(myIv, 'hex');
  var decipher = crypto.createDecipheriv(algorithm, passwordf, myIvf)
  decipher.setAuthTag(Buffer.from(myAuthTag, 'hex'))
  var dec = decipher.update(content, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec;
}

var help = "\n" +
  "Required flags for initialization:\n" +
  "-f filePathToWatch\n" +
  "-k bsvPrivateKey\n" +
  "-t tagYourData\n" +
  "-r regexExpressionToMatch\n" +
  "\n" +
  "Optional flag for initialization:\n" +
  "-e encryptionKey\n" +
  "\n" +
  "Required flag for CSV export:\n" +
  "-s tagToSearch\n" +
  "\n" +
  "Optional flag for CSV export:\n" +
  "-e encyptionKey\n" +
  "\n" +
  "Please note:\n" +
  "!! You must add BSV to the address before Loggeru can be initialized. We don't store the address or private key so please so write it down !!\n" +
  "\n" +
  "More detailed instructions available @ https://github.com/BuildOnBSV/loggeru\n"

if ((!args.k) && (!args.s)) {
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
} else if ((!args.f) && (!args.s)) {
  console.log(help)
  return;
} else if ((!args.t) && (!args.s)) {
  console.log(help)
  return;
} else if ((!args.r) && (!args.s)) {
  console.log(help)
  return;
}

if ((!args.e) && (!args.s)) {
  var encryption = '';
} else {
  var encryption = args.e;
}

if (args.s) {
  request.post({
    url: 'https://www.loggeru.com/tag/'+ args.s +'/file/.%2A/condition/.%2A/results/.%2A'
  }, function(error, response, body) {
    body = JSON.parse(body);
    csvarray = []
    body.forEach(function(entry) {
      if (entry['out'][1]['s7']) {
        if (args.e) {
          var decrypt = entry['out'][1]['s7'];
          var decryptobj = JSON.parse(decrypt);
          decryptobj.body = entry['out'][1]['s6'];
          entry['out'][1]['s6'] = decryptData(decryptobj.body, args.e, decryptobj.a, decryptobj.i);
        }
        try {
          csventry = [entry['_id'], entry['blk']['i'], new Date(entry['blk']['t'] * 1000), entry['in'][0]['e']['a'],
            entry['out'][0]['e']['a'], entry['out'][0]['e']['v'] / 100000000, entry['out'][1]['s3'], entry['out'][1]['s4'],
            entry['out'][1]['s5'], entry['out'][1]['s6'], entry['out'][1]['s7']
          ]
        } catch {
          csventry = [entry['_id'],'Unconfirmed','Unconfirmed', entry['in'][0]['e']['a'],
            entry['out'][0]['e']['a'], entry['out'][0]['e']['v'] / 100000000, entry['out'][1]['s3'], entry['out'][1]['s4'],
            entry['out'][1]['s5'], entry['out'][1]['s6'], entry['out'][1]['s7']
          ]
        }
        csvarray.push(csventry);
      } else {
        try {
          csventry = [entry['_id'], entry['blk']['i'], new Date(entry['blk']['t'] * 1000), entry['in'][0]['e']['a'],
            entry['out'][0]['e']['a'], entry['out'][0]['e']['v'] / 100000000, entry['out'][1]['s3'], entry['out'][1]['s4'],
            entry['out'][1]['s5'], entry['out'][1]['s6']
          ]
        } catch {
          csventry = [entry['_id'],'Unconfirmed','Unconfirmed', entry['in'][0]['e']['a'],
            entry['out'][0]['e']['a'], entry['out'][0]['e']['v'] / 100000000, entry['out'][1]['s3'], entry['out'][1]['s4'],
            entry['out'][1]['s5'], entry['out'][1]['s6']
          ]
        }
        csvarray.push(csventry);
      }
    });
    console.log(csvarray);
    const header = ['Transaction', 'Block Height', 'Block Time', 'From Address', 'To Address', 'Value (BSV)', 'S3', 'S4', 'S5', 'S6', 'S7'];
    const mycsv = convertArrayToCSV(csvarray, {
      header,
      separator: ','
    });
    fs.writeFile(Date.now() + '.csv', mycsv, err => {
      if (err) return console.log(err);
    });
  });
  return;
}

pm2.connect(function(err) {
  if (err) {
    console.error(JSON.stringify(err));
    process.exit(2);
  }

  pm2.start({
      script: "loggeru-run",
      name: "log-" + args.f,
      env: {
        TAG: args.t,
        FILE: args.f,
        KEY: args.k,
        REGEX: args.r,
        ENCRYPTION: encryption
      },
      exec_mode: "cluster"

    },
    function(err, apps) {
      pm2.disconnect();
      if (err) throw err
    });
});
