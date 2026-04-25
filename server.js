require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Game = require('./models/Game');

const app = express();
const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- HELPER: เรียก AI พร้อมระบบสลับรุ่นอัตโนมัติ ---
async function callGemini(prompt, systemInstruction = "", modelPriority = []) {
    // ถ้าไม่มีการระบุลำดับ ให้ใช้ค่ามาตรฐาน
    const modelsToTry = (modelPriority && modelPriority.length > 0) 
        ? modelPriority 
        : ["gemini-flash-latest", "gemini-1.5-flash", "gemini-3-flash"];

    for (let modelName of modelsToTry) {
        try {
            console.log(`Attempting with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const finalPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
            const result = await model.generateContent(finalPrompt);
            return result.response.text();
        } catch (err) {
            console.error(`[AI Error] Model ${modelName}: ${err.message}`);
            // ถ้าติด Quota (429) หรือ Server ยุ่ง (503) ให้ลองตัวถัดไปทันที
            if (err.status === 429 || err.status === 503) {
                console.log(`Model ${modelName} is busy/exhausted. Switching to next...`);
                continue; 
            } else {
                // ถ้าเป็น Error อื่นๆ (เช่น 404 ชื่อรุ่นผิด) ให้ลองตัวถัดไปเช่นกัน
                console.log(`Model ${modelName} failed. Trying next...`);
                continue;
            }
        }
    }
    throw new Error("ขออภัย ทุกโมเดลในลิสต์ของคุณโควต้าเต็มแล้ว กรุณารอสักครู่หรือเปลี่ยน API Key");
}

app.post('/api/game/start', async (req, res) => {
    try {
        const { character, worldSetting, party, modelPriority } = req.body;
        const newGame = new Game({ 
            character, 
            worldSetting, 
            party: party || [], 
            modelPriority: modelPriority || [],
            history: [] 
        });
        await newGame.save();
        res.status(201).json(newGame);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/game/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        const { message, modelPriority } = req.body;
        const game = await Game.findById(id);
        if (!game) return res.status(404).json({ error: 'Game not found' });

        const partyStr = game.party.map(p => `${p.name} (${p.race} ${p.class})`).join(', ');
        const systemInstruction = `โลก: ${game.worldSetting}\nผู้เล่น: ${game.character.name} (${game.character.race} ${game.character.class})\nปาร์ตี้: ${partyStr}\nบรรยายในฐานะ DM และแทรกบทพูดเพื่อนร่วมทีม ใช้ภาษาไทย`;
        
        // ใช้ลำดับโมเดลที่ส่งมาจากหน้าแชทก่อน ถ้าไม่มีค่อยใช้ที่ตั้งค่าไว้ตอนเริ่มเกม
        const activePriority = modelPriority || game.modelPriority;
        const aiText = await callGemini(message, systemInstruction, activePriority);

        game.history.push({ role: 'user', content: message });
        game.history.push({ role: 'model', content: aiText });
        await game.save();
        res.json({ text: aiText });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/game/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
