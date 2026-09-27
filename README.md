# LaundriP 런드립

Turn laundromat wait time into a mini trip. LaundriP shows nearby coin laundromats in Korea and, while your laundry runs, recommends places you can walk to and back in time, matched to your interests.

- **Stack**: React Native (Expo SDK 54) + TypeScript, one codebase for Android and the web
- **Data**: Kakao Local API, Korea Tourism Organization TourAPI, regional culture facility API
- **Recommendation**: cosine similarity (interests) + Haversine distance
- **Languages**: Korean, English, Japanese, Chinese

## Code guide

- 한국어: [docs/GUIDE.ko.md](docs/GUIDE.ko.md)
- English: [docs/GUIDE.en.md](docs/GUIDE.en.md)

## Quick start

```bash
cp .env.example .env     # fill in your API keys
npm install
npx expo start           # phone (Expo Go / dev build)
npx vercel dev           # web, together with the /api proxy
```

Deploying the web version to Vercel is covered in the guide (section 9).
