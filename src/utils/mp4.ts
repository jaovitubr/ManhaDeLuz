// Converte o áudio HLS em MP4 fragmentado (segmento de inicialização + pedaços
// moof/mdat) num .m4a comum, com tabela de amostras completa. Sem isso muitos
// players (inclusive o do WhatsApp) mostram duração 0:00 e não deixam avançar.
// Não reencoda nada: só reorganiza as caixas do arquivo.
//
// Layout gerado: ftyp | mdat (amostras) | moov

interface Box {
  type: string;
  start: number;
  end: number;
  data: number;
}

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "dinf", "moof", "traf", "mvex"]);

const getView = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

const readUint64 = (view: DataView, offset: number) => view.getUint32(offset) * 2 ** 32 + view.getUint32(offset + 4);

function writeUint64(view: DataView, offset: number, value: number) {
  view.setUint32(offset, Math.floor(value / 2 ** 32));
  view.setUint32(offset + 4, value >>> 0);
}

function readBoxes(bytes: Uint8Array, start = 0, end = bytes.length) {
  const view = getView(bytes);
  const boxes: Box[] = [];

  for (let offset = start; offset + 8 <= end;) {
    let size = view.getUint32(offset);
    let data = offset + 8;

    if (size === 1) {
      size = readUint64(view, offset + 8);
      data += 8;
    } else if (size === 0) {
      size = end - offset;
    }

    if (size < data - offset || offset + size > end) break;

    boxes.push({ type: String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)), start: offset, end: offset + size, data });
    offset += size;
  }

  return boxes;
}

const getChildren = (bytes: Uint8Array, box: Box) => readBoxes(bytes, box.data, box.end);

function createBox(type: string, ...parts: Uint8Array[]) {
  const size = parts.reduce((total, part) => total + part.length, 8);
  const box = new Uint8Array(size);

  getView(box).setUint32(0, size);
  box.set(Array.from(type, (char) => char.charCodeAt(0)), 4);
  parts.reduce((offset, part) => (box.set(part, offset), offset + part.length), 8);

  return box;
}

function uint32Array(values: number[]) {
  const bytes = new Uint8Array(values.length * 4);
  const view = getView(bytes);
  values.forEach((value, index) => view.setUint32(index * 4, value));
  return bytes;
}

const ascii = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0));

