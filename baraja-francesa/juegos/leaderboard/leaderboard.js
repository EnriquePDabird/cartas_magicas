document.addEventListener('DOMContentLoaded', () => {
    // Referencias a las tablas del DOM
    const tables = {
        chips: document.getElementById('table-poker-chips').querySelector('tbody'),
        pokerWins: document.getElementById('table-poker-wins').querySelector('tbody'),
        solitaireScore: document.getElementById('table-solitaire-score').querySelector('tbody'),
        solitaireTime: document.getElementById('table-solitaire-time').querySelector('tbody'),
        solitaireWins: document.getElementById('table-solitaire-wins').querySelector('tbody')
    };

    /**
     * Enmascara un email por privacidad (e.g., test@gmail.com -> tes***@gmail.com)
     */
    function maskEmail(email) {
        if (!email) return 'Jugador Anónimo';
        const parts = email.split('@');
        if (parts.length !== 2) return email;

        let name = parts[0];
        const domain = parts[1];

        if (name.length > 3) {
            name = name.substring(0, 3) + '***';
        } else {
            name = name.substring(0, 1) + '***';
        }

        // Ocultar también el dominio (opcional, lo dejamos visible para saber el provider)
        return `${name}@${domain}`;
    }

    /**
     * Formatea segundos a MM:SS
     */
    function formatTime(totalSeconds) {
        if (totalSeconds === null || totalSeconds === undefined || totalSeconds === Infinity) return '---';
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * Renderiza un array de jugadores en una tabla específica
     */
    function renderTable(tbody, dataList, valueFormatterFn) {
        tbody.innerHTML = ''; // Limpiar estado de carga

        if (dataList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted)">Aún no hay magos aquí.</td></tr>';
            return;
        }

        dataList.forEach((player, index) => {
            const tr = document.createElement('tr');

            // Icono de medalla para el Top 3
            let rankHtml = `${index + 1}`;
            let rankClass = '';
            if (index === 0) { rankHtml = '<i class="fa-solid fa-trophy"></i> 1'; rankClass = 'rank-1'; }
            if (index === 1) { rankHtml = '<i class="fa-solid fa-medal"></i> 2'; rankClass = 'rank-2'; }
            if (index === 2) { rankHtml = '<i class="fa-solid fa-medal"></i> 3'; rankClass = 'rank-3'; }

            // Celda Rango
            const tdRank = document.createElement('td');
            tdRank.className = rankClass;
            tdRank.innerHTML = rankHtml;

            // Celda Nombre (Email Enmascarado)
            const tdName = document.createElement('td');
            tdName.className = 'player-name';
            tdName.textContent = maskEmail(player.email);

            // Celda Valor (Puntuación, Fichas, Tiempo, etc)
            const tdValue = document.createElement('td');
            tdValue.className = 'player-score';
            tdValue.textContent = valueFormatterFn ? valueFormatterFn(player.value) : player.value;

            tr.appendChild(tdRank);
            tr.appendChild(tdName);
            tr.appendChild(tdValue);

            tbody.appendChild(tr);
        });
    }

    /**
     * Obtiene y ordena todos los datos desde Firestore
     */
    function loadLeaderboards() {
        db.collection('users').get()
            .then(snapshot => {
                const users = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Fallbacks seguros para evitar errores en usuarios antiguos sin estructura completa
                    const userPack = {
                        email: data.email,
                        chips: data.chips || 0,
                        pokerWins: (data.stats && data.stats.poker && data.stats.poker.handsWon) || 0,
                        solitaireScore: (data.stats && data.stats.solitaire && data.stats.solitaire.highestScore) || 0,
                        solitaireTime: (data.stats && data.stats.solitaire && data.stats.solitaire.bestTime) !== undefined ? data.stats.solitaire.bestTime : Infinity,
                        solitaireWins: (data.stats && data.stats.solitaire && data.stats.solitaire.gamesWon) || 0
                    };
                    users.push(userPack);
                });

                // Ordenadores Genéricos
                const sortDesc = (prop) => (a, b) => b[prop] - a[prop];
                const sortAsc = (prop) => (a, b) => a[prop] - b[prop];

                // --- 1. Jugadores Más Ricos (Chips) ---
                const topChips = [...users].sort(sortDesc('chips')).slice(0, 10);
                renderTable(tables.chips, topChips.map(u => ({ email: u.email, value: u.chips })), val => val.toString());

                // --- 2. Más Manos Ganadas (Póker) ---
                // Solo mostrar los que al menos han ganado 1 vez
                const topPokerWins = [...users].filter(u => u.pokerWins > 0).sort(sortDesc('pokerWins')).slice(0, 10);
                renderTable(tables.pokerWins, topPokerWins.map(u => ({ email: u.email, value: u.pokerWins })));

                // --- 3. Récord de Puntuación (Solitario) ---
                const topSolitaireScore = [...users].filter(u => u.solitaireScore > 0).sort(sortDesc('solitaireScore')).slice(0, 10);
                renderTable(tables.solitaireScore, topSolitaireScore.map(u => ({ email: u.email, value: u.solitaireScore })));

                // --- 4. Speedrunners (Solitario, Menor Tiempo) ---
                // Filtrar los Infinity (gente que no ha ganado nunca)
                const topSolitaireTime = [...users].filter(u => u.solitaireTime !== Infinity).sort(sortAsc('solitaireTime')).slice(0, 10);
                renderTable(tables.solitaireTime, topSolitaireTime.map(u => ({ email: u.email, value: u.solitaireTime })), formatTime);

                // --- 5. Ganadores Frecuentes (Solitario) ---
                const topSolitaireWins = [...users].filter(u => u.solitaireWins > 0).sort(sortDesc('solitaireWins')).slice(0, 10);
                renderTable(tables.solitaireWins, topSolitaireWins.map(u => ({ email: u.email, value: u.solitaireWins })));
            })
            .catch(error => {
                console.error("Error obteniendo leaderboard: ", error);

                // Mensaje visual de error en todas las tablas
                const errorHtml = '<tr><td colspan="3" style="text-align: center; color: var(--danger)">Error de conexión mágica.</td></tr>';
                Object.values(tables).forEach(tbody => tbody.innerHTML = errorHtml);
            });
    }

    // Inicializamos al cargar la página.
    // Como firebase-config.js y auth.js se cargan antes, `db` ya está disponible.
    // Usamos setTimeout leve para asegurar que Firebase se ha inicializado internamente
    setTimeout(loadLeaderboards, 500);
});
