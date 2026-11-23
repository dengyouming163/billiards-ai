interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: string;
  isElectron: boolean;
}

interface Window {
  electronAPI?: ElectronAPI;
}
