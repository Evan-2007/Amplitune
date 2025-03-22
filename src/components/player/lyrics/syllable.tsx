import React, { useEffect, useState, useMemo } from 'react';
import XmlJS from 'xml-js';
import { SourceManager } from '@/lib/sources/source-manager';
import localFont from 'next/font/local';

declare global {
  interface Window {
    isTauri?: boolean;
  }
}
import { useQueueStore } from '@/lib/queue';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { format } from 'path';

export interface SyllableLyricsType {
  sections: {
    lines: {
      words: {
        value: string;
        start: number;
        end: number;
        whitespace?: boolean;
      }[];
      start: number;
      end: number;
      key: string;
      agent: string;
    }[];
    start: number;
    end: number;
    songPart: string;
  }[];

  lang: string;
  timing: string;
}

async function accessToken() {
  console.info('Fetching access token from webUI');
  const response = await tauriFetch('https://music.apple.com/us/browse', {
    method: 'GET',
    mode: 'no-cors',
  });

  if (response.status !== 200) {
    console.error('Failed to get music.apple.com! Please re-try...');
    throw new Error('Failed to get music.apple.com');
  }

  const htmlText = await response.text();
  const indexJsMatch = htmlText.match(/(?<=index)(.*?)(?=\.js")/);
  if (!indexJsMatch) {
    throw new Error('Could not find index JS file reference');
  }

  const indexJs = indexJsMatch[1];
  console.log(indexJs);
  const jsResponse = await tauriFetch(
    `https://music.apple.com/assets/index${indexJs}.js`
  );

  if (jsResponse.status !== 200) {
    console.error('Failed to get js library! Please re-try...');
    throw new Error('Failed to get js library');
  }

  const jsText = await jsResponse.text();
  const tokenMatch = jsText.match(/(?=eyJh)(.*?)(?=")/);

  if (!tokenMatch) {
    throw new Error('Could not find access token in JS file');
  }

  const accessToken = tokenMatch[1];
  console.log('Access token:', accessToken);
  return accessToken;
}

function convertToMilliseconds(timeString: string) {
  const [minutes, seconds] = timeString.split(':');
  const [wholeSecs, fractionalSecs] = seconds.split('.');

  const fractionalDigits = fractionalSecs.length;
  const fractionalValue =
    parseInt(fractionalSecs) / Math.pow(10, fractionalDigits);

  const totalSeconds =
    parseInt(minutes) * 60 + parseInt(wholeSecs) + fractionalValue;

  return totalSeconds;
}

function formatTime(time: string) {
  if (time.includes(':')) {
    return convertToMilliseconds(time);
  } else {
    return parseFloat(time);
  }
}

export async function getSyllableLyrics(
  setSyllableLyrics: (lyrics: SyllableLyricsType) => void
) {
  const sourceManager = SourceManager.getInstance();
  const songId = useQueueStore.getState().queue.currentSong?.track.id;
  if (!window.isTauri && sourceManager.activeSource !== 'musicKit') {
    console.log('Not running in Tauri, cannot fetch syllable lyrics');
    return false;
  }
  const token = await accessToken();
  const MediaUserToken = localStorage.getItem(
    'music.q222xnn59b.media-user-token'
  );

  try {
    const response = await tauriFetch(
      'https://amp-api.music.apple.com/v1/catalog/us/songs/' +
        songId +
        '/syllable-lyrics',
      {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: 'https://music.apple.com',
          'Media-User-Token': MediaUserToken || '',
        },
      }
    );
    const text = await response.text();
    const json = JSON.parse(text);
    if (json.data.length > 0) {
      let xml = json.data[0].attributes.ttml;

      const spanCloseRegex = /<\/span>/g;
      const whitespaceFlags: boolean[] = [];
      let m;
      while ((m = spanCloseRegex.exec(xml)) !== null) {
        const pos = m.index + m[0].length;

        const after = xml.substring(pos);

        const wsMatch = after.match(/^\s+/);
        if (wsMatch) {
          const afterWS = after.substring(
            wsMatch[0].length,
            wsMatch[0].length + 5
          );
          whitespaceFlags.push(afterWS.startsWith('<span'));
        } else {
          whitespaceFlags.push(false);
        }
      }
      console.log('Whitespace flags (per span in order):', whitespaceFlags);

      const options = {
        compact: false,
        ignoreComment: true,
        trim: false,
        preserveChildrenOrder: true,
      };
      const result = XmlJS.xml2js(xml, options);

      const tt = result.elements.find((el: any) => el.name === 'tt');
      if (!tt) {
        console.error('TT element not found');
        return false;
      }
      if (tt.attributes['itunes:timing'] !== 'Word') {
        console.log('Not word timing, cannot fetch syllable lyrics');
        return false;
      }

      const body = tt.elements.find((el: any) => el.name === 'body');
      if (!body) {
        console.error('Body element not found');
        return false;
      }

      let globalSpanIndex = 0;
      const sections = body.elements
        .filter((el: any) => el.name === 'div')
        .map((section: any) => {
          const lines = section.elements
            .filter((el: any) => el.name === 'p')
            .map((line: any) => {
              const words = [];
              if (line.elements && Array.isArray(line.elements)) {
                for (let i = 0; i < line.elements.length; i++) {
                  const node = line.elements[i];
                  if (node.type === 'element' && node.name === 'span') {
                    let value = '';
                    if (node.elements && node.elements.length > 0) {
                      const textNode = node.elements.find(
                        (el: any) => el.type === 'text'
                      );
                      if (textNode) {
                        value = textNode.text;
                      }
                    }
                    const word: any = {
                      value,
                      start: formatTime(node.attributes.begin),
                      end: formatTime(node.attributes.end),
                    };

                    if (
                      globalSpanIndex < whitespaceFlags.length &&
                      whitespaceFlags[globalSpanIndex]
                    ) {
                      word.whitespace = true;
                    }
                    globalSpanIndex++;
                    words.push(word);
                  }
                }
              }
              return {
                words,
                start: formatTime(line.attributes.begin),
                end: formatTime(line.attributes.end),
                key: line.attributes['itunes:key'],
                agent: line.attributes['ttm:agent'],
              };
            });
          return {
            lines,
            start: parseFloat(section.attributes.begin),
            end: parseFloat(section.attributes.end),
            songPart: section.attributes['itunes:songPart'],
          };
        });

      const syllableLyrics: SyllableLyricsType = {
        sections,
        lang: tt.attributes['xml:lang'],
        timing: tt.attributes['itunes:timing'],
      };
      console.log(syllableLyrics);
      setSyllableLyrics(syllableLyrics);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

interface WordData {
  value: string;
  start: number;
  end: number;
  whitespace?: boolean;
}

interface GradientTextLineProps {
  words: WordData[];
  progress: number;
  whitespace?: boolean;
}

const myFont = localFont({
  src: 'SF-Pro-Display-Bold.woff',
  display: 'swap',
});

const GradientWord: React.FC<{
  word: string;
  wordStart: number;
  wordEnd: number;
  progress: number;
  whitespace?: boolean;
}> = ({ word, wordStart, wordEnd, progress, whitespace }) => {
  let percent = 0;
  if (progress >= wordEnd) {
    percent = 100;
  } else if (progress > wordStart) {
    percent = ((progress - wordStart) / (wordEnd - wordStart)) * 100;
  }

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
      className={` ${percent > 0 ? '-translate-y-1' : ''} transition-all duration-700 ${myFont.className}`}
    >
      <span style={{ color: '#8c8da2' }}>
        {whitespace ? `${word}\u00A0` : word}
      </span>
      {/*  overlay */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${percent}%`,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          background: 'white',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          height: '120%',
        }}
      >
        {whitespace ? `${word}\u00A0` : word}
      </span>
    </span>
  );
};

const GradientTextLine: React.FC<GradientTextLineProps> = ({
  words,
  progress,
}) => {
  return (
    <div className='mb-4 flex flex-wrap text-3xl drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] md:text-6xl'>
      {words.map((w, index) => (
        <>
          <GradientWord
            key={`${w.value} + ${index}`} // Use a unique parentId or unique word id if available.
            word={w.value}
            wordStart={w.start}
            wordEnd={w.end}
            progress={progress}
            whitespace={w.whitespace}
          />
        </>
      ))}
    </div>
  );
};

interface LyricsDisplayProps {
  isMobile: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  isMouseMoving: boolean;
  lyrics: SyllableLyricsType;
}

export function SyllableLyrics({
  isMobile,
  containerRef,
  isMouseMoving,
  lyrics,
}: LyricsDisplayProps) {
  const currentQueue = useQueueStore((state) => state.queue);
  const sourceManager = SourceManager.getInstance();

  const [currentLine, setCurrentLine] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const playing = useQueueStore((state) => state.queue.playing);

  const songData = useQueueStore((state) => state.queue.currentSong?.track);

  const handleLyricClick = (index: number) => {
    sourceManager.seek(index);
  };

  const lines = useMemo(() => {
    return lyrics.sections.flatMap((section) =>
      section.lines.map((line) => ({
        ...line,
      }))
    );
  }, [lyrics]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastFrameTime = performance.now();

    let lastSourceTime = sourceManager.getPosition() || 0;

    const handleSourceUpdate = () => {
      if (playing !== 'playing') {
        return;
      }
      const newSourceTime = sourceManager.getPosition() || 0;

      if (
        newSourceTime > lastSourceTime ||
        newSourceTime < lastSourceTime - 1
      ) {
        lastSourceTime = newSourceTime;
      }
    };

    const removeListener = sourceManager.onTimeUpdate(handleSourceUpdate);

    const tick = () => {
      if (playing !== 'playing') {
        console.log(playing);

        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        return;
      }

      const now = performance.now();
      const delta = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      const currentSourceTime = sourceManager.getPosition() || lastSourceTime;

      if (currentSourceTime > lastSourceTime) {
        lastSourceTime = currentSourceTime;
      } else {
        lastSourceTime += delta;
      }

      setProgress(lastSourceTime);
      rafId = requestAnimationFrame(tick);
    };

    if (playing === 'playing') {
      tick();
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      removeListener();
    };
  }, [sourceManager, playing]);

  useEffect(() => {
    console.log(lines);
  }, [lines]);

  useEffect(() => {
    const currentLineIndex = lines.findIndex((line) => line.start > progress);
    setCurrentLine(currentLineIndex - 1);
  }, [progress]);

  useEffect(() => {
    if (containerRef.current && !isMouseMoving) {
      const container = containerRef.current;
      const currentLineElement = container.querySelector(
        `[data-line="${currentLine}"]`
      );
      if (currentLineElement && !isMobile) {
        currentLineElement.scrollIntoView({ block: 'center' });
      } else if (currentLineElement && isMobile) {
        const elementRect = currentLineElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetOffset = window.innerHeight * 0.23; // 23vh
        container.scrollTo({
          top:
            container.scrollTop +
            (elementRect.top - containerRect.top) -
            targetOffset,
          behavior: 'smooth',
        });
      }
    }
  }, [currentLine, isMouseMoving]);

  return (
    <>
      {error && (
        <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
          {error}
        </p>
      )}
      {lyrics ? (
        lines.map((line, index) => (
          <button
            key={index}
            onClick={() => handleLyricClick(line.start)}
            data-line={index}
            className={`w-full text-left ${index < currentLine && !isMouseMoving ? 'opacity-0' : ''} transition-all duration-700 ${(index > currentLine || index < currentLine) && !isMouseMoving ? 'blur-sm' : ''} pl-2`}
          >
            <GradientTextLine
              words={line.words}
              // fontUrl="https://applesocial.s3.amazonaws.com/assets/styles/fonts/sanfrancisco/sanfranciscodisplay-bold-webfont.woff  "
              progress={progress}
              // start={line.start}
              // end={line.end}
            />
            {line.words.length == 0 && index === currentLine && (
              <div className='mb-10 flex gap-2'>
                <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4'></div>
                <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4 delay-200'></div>
                <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4 delay-500'></div>
              </div>
            )}
          </button>
        ))
      ) : (
        <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
          No lyrics found
        </p>
      )}
    </>
  );
}
