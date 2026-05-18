const { UAParser } = require('ua-parser-js');

module.exports = (req, res) => {
    // 1. Matikan Cache agar data selalu segar (Real-Time) dan tidak mengambil dari memori cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Ambil data RAM dan CPU dari query parameter (bila dikirim oleh client)
    const ram = req.query.ram;
    const cpu = req.query.cpu;

    // Jika RAM dan CPU belum ada, dan request ini dibuka langsung dari browser (Accept HTML)
    const acceptHeader = req.headers['accept'] || '';
    if (!ram && !cpu && acceptHeader.includes('text/html')) {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Device Detector API</title>
    <style>
        body {
            background-color: #0d1117;
            color: #58a6ff;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            line-height: 1.5;
            padding: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>Mendeteksi spesifikasi hardware...

<script>
    // Langsung jalankan secara agresif tanpa menunggu DOMContentLoaded!
    try {
        const ram = navigator.deviceMemory || 'unknown';
        const cpu = navigator.hardwareConcurrency || 'unknown';

        // Tembak kembali ke API /api/parse tapi dengan parameter di background
        fetch(\`/api/parse?ram=\${ram}&cpu=\${cpu}\`)
            .then(res => res.json())
            .then(data => {
                // Tampilkan JSON murni di layar, URL tetap /api/parse bersih!
                document.body.textContent = JSON.stringify(data, null, 2);
                document.body.style.color = "#8b949e";
            })
            .catch(err => {
                document.body.textContent = "Error: " + err.message;
                document.body.style.color = "#f85149";
            });
    } catch (e) {
        document.body.textContent = "Error deteksi hardware: " + e.message;
    }
</script>
</body>
</html>
        `);
        return;
    }

    // Jika dipanggil via API fetch atau sudah ada parameter, kembalikan JSON seperti biasa
    const ua = req.query.ua || req.headers['user-agent'] || '';
    const parser = new UAParser(ua);
    const result = parser.getResult();

    res.status(200).json({
        status: 'success',
        timestamp: Math.floor(Date.now() / 1000),
        data: {
            ...result,
            hardware: {
                ram: (ram && ram !== 'unknown' ? ram + " GB" : "unknown"),
                cpu_cores: (cpu && cpu !== 'unknown' ? cpu + " Cores" : "unknown")
            }
        }
    });
};
