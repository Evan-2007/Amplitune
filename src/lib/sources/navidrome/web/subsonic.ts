export const subsonicBaseUrl = async (
  path: string,
  params: string = ''
): Promise<string> => {
  const activeServer = localStorage.getItem('activeServer');
  if (!activeServer) {
    throw new Error('No active server');
  }
  const parsedServer = await JSON.parse(activeServer);
  console.log(parsedServer);
  const url = `${parsedServer.url}${path}?u=${parsedServer.username}&t=${parsedServer.hash}&s=${parsedServer.salt}&v=1.13.0&c=myapp&f=json${params}`;
  return url;
};
