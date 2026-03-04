document.addEventListener('DOMContentLoaded', () => {
    // === ESTADO DEL JUEGO ===
    let score = 0;
    const scoreEl = document.getElementById('score');

    // Generación de Baraja Base
    const suits = [
        { name: 'Corazones', symbol: '♥', color: 'red' },
        { name: 'Tréboles', symbol: '♣', color: 'black' },
        { name: 'Diamantes', symbol: '♦', color: 'red' },
        { name: 'Picas', symbol: '♠', color: 'black' }
    ];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const valMap = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

    // Estado absoluto del juego
    let gameState = {
        stock: [],
        waste: [],
        foundations: {
            'Corazones': [],
            'Diamantes': [],
            'Tréboles': [],
            'Picas': []
        },
        tableau: [[], [], [], [], [], [], []]
    };

    // Referencias DOM
    const DOM = {
        stock: document.getElementById('stock'),
        waste: document.getElementById('waste'),
        foundations: {
            'Corazones': document.getElementById('foundation-hearts'),
            'Diamantes': document.getElementById('foundation-diamonds'),
            'Tréboles': document.getElementById('foundation-clubs'),
            'Picas': document.getElementById('foundation-spades')
        },
        tableau: Array.from({ length: 7 }, (_, i) => document.getElementById(`tableau-${i}`))
    };

    function updateScore(points) {
        score += points;
        if (score < 0) score = 0;
        scoreEl.innerText = score;
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // === GENERADOR DE CARTAS (Reutilizado visualmente) ===
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

    function createCardElement(cardData, sourceZone, sourceIndex) {
        const card = document.createElement('div');
        card.className = `card ${cardData.suit.color}`;
        if (cardData.isFlipped) {
            card.classList.add('flipped');
        }
        card.innerHTML = createCardHTML(cardData.suit, cardData.val, cardData.isFlipped);

        card.dataset.zone = sourceZone;
        card.dataset.index = sourceIndex;

        // Si no está dada la vuelta, se puede interactuar
        if (!cardData.isFlipped) {
            card.addEventListener('pointerdown', handleCardPointerDown);
        }

        return card;
    }

    // === GESTIÓN DEL ARRASTRE (DRAG & DROP ROBUSTO) ===
    let dragCtx = null;
    let dragGhost = null;

    function handleCardPointerDown(e) {
        if (e.button !== 0) return; // Solo click izquierdo

        const cardEl = e.currentTarget;
        const zoneInfo = cardEl.dataset.zone.split(':');
        const zoneType = zoneInfo[0];
        const zoneKey = zoneInfo[1];
        const cardIndex = parseInt(cardEl.dataset.index);

        let cardsToDrag = [];
        let originArray = null;

        // Determinar qué cartas se están arrastrando
        if (zoneType === 'waste') {
            originArray = gameState.waste;
            // Solo se puede arrastrar la última carta del waste
            if (cardIndex !== originArray.length - 1) return;
            cardsToDrag = [originArray[cardIndex]];
        } else if (zoneType === 'foundation') {
            originArray = gameState.foundations[zoneKey];
            // Solo se puede arrastrar la última
            if (cardIndex !== originArray.length - 1) return;
            cardsToDrag = [originArray[cardIndex]];
        } else if (zoneType === 'tableau') {
            originArray = gameState.tableau[parseInt(zoneKey)];
            // Se arrastra la carta seleccionada Y TODAS las que están por encima
            cardsToDrag = originArray.slice(cardIndex);
        }

        if (cardsToDrag.length === 0) return;

        e.preventDefault();

        dragCtx = {
            cards: cardsToDrag,
            originArray: originArray,
            originZoneType: zoneType,
            originZoneKey: zoneKey,
            originIndex: cardIndex,
            sourceElements: []
        };

        // Ocultar elementos originales transparentemente
        const parentSlot = cardEl.parentElement;
        const children = Array.from(parentSlot.children);
        // Ocultamos desde el índice real en el DOM que corresponde
        const domStartIndex = children.indexOf(cardEl);
        for (let i = domStartIndex; i < children.length; i++) {
            children[i].style.opacity = '0.3'; // Semi-transparente como pista
            dragCtx.sourceElements.push(children[i]);
        }

        // Crear contenedor fantasma flotante
        dragGhost = document.createElement('div');
        dragGhost.style.position = 'fixed';
        dragGhost.style.pointerEvents = 'none'; // Crucial para detectar el drop por debajo
        dragGhost.style.zIndex = '9999';

        // Centrar el agarre al ratón
        const rect = cardEl.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        // Añadir copias visuales al ghost
        dragCtx.cards.forEach((cData, i) => {
            const visualCard = document.createElement('div');
            visualCard.className = `card ${cData.suit.color}`;
            visualCard.innerHTML = createCardHTML(cData.suit, cData.val, cData.isFlipped);
            // Re-aplicar sombreados
            visualCard.style.boxShadow = '0 25px 50px rgba(0,0,0,0.4)';
            visualCard.style.position = 'absolute';
            visualCard.style.top = `${i * 30}px`;
            visualCard.style.left = '0';
            dragGhost.appendChild(visualCard);
        });

        document.body.appendChild(dragGhost);

        const moveGhost = (clientX, clientY) => {
            dragGhost.style.left = `${clientX - offsetX}px`;
            dragGhost.style.top = `${clientY - offsetY}px`;
        };

        moveGhost(e.clientX, e.clientY);

        // Controladores globales de movimiento
        const onPointerMove = (moveEvt) => {
            moveGhost(moveEvt.clientX, moveEvt.clientY);
        };

        const onPointerUp = (upEvt) => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.body.removeChild(dragGhost);

            // Ver dónde soltó
            dragGhost.style.display = 'none';
            const elementBelow = document.elementFromPoint(upEvt.clientX, upEvt.clientY);
            const dropSlot = elementBelow ? elementBelow.closest('.card-slot') : null;

            let successfulDrop = false;

            if (dropSlot) {
                successfulDrop = attemptDrop(dropSlot, dragCtx);
            }

            dragGhost = null;
            dragCtx = null;

            // Siempre re-renderizamos para limpiar estados fantasma (opacity)
            // Y para reflejar el estado oficial
            renderDOMfromState();
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }

    // === REGLAS DEL KLONDIKE ===
    function attemptDrop(dropSlot, ctx) {
        const targetIsFoundation = dropSlot.classList.contains('foundation-slot');
        const targetIsTableau = dropSlot.classList.contains('tableau-slot');
        const baseDragCard = ctx.cards[0]; // La carta principal siendo arrastrada

        let validMove = false;
        let targetArray = null;

        if (targetIsFoundation) {
            // Regla Foundation: Solo 1 carta a la vez
            if (ctx.cards.length > 1) return false;

            const targetSuitName = dropSlot.dataset.suit;
            targetArray = gameState.foundations[targetSuitName];

            // Regla Foundation: Mismo palo
            if (baseDragCard.suit.name !== targetSuitName) return false;

            const topCard = targetArray.length > 0 ? targetArray[targetArray.length - 1] : null;

            if (!topCard) {
                // Must be Ace
                if (baseDragCard.val === 'A') validMove = true;
            } else {
                // Ascendente secuencial
                if (valMap[baseDragCard.val] === valMap[topCard.val] + 1) {
                    validMove = true;
                }
            }

            if (validMove) {
                updateScore(10);
                showToast('+10 PUNTOS!');
            }
        }
        else if (targetIsTableau) {
            const tIndex = parseInt(dropSlot.id.replace('tableau-', ''));
            targetArray = gameState.tableau[tIndex];
            const topCard = targetArray.length > 0 ? targetArray[targetArray.length - 1] : null;

            if (!topCard) {
                // Tableau vacío: Tradicionalmente solo Reyes ('K'), o libre
                // Lo limitaremos a Reyes para ser estrictos con Klondike
                if (baseDragCard.val === 'K') validMove = true;
            } else {
                // Tableau ocupado: Color alterno y descendente
                const diffColor = baseDragCard.suit.color !== topCard.suit.color;
                const descendente = valMap[baseDragCard.val] === valMap[topCard.val] - 1;

                // Mover sobre carta boca abajo no está permitido
                if (!topCard.isFlipped && diffColor && descendente) {
                    validMove = true;
                }
            }
        }

        if (validMove) {
            // 1. Añadimos cartas al nuevo array
            ctx.cards.forEach(c => targetArray.push(c));

            // 2. Quitamos del antiguo
            ctx.originArray.splice(ctx.originIndex, ctx.cards.length);

            // 3. Revisar si revelamos carta antigua en el tableau
            if (ctx.originZoneType === 'tableau' && ctx.originArray.length > 0) {
                const newTopOrig = ctx.originArray[ctx.originArray.length - 1];
                if (newTopOrig.isFlipped) {
                    newTopOrig.isFlipped = false;
                    updateScore(5);
                }
            }
            return true;
        }

        return false; // Movimiento inválido
    }

    // Al hacer click en el Mazo (Stock) roba una carta
    DOM.stock.addEventListener('click', () => {
        if (gameState.stock.length > 0) {
            const numToPull = Math.min(1, gameState.stock.length);
            for (let i = 0; i < numToPull; i++) {
                const c = gameState.stock.pop();
                c.isFlipped = false; // Al pasar al waste se voltean
                gameState.waste.push(c);
            }
            renderDOMfromState();
        } else {
            // Recargar mazo
            if (gameState.waste.length > 0) {
                // Se invierten y se voltean
                const recycled = gameState.waste.reverse();
                recycled.forEach(c => c.isFlipped = true);
                gameState.stock = recycled;
                gameState.waste = [];
                updateScore(-20); // Penalización por reciclaje
                renderDOMfromState();
            }
        }
    });

    // === RENDERIZADO DESDE ESTADO ===
    function renderDOMfromState() {
        // Limpiamos DOM
        DOM.stock.innerHTML = '';
        DOM.waste.innerHTML = '';
        Object.values(DOM.foundations).forEach(el => el.innerHTML = '');
        DOM.tableau.forEach(el => el.innerHTML = '');

        // Render Stock
        if (gameState.stock.length > 0) {
            // Renderizamos solo la de arriba para no saturar DIVs
            const cardData = gameState.stock[gameState.stock.length - 1];
            const el = createCardElement(cardData, 'stock:0', gameState.stock.length - 1);
            DOM.stock.appendChild(el);
        }

        // Render Waste
        // Para que se vea bonito podríamos mostrar las 3 últimas con offset
        // Pero para KLondike base, mostremos todo apilado (solo interacciona la última)
        gameState.waste.forEach((cardData, idx) => {
            const el = createCardElement(cardData, 'waste:0', idx);
            // Offset visual leve (opcional)
            // el.style.left = `${Math.min(idx, 2) * 15}px`;
            DOM.waste.appendChild(el);
        });

        // Render Foundations
        Object.keys(gameState.foundations).forEach(suitName => {
            const arr = gameState.foundations[suitName];
            // Renderizamos solo la carta superior de la fundación
            if (arr.length > 0) {
                const idx = arr.length - 1;
                const cardData = arr[idx];
                const el = createCardElement(cardData, `foundation:${suitName}`, idx);
                DOM.foundations[suitName].appendChild(el);
            }
        });

        // Render Tableau
        gameState.tableau.forEach((col, tableIndex) => {
            col.forEach((cardData, cardIndex) => {
                const el = createCardElement(cardData, `tableau:${tableIndex}`, cardIndex);
                // Distancia entre cartas apiladas: 30px si boca arriba, 15px si boca abajo
                let accTop = 0;
                for (let prev = 0; prev < cardIndex; prev++) {
                    accTop += col[prev].isFlipped ? 15 : 30;
                }
                el.style.top = `${accTop}px`;
                DOM.tableau[tableIndex].appendChild(el);
            });
        });
    }

    // === INICIALIZACIÓN ===
    function startNewGame() {
        score = 0;
        updateScore(0);

        // 1. Crear baraja ordenada
        const deck = [];
        suits.forEach(suit => {
            values.forEach(val => {
                deck.push({ suit, val, isFlipped: true });
            });
        });

        // 2. Barajar aleatoriamente
        deck.sort(() => Math.random() - 0.5);

        // 3. Limpiar estado
        gameState.stock = [];
        gameState.waste = [];
        Object.keys(gameState.foundations).forEach(k => gameState.foundations[k] = []);
        for (let i = 0; i < 7; i++) gameState.tableau[i] = [];

        // 4. Repartir al Tableau (Layout Klondike)
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = deck.pop();
                if (i === j) card.isFlipped = false; // La última es boca arriba
                gameState.tableau[j].push(card);
            }
        }

        // 5. Resto al stock
        deck.forEach(c => {
            gameState.stock.push(c);
        });

        renderDOMfromState();
    }

    // Binding botón Nuevo Juego
    document.getElementById('btn-new-game').addEventListener('click', startNewGame);

    // Arrancar el primer juego
    startNewGame();
});
