/**
 * DND AI Adventure - Game Logic
 */

let gameId = new URLSearchParams(window.location.search).get('id');
let gameState = null;

const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const diceResult = document.getElementById('dice-result');

document.addEventListener('DOMContentLoaded', async () => {
    if (!gameId) {
        window.location.href = 'index.html';
        return;
    }

    // Load Game Data
    try {
        const response = await fetch(`http://localhost:3000/api/game/${gameId}`);
        gameState = await response.json();
        
        renderParty(gameState.character, gameState.party);
        
        if (gameState.history.length === 0) {
            initStory();
        } else {
            // โหลดประวัติเก่า
            gameState.history.forEach(msg => {
                appendMessage(msg.role === 'user' ? 'user' : 'dm', msg.content);
            });
        }
    } catch (error) {
        appendMessage('system', '❌ โหลดข้อมูลเกมไม่สำเร็จ');
    }

    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserInput(); });
    rollDiceBtn.addEventListener('click', rollDice);
    document.getElementById('exit-game-btn').addEventListener('click', () => window.location.href = 'index.html');
});

async function initStory() {
    appendMessage('system', 'กำลังเตรียมเนื้อเรื่อง...');
    showLoading();
    const response = await callBackendChat("เริ่มการผจญภัย!");
    hideLoading();
    appendMessage('dm', response);
}

async function handleUserInput() {
    const text = userInput.value.trim();
    if (!text) return;
    userInput.value = '';
    appendMessage('user', text);
    showLoading();
    const response = await callBackendChat(text);
    hideLoading();
    appendMessage('dm', response);
}

async function callBackendChat(message) {
    const selectedModel = document.getElementById('current-model-select').value;
    try {
        const response = await fetch(`http://localhost:3000/api/game/${gameId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message, 
                modelPriority: [selectedModel, "gemma-3-27b-it", "gemma-3-12b-it", "gemini-flash-latest"]
            })
        });
        const data = await response.json();
        return data.text;
    } catch (error) {
        return "❌ การเชื่อมต่อล้มเหลว";
    }
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgDiv.innerHTML = `<div class="msg-sender">${sender.toUpperCase()}</div><div class="msg-content">${formattedText}</div>`;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
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

function rollDice() {
    const result = Math.floor(Math.random() * 20) + 1;
    diceResult.innerText = result;
    diceResult.style.animation = 'none';
    setTimeout(() => { diceResult.style.animation = 'dicePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; }, 10);
    appendMessage('system', `คุณทอยลูกเต๋าได้: ${result}`);
}

function renderParty(char, party) {
    const partyList = document.getElementById('party-list');
    
    let html = `
        <div class="party-member user-member">
            <div class="member-avatar">
                <img src="${char.avatar}" alt="${char.name}" onerror="this.src='https://via.placeholder.com/150?text=Hero'">
            </div>
            <div class="member-info">
                <h4>${char.name} (คุณ)</h4>
                <p>${char.race} ${char.class}</p>
            </div>
        </div>
    `;

    if (party && party.length > 0) {
        party.forEach(m => {
            html += `
                <div class="party-member">
                    <div class="member-avatar">
                        <img src="${m.avatar}" alt="${m.name}" onerror="this.src='https://via.placeholder.com/150?text=NPC'">
                    </div>
                    <div class="member-info">
                        <h4>${m.name}</h4>
                        <p>${m.race} ${m.class}</p>
                    </div>
                </div>
            `;
        });
    }

    partyList.innerHTML = html;
}
