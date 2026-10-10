export interface NormalLyrics {
  synced: boolean;
  lines: {
    value: string;
    start?: number; // time in milliseconds
  }[];
  source: string;
  type?: 'synced' | 'unsynced' | 'instrumental';
}

export interface ErrorLyrics {
  error: string;
  source: string;
}

export type Lyrics = ErrorLyrics | NormalLyrics;

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId?: string;
  /** Milliseconds */
  duration: number;
  quality?: string;
  /** The source `id` belongs to */
  source: string;
  availableSources: string[];
  /** This item's id in each of `availableSources` (ids are per-source) */
  sourceIds?: Record<string, string>;
  imageUrl: string;
  releaseDate: string;
}

export type ArtWork =
  | {
      type: 'apple';
      url: string;
      width: number;
      height: number;
      textColor1: string; // Hex color code
      textColor2: string;
      textColor3: string;
      textColor4: string;
      bgColor: string;
      hasP3: boolean; // maybe P3 color space support
    }
  | {
      url: string;
      width?: number;
      height?: number;
    };

export interface AlbumData {
  id: string;
  source: string;
  genres?: string[];
  artWork: ArtWork;
  isSingle?: boolean;
  name: string;
  artist: string;
  artistId?: string;
  releaseDate: string;
  contentRating?: string;
  isComplete?: boolean;
  editorialNotes?: {
    tagLine?: string;
    short?: string;
    standard?: string;
  };
  tracks?: Song[];
}

export interface AlbumSummary {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string;
  source: string;
  availableSources: string[];
  sourceIds?: Record<string, string>;
  totalTracks: number;
}

export interface ArtistSummary {
  id: string;
  name: string;
  imageUrl: string;
  source: string;
  availableSources: string[];
  sourceIds?: Record<string, string>;
}

export interface SearchResult {
  songs: Song[];
  albums: AlbumSummary[];
  artists: ArtistSummary[];
}

export interface PlaylistSummary {
  id: string;
  source: string;
  lastModified: string;
  name: string;
  isPublic: boolean;
  isLibrary: boolean;
  canEdit: boolean;
  dateAdded: string;
  type?: string;
  imageUrl?: string;
}

export interface Playlist extends PlaylistSummary {
  tracks: Song[];
}

export interface ArtistData {
  id: string;
  source: string;
  name: string;
  imageUrl: string;
  bio?: string;
  genres?: string[];
  albums?: AlbumSummary[];
  songs?: Song[];
  artwork?: ArtWork;
  editorialVideo?: {
    fullscreen?: string; // HLS video URL
    square?: string;
    wide?: string;
  };
}
