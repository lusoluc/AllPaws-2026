/**
 * Helper utility to stitch/append audio blobs using the Web Audio API
 * and export the merged audio as a standard WAV file.
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes Float32 mono audio samples into a standard 16-bit PCM WAV Blob.
 */
export function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM = 1) */
  view.setUint16(20, 1, true);
  /* channel count (mono = 1) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples (convert float to 16-bit signed integer)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Decodes an audio Blob into an AudioBuffer.
 */
export async function decodeBlobToAudioBuffer(blob: Blob, audioCtx: AudioContext): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  // decodeAudioData consumes the ArrayBuffer, so we need to copy or be mindful if reused.
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Stitches two AudioBuffers together (mono output).
 */
export function stitchAudioBuffers(buffer1: AudioBuffer, buffer2: AudioBuffer, audioCtx: AudioContext): AudioBuffer {
  const sampleRate = buffer1.sampleRate;
  const length = buffer1.length + buffer2.length;
  
  const stitchedBuffer = audioCtx.createBuffer(1, length, sampleRate);
  const channelData = stitchedBuffer.getChannelData(0);
  
  // Extract mono channel 0 from both buffers
  const c1 = buffer1.getChannelData(0);
  const c2 = buffer2.getChannelData(0);
  
  channelData.set(c1, 0);
  channelData.set(c2, buffer1.length);
  
  return stitchedBuffer;
}

/**
 * Helper to stitch/append a new recorded audio Blob to an existing audio Blob.
 * Both files are decoded, merged, and returned as a fresh WAV Blob.
 */
export async function appendAudioBlobs(existingBlob: Blob, newBlob: Blob): Promise<Blob> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const audioCtx = new AudioContextClass();
  try {
    const buffer1 = await decodeBlobToAudioBuffer(existingBlob, audioCtx);
    const buffer2 = await decodeBlobToAudioBuffer(newBlob, audioCtx);
    const stitched = stitchAudioBuffers(buffer1, buffer2, audioCtx);
    
    const wavBlob = encodeWAV(stitched.getChannelData(0), stitched.sampleRate);
    return wavBlob;
  } finally {
    audioCtx.close().catch(() => {});
  }
}
