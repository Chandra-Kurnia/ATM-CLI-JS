const model = require('./model');

const login = async (name) => {
  try {
    const userLoggedIn = await model.findUser('islogin', 1);
    if (userLoggedIn.length > 0 && userLoggedIn[0].name !== name) {
      console.log(`You are still logged in as "${userLoggedIn[0].name}", please logout before logging in as "${name}"`);
      process.exit();
    }
    console.log('Welcome to atm-cli');
    const user = await model.findUser('name', name);
    if (user.length < 1) {
      // console.log(`User not found, are you want create new user with name "${name}" ?`);
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
      if (user[0].islogin === 1) {
        console.log(`You already logged in as "${user[0].name}"`);
        console.log(`Your balance is : ${user[0].balance}`);
        process.exit();
      } else {
        console.log(`You logged in as "${user[0].name}"`);
        console.log(`Your balance is : ${user[0].balance}`);
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
        if (user[0].balance < amount) {
          const owedData = {
            debtor: user[0].user_id,
            creditor: recipient[0].user_id,
            amount: parseInt(amount) - parseInt(user[0].balance),
          };
          const transferResult = await model.transfer(user[0].user_id, recipient[0].user_id, user[0].balance);
          const owedResult = await model.createOwed(owedData);
          console.log('Transfer Success');
          console.log(`Transferred ${user[0].balance} to ${target}`);
          console.log('Your balance is : 0');
          console.log(`Owed ${owedData.amount} to ${recipient[0].name}`);
          process.exit()
        } else {
          const transferResult = await model.transfer(user[0].user_id, recipient[0].user_id, amount);
          if (transferResult.affectedRows > 0) {
            console.log('Transfer Success');
            console.log(`Transferred ${amount} to ${target}`);
            console.log(`Your balance is : ${parseInt(user[0].balance) - parseInt(amount)}`);
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

module.exports = {
  login,
  deposit,
  transfer,
  logout,
};
