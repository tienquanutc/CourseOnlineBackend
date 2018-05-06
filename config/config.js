const env = process.env.NODE_ENV || 'dev';

const dev = {
    app: {
        port: process.env.PORT || 3000,
    },
    db: {
        host: process.env.DEV_DB_HOST || 'localhost',
        port: parseInt(process.env.DEV_DB_PORT) || 37017,
        name: process.env.DEV_DB_NAME || 'course_online'
    },
    jwt: {
        secret: 'course online',
        issuer: 'my.issuer.com',
        audience: 'my.audience.com',
        live: 10 * 60 //10 minutes
    }, mail: {
        user: 'tienquan.utc@gmail.com',
        pass: 'Vuyen2503'
    }
};

const production = {
    app: {
        port: process.env.PORT || 3000
    },
    db: {
        host: process.env.DEV_DB_HOST || 'localhost',
        port: parseInt(process.env.DEV_DB_PORT) || 27018,
        name: process.env.DEV_DB_NAME || 'db'
    },
    jwt: {
        secret: 'course online',
        issuer: 'my.issuer.com',
        audience: 'my.audience.com'
    }
};

const config = {
    dev,
    production
};

module.exports = config.dev;
