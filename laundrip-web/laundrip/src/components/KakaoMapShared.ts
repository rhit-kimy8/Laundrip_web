import { StyleSheet } from 'react-native';

// Shared by KakaoMap.tsx (Android/iOS, WebView) and KakaoMap.web.tsx (browser, iframe).
// The map itself is a small HTML page that loads the Kakao Maps JavaScript SDK.
// When a marker is tapped, the page sends a message: { type: 'shop' | 'place' | 'mapPress', payload }.

export const generateMapHTML = (
  apiKey: string,
  currentLocation: { latitude: number; longitude: number; } | null,
  shops: any[],
  tourPlaces: any[],
  showShops: boolean,
  activeShopId?: number
) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false"></script>
<style>
html, body { margin:0; padding:0; width:100%; height:100%; }
#map { width:100%; height:100%; }
</style>
</head>
<body>
<div id="map"></div>
<script>
kakao.maps.load(function() {
  var container = document.getElementById('map');
  var userLocation = ${JSON.stringify(currentLocation)};

  var initLat = userLocation ? userLocation.latitude : 37.5665;
  var initLng = userLocation ? userLocation.longitude : 126.9983;

  var options = {
    center: new kakao.maps.LatLng(initLat, initLng),
    level: 5
  };
  var map = new kakao.maps.Map(container, options);

  kakao.maps.event.addListener(map, 'click', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress' }));
  });

  if (userLocation) {
    var userOverlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(userLocation.latitude, userLocation.longitude),
      content:
        '<div style="position:relative;">' +
        '<div style="width:14px;height:14px;background:#2196F3;border:3px solid white;border-radius:50%;position:absolute;top:-7px;left:-7px;"></div>' +
        '</div>',
      yAnchor: 0.5,
      xAnchor: 0.5
    });
    userOverlay.setMap(map);
  }

  var showShops = ${JSON.stringify(showShops)};
  var activeShopId = ${JSON.stringify(activeShopId ?? null)};

  if (showShops) {
    var shops = ${JSON.stringify(shops)};
    shops.forEach(function(shop) {
      var isActive = activeShopId !== null && shop.id === activeShopId;
      var borderColor = isActive ? '#FFD700' : '#4FC3F7';
      var bgColor = isActive ? '#2e2a00' : '#1e1e2e';
      var statusText = isActive
        ? '🔄 사용중'
        : '세탁' + shop.washer + ' · 건조' + shop.dryer;

      var div = document.createElement('div');
      var showAllMode = ${JSON.stringify(showShops)};
var shopMarker = showAllMode && !isActive
  ? '<div style="width:28px;height:28px;background:' + bgColor + ';border:2px solid ' + borderColor + ';border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;">🧺</div>'
  : '<div style="background:' + bgColor + ';border:2px solid ' + borderColor + ';border-radius:12px;padding:6px 8px;text-align:center;cursor:pointer;width:70px;">' +
    '<div style="font-size:16px;">🧺</div>' +
    '<div style="color:white;font-size:9px;font-weight:bold;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60px;margin:0 auto;">' + shop.name + '</div>' +
    '<div style="color:' + borderColor + ';font-size:8px;margin-top:2px;text-align:center;">' + statusText + '</div>' +
    '</div>';

div.innerHTML = shopMarker;

      div.addEventListener('click', function(event) {
        event.stopPropagation();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'shop',
          payload: shop
        }));
      });

      var overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(shop.lat, shop.lng),
        content: div,
        yAnchor: 1
      });
      overlay.setMap(map);
    });
  }

  var categoryIcon = {
    '관광지': '🗺️',
    '음식점': '🍜',
    '문화시설': '🏛️',
    '숙박': '🏨',
    '쇼핑': '🛍️',
    '축제/행사': '🎉',
    '전통시장': '🏪',
    '기타': '📍'
  };

  var tourPlaces = ${JSON.stringify(tourPlaces)};
  tourPlaces.forEach(function(place) {
    if (!place.mapx || !place.mapy) return;
    var icon = categoryIcon[place.category] || '📍';
    var div = document.createElement('div');
    var showAllMode = ${JSON.stringify(showShops)};
var markerContent = showAllMode
  ? '<div style="width:28px;height:28px;background:rgba(30,30,46,0.9);border:1.5px solid #aaa;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;">' + icon + '</div>'
  : '<div style="background:rgba(30,30,46,0.9);border:1.5px solid #aaa;border-radius:10px;padding:4px 7px;text-align:center;cursor:pointer;white-space:nowrap;">' +
    '<div style="font-size:13px;">' + icon + '</div>' +
    '<div style="color:#fff;font-size:9px;max-width:55px;overflow:hidden;text-overflow:ellipsis;">' + place.name + '</div>' +
    '</div>';

div.innerHTML = markerContent;

    div.addEventListener('click', function(event) {
      event.stopPropagation();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'place',
        payload: place
      }));
    });

    var overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(parseFloat(place.mapy), parseFloat(place.mapx)),
      content: div,
      yAnchor: 1
    });
    overlay.setMap(map);
  });
});
</script>
</body>
</html>
`;

export interface KakaoMapProps {
  onToggleFullscreen?: () => void;
  showShops?: boolean;
  activeShopId?: number;
  onShopSelect: (shop: any) => void;
  onPlaceSelect: (place: any) => void;
  onMapPress?: () => void;
  currentLocation: { latitude: number; longitude: number; } | null;
  shops: {
    id: number;
    name: string;
    lat: number;
    lng: number;
    washer: number;
    dryer: number;
    distance: string;
  }[];
  tourPlaces: {
    id: string;
    name: string;
    category: string;
    mapx: string;
    mapy: string;
  }[];
}

// Handles a message sent from the map page (same logic on phone and web).
export const handleMapMessage = (raw: string, props: KakaoMapProps) => {
  try {
    const data = JSON.parse(raw);
    if (data.type === 'shop') {
      props.onShopSelect(data.payload);
    } else if (data.type === 'place') {
      props.onPlaceSelect(data.payload);
    } else if (data.type === 'mapPress') {
      props.onMapPress?.();
    }
  } catch (error) {
    console.log('메시지 파싱 오류', error);
  }
};

export const mapStyles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  webview: { flex: 1 },
  fullscreenButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenButtonText: { color: '#fff', fontSize: 18 },
});