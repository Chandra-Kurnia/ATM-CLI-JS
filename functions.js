const login = (name) => {
  console.log('Welcome ' + name);

};

const deposit = (amount) => {
    console.log('Deposit ' + amount);
};

const transfer = (target, amount) => {
    console.log(`You transfered to ${target} with amount = ${amount}`);
}

module.exports = {
  login,
  deposit,
  transfer
};
