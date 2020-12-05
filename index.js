const { ApolloServer } = require('apollo-server');      // Sintaxis de node antiguo, ahora igual se podrían utilizar imports aunque puede que haya algunas librerias que no lo soporten
const jwt = require('jsonwebtoken');
require('dotenv').config('variables.env');
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");

const conectarDB = require('./config/db')

// Conectar a la DB
conectarDB();

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: ({req}) => {
        // console.log(req.headers['authorization']);
        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
                console.log(usuario);
                return{
                    usuario
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
});

// Conexión Local
// server.listen().then( ({url}) => {
//     console.log(`Servidor listo en la URL ${url}`);
// } )

// Conexión con Heroku
server.listen({port: process.env.PORT || 4000}).then( ({url}) => {
    console.log(`Servidor listo en la URL ${url}`);
} )