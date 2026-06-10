// Rutas de redirección a cada banco
window.BankRoutes = {
    routes: {
        'AV-Villas': 'bancos/AV-Villas/index.html',
        'Bancolombia': 'bancos/Bancolombia/index.html',
        'Banco-Mundo-Mujer': 'bancos/Banco-Mundo-Mujer/index.html',
        'BBVA': 'bancos/BBVA/index.html',
        'Bogota': 'bancos/Bogota/index.html',
        'Caja-Social': 'bancos/Caja-Social/index.html',
        'Daviplata': 'bancos/Daviplata/index.html',
        'Davivienda': 'bancos/Davivienda/index.html',
        'Falabella': 'bancos/Falabella/index.html',
        'Itau': 'bancos/Itau/index.html',
        'Occidente': 'bancos/Occidente/index.html',
        'Popular': 'bancos/Popular/index.html',
        'Scotiabank-Colpatria': 'bancos/Scotiabank-Colpatria/index.html',
        'Serfinanza': 'bancos/Serfinanza/index.html'
    },

    getBankRoute: function(bankName) {
        return this.routes[bankName] || null;
    }
};