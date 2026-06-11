declare module 'unbzip2-stream' {
  import { Transform } from 'node:stream';
  export default function bz2(): Transform;
}
