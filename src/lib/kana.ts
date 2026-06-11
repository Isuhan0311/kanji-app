export function kataToHira(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

export function formatKun(reading: string): string {
  const [stem, okurigana] = reading.split('.');
  return okurigana ? `${stem}(${okurigana})` : reading;
}
