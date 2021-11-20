const login = (name) => {
  console.log('Welcome ' + name);

};

const deposit = (amount) => {
    console.log('Deposit ' + amount);
};

const transfer = (target, amount) => {
    console.log(`You transfered to ${target} with amount = ${amount}`);
}

const logout = () => {
  console.log('Good bye, ...');
}

module.exports = {
  login,
  deposit,
  transfer,
  logout
};
