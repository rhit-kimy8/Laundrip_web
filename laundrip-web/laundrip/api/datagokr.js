// Vercel serverless function — used only by the WEB version.
// Browser → /api/datagokr?path=/B551011/KorService2/locationBasedList2&... → data.go.kr (with our key added here).
// The key lives only on the server (Vercel env var TOUR_API_KEY), so it never reaches the browser.

const ALLOWED_PATHS = [
  '/B551011/KorService2/locationBasedList2', // 주변 관광지·음식점·문화시설
  '/B551011/KorService2/searchFestival2',    // 축제
  '/B551011/KorService2/detailCommon2',      // 장소 상세
  '/B553457/rgnCltrFcltExmnv1/clifMsmv1',    // 박물관
  '/B553457/rgnCltrFcltExmnv1/clifArglv1',   // 미술관
];

module.exports = async (req, res) => {
  const { path, ...params } = req.query;
  if (!ALLOWED_PATHS.includes(path)) {
    res.status(400).json({ error: 'path not allowed' });
    return;
  }

  const url = `https://apis.data.go.kr${path}?serviceKey=${process.env.TOUR_API_KEY}&${new URLSearchParams(params)}`;
  const response = await fetch(url);

  res.status(response.status);
  res.setHeader('Content-Type', response.headers.get('content-type') || 'text/plain; charset=utf-8');
  res.send(await response.text());
};
