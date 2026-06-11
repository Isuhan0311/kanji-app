import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import bz2 from 'unbzip2-stream';

const RAW = 'data/raw';

const SOURCES: { url: string; dest: string; unzip?: 'gz' | 'bz2' }[] = [
  {
    url: 'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji-jouyou.json',
    dest: 'kanji-jouyou.json',
  },
  {
    url: 'https://raw.githubusercontent.com/libhangul/libhangul/master/data/hanja/hanja.txt',
    dest: 'hanja.txt',
  },
  {
    url: 'https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt',
    dest: 'ids.txt',
  },
  // elzup/jlpt-word-list: repo has CSV only (no JSON) — using src/*.csv
  ...['n5', 'n4', 'n3', 'n2'].map((n) => ({
    url: `https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/${n}.csv`,
    dest: `vocab-${n}.csv`,
  })),
  {
    url: 'https://downloads.tatoeba.org/exports/per_language/jpn/jpn_sentences.tsv.bz2',
    dest: 'jpn_sentences.tsv',
    unzip: 'bz2' as const,
  },
  {
    url: 'https://downloads.tatoeba.org/exports/per_language/kor/kor_sentences.tsv.bz2',
    dest: 'kor_sentences.tsv',
    unzip: 'bz2' as const,
  },
  {
    url: 'https://downloads.tatoeba.org/exports/per_language/jpn/jpn-kor_links.tsv.bz2',
    dest: 'jpn-kor_links.tsv',
    unzip: 'bz2' as const,
  },
];

async function download(url: string, dest: string, unzip?: 'gz' | 'bz2') {
  const path = `${RAW}/${dest}`;
  if (existsSync(path)) {
    console.log(`skip (exists): ${dest}`);
    return;
  }
  console.log(`downloading: ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${res.status} ${url}`);
  const body = Readable.fromWeb(res.body as never);
  const out = createWriteStream(path);
  try {
    if (unzip === 'gz') await pipeline(body, createGunzip(), out);
    else if (unzip === 'bz2') await pipeline(body, bz2(), out);
    else await pipeline(body, out);
  } catch (err) {
    out.destroy();
    if (existsSync(path)) unlinkSync(path);
    throw err;
  }
}

async function main() {
  mkdirSync(RAW, { recursive: true });
  for (const s of SOURCES) await download(s.url, s.dest, s.unzip);
  console.log('done');
}

main();
