const program = require('commander');
const {
    login,
    deposit
} = require('./functions');

program.version('1.0.0').description('ATM CLI');

program
  .command('login <name>')
  .alias('L')
  .description('Login to ATM')
  .action((name) => {
    login(name);
  });

program
.command('deposit <amount>')
.alias('D')
.description('Deposit to account')
.action(amount => {
    deposit(amount)
});

program.parse(process.argv);
