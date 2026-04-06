// Vercel Serverless Function — Claude API Proxy
const https = require('https');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: { message: 'Method not allowed' } });
        return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: { message: 'API key not configured' } });
        return;
    }

    const body = JSON.stringify(req.body);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let responseData = '';
            proxyRes.on('data', chunk => { responseData += chunk; });
            proxyRes.on('end', () => {
                res.status(proxyRes.statusCode).json(JSON.parse(responseData));
                resolve();
            });
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy error:', error.message);
            res.status(500).json({ error: { message: error.message } });
            resolve();
        });

        proxyReq.write(body);
        proxyReq.end();
    });
};
