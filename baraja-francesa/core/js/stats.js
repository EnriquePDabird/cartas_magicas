const StatsService = {
    /**
     * Obtiene los datos del usuario desde Firestore. 
     * Si no existe, crea el documento base con todas las estadísticas inicializadas para todos los juegos.
     */
    getUserData: function (user) {
        const userRef = db.collection('users').doc(user.uid);
        return userRef.get().then(doc => {
            if (doc.exists) {
                return doc.data();
            } else {
                // Esquema Base de Datos unificado para todo el perfil
                const newDoc = {
                    email: user.email,
                    chips: 1000,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    stats: {
                        poker: { handsPlayed: 0, handsWon: 0, highestWin: 0 },
                        solitaire: { gamesPlayed: 0, gamesWon: 0, highestScore: 0, bestTime: Infinity }
                    }
                };
                return userRef.set(newDoc, { merge: true }).then(() => newDoc);
            }
        });
    },

    /**
     * Actualiza propiedades del usuario en la base de datos
     */
    update: function (uid, updates) {
        if (!uid) return Promise.resolve();
        // Usamos siempre update() para forzar a Firebase a interpretar las claves
        // pre-formateadas con puntos (ej. 'stats.solitaire.highestScore') como rutas
        // profundas en lugar de como strings literales enteros.
        return db.collection('users').doc(uid).update(updates).catch(console.error);
    }
};

window.StatsService = StatsService;
