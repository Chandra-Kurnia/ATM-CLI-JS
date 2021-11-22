const model = require('./model');
const chalk = require('chalk');

const login = async (name) => {
  try {
    const userLoggedIn = await model.findUser('islogin', 1);
    // When the current user has not logged out and wants to login using another account.
    if (userLoggedIn.length > 0 && userLoggedIn[0].name !== name) {
      console.log(
        chalk.yellow(
          `You are still logged in as "${chalk.underline(
            userLoggedIn[0].name
          )}", please logout before logging in as "${chalk.underline(name)}"`
        )
      );
      process.exit();
    }
    const user = await model.findUser('name', name);
    // When the user does not have an account.
    if (user.length < 1) {
      const addUser = await model.addUser({
        name,
        balance: 0,
        islogin: 1,
      });
      if (addUser.affectedRows > 0) {
        console.log(chalk.bgGreen.black.bold('Login success'));
        console.log(chalk.green(`You logged in as new user "${chalk.underline(name)}"`));
        console.log(`Your balance is : ${chalk.cyan('$0')}`);
        process.exit();
      }
    } else {
      const owed = await model.getOweds(user[0].user_id);
      // When the user tries to re-login without logging out.
      if (user[0].islogin === 1) {
        console.log(chalk.yellow(`You already logged in as "${chalk.underline(user[0].name)}"`));
        console.log(`Your balance is : ${chalk.cyan(`$${user[0].balance}`)}`);
        if (owed.length > 0) {
          if (owed[0].debtor === user[0].user_id) {
            console.log(`Owed ${chalk.cyan(`$${owed[0].amount}`)}  to ${chalk.underline(owed[0].creditor_name)}`);
          } else {
            console.log(`Owed ${chalk.cyan(`$${owed[0].amount}`)} from ${chalk.underline(owed[0].debtor_name)}`);
          }
        }
        process.exit();
      } else {
        // normal login
        console.log(chalk.bgGreen.black.bold('Login success'));
        console.log(`You logged in as "${chalk.underline(user[0].name)}"`);
        console.log(`Your balance is : ${chalk.cyan(`$${user[0].balance}`)}`);
        if (owed.length > 0) {
          if (owed[0].debtor === user[0].user_id) {
            console.log(`Owed ${chalk.cyan(`$${owed[0].amount}`)}  to ${chalk.underline(owed[0].creditor_name)}`);
          } else {
            console.log(`Owed ${chalk.cyan(`$${owed[0].amount}`)} from ${chalk.underline(owed[0].debtor_name)}`);
          }
        }
        await model.auth(user[0].user_id, 1);
        process.exit();
      }
    }
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

const logout = async () => {
  try {
    const user = await model.findUser('islogin', 1);
    if (user.length > 0) {
      await model.auth(user[0].user_id, 0);
      console.log(chalk.bgGreen.black.bold('Logout success'));
      console.log(`Goodbye ${chalk.underline(user[0].name)}`);
      process.exit();
    } else {
      console.log(chalk.bgRed('Logout rejected'));
      console.log(chalk.yellow('You are not logged in'));
      process.exit();
    }
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

const deposit = async (amount) => {
  try {
    const user = await model.findUser('islogin', 1);
    if (user.length > 0) {
      const owed = await model.getOweds(user[0].user_id);
      if (owed.length > 0 && owed[0].debtor === user[0].user_id) {
        if (parseInt(amount) > parseInt(owed[0].amount)) {
          const balanceUser = parseInt(amount) - parseInt(owed[0].amount);
          await model.deposit(user[0].user_id, balanceUser);
          await model.deleteOweds(owed[0].owed_id);
          await model.transfer(user[0].user_id, owed[0].creditor, owed[0].amount);
          console.log(chalk.bgGreen.black.bold('Transfer success'));
          console.log(`Transferred ${chalk.cyan(`$${owed[0].amount}`)} to ${chalk.underline(owed[0].creditor_name)}`);
          console.log(`Your balance is : ${chalk.cyan(`$${balanceUser}`)}`);
          console.log(`Owed ${chalk.cyan('$0')} to ${chalk.underline(owed[0].creditor_name)}`);
          process.exit();
        } else {
          const remainOwed = parseInt(owed[0].amount) - parseInt(amount);
          await model.updateOweds(owed[0].owed_id, remainOwed);
          await model.transfer(user[0].user_id, owed[0].creditor, amount);
          console.log(chalk.bgGreen.black.bold('Transfer success'));
          console.log(`Transferred ${chalk.cyan(`$${amount}`)} to ${chalk.underline(owed[0].creditor_name)}`);
          console.log(`Your balance is : ${chalk.cyan('$0')}`);
          console.log(`Owed ${chalk.cyan(`$${remainOwed}`)}`);
          process.exit();
        }
      }
      const depositResult = await model.deposit(user[0].user_id, amount);
      if (depositResult.affectedRows > 0) {
        console.log(chalk.bgGreen.black.bold('Deposit success'));
        console.log(`Your balance is : ${chalk.cyan(`$${parseInt(user[0].balance) + parseInt(amount)}`)}`);
        process.exit();
      } else {
        console.log(chalk.bgRed('Deposit failed'));
        console.log(chalk.bgRed('Deposit failed, please try again later'));
        process.exit();
      }
    } else {
      console.log(chalk.bgRed('Deposit failed'));
      console.log(chalk.yellow('Please login before making a deposit'));
      process.exit();
    }
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

const transfer = async (target, amount) => {
  try {
    const user = await model.findUser('islogin', 1);
    const recipient = await model.findUser('name', target);
    if (user[0].balance === '0') {
      console.log(chalk.bgRed('Transfer Failed'));
      console.log(chalk.yellow('Your balance is empty, you cannot make a transfer until you make a deposit.'));
      process.exit();
    }
    if (user.length > 0) {
      if (recipient.length > 0 && recipient[0].user_id !== user[0].user_id) {
        const accRec = await model.getOweds(user[0].user_id);
        let totalAmount = amount;
        if (accRec.length > 0 && accRec[0].debtor === recipient[0].user_id) {
          if (parseInt(accRec[0].amount) - parseInt(amount) === 0) {
            await model.deleteOweds(accRec[0].owed_id);
            console.log(chalk.bgGreen.black.bold('Transfer success'));
            console.log(`Transferred ${chalk.cyan(`$${amount}`)} to ${chalk.underline(recipient[0].name)}`);
            console.log(`Owed ${chalk.cyan('$0')} from ${chalk.underline(accRec[0].debtor_name)}`);
            process.exit();
          } else if (parseInt(amount) < parseInt(accRec[0].amount)) {
            totalAmount = parseInt(accRec[0].amount) - parseInt(amount);
            await model.updateOweds(accRec[0].owed_id, totalAmount);
            console.log(chalk.bgGreen.black.bold('Transfer success'));
            console.log(`Reduce ${chalk.cyan(`$${accRec[0].debtor_name}`)} debt : ${chalk.cyan(`$${amount}`)}`);
            console.log(`Owed ${chalk.cyan(`$${totalAmount}`)} from ${chalk.underline(accRec[0].debtor_name)}`);
            process.exit();
          } else {
            totalAmount = parseInt(amount) - parseInt(accRec[0].amount);
            await model.deleteOweds(accRec[0].owed_id);
            console.log(`Owed ${chalk.cyan('$0')} from ${chalk.underline(accRec[0].debtor_name)}`);
          }
        }
        if (user[0].balance < totalAmount) {
          const owedData = {
            debtor: user[0].user_id,
            creditor: recipient[0].user_id,
            amount: parseInt(totalAmount) - parseInt(user[0].balance),
          };
          await model.transfer(user[0].user_id, recipient[0].user_id, user[0].balance);
          await model.createOwed(owedData);
          console.log(chalk.bgGreen.black.bold('Transfer Success'));
          console.log(`Transferred ${chalk.cyan(`$${user[0].balance}`)} to ${chalk.underline(target)}`);
          console.log(`Your balance is : ${chalk.cyan('$0')}`);
          console.log(`Owed ${chalk.cyan(`$${owedData.amount}`)} to ${chalk.underline(recipient[0].name)}`);
          process.exit();
        } else {
          const transferResult = await model.transfer(user[0].user_id, recipient[0].user_id, totalAmount);
          if (transferResult.affectedRows > 0) {
            console.log(chalk.bgGreen.black.bold('Transfer Success'));
            console.log(`Transferred ${chalk.cyan(`$${totalAmount}`)} to ${chalk.underline(target)}`);
            console.log(`Your balance is : ${chalk.cyan(`$${parseInt(user[0].balance) - parseInt(totalAmount)}`)}`);
            process.exit();
          } else {
            console.log(chalk.bgRed('Transfer failed, please try again later'));
            process.exit();
          }
        }
      } else if (recipient[0].user_id === user[0].user_id) {
        console.log(chalk.yellow('You cant transfer money to yourself'));
        process.exit();
      } else {
        console.log(chalk.yellow(`Recipients with the name ${target} could not be found`));
        process.exit();
      }
    } else {
      console.log(chalk.yellow('Please login before making a transfer'));
      process.exit();
    }
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

const withdraw = async (amount) => {
  try {
    const user = await model.findUser('islogin', 1);
    if (user.length > 0) {
      if (parseInt(amount) > parseInt(user[0].balance)) {
        console.log(chalk.bgRed('Withdraw Failed'));
        console.log(`Your balance is not more than ${chalk.cyan(`$${user[0].balance}`)}`);
        process.exit();
      }
      const withDrawResult = await model.withdraw(user[0].user_id, amount);
      if (withDrawResult.affectedRows > 0) {
        console.log(chalk.bgGreen.black.bold('Withdraw success'));
        console.log(`Balance withdrawn: ${chalk.cyan(`$${amount}`)}`);
        console.log(`Your balance is : ${chalk.cyan(`$${parseInt(user[0].balance) - parseInt(amount)}`)}`);
        process.exit();
      }
    } else {
      console.log(chalk.bgRed('Withdraw Failed'));
      console.log('Please login before withdrawing the balance.');
      process.exit();
    }
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

const profile = async () => {
  try {
    const user = await model.findUser('islogin', 1);
    if (user.length > 0) {
      console.log('My Profile');
      console.log(`Name : ${user[0].name}`);
      console.log(`Balance : $${user[0].balance}`);
      process.exit();
    } else {
      console.log(chalk.yellow('You not logged in'));
      process.exit();
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  login,
  deposit,
  transfer,
  logout,
  withdraw,
  profile,
};
