declare module 'react-native-config' {
  export interface NativeConfig {
    OTA_SERVER_URL?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
