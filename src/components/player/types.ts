export interface searchResult {
  song: Song[];
  artist: Artist[];
  album: Album[];
}

export interface Song {
  id: string;
  parent: string;
  isDir: boolean;
  title: string;
  album: string;
  artist: string;
  track: number;
  year: number;
  coverArt: string;
  size: number;
  contentType: string;
  suffix: string;
  duration: number;
  bitRate: number;
  path: string;
  playCount: number;
  discNumber: number;
  created: string;
  albumId: string;
  artistId: string;
  type: string;
  isVideo: boolean;
  played: boolean;
  bpm: number;
  comment: string;
  sortName: string;
  mediaType: string;
  musicBrainzId: string;
  genres: string[];
  replayGain: {
    trackPeak: number;
    trackGain: number;
  };
  channelCount: number;
  samplingRate: number;
}

interface Artist {
  albumCount: number;
  artistImageUrl: string;
  coverArt: string;
  id: string;
  name: string;
}

interface Album {
  artist: string;
  artistId: string;
  coverArt: string;
  created: string;
  diskTitles: diskTitles[];
  duration: number;
  genre: any[];
  id: string;
  isCompilation: boolean;
  musicBrainzId: string;
  name: string;
  originalReleaseDate: object;
  releseDate: object;
  songCount: number;
  sortName: string;
  userRating: number;
  year: number;
}

interface diskTitles {
  disc: number;
  title: string;
}
