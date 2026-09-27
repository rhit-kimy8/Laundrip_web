import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { KAKAO_MAP_KEY } from '../services/api';
import { generateMapHTML, handleMapMessage, KakaoMapProps, mapStyles as styles } from './KakaoMapShared';

// Web version: Expo automatically uses this file instead of KakaoMap.tsx when building for the browser.
// Same map page as the phone app, but shown in an <iframe> instead of a WebView.
//
// Why document.write instead of <iframe srcDoc>?
// A srcDoc page's address is "about:srcdoc", so the Kakao SDK doesn't see "https:" and tries to load
// the rest of the map over http, which browsers block on an https site. Writing the page into an
// empty iframe gives it this site's real https address instead, just like `baseUrl` does in the phone WebView.

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

  // Put the map page into the iframe (and redraw it when the data changes)
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !KAKAO_MAP_KEY) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  if (!KAKAO_MAP_KEY) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a3e' }]}>
        <Text style={{ color: '#aaa', textAlign: 'center', padding: 16 }}>
          {'Kakao map key is missing.\nSet EXPO_PUBLIC_KAKAO_MAP_KEY and redeploy.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        title="LaundriP map"
        style={{ border: 0, width: '100%', height: '100%', flex: 1 }}
        allow="geolocation"
      />
      {/* Full Scrren Toggle Button */}
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
