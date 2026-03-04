document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO Y CONFIGURACIONES ---
    let chips = 1000;
    let anteBet = 0;
    let callBet = 0;
    let deck = [];
    let playerHand = [];
    let dealerHand = [];
    let gameState = 'IDLE'; // IDLE, ANTE, DEALT, RESOLVED

    const BASE_ANTE = 10;

    const suits = [
        { name: 'Corazones', symbol: '♥', color: 'red' },
        { name: 'Tréboles', symbol: '♣', color: 'black' },
        { name: 'Diamantes', symbol: '♦', color: 'red' },
        { name: 'Picas', symbol: '♠', color: 'black' }
    ];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    // Map para evaluar manos, A=14
    const valMap = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

    // --- DOM REFERENCES ---
    const DOM = {
        chips: document.getElementById('chips-amount'),
        ante: document.getElementById('ante-amount'),
        callAmount: document.getElementById('call-amount'),
        dealerCards: document.getElementById('dealer-cards'),
        playerCards: document.getElementById('player-cards'),
        dealerRank: document.getElementById('dealer-rank'),
        playerRank: document.getElementById('player-rank'),
        btnAnte: document.getElementById('btn-ante'),
        btnDeal: document.getElementById('btn-deal'),
        btnFold: document.getElementById('btn-fold'),
        btnCall: document.getElementById('btn-call'),
        btnNext: document.getElementById('btn-next'),
        btnReset: document.getElementById('btn-reset-chips'),
        msgBox: document.getElementById('game-message'),
        msgTitle: document.getElementById('msg-title'),
        msgDesc: document.getElementById('msg-desc')
    };

    // --- RENDERIZADO DE CARTAS (Reutilizado) ---
    function createCardHTML(suit, val, isFlipped = false) {
        let centerContent = '';
        if (val === 'A') {
            centerContent = `<div class="card-center huge">${suit.symbol}</div>`;
        } else if (['J', 'Q', 'K'].includes(val)) {
            let figure = '';
            if (val === 'J') figure = '💂';
            if (val === 'Q') figure = '👸';
            if (val === 'K') figure = '🤴';
            centerContent = `<div class="card-center figure">${figure}</div>`;
        } else {
            const num = parseInt(val);
            const pos = [];
            const L = '20%', R = '80%', M = '50%', T = '12%', B = '88%', C = '50%';
            switch (num) {
                case 2: pos.push({ x: M, y: T }, { x: M, y: B, flip: true }); break;
                case 3: pos.push({ x: M, y: T }, { x: M, y: C }, { x: M, y: B, flip: true }); break;
                case 4: pos.push({ x: L, y: T }, { x: R, y: T }, { x: L, y: B, flip: true }, { x: R, y: B, flip: true }); break;
                case 5: pos.push({ x: L, y: T }, { x: R, y: T }, { x: M, y: C }, { x: L, y: B, flip: true }, { x: R, y: B, flip: true }); break;
                case 6: pos.push({ x: L, y: T }, { x: R, y: T }, { x: L, y: C }, { x: R, y: C }, { x: L, y: B, flip: true }, { x: R, y: B, flip: true }); break;
                case 7: pos.push({ x: L, y: T }, { x: R, y: T }, { x: M, y: '30%' }, { x: L, y: C }, { x: R, y: C }, { x: L, y: B, flip: true }, { x: R, y: B, flip: true }); break;
                case 8: pos.push({ x: L, y: T }, { x: R, y: T }, { x: M, y: '30%' }, { x: L, y: C }, { x: R, y: C }, { x: M, y: '70%', flip: true }, { x: L, y: B, flip: true }, { x: R, y: B, flip: true }); break;
                case 9: pos.push({ x: L, y: '12%' }, { x: R, y: '12%' }, { x: L, y: '37%' }, { x: R, y: '37%' }, { x: M, y: C }, { x: L, y: '63%', flip: true }, { x: R, y: '63%', flip: true }, { x: L, y: '88%', flip: true }, { x: R, y: '88%', flip: true }); break;
                case 10: pos.push({ x: L, y: '12%' }, { x: R, y: '12%' }, { x: M, y: '30%' }, { x: L, y: '37%' }, { x: R, y: '37%' }, { x: L, y: '63%', flip: true }, { x: R, y: '63%', flip: true }, { x: M, y: '70%', flip: true }, { x: L, y: '88%', flip: true }, { x: R, y: '88%', flip: true }); break;
            }
            centerContent = `<div class="card-center layout-absolute">`;
            pos.forEach(p => centerContent += `<div class="suit-icon ${p.flip ? 'flip' : ''}" style="left: ${p.x}; top: ${p.y};">${suit.symbol}</div>`);
            centerContent += `</div>`;
        }

        return `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-top">
                        <span class="val">${val}</span>
                        <span class="suit-mini">${suit.symbol}</span>
                    </div>
                    ${centerContent}
                    <div class="card-bottom">
                        <span class="val">${val}</span>
                        <span class="suit-mini">${suit.symbol}</span>
                    </div>
                </div>
                <div class="card-back"></div>
            </div>
        `;
    }

    function createCardElement(cardData) {
        const card = document.createElement('div');
        card.className = `card ${cardData.suit.color}`;
        if (cardData.isFlipped) card.classList.add('flipped');
        card.innerHTML = createCardHTML(cardData.suit, cardData.val);
        card.style.animation = 'fadeInUp 0.3s ease-out backwards';
        return card;
    }

    // --- LÓGICA DE CARTAS Y EVALUADOR ---
    function initializeDeck() {
        deck = [];
        suits.forEach(suit => {
            values.forEach(val => {
                deck.push({ suit, val, isFlipped: true, rankValue: valMap[val] });
            });
        });
        deck.sort(() => Math.random() - 0.5);
    }

    // Evaluador simple de manos de poker (retorna {rankScore, rankName})
    // rankScore mayor = mejor mano (ej: Escalera Real = 9, Carta Alta = 0)
    // Para desempates usamos los valores de las cartas (hex/base 15 number)
    function evaluateHand(hand) {
        // Ordenar de mayor a menor valor
        const sorted = [...hand].sort((a, b) => b.rankValue - a.rankValue);
        const vals = sorted.map(c => c.rankValue);
        const suits = sorted.map(c => c.suit.name);

        const isFlush = suits.every(s => s === suits[0]);
        // Arreglar escalera con As bajo (A, 2, 3, 4, 5) => 14, 5, 4, 3, 2
        let isStraight = true;
        for (let i = 0; i < 4; i++) {
            if (vals[i] !== vals[i + 1] + 1) isStraight = false;
        }
        let isLowStraight = false;
        if (!isStraight && vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2) {
            isLowStraight = true;
            vals.push(vals.shift()); // Mover el As al final [5,4,3,2,14]
        }
        const straight = isStraight || isLowStraight;

        // Conteos para pares, tríos...
        const counts = {};
        vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const freqs = Object.values(counts).sort((a, b) => b - a);

        let rankScore = 0;
        let rankName = "Carta Alta";

        if (straight && isFlush && vals[0] === 14 && !isLowStraight) { rankScore = 9; rankName = "Escalera Real"; }
        else if (straight && isFlush) { rankScore = 8; rankName = "Escalera de Color"; }
        else if (freqs[0] === 4) { rankScore = 7; rankName = "Póker"; }
        else if (freqs[0] === 3 && freqs[1] === 2) { rankScore = 6; rankName = "Full House"; }
        else if (isFlush) { rankScore = 5; rankName = "Color"; }
        else if (straight) { rankScore = 4; rankName = "Escalera"; }
        else if (freqs[0] === 3) { rankScore = 3; rankName = "Trío"; }
        else if (freqs[0] === 2 && freqs[1] === 2) { rankScore = 2; rankName = "Doble Pareja"; }
        else if (freqs[0] === 2) { rankScore = 1; rankName = "Pareja"; }

        // Construir string hexadecimal para desempates basado en frecuencias y luego valores
        // Ej: Para un par de Ases: A, A, K, Q, J -> Frecuencia: 2 (A), 1(K), 1(Q), 1(J) -> valores ordenados por desc(frecuencia)
        const entries = Object.entries(counts).map(([v, f]) => ({ v: parseInt(v), f }));
        entries.sort((a, b) => b.f === a.f ? b.v - a.v : b.f - a.f);
        let hexVal = entries.map(e => {
            let str = '';
            for (let i = 0; i < e.f; i++) {
                str += e.v.toString(16).padStart(2, '0');
            }
            return str;
        }).join('');

        return { rankScore, rankName, hexVal, highestVal: sorted[0].rankValue, sortedVals: vals };
    }

    // Regla de clasificación de Banca (AK o mejor)
    function dealerQualifies(evalData) {
        if (evalData.rankScore > 0) return true; // Pareja o superior
        // Si Carta Alta, comprobar si tiene A y K.
        const vals = evalData.sortedVals;
        if (vals[0] === 14 && vals[1] === 13) return true;
        return false;
    }

    // --- ACCIONES DE UI Y FLUJO ---

    function renderUI() {
        DOM.chips.innerText = chips;
        DOM.ante.innerText = anteBet;
        DOM.callAmount.innerText = callBet;

        DOM.btnAnte.disabled = (gameState !== 'IDLE' || chips < BASE_ANTE);
        DOM.btnDeal.disabled = (gameState !== 'ANTE' || anteBet === 0);
        DOM.btnFold.disabled = (gameState !== 'DEALT');
        DOM.btnCall.disabled = (gameState !== 'DEALT' || chips < anteBet * 2);

        if (gameState === 'RESOLVED') {
            DOM.btnNext.style.display = 'block';
            DOM.btnAnte.style.display = 'none';
            DOM.btnDeal.style.display = 'none';
            DOM.btnFold.style.display = 'none';
            DOM.btnCall.style.display = 'none';
        } else {
            DOM.btnNext.style.display = 'none';
            DOM.btnAnte.style.display = 'block';
            DOM.btnDeal.style.display = 'block';
            DOM.btnFold.style.display = 'block';
            DOM.btnCall.style.display = 'block';
        }
    }

    function renderHands(revealDealer = false) {
        DOM.playerCards.innerHTML = '';
        playerHand.forEach((c, idx) => {
            c.isFlipped = false;
            const el = createCardElement(c);
            el.style.animationDelay = `${idx * 0.1}s`;
            DOM.playerCards.appendChild(el);
        });

        DOM.dealerCards.innerHTML = '';
        dealerHand.forEach((c, idx) => {
            // Regla: Crupier revela solo la última carta inicialmente
            if (!revealDealer && idx < 4) {
                c.isFlipped = true;
            } else {
                c.isFlipped = false;
            }
            const el = createCardElement(c);
            el.style.animationDelay = `${idx * 0.1}s`;
            DOM.dealerCards.appendChild(el);
        });

        if (playerHand.length > 0) {
            const pEval = evaluateHand(playerHand);
            DOM.playerRank.innerText = pEval.rankName;
        } else {
            DOM.playerRank.innerText = '';
        }

        if (revealDealer && dealerHand.length > 0) {
            const dEval = evaluateHand(dealerHand);
            DOM.dealerRank.innerText = dealerQualifies(dEval) ? `${dEval.rankName} (Cualifica)` : `${dEval.rankName} (No cualifica)`;
        } else {
            DOM.dealerRank.innerText = '';
        }
    }

    function showMessage(title, desc = '') {
        DOM.msgBox.classList.remove('show');
        void DOM.msgBox.offsetWidth; // trigger reflow
        DOM.msgTitle.innerText = title;
        DOM.msgDesc.innerText = desc;
        DOM.msgBox.classList.add('show');
    }

    function hideMessage() {
        DOM.msgBox.classList.remove('show');
        DOM.msgTitle.innerText = "Esperando";
        DOM.msgDesc.innerText = "Haz tu apuesta Ante para comenzar la mano.";
    }

    // --- EVENTOS ---
    DOM.btnAnte.addEventListener('click', () => {
        if (chips >= BASE_ANTE) {
            chips -= BASE_ANTE;
            anteBet += BASE_ANTE;
            gameState = 'ANTE';
            renderUI();
        }
    });

    DOM.btnDeal.addEventListener('click', () => {
        initializeDeck();
        playerHand = [];
        dealerHand = [];
        for (let i = 0; i < 5; i++) {
            playerHand.push(deck.pop());
            dealerHand.push(deck.pop());
        }
        gameState = 'DEALT';
        renderHands();
        renderUI();
    });

    DOM.btnFold.addEventListener('click', () => {
        gameState = 'RESOLVED';
        renderHands(true);
        renderUI();
        showMessage('Te Retiraste', `Pierdes el Ante (${anteBet} fichas).`);
    });

    DOM.btnCall.addEventListener('click', () => {
        const callNeeded = anteBet * 2;
        if (chips >= callNeeded) {
            chips -= callNeeded;
            callBet = callNeeded;
            resolveGame();
        }
    });

    DOM.btnReset.addEventListener('click', () => {
        chips = 1000;
        renderUI();
    });

    DOM.btnNext.addEventListener('click', () => {
        anteBet = 0;
        callBet = 0;
        playerHand = [];
        dealerHand = [];
        gameState = 'IDLE';
        hideMessage();
        renderHands();
        renderUI();
    });

    // --- RESOLUCIÓN DEL JUEGO ---
    function resolveGame() {
        gameState = 'RESOLVED';
        renderHands(true);
        renderUI();

        const pEval = evaluateHand(playerHand);
        const dEval = evaluateHand(dealerHand);

        if (!dealerQualifies(dEval)) {
            // Banca no cualifica: Ante paga 1:1, Call empuja
            chips += (anteBet * 2) + callBet;
            showMessage('Banca no cualifica', `Ganas el Ante (+${anteBet}). El Call se devuelve.`);
        } else {
            // Comparar manos
            let winner = 'tie';
            if (pEval.rankScore > dEval.rankScore) winner = 'player';
            else if (pEval.rankScore < dEval.rankScore) winner = 'dealer';
            else {
                if (pEval.hexVal > dEval.hexVal) winner = 'player';
                else if (pEval.hexVal < dEval.hexVal) winner = 'dealer';
            }

            if (winner === 'player') {
                // Pago del Call depende de la mano
                const payouts = [1, 1, 2, 3, 4, 5, 7, 20, 50, 100]; // Multiplicadores clásicos aprox
                const multiplier = payouts[pEval.rankScore] || 1;
                const wonAnte = anteBet * 2;
                const wonCall = callBet + (callBet * multiplier);
                chips += wonAnte + wonCall;
                showMessage('¡Ganaste!', `Mejor mano. Ganas +${anteBet} (Ante) y +${callBet * multiplier} (Call x${multiplier}).`);
            } else if (winner === 'dealer') {
                showMessage('Perdiste', `La Banca tiene mejor mano.`);
            } else {
                chips += anteBet + callBet;
                showMessage('Empate', 'Recuperas tus apuestas.');
            }
        }
        renderUI();
    }

    renderUI();
});
