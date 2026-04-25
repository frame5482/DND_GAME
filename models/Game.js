const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'model', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const GameSchema = new mongoose.Schema({
    character: {
        name: String,
        race: String,
        class: String,
        bio: String
    },
    worldSetting: String,
    modelPriority: [String],
    party: [
        {
            name: String,
            role: String,
            avatar: String
        }
    ],
    history: [MessageSchema],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', GameSchema);
