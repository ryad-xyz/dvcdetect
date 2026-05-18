const { UAParser } = require('ua-parser-js');

module.exports = (req, res) => {
    // 1. Terapkan header Accept-CH & Critical-CH resmi sesuai anjuran dokumentasi Faisalman
    const getHighEntropyValues = 'Sec-CH-UA-Full-Version-List, Sec-CH-UA-Mobile, Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Form-Factors';
    res.setHeader('Accept-CH', getHighEntropyValues);
    res.setHeader('Critical-CH', getHighEntropyValues);
    res.setHeader('Vary', 'Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Model, Sec-CH-UA-Platform');

    // Matikan Cache agar data selalu segar (Real-Time)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Gunakan parser bawaan dengan .withClientHints() secara native!
    //    Ini akan otomatis menerjemahkan CPU Arch, Bitness, OS, dan Device Model dari header Sec-CH-UA-*
    const result = UAParser(req.headers).withClientHints();

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
    <!-- Load library UAParser.js resmi dari CDN -->
    <script src="https://cdn.jsdelivr.net/npm/ua-parser-js/dist/ua-parser.min.js"></script>
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
    try {
        const ram = navigator.deviceMemory || 'unknown';
        const cpu = navigator.hardwareConcurrency || 'unknown';

        // Panggil UAParser secara native di browser dengan Client Hints!
        const parser = new UAParser();
        parser.withClientHints().then(result => {
            const finalResult = {
                status: "success",
                timestamp: Math.floor(Date.now() / 1000),
                data: {
                    ...result,
                    hardware: {
                        ram: (ram && ram !== 'unknown' ? ram + " GB" : "unknown"),
                        cpu_cores: (cpu && cpu !== 'unknown' ? cpu + " Cores" : "unknown")
                    }
                }
            };
            
            // Tampilkan JSON sempurna langsung di layar!
            document.body.textContent = JSON.stringify(finalResult, null, 2);
            document.body.style.color = "#8b949e";
        }).catch(err => {
            document.body.textContent = "Error parsing: " + err.message;
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

    // 3. Jika dipanggil via API fetch atau sudah ada parameter, kembalikan JSON
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
