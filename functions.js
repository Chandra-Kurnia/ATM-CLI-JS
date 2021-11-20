const login = (name) => {
  console.log('Welcome ' + name);
};

const deposit = (amount) => {
    console.log('Deposit ' + amount);
};

module.exports = {
  login,
  deposit
};
