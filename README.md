# omdb-api-clone

TO SET UP 

1 Run a mongodb server in your computer
2 The commond to do this is sudo service mongod start in the terminal 
3 Clone the repo and open in the terminal in the location and type the command node app.js to run the webserver in your       computer in port 3000
4 Incase if it reports an error with a message 'node module not found' delete the node modules dir and type the command npm  5 5 Install to install the dependencies

THE DB SCHEMA

There are three collections in the database'apiclone'.Like,Watch,Wtw and users
The properties in Like,Watch,Wtw are the same 

    movie: String,
    imdbid: String,
    user: String
  
 The properties in Users
    
    username: String,
    password: String,
    Like: refering the Like schema (array)
    Watch: refering the Watch schema (array)
    Wtw : refering the Wtw schema (array)
    activity : String (array)
