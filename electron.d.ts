export interface ElectronAPI {
    invokeMain: (channel: string, ...args: any[]) => Promise<any>
    send: (channel: string, ...args: any[]) => void
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI
    }
  }