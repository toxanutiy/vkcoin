const mongoose = require('mongoose');
const db = mongoose.connection;
const config = require('../config.json');

let userSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        index: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    avatar: {
        type: String
    },
    balance: {
        type: Number,
        default: 0
    },
    upgrades: {
        type: Array,
        default: []
    },
    auto: {
        type: Number,
        default: 0
    },
    shop: {
        type: Array,
        default: []
    }
});

class User {
    constructor() {
        this.id = null;
        this.firstName = null;
        this.lastName = null;
        this.avatar = null;
        this.balance = 0;
    }

    static async findOrCreate(VK, id) {
        let user = await this.findOne({id: id});

        if (user === null) {
            const account = await VK.api.users.get({
                user_ids: id,
                fields: 'photo_max_orig',
                lang: 'ru'
            });

            user = await this.create({id: id, firstName: account[0].first_name, lastName: account[0].last_name, avatar: account[0].photo_max_orig, shop: config.shop});
        }

        return user;
    }
}

userSchema.loadClass(User);

module.exports = db.model('User', userSchema);
