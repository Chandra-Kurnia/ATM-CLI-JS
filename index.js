const program = require('commander');
const functions = require('./functions');

program.version('1.0.0').description('ATM CLI');


program
.command('login <name>')
.alias('L')
.description('Login to ATM')
.action((name) => {
    functions.login(name);
});

program.parse(process.argv);