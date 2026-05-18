const { UAParser } = require('ua-parser-js');

module.exports = (req, res) => {
    // Matikan Cache agar data selalu segar (Real-Time)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Ambil data RAM, CPU, dan UA Hints dari query parameter
    const ram = req.query.ram;
    const cpu = req.query.cpu;
    const arch = req.query.arch;
    const bitness = req.query.bitness;

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
    // Gunakan fungsi asynchronous untuk membaca UA Hints secara real-time
    async function detectDevice() {
        try {
            const ram = navigator.deviceMemory || 'unknown';
            const cpu = navigator.hardwareConcurrency || 'unknown';
            
            let arch = 'unknown';
            let bitness = 'unknown';

            // 1. Baca User-Agent Client Hints secara modern!
            if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
                try {
                    const hints = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
                    arch = hints.architecture || 'unknown';
                    bitness = hints.bitness || 'unknown';
                } catch (e) {
                    console.log("Client hints blocked:", e);
                }
            }

            // 2. Tembak kembali ke API /api/parse dengan data hardware sangat lengkap
            fetch(\`/api/parse?ram=\${ram}&cpu=\${cpu}&arch=\${arch}&bitness=\${bitness}\`)
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
    }
    
    detectDevice();
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
            // 3. Gabungkan arsitektur CPU hasil deteksi UA Hints ke variabel CPU asli
            cpu: {
                architecture: (arch && arch !== 'unknown' ? arch : (result.cpu.architecture || undefined))
            },
            hardware: {
                ram: (ram && ram !== 'unknown' ? ram + " GB" : "unknown"),
                cpu_cores: (cpu && cpu !== 'unknown' ? cpu + " Cores" : "unknown"),
                bitness: (bitness && bitness !== 'unknown' ? bitness + "-bit" : "unknown")
            }
        }
    });
};
