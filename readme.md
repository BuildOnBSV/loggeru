
<p align="center">
<img src="logo.png" alt="logo" width="500px">
</p>    

[![npm version](http://img.shields.io/npm/v/loggeru.svg?style=flat)](https://npmjs.org/package/loggeru "View this project on npm")

## About

Use Loggeru to automatically record file alterations to the Bitcoin SV blockchain. 

Future features include CSV export, USD billing, Splunk integration, CLI decryption, and a visual explorer on loggeru.com.

## Install

`npm install -S bsv`

`npm install -g loggeru`

## Run

`loggeru`

This will return a BSV private key, public key, and address, as well as a AES 256 key. Please record these or use your own. We do not store these.

Once you have a funded BSV private key:

`loggeru -k bsvPrivateKey -f /file/to/watch -t tagForYourData -r regexExpressionToLookFor -e optionalEncryptionCode`
<br>

### Example values:
- -t myCompanyName <br>
- -f /var/log/secure <br>
- -k 36a5a9a7b2ef8d18538db2f16752dd015140d7e5e706aa0a364d17c92416b901 <br>
- -r 'Accepted publickey' <br>
- -e fd2f50f13c7bcb424e68f04af14d515cbd42e637da9ed317338e4d35de564c5e`<br>

This example checks /var/log/secure for new lines with 'Accepted publickey' in the text, then makes a BSV transaction with that data in the OP_RETURN. 

The result of this is that the IP of anyone who accesses this RHEL/Centos virtual machine (Amazon Linux AMI) via SSH will be written to BSV.
<br>

### Troubleshooting
Getting a permission error? For /var/log/secure on an Amazon EC2 instance, I fixed it with this:

`sudo setfacl -Rm u:ec2-user:rX,d:u:ec2-user:rX /var/log`

And also added this to /etc/logrotate.d/Loggeru_ACLs (otherwise permissions will be reset automatically): 


    {
      postrotate
        /usr/bin/setfacl -Rm u:ec2-user:rX,d:u:ec2-user:rX /var/log
      endscript
    }
    
