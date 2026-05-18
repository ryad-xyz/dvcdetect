const { UAParser } = require('ua-parser-js');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    const ua = req.query.ua || req.headers['user-agent'] || '';
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const ram = req.query.ram || 'unknown';
    const cpu = req.query.cpu || 'unknown';

    res.status(200).json({
        status: 'success',
        timestamp: Math.floor(Date.now() / 1000),
        data: {
            ...result,
            hardware: {
                ram: ram + " GB",
                cpu_cores: cpu + " Cores"
            }
        }
    });
};
