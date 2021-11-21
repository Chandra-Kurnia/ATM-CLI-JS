const connection = require('./configs/db')

const getUser = () => new Promise((resolve, reject) => {
    connection.query('SELECT * FROM users', (err, result) => {
        if(err){
          reject(err)
        }else{
          resolve(result)
        }
      })
})

const findUser = (column, value) => new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM users WHERE ${column}='${value}'`, (err, result) => {
        if(err){
            reject(err)
        }else{
            resolve(result)
        }
    })
})

const addUser = (data) => new Promise((resolve, reject) => {
    connection.query('INSERT INTO users SET ?', data, (err, result) => {
        if(err){
            reject(err)
        }else{
            resolve(result)
        }
    })
})

const auth = (id, islogin) => new Promise((resolve, reject) => {
    connection.query(`UPDATE users SET islogin=${islogin} WHERE user_id=${id}`, (err, result) => {
        if(err){
            reject(err)
        }else{
            resolve(result)
        }
    })
})

module.exports = {
    getUser,
    findUser,
    addUser,
    auth
}