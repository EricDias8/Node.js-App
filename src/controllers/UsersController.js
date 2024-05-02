const AppError = require("../utils/AppError");
const { hash, compare } = require("bcrypt")
const sqliteConnection = require("../database/sqlite");

class UsersController {
    async create (request, response){
        const { name, email, password} = request.body; 

        const database = await sqliteConnection();
        const checkUserExists = await database.get("SELECT * FROM users WHERE email = (?)", [email]);
        
    if(checkUserExists){
        throw new AppError("Este e-mail já esta em uso.");
    }

    const hashedPassword = await hash(password, 8);


    await database.run("INSERT INTO users (name, email, password) VALUES(?,?,?)",[name,email,hashedPassword]);
    
    return response.status(201).json();
    }

    async update (request, response){

        const { name, email, password, old_password} = request.body;
        const { id } = request.params;

        const database = await sqliteConnection();
        const user = await database.get("SELECT * FROM users WHERE id = (?)", [id] )

        if(!user){
            throw new AppError("User does not exist");
        }

        const userWithUpdatedEmail = await database.get("SELECT * FROM users WHERE email = (?)", [email]);

        if(userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id){
            throw new AppError("Este Email já está em uso");
        }

        if(password && old_password) {
            const checkOldPassword = await compare(old_password, user.password);

            if(!checkOldPassword){
            throw new AppError("Senha Antiga não confere"); 
            }

            user.password = await hash(password, 8);
        }

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if(password && !old_password){
            throw new AppError("Voce precisa informar a nova senha");
        }

        await database.run(`UPDATE users SET name = ?, email = ?, password = ?, updated_at = DATETIME('now') WHERE id = ?`,[user.name,user.email, user.password, id]);

        return response.json();

    }

}

module.exports = UsersController;