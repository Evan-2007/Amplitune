import { fetch } from '@tauri-apps/plugin-http';

const youtubeEndpoint = 'https://www.youtube.com';

interface Thumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface VideoItem {
  id: string;
  type: 'video' | 'channel' | 'playlist';
  thumbnail: Thumbnail[];
  title: string;
  channelTitle?: string;
  shortBylineText?: string;
  length?: string;
  isLive: boolean;
}

interface NextPageContext {
  context: any;
  continuation: string;
}

interface NextPage {
  nextPageToken: string;
  nextPageContext: NextPageContext;
}

interface SearchResult {
  items: VideoItem[];
  nextPage: NextPage;
}

interface SearchOptions {
  type?: 'video' | 'channel' | 'playlist' | 'movie';
}

async function GetYoutubeInitData(url: string): Promise<{ 
  initdata: any; 
  apiToken: string; 
  context: any 
}> {
  try {
    const page = await fetch(encodeURI(url), { mode: 'no-cors' });
    const pageData = await page.text();
    const ytInitData = pageData.split("var ytInitialData =");
    
    if (ytInitData && ytInitData.length > 1) {
      const data = ytInitData[1].split("</script>")[0].slice(0, -1);
      
      let apiToken = '';
      if (pageData.split("innertubeApiKey").length > 0) {
        apiToken = pageData
          .split("innertubeApiKey")[1]
          .trim()
          .split(",")[0]
          .split('"')[2];
      }
      
      let context = null;
      if (pageData.split("INNERTUBE_CONTEXT").length > 0) {
        context = JSON.parse(
          pageData.split("INNERTUBE_CONTEXT")[1].trim().slice(2, -2)
        );
      }
      
      const initdata = JSON.parse(data);
      return { initdata, apiToken, context };
    } else {
      throw new Error("cannot_get_init_data");
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}

function VideoRender(json: any): VideoItem {
  try {
    const videoRenderer = json.videoRenderer || json.playlistVideoRenderer;
    
    if (!videoRenderer) return {} as VideoItem;
    
    let isLive = false;
    if (
      videoRenderer.badges &&
      videoRenderer.badges.length > 0 &&
      videoRenderer.badges[0].metadataBadgeRenderer &&
      videoRenderer.badges[0].metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_LIVE_NOW"
    ) {
      isLive = true;
    }
    
    if (videoRenderer.thumbnailOverlays) {
      videoRenderer.thumbnailOverlays.forEach((item: any) => {
        if (
          item.thumbnailOverlayTimeStatusRenderer &&
          item.thumbnailOverlayTimeStatusRenderer.style &&
          item.thumbnailOverlayTimeStatusRenderer.style === "LIVE"
        ) {
          isLive = true;
        }
      });
    }
    
    return {
      id: videoRenderer.videoId,
      type: "video",
      thumbnail: videoRenderer.thumbnail,
      title: videoRenderer.title.runs[0].text,
      channelTitle: videoRenderer.ownerText?.runs?.[0]?.text || '',
      shortBylineText: videoRenderer.shortBylineText || '',
      length: videoRenderer.lengthText || '',
      isLive
    };
  } catch (ex) {
    throw ex;
  }
}

async function GetListByKeyword(
  keyword: string, 
  withPlaylist: boolean = false, 
  limit: number = 0, 
  options: SearchOptions[] = []
): Promise<SearchResult> {
  let endpoint = `${youtubeEndpoint}/results?search_query=${keyword}`;
  
  try {
    if (Array.isArray(options) && options.length > 0) {
      const type = options.find((z) => z.type);
      if (type && typeof type.type === "string") {
        switch (type.type.toLowerCase()) {
          case "video":
            endpoint = `${endpoint}&sp=EgIQAQ%3D%3D`;
            break;
          case "channel":
            endpoint = `${endpoint}&sp=EgIQAg%3D%3D`;
            break;
          case "playlist":
            endpoint = `${endpoint}&sp=EgIQAw%3D%3D`;
            break;
          case "movie":
            endpoint = `${endpoint}&sp=EgIQBA%3D%3D`;
            break;
        }
      }
    }
    
    const page = await GetYoutubeInitData(endpoint);
    
    const sectionListRenderer = page.initdata.contents
      .twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer;
    
    let contToken: string = '';
    let items: VideoItem[] = [];
    
    sectionListRenderer.contents.forEach((content: any) => {
      if (content.continuationItemRenderer) {
        contToken = content.continuationItemRenderer.continuationEndpoint
          .continuationCommand.token;
      } else if (content.itemSectionRenderer) {
        content.itemSectionRenderer.contents.forEach((item: any) => {
          if (item.channelRenderer) {
            const channelRenderer = item.channelRenderer;
            items.push({
              id: channelRenderer.channelId,
              type: "channel",
              thumbnail: channelRenderer.thumbnail,
              title: channelRenderer.title.simpleText,
              isLive: false
            });
          } else {
            const videoRender = item.videoRenderer;
            const playListRender = item.playlistRenderer;
            
            if (videoRender && videoRender.videoId) {
              items.push(VideoRender(item));
            }
            
            if (withPlaylist) {
              if (playListRender && playListRender.playlistId) {
                items.push({
                  id: playListRender.playlistId,
                  type: "playlist",
                  thumbnail: playListRender.thumbnails,
                  title: playListRender.title.simpleText,
                  length: `${playListRender.videoCount} videos`,
                  isLive: false
                });
              }
            }
          }
        });
      }
    });
    
    const apiToken = page.apiToken;
    const context = page.context;
    const nextPageContext = { context, continuation: contToken };
    const itemsResult = limit !== 0 ? items.slice(0, limit) : items;
    
    return {
      items: itemsResult,
      nextPage: { 
        nextPageToken: apiToken, 
        nextPageContext 
      }
    };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}

export { GetListByKeyword };