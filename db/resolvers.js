const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

// Crea y firma un jsonwebtoken
const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre } = usuario;

    return jwt.sign( { id, email, nombre }, secreta, { expiresIn } );
}


const resolvers = {
    Query: {
        obtenerProyectos: async (_, {}, ctx) => {
            const proyectos = Proyecto.find({creador: ctx.usuario.id});
            return proyectos;
        },
        obtenerTareas: async (_, {input}, ctx) => {
            const tareas = Tarea.find({creador: ctx.usuario.id}).where('proyecto').equals(input.proyecto);
            return tareas;
        }
    },
    Mutation: {
        crearUsuario: async (_, {input}, ctx) => {
            const { email, password } = input;

            const existeUsuario = await Usuario.findOne({ email });

            // Si el usuario existe
            if (existeUsuario) {
                throw new Error('El usuario ya está registrado');
            }
            
            try{

                // Hashear password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt);

                // Registrar nuevo usuario
                const nuevoUsuario = new Usuario(input);
                
                nuevoUsuario.save();
                return "Usuario Creado Correctamente"
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_, {input}, ctx) => {
            const {email, password} = input;

            // Comprobar si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });

            // Si el usuario existe
            if (!existeUsuario) {
                throw new Error('El usuario no existe');
            }

            // Comprobar si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            
            if(!passwordCorrecto){
                throw new Error('Password Incorrecto');
            }

            // Dar acceso a la app
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '4hr')
            }
        },
        nuevoProyecto: async (_, {input}, ctx) => {
            try {
                const proyecto = new Proyecto(input);

                // Asociar el creador
                proyecto.creador = ctx.usuario.id;

                // Almacenarlo en la DB
                const resultado = await proyecto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProyecto: async (_, {id, input}, ctx) => {
            // Revisar si el proyecto existe o no
            let proyecto = await Proyecto.findById(id);

            if (!proyecto){
                throw new Error('Proyecto no encontrado');
            }

            // Verificar si la persona que trata de editarlo es el creador
            if(proyecto.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para editar');
            }

            // Guardar el proyecto
            proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, { new: true });
            return proyecto;
        },
        eliminarProyecto: async (_, {id}, ctx) => {
            // Revisar si el proyecto existe o no
            let proyecto = await Proyecto.findById(id);

            if (!proyecto){
                throw new Error('Proyecto no encontrado');
            }

            // Verificar si la persona que trata de eliminarlo es el creador
            if(proyecto.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para eliminar');
            }

            // Eliminar el proyecto
            await Proyecto.findOneAndRemove({_id: id});
            return 'El proyecto se ha eliminado correctamente';
        },
        nuevaTarea: async (_, {input}, ctx) => {
            try {
                const tarea = new Tarea(input);
                tarea.creador = ctx.usuario.id;
                const resultado = await tarea.save();
                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarTarea: async (_, {id, input, estado}, ctx) => {
            // Comprobar si la tarea existe
            let tarea = await Tarea.findById(id);

            if (!tarea){
                throw new Error('Tarea no encontrada');
            }

            // Verificar si la persona que trata de editarlo es el creador
            if(tarea.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para editar');
            }

            // Asignar el estado
            input.estado = estado;

            // Guardar la tarea
            tarea = await Tarea.findOneAndUpdate({_id: id}, input, { new: true });
            return tarea;
        },
        eliminarTarea: async (_, {id}, ctx) => {
            // Comprobar si la tarea existe
            let tarea = await Tarea.findById(id);

            if (!tarea){
                throw new Error('Tarea no encontrada');
            }

            // Verificar si la persona que trata de editarlo es el creador
            if(tarea.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para eliminar');
            }

            // Eliminar la tarea
            await Tarea.findOneAndDelete({_id: id});
            return "Tarea eliminada correctamente";
        }
    }
}

module.exports = resolvers;