let mysql = require('mysql');
let connection = mysql.createConnection({
    host:     'localhost',
    user:     'root',
    password: '',
    database: 'database_express_basic',
});

connection.connect(function(error){
    if(!!error){
        console.log(error);
    }else{
        console.log('Connection success');
    }
})

module.exports = connection;