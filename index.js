const program = require('commander');
const {login, deposit, transfer, logout} = require('./functions');

program.version('1.0.0').description('ATM CLI');

program
  .command('login <name>')
  .alias('IN')
  .description('Login to ATM')
  .action((name) => {
    login(name);
  });

program
  .command('logout')
  .alias('OUT')
  .description('User logout')
  .action(() => {
    logout();
  });

program
  .command('deposit <amount>')
  .alias('D')
  .description('Deposit to account')
  .action((amount) => {
    deposit(amount);
  });

program
  .command('transfer <target> <amount>')
  .alias('TF')
  .description('Transfer to other user')
  .action((target, amount) => {
    transfer(target, amount);
  });

program.parse(process.argv);
