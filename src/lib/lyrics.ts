interface formatedLyrics {
    start: number,
    value: string
}


export function formatLyrics(lyrics: string): formatedLyrics[] {
    console.log(lyrics)
    const lines = lyrics.split('\n').filter(line => line.length > 0);
    const formatedLyrics: formatedLyrics[] = [];
    lines.forEach(line => {
        const [time, value] = line.split(']');
        const start = time.replace('[', '');
        formatedLyrics.push({ start: convertToMilliseconds(start), value: value.trimStart() });
    });
    return formatedLyrics
}


function convertToMilliseconds(timeString: string) {
    const [minutes, seconds] = timeString.split(':');
    const [wholeSecs, fractionalSecs] = seconds.split('.');
    
    const totalMilliseconds = 
      parseInt(minutes) * 60 * 1000 +
      parseInt(wholeSecs) * 1000 +
      parseInt(fractionalSecs) * 10;
    
    return totalMilliseconds;
  }