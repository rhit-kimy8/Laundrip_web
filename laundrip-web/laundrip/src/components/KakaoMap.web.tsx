import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { KAKAO_MAP_KEY } from '../services/api';
import { generateMapHTML, handleMapMessage, KakaoMapProps, mapStyles as styles } from './KakaoMapShared';

// Web version: Expo automatically uses this file instead of KakaoMap.tsx when building for the browser.
// Same map page as the phone app, but shown in an <iframe> instead of a WebView.

// The map page calls window.ReactNativeWebView.postMessage(...).
// In a browser that object doesn't exist, so we add a tiny stand-in that forwards messages to this page.
const BRIDGE =
  '<script>window.ReactNativeWebView={postMessage:function(m){window.parent.postMessage(m,"*");}};</script>';

export default function KakaoMap(props: KakaoMapProps) {
  const { onToggleFullscreen, currentLocation, shops, tourPlaces, showShops = true, activeShopId } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  // Listen for marker taps coming from the iframe
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (typeof event.data === 'string') handleMapMessage(event.data, propsRef.current);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const html = generateMapHTML(KAKAO_MAP_KEY, currentLocation, shops, tourPlaces, showShops, activeShopId)
    .replace('<head>', `<head>${BRIDGE}`);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="LaundriP map"
        style={{ border: 0, width: '100%', height: '100%', flex: 1 }}
        allow="geolocation"
      />
      {/* 풀스크린 토글 버튼 */}
      {onToggleFullscreen && (
        <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={onToggleFullscreen}
        >
          <Text style={styles.fullscreenButtonText}>⛶</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
