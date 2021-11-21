const model = require('./model');

const login = async (name) => {
  try {
    const userLoggedIn = await model.findUser('islogin', 1);
    // When the current user has not logged out and wants to login using another account.
    if (userLoggedIn.length > 0 && userLoggedIn[0].name !== name) {
      console.log(`You are still logged in as "${userLoggedIn[0].name}", please logout before logging in as "${name}"`);
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
        console.log(`You logged in as new user "${name}"`);
        console.log('Your balance is : 0');
        process.exit();
      }
    } else {
      const owed = await model.getOweds(user[0].user_id);
      // When the user tries to re-login without logging out.
      if (user[0].islogin === 1) {
        console.log(`You already logged in as "${user[0].name}"`);
        console.log(`Your balance is : ${user[0].balance}`);
        if (owed.length > 0) {
          if (owed[0].debtor === user[0].user_id) {
            console.log(`Owed ${owed[0].amount} to ${owed[0].creditor_name}`);
          } else {
            console.log(`Owed ${owed[0].amount} from ${owed[0].debtor_name}`);
          }
        }
        process.exit();
      } else {
        // normal login
        console.log(`You logged in as "${user[0].name}"`);
        console.log(`Your balance is : ${user[0].balance}`);
        if (owed.length > 0) {
          if (owed[0].debtor === user[0].user_id) {
            console.log(`Owed ${owed[0].amount} to ${owed[0].creditor_name}`);
          } else {
            console.log(`Owed ${owed[0].amount} from ${owed[0].debtor_name}`);
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
      console.log('Logout success');
      console.log(`Goodbye ${user[0].name}`);
      process.exit();
    } else {
      console.log('You are not logged in');
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
          console.log(amount);
          console.log(owed[0].amount);
          const balanceUser = parseInt(amount) - parseInt(owed[0].amount);
          await model.deposit(user[0].user_id, balanceUser);
          await model.deleteOweds(owed[0].owed_id);
          await model.transfer(user[0].user_id, owed[0].creditor, owed[0].amount);
          console.log(`Transferred ${owed[0].amount} to ${owed[0].creditor_name}`);
          console.log(`Your balance is : ${balanceUser}`);
          console.log(`Owed 0 to ${owed[0].creditor_name}`);
          process.exit();
        } else {
          const remainOwed = parseInt(owed[0].amount) - parseInt(amount);
          await model.updateOweds(owed[0].owed_id, remainOwed);
          await model.transfer(user[0].user_id, owed[0].creditor, amount);
          console.log(`Transferred ${amount} to ${owed[0].creditor_name}`);
          console.log('Your balance is : 0');
          console.log(`Owed ${remainOwed}`);
          process.exit();
        }
      }
      const depositResult = await model.deposit(user[0].user_id, amount);
      if (depositResult.affectedRows > 0) {
        console.log('Deposit success');
        console.log(`Your balance is : ${parseInt(user[0].balance) + parseInt(amount)}`);
        process.exit();
      } else {
        console.log('Deposit failed, please try again later');
        process.exit();
      }
    } else {
      console.log('Please login before making a deposit');
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
      console.log('Your balance is empty, you cannot make a transfer until you make a deposit.');
      process.exit();
    }
    if (user.length > 0) {
      if (recipient.length > 0 && recipient[0].user_id !== user[0].user_id) {
        const accRec = await model.getOweds(user[0].user_id);
        let totalAmount = amount;
        if (accRec.length > 0 && accRec[0].debtor === recipient[0].user_id) {
          if (parseInt(accRec[0].amount) - parseInt(amount) === 0) {
            await model.deleteOweds(accRec[0].owed_id);
            console.log('Transfer success');
            console.log(`Transferred ${amount} to ${recipient[0].name}`);
            console.log(`Owed 0 from ${accRec[0].debtor_name}`);
            process.exit();
          } else if (parseInt(amount) < parseInt(accRec[0].amount)) {
            totalAmount = parseInt(accRec[0].amount) - parseInt(amount);
            await model.updateOweds(accRec[0].owed_id, totalAmount);
            console.log('Transfer success');
            console.log(`Reduce ${accRec[0].debtor_name} debt = ${amount}`);
            console.log(`Owed ${totalAmount} from ${accRec[0].debtor_name}`);
            process.exit();
          } else {
            totalAmount = parseInt(amount) - parseInt(accRec[0].amount);
            await model.deleteOweds(accRec[0].owed_id);
            console.log(`Owed 0 from ${accRec[0].debtor_name}`);
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
          console.log('Transfer Success');
          console.log(`Transferred ${user[0].balance} to ${target}`);
          console.log('Your balance is : 0');
          console.log(`Owed ${owedData.amount} to ${recipient[0].name}`);
          process.exit();
        } else {
          const transferResult = await model.transfer(user[0].user_id, recipient[0].user_id, totalAmount);
          if (transferResult.affectedRows > 0) {
            console.log('Transfer Success');
            console.log(`Transferred ${totalAmount} to ${target}`);
            console.log(`Your balance is : ${parseInt(user[0].balance) - parseInt(totalAmount)}`);
            process.exit();
          } else {
            console.log('Transfer failed, please try again later');
            process.exit();
          }
        }
      } else if (recipient[0].user_id === user[0].user_id) {
        console.log('You cant transfer money to yourself');
        process.exit();
      } else {
        console.log(`Recipients with the name ${target} could not be found`);
        process.exit();
      }
    } else {
      console.log('Please login before making a transfer');
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
      if(parseInt(amount) > parseInt(user[0].balance)){
        console.log('Withdraw Failed');
        console.log(`Your balance is not more than ${user[0].balance}`);
        process.exit()
      }
      const withDrawResult = await model.withdraw(user[0].user_id, amount);
      if (withDrawResult.affectedRows > 0) {
        console.log('Withdraw success');
        console.log(`Your balance is : ${parseInt(user[0].balance) - parseInt(amount)}`);
        process.exit();
      }
    } else {
      console.log('Please login before withdrawing the balance.');
      process.exit();
    }
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

module.exports = {
  login,
  deposit,
  transfer,
  logout,
  withdraw,
};
