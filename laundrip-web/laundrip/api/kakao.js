// Vercel serverless function — used only by the WEB version.
// Browser → /api/kakao?path=/v2/local/search/keyword.json&query=... → Kakao (with our key added here).
// The key lives only on the server (Vercel env var KAKAO_REST_KEY), so it never reaches the browser.

const ALLOWED_PATHS = ['/v2/local/search/keyword.json', '/v2/local/search/address.json'];

module.exports = async (req, res) => {
  const { path, ...params } = req.query;
  if (!ALLOWED_PATHS.includes(path)) {
    res.status(400).json({ error: 'path not allowed' });
    return;
  }

  const url = `https://dapi.kakao.com${path}?${new URLSearchParams(params)}`;
  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` },
  });

  res.status(response.status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(await response.text());
};
