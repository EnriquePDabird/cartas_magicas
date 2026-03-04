document.addEventListener('DOMContentLoaded', () => {
    // Definimos los palos en el orden estándar de la baraja francesa
    const suits = [
        { name: 'Corazones', symbol: '♥', color: 'red' },
        { name: 'Tréboles', symbol: '♣', color: 'black' },
        { name: 'Diamantes', symbol: '♦', color: 'red' },
        { name: 'Picas', symbol: '♠', color: 'black' }
    ];

    // Valores ordenados de menor a mayor (As hasta Rey)
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    const deckContainer = document.getElementById('deck-container');
    const allCards = [];

    // Contador para escalar de forma escalonada la animación inicial
    let delayCounter = 0;

    suits.forEach(suit => {
        values.forEach(val => {
            const card = document.createElement('div');
            card.className = `card ${suit.color}`;

            // Animación de aparición consecutiva
            card.style.animationDelay = `${delayCounter * 0.02}s`;
            delayCounter++;

            // Generar contenido central según el valor
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
                const L = '20%', R = '80%', M = '50%';
                const T = '12%', B = '88%', C = '50%';

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
                pos.forEach(p => {
                    centerContent += `<div class="suit-icon ${p.flip ? 'flip' : ''}" style="left: ${p.x}; top: ${p.y};">${suit.symbol}</div>`;
                });
                centerContent += `</div>`;
            }

            // Maquetación interna de la carta (con soporte para 3D flip)
            card.innerHTML = `
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

            // Lógica para arrastrar y soltar cartas
            let isDragging = false;
            let startX, startY;
            let translateX = 0, translateY = 0;

            card.addEventListener('pointerdown', (e) => {
                isDragging = true;
                card.classList.add('dragging');
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                card.setPointerCapture(e.pointerId);
                e.preventDefault();
            });

            card.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                card.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.05) rotate(${translateX * 0.05}deg)`;
            });

            const releaseCard = (e) => {
                if (!isDragging) return;
                isDragging = false;
                card.classList.remove('dragging');
                card.releasePointerCapture(e.pointerId);
                translateX = 0;
                translateY = 0;
                card.style.transform = '';
            };

            card.addEventListener('pointerup', releaseCard);
            card.addEventListener('pointercancel', releaseCard);

            // Almacenar ref global
            allCards.push({ suit, val, element: card });
        });
    });

    // Función para renderizar por palos organizados
    function renderSorted() {
        deckContainer.innerHTML = '';
        suits.forEach(suit => {
            const suitSection = document.createElement('section');
            suitSection.className = 'suit-section';

            const suitTitle = document.createElement('h2');
            suitTitle.className = `suit-title ${suit.color}`;
            suitTitle.innerHTML = `<span>${suit.symbol}</span> ${suit.name}`;
            suitSection.appendChild(suitTitle);

            const cardsGrid = document.createElement('div');
            cardsGrid.className = 'cards-grid';

            // Filtrar las cartas de este palo y asegurarnos de que estén en orden (As a Rey)
            const suitCards = allCards.filter(c => c.suit.name === suit.name);
            suitCards.sort((a, b) => values.indexOf(a.val) - values.indexOf(b.val));

            suitCards.forEach(c => cardsGrid.appendChild(c.element));

            suitSection.appendChild(cardsGrid);
            deckContainer.appendChild(suitSection);
        });
    }

    // Función para renderizar en una única parrilla mezclada
    function renderShuffled() {
        deckContainer.innerHTML = '';
        const section = document.createElement('section');
        section.className = 'suit-section';

        const title = document.createElement('h2');
        title.className = `suit-title black`;
        title.innerHTML = `<span>🎲</span> Baraja Mezclada`;
        section.appendChild(title);

        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'cards-grid';

        // Ordenamos las cartas aleatoriamente
        const mixed = [...allCards].sort(() => Math.random() - 0.5);
        mixed.forEach(c => cardsGrid.appendChild(c.element));

        section.appendChild(cardsGrid);
        deckContainer.appendChild(section);
    }

    // Inicializar la vista agrupada por defecto
    renderSorted();

    // Lógica de botones
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnSort = document.getElementById('btn-sort');

    // Función auxiliar para girar boca abajo, reorganizar DOM y girar boca arriba
    const flipCardsAndExecute = (callback) => {
        // 1. Damos la vuelta a todas las cartas (añadimos la clase flipped)
        allCards.forEach(c => c.element.classList.add('flipped'));

        // 2. Esperamos medio segundo (500ms)
        setTimeout(() => {
            // Reorganizamos DOM silenciosamente
            callback();

            // 3. Volvemos a darles la vuelta (con requestAnimationFrame para que el DOM aplique reflow)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    allCards.forEach(c => c.element.classList.remove('flipped'));
                });
            });
        }, 500);
    };

    btnShuffle.addEventListener('click', () => {
        flipCardsAndExecute(() => renderShuffled());
    });

    btnSort.addEventListener('click', () => {
        flipCardsAndExecute(() => renderSorted());
    });
});
