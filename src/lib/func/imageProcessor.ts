export interface ProcessedImageInfo {
  file: File;
  originalSize: number;
  processedSize: number;
  quality: number;
}

// 画質調整
export async function adjustImageQuality(
  file: File,
  quality: number
): Promise<ProcessedImageInfo> {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CanvasRenderingContext2D not available");
  ctx.drawImage(imageBitmap, 0, 0);

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), mimeType, quality / 100)
  );

  const processedFile = new File([blob], file.name, { type: mimeType });
  return {
    file: processedFile,
    originalSize: file.size,
    processedSize: processedFile.size,
    quality,
  };
}

// Exif削除
export async function removeExif(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === "image/jpeg") {
      const cleanedFile = removeExifFromJPEG(arrayBuffer);
      return new File([cleanedFile], file.name, { type: file.type });
    } else if (file.type === "image/png") {
      const cleanedFile = removeMetadataFromPNG(arrayBuffer);
      return new File([cleanedFile], file.name, { type: file.type });
    }
  } catch (error) {
    console.error("Failed to remove Exif data:", error);
  }
  return file;
}

function removeExifFromJPEG(data: ArrayBuffer): ArrayBuffer {
  const dataView = new DataView(data);
  let offset = 2;
  const length = data.byteLength;

  while (offset < length) {
    if (dataView.getUint8(offset) !== 0xff) break;
    const segmentType = dataView.getUint8(offset + 1);

    if (segmentType === 0xe1) {
      const segmentLength = dataView.getUint16(offset + 2);
      const newLength = length - segmentLength - 2;
      const newData = new ArrayBuffer(newLength);
      const newUint8Array = new Uint8Array(newData);

      const beforeExif = new Uint8Array(data, 0, offset);
      const afterExif = new Uint8Array(
        data,
        offset + 2 + segmentLength,
        length - (offset + 2 + segmentLength)
      );
      newUint8Array.set(beforeExif, 0);
      newUint8Array.set(afterExif, beforeExif.length);
      return newData;
    }

    const segmentLength = dataView.getUint16(offset + 2);
    offset += 2 + segmentLength;
  }

  return data;
}

export function removeMetadataFromPNG(arrayBuffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(arrayBuffer);
  const pngSignature = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  if (!pngSignature.every((value, index) => data[index] === value)) {
    return arrayBuffer;
  }

  const chunks: Uint8Array[] = [];
  let offset = 8;
  const metadataChunks = ["tEXt", "iTXt", "zTXt", "gAMA", "pHYs"];

  while (offset < data.length) {
    const length = new DataView(data.buffer).getUint32(offset);
    const typeBytes = data.subarray(offset + 4, offset + 8);
    const type = String.fromCharCode(...typeBytes);

    if (!metadataChunks.includes(type)) {
      chunks.push(data.subarray(offset, offset + 12 + length));
    }
    offset += 12 + length;
  }

  const cleanedBuffer = new Uint8Array(
    pngSignature.byteLength + chunks.reduce((acc, c) => acc + c.byteLength, 0)
  );
  cleanedBuffer.set(pngSignature, 0);
  let pos = pngSignature.byteLength;
  for (const chunk of chunks) {
    cleanedBuffer.set(chunk, pos);
    pos += chunk.byteLength;
  }
  return cleanedBuffer.buffer;
}
