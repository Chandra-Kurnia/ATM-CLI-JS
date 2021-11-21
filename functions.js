const model = require('./model');

const login = async (name) => {
  try {
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
      }else{
        console.log('Deposit failed, please try again later');
        process.exit()
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

const transfer = (target, amount) => {
  console.log(`You transfered to ${target} with amount = ${amount}`);
};

module.exports = {
  login,
  deposit,
  transfer,
  logout,
};
