/**
 * DND AI Adventure - Core Logic (Refactored for Multi-Step Setup)
 */

const state = {
    gameId: null,
    character: { name: '', race: '', class: '', bio: '' },
    world: '',
    party: [
        { name: 'Kaelen', role: 'Elf Archer', icon: 'fa-user-ninja' },
        { name: 'Grom', role: 'Half-Orc Tank', icon: 'fa-shield-halved' }
    ]
};

const API_BASE = 'http://localhost:3000/api';

// UI Screens
const worldScreen = document.getElementById('world-screen');
const charScreen = document.getElementById('char-screen');
const gameScreen = document.getElementById('game-screen');

// Elements
const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const diceResult = document.getElementById('dice-result');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.getElementById('next-to-char-btn').addEventListener('click', () => {
        switchScreen(worldScreen, charScreen);
    });
    
    document.getElementById('back-to-world-btn').addEventListener('click', () => {
        switchScreen(charScreen, worldScreen);
    });

    document.getElementById('start-game-btn').addEventListener('click', startGame);
    
    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserInput();
    });
    rollDiceBtn.addEventListener('click', rollDice);
});

function switchScreen(from, to) {
    from.classList.remove('active');
    to.classList.add('active');
}

async function startGame() {
    state.character = {
        name: document.getElementById('char-name').value || 'นักผจญภัยไร้นาม',
        race: document.getElementById('char-race').value,
        class: document.getElementById('char-class').value,
        bio: document.getElementById('char-bio').value
    };
    state.world = document.getElementById('world-prompt').value || 'โลกแฟนตาซีลึกลับที่มีมังกรและเวทมนตร์';

    switchScreen(charScreen, gameScreen);
    renderParty();

    try {
        appendMessage('system', 'กำลังสร้างการเชื่อมต่อกับเซิร์ฟเวอร์...');
        
        const response = await fetch(`${API_BASE}/game/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                character: state.character,
                worldSetting: state.world
            })
        });

        const data = await response.json();
        state.gameId = data._id;

        initStory();
    } catch (error) {
        console.error('Error starting game:', error);
        appendMessage('system', '❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

async function initStory() {
    appendMessage('system', 'กำลังเตรียมเนื้อเรื่องและเพื่อนร่วมทีม...');
    showLoading();
    const response = await callBackendChat("เริ่มการผจญภัย! จงบรรยายฉากแรกและชวนฉันเข้าสู่การผจญภัยพร้อมเพื่อนร่วมทีม");
    hideLoading();
    appendMessage('dm', response);
}

async function handleUserInput() {
    const text = userInput.value.trim();
    if (!text || !state.gameId) return;

    userInput.value = '';
    appendMessage('user', text);

    showLoading();
    const response = await callBackendChat(text);
    hideLoading();
    appendMessage('dm', response);
}

async function callBackendChat(message) {
    try {
        const response = await fetch(`${API_BASE}/game/${state.gameId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unknown error');
        return data.text;
    } catch (error) {
        console.error('API Error:', error);
        appendMessage('system', `❌ Error: ${error.message}`);
        return "ขออภัย เกิดข้อผิดพลาด กรุณาตรวจสอบ Server";
    }
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'ai-loading';
    loadingDiv.className = 'typing';
    loadingDiv.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
    chatLog.appendChild(loadingDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function hideLoading() {
    const loadingDiv = document.getElementById('ai-loading');
    if (loadingDiv) loadingDiv.remove();
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgDiv.innerHTML = `
        <div class="msg-sender">${sender.toUpperCase()}</div>
        <div class="msg-content">${formattedText}</div>
    `;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function rollDice() {
    const result = Math.floor(Math.random() * 20) + 1;
    diceResult.innerText = result;
    diceResult.style.animation = 'none';
    setTimeout(() => {
        diceResult.style.animation = 'dicePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }, 10);
    appendMessage('system', `คุณทอยลูกเต๋าได้: ${result}`);
}

function renderParty() {
    const partyList = document.getElementById('party-list');
    partyList.innerHTML = `
        <div class="party-member user-member">
            <i class="fas fa-crown"></i>
            <div class="member-info">
                <h4>${state.character.name} (คุณ)</h4>
                <p>${state.character.race} ${state.character.class}</p>
            </div>
        </div>
    `;
    state.party.forEach(member => {
        partyList.innerHTML += `
            <div class="party-member">
                <i class="fas ${member.icon}"></i>
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p>${member.role}</p>
                </div>
            </div>
        `;
    });
}