export function createMp4Remuxer(init: Uint8Array) {
  const top = readBoxes(init);
  const moov = top.find((box) => box.type === "moov");
  if (!moov) throw new Error("Segmento de inicialização MP4 sem moov");
  const root: Box = moov;

  const initView = getView(init);
  const findPath = (path: string[]) => path.reduce<Box | undefined>(
    (parent, type) => parent && getChildren(init, parent).find((box) => box.type === type),
    moov
  );

  const timescaleOf = (box?: Box) => box ? initView.getUint32(box.data + (init[box.data] === 1 ? 20 : 12)) : 0;
  const movieTimescale = timescaleOf(findPath(["mvhd"]));
  const mediaTimescale = timescaleOf(findPath(["trak", "mdia", "mdhd"]));
  const trex = findPath(["mvex", "trex"]);
  const defaultDuration = trex ? initView.getUint32(trex.data + 12) : 0;
  const defaultSize = trex ? initView.getUint32(trex.data + 16) : 0;

  if (!movieTimescale || !mediaTimescale) throw new Error("Segmento de inicialização MP4 inválido");

  const ftyp = createBox("ftyp", ascii("M4A "), uint32Array([0x200]), ascii("M4A isomiso2mp41"));
  const sizes: number[] = [];
  const durations: number[] = [];
  let mdatSize = 0;

  // Extrai as amostras de áudio de um pedaço e devolve os bytes para gravar no mdat.
  function addSegment(segment: Uint8Array) {
    const view = getView(segment);
    const chunks: Uint8Array[] = [];

    for (const moof of readBoxes(segment).filter((box) => box.type === "moof")) {
      for (const traf of getChildren(segment, moof).filter((box) => box.type === "traf")) {
        const boxes = getChildren(segment, traf);
        const tfhd = boxes.find((box) => box.type === "tfhd");
        if (!tfhd) continue;

        const tfhdFlags = view.getUint32(tfhd.data) & 0xffffff;
        let offset = tfhd.data + 8;
        let base = moof.start;
        let trafDuration = defaultDuration;
        let trafSize = defaultSize;

        if (tfhdFlags & 0x1) {
          base = readUint64(view, offset);
          offset += 8;
        }
        if (tfhdFlags & 0x2) offset += 4;
        if (tfhdFlags & 0x8) {
          trafDuration = view.getUint32(offset);
          offset += 4;
        }
        if (tfhdFlags & 0x10) trafSize = view.getUint32(offset);

        let nextData = base;
        for (const trun of boxes.filter((box) => box.type === "trun")) {
          const trunFlags = view.getUint32(trun.data) & 0xffffff;
          const count = view.getUint32(trun.data + 4);
          let cursor = trun.data + 8;
          let dataStart = nextData;
          let total = 0;

          if (trunFlags & 0x1) {
            dataStart = base + view.getInt32(cursor);
            cursor += 4;
          }
          if (trunFlags & 0x4) cursor += 4;

          for (let i = 0; i < count; i++) {
            let duration = trafDuration;
            let size = trafSize;

            if (trunFlags & 0x100) {
              duration = view.getUint32(cursor);
              cursor += 4;
            }
            if (trunFlags & 0x200) {
              size = view.getUint32(cursor);
              cursor += 4;
            }
            if (trunFlags & 0x400) cursor += 4;
            if (trunFlags & 0x800) cursor += 4;

            // 1024 amostras por quadro é o padrão do AAC, caso o arquivo não informe.
            durations.push(duration || 1024);
            sizes.push(size);
            total += size;
          }

          if (dataStart < 0 || dataStart + total > segment.length) throw new Error("Pedaço de áudio MP4 incompleto");

          chunks.push(segment.slice(dataStart, dataStart + total));
          mdatSize += total;
          nextData = dataStart + total;
        }
      }
    }

    return chunks;
  }

  // Monta o moov final (com tabelas de amostras) a partir do moov original.
  function finish() {
    if (!sizes.length) throw new Error("Nenhuma amostra de áudio encontrada");

    const mediaDuration = durations.reduce((total, duration) => total + duration, 0);
    const movieDuration = Math.round(mediaDuration * movieTimescale / mediaTimescale);

    const timeToSample: number[] = [];
    for (const duration of durations) {
      if (timeToSample[timeToSample.length - 1] === duration) timeToSample[timeToSample.length - 2]++;
      else timeToSample.push(1, duration);
    }

    const sampleTables = [
      createBox("stts", uint32Array([0, timeToSample.length / 2, ...timeToSample])),
      createBox("stsc", uint32Array([0, 1, 1, sizes.length, 1])),
      createBox("stsz", uint32Array([0, 0, sizes.length, ...sizes])),
      createBox("stco", uint32Array([0, 1, ftyp.length + 8])),
    ];

    const rebuild = (box: Box): Uint8Array | null => {
      if (box.type === "mvex") return null;

      if (box.type === "stbl") {
        const stsd = getChildren(init, box).find((child) => child.type === "stsd");
        if (!stsd) throw new Error("MP4 sem descrição do áudio (stsd)");
        return createBox("stbl", init.slice(stsd.start, stsd.end), ...sampleTables);
      }

      if (CONTAINERS.has(box.type)) {
        return createBox(box.type, ...getChildren(init, box).map(rebuild).filter((child) => !!child));
      }

      const copy = init.slice(box.start, box.end);
      const view = getView(copy);
      const data = box.data - box.start;
      const isV1 = copy[data] === 1;
      const setDuration = (offsetV0: number, offsetV1: number, value: number) => isV1 ?
        writeUint64(view, data + offsetV1, value) :
        view.setUint32(data + offsetV0, Math.min(value, 0xffffffff));

      if (box.type === "mvhd") setDuration(16, 24, movieDuration);
      if (box.type === "mdhd") setDuration(16, 24, mediaDuration);
      if (box.type === "tkhd") setDuration(20, 28, movieDuration);
      if (box.type === "elst") {
        const entrySize = isV1 ? 20 : 12;
        for (let i = 0, count = view.getUint32(data + 4); i < count; i++) {
          const entry = data + 8 + i * entrySize;
          const segmentDuration = isV1 ? readUint64(view, entry) : view.getUint32(entry);
          if (segmentDuration === 0) {
            if (isV1) writeUint64(view, entry, movieDuration);
            else view.setUint32(entry, movieDuration);
          }
        }
      }

      return copy;
    };

    return rebuild(root) as Uint8Array;
  }

  return {
    // ftyp + cabeçalho do mdat; o tamanho do mdat é corrigido no fim (mdatSizeOffset).
    header: new Uint8Array([...ftyp, 0, 0, 0, 0, ...ascii("mdat")]),
    mdatSizeOffset: ftyp.length,
    getMdatSizeBytes: () => uint32Array([mdatSize + 8]),
    addSegment,
    finish,
  };
}
