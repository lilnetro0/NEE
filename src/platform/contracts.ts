export type PlatformKind = "web" | "ios" | "android";

export interface SecureStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface PreferenceStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface ClipboardService {
  writeText(text: string): Promise<boolean>;
}

export interface ExternalUrlService {
  open(url: string): Promise<boolean>;
}

export interface DeepLinkService {
  getInitialUrl(): Promise<string | null>;
  onOpen(handler: (url: string) => void): () => void;
}

export type NotificationPermission = "granted" | "denied" | "prompt" | "unsupported";

export interface NotificationService {
  getPermission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  showLocal(title: string, body: string): Promise<boolean>;
}

export type DeviceInformation = {
  platform: PlatformKind;
  operatingSystem: string;
  osVersion: string;
  model?: string;
  locale: string;
};

export interface DeviceInformationService {
  getInfo(): Promise<DeviceInformation>;
}

export type AppVersionInformation = {
  version: string;
  build?: string;
};

export interface AppVersionService {
  getInfo(): Promise<AppVersionInformation>;
}

export type ShareContent = {
  title?: string;
  text?: string;
  url?: string;
};

export type ShareOutcome = "shared" | "cancelled" | "unsupported" | "failed";

export interface SharingService {
  share(content: ShareContent): Promise<ShareOutcome>;
}

export type ReceiptDocument = {
  filename: string;
  mimeType: string;
  data: string;
  encoding: "utf8" | "base64";
};

export interface ReceiptFileService {
  save(document: ReceiptDocument): Promise<boolean>;
}

export type HapticImpactStyle = "light" | "medium" | "heavy";
export type HapticNotificationType = "success" | "warning" | "error";

export interface HapticFeedbackService {
  impact(style?: HapticImpactStyle): Promise<boolean>;
  notification(type: HapticNotificationType): Promise<boolean>;
}

export type ConnectivityStatus = {
  connected: boolean;
  connectionType: "wifi" | "cellular" | "ethernet" | "unknown" | "none";
};

export interface ConnectivityService {
  getStatus(): Promise<ConnectivityStatus>;
  subscribe(handler: (status: ConnectivityStatus) => void): () => void;
}

/**
 * Local device unlock (Face ID / fingerprint / device PIN).
 * This is never a backend identity provider — it only unlocks an already
 * authenticated session that was locked on this device.
 */
export type LocalUnlockResult = "unlocked" | "cancelled" | "unavailable" | "failed";

export interface LocalUnlockService {
  isAvailable(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
  unlock(): Promise<LocalUnlockResult>;
}

export type PlatformServices = {
  secureStorage: SecureStorage;
  preferences: PreferenceStorage;
  clipboard: ClipboardService;
  externalUrls: ExternalUrlService;
  deepLinks: DeepLinkService;
  notifications: NotificationService;
  device: DeviceInformationService;
  appVersion: AppVersionService;
  sharing: SharingService;
  receipts: ReceiptFileService;
  haptics: HapticFeedbackService;
  connectivity: ConnectivityService;
  localUnlock: LocalUnlockService;
};
