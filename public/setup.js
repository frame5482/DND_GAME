/**
 * DND AI Adventure - Advanced Setup Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const worldScreen = document.getElementById('world-screen');
    const charScreen = document.getElementById('char-screen');
    const partyContainer = document.getElementById('party-members-container');
    const addMemberBtn = document.getElementById('add-member-btn');

    // Navigation
    document.getElementById('next-to-char-btn').addEventListener('click', () => {
        worldScreen.classList.remove('active');
        charScreen.classList.add('active');
    });
    
    document.getElementById('back-to-world-btn').addEventListener('click', () => {
        charScreen.classList.remove('active');
        worldScreen.classList.add('active');
    });

    // Add Dynamic Member
    addMemberBtn.addEventListener('click', () => {
        const memberId = Date.now();
        const memberCard = document.createElement('div');
        memberCard.className = 'card teammate-card';
        memberCard.id = `member-${memberId}`;
        memberCard.innerHTML = `
            <div class="card-header">
                <h3><i class="fas fa-user-plus gold"></i> เพื่อนร่วมทีม</h3>
                <button class="btn-remove" onclick="document.getElementById('member-${memberId}').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="form-group">
                <label>ชื่อ</label>
                <input type="text" class="p-name" placeholder="ชื่อเพื่อน...">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>เพศ</label>
                    <input type="text" class="p-gender" placeholder="ชาย, หญิง...">
                </div>
                <div class="form-group">
                    <label>เผ่าพันธุ์</label>
                    <input type="text" class="p-race" placeholder="Human, Elf...">
                </div>
            </div>
            <div class="form-group">
                <label>อาชีพ</label>
                <input type="text" class="p-class" placeholder="เช่น Archer, Priest...">
            </div>
            <div class="form-group">
                <label>ลักษณะนิสัย</label>
                <input type="text" class="p-personality" placeholder="เช่น กล้าหาญ, ขี้เล่น...">
            </div>
            <div class="form-group">
                <label>Avatar URL</label>
                <input type="text" class="p-avatar" placeholder="https://...">
            </div>
            <div class="form-group">
                <label>ประวัติ/ความสัมพันธ์กับคุณ</label>
                <textarea class="p-bio" placeholder="เช่น 'เพื่อนสมัยเด็ก', 'ทหารรับจ้างที่จ้างมา'..."></textarea>
            </div>
        `;
        partyContainer.appendChild(memberCard);
    });

    document.getElementById('start-game-btn').addEventListener('click', async () => {
        // Collect Hero Data
        const character = {
            name: document.getElementById('char-name').value || 'นักผจญภัยไร้นาม',
            gender: document.getElementById('char-gender').value || 'ไม่ระบุ',
            race: document.getElementById('char-race').value || 'Human',
            class: document.getElementById('char-class').value || 'Warrior',
            personality: document.getElementById('char-personality').value || 'ปกติ',
            bio: document.getElementById('char-bio').value || '',
            avatar: document.getElementById('char-avatar').value || 'https://via.placeholder.com/150?text=Hero'
        };

        // Collect Dynamic Party Data (ละเอียดขึ้น)
        const party = [];
        const memberCards = document.querySelectorAll('.teammate-card');
        memberCards.forEach(card => {
            party.push({
                name: card.querySelector('.p-name').value || 'Companion',
                gender: card.querySelector('.p-gender').value || 'ไม่ระบุ',
                race: card.querySelector('.p-race').value || 'Human',
                class: card.querySelector('.p-class').value || 'Warrior',
                personality: card.querySelector('.p-personality').value || 'ปกติ',
                bio: card.querySelector('.p-bio').value || '',
                avatar: card.querySelector('.p-avatar').value || 'https://via.placeholder.com/150?text=Member'
            });
        });

        const worldSetting = document.getElementById('world-prompt').value || 'โลกแฟนตาซีลึกลับ';
        const modelPriority = document.getElementById('model-priority').value.split(',').map(m => m.trim()).filter(m => m !== "");

        try {
            const response = await fetch('http://localhost:3000/api/game/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character, worldSetting, party, modelPriority })
            });

            const data = await response.json();
            if (data._id) {
                window.location.href = `game.html?id=${data._id}`;
            }
        } catch (error) {
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
    });
});
