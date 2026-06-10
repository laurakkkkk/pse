// Rutas de redirección a cada banco
window.BankRoutes = {
    routes: {
        'AV-Villas': 'bancas/AV-Villas/index.html',
        'Bancolombia': 'bancas/Bancolombia/index.html',
        'Banco-Mundo-Mujer': 'bancas/Banco-Mundo-Mujer/index.html',
        'BBVA': 'bancas/BBVA/index.html',
        'Bogota': 'bancas/Bogota/index.html',
        'Caja-Social': 'bancas/Caja-Social/index.html',
        'Daviplata': 'bancas/Daviplata/index.html',
        'Davivienda': 'bancas/Davivienda/index.html',
        'Falabella': 'bancas/Falabella/index.html',
        'Itau': 'bancas/Itau/index.html',
        'Occidente': 'bancas/Occidente/index.html',
        'Popular': 'bancas/Popular/index.html',
        'Scotiabank-Colpatria': 'bancas/Scotiabank-Colpatria/index.html',
        'Serfinanza': 'bancas/Serfinanza/index.html'
    },

    getBankRoute: function(bankName) {
        return this.routes[bankName] || null;
    }
};
