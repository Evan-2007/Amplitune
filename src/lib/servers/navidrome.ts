import { useRouter } from 'next/router';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';

export const fawafsfa = async () => {
  const storage = new CrossPlatformStorage();
  const servers = await storage.getItem('servers');
  if (!servers) {
    return null;
  }
  const parsedServers = JSON.parse(servers);
  const activeServer = parsedServers.find(
    (server: { type: string }) => server.type === 'navidrome'
  );
  return activeServer.url;
};

interface server {
  url: string;
  username: string;
  password: string;
  id: string;
  salt: string;
  hash: string;
  type: 'navidrome';
}

export const subsonicURL = async (path: string, params?: string) => {
  const storage = new CrossPlatformStorage();
  const activeServer = await storage.getItem('activeServer');
  if (!activeServer) {
    return 'error';
  }
  const parsedServer = await JSON.parse(activeServer);
  console.log(parsedServer);
  const url = `${parsedServer.url}${path}?u=${parsedServer.username}&t=${parsedServer.hash}&s=${parsedServer.salt}&v=1.13.0&c=myapp&f=json${params}`;
  return url;
};
