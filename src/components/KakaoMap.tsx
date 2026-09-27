import { Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { KAKAO_MAP_KEY } from '../services/api';
import { generateMapHTML, handleMapMessage, KakaoMapProps, mapStyles as styles } from './KakaoMapShared';

// Phone version (Android/iOS): the map page runs inside a WebView.
export default function KakaoMap(props: KakaoMapProps) {
  const { onToggleFullscreen, currentLocation, shops, tourPlaces, showShops = true, activeShopId } = props;

  return (
    <View style={styles.container}>
      <WebView
        source={{
          html: generateMapHTML(KAKAO_MAP_KEY, currentLocation, shops, tourPlaces, showShops, activeShopId),
          baseUrl: 'https://dapi.kakao.com',
        }}
        style={styles.webview}
        onMessage={(event) => handleMapMessage(event.nativeEvent.data, props)}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        onError={(e) => console.log('WEBVIEW ERROR', e.nativeEvent)}
        onHttpError={(e) => console.log('HTTP ERROR', e.nativeEvent)}
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
