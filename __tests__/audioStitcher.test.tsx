import { encodeWAV, stitchAudioBuffers, appendAudioBlobs } from '@/lib/audioStitcher';

describe('AudioStitcher Utility', () => {
  let mockAudioContextInstance: any;

  beforeEach(() => {
    mockAudioContextInstance = {
      createBuffer: jest.fn((channels, length, rate) => ({
        numberOfChannels: channels,
        length: length,
        sampleRate: rate,
        getChannelData: jest.fn(() => new Float32Array(length)),
      })),
      close: jest.fn().mockResolvedValue(undefined),
      decodeAudioData: jest.fn().mockResolvedValue({
        numberOfChannels: 1,
        length: 100,
        sampleRate: 16000,
        getChannelData: jest.fn(() => new Float32Array(100)),
      }),
    };

    const mockAudioContextClass = jest.fn(() => mockAudioContextInstance);
    (window as any).AudioContext = mockAudioContextClass;
    (window as any).webkitAudioContext = mockAudioContextClass;
  });

  afterEach(() => {
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;
  });

  describe('encodeWAV', () => {
    it('should encode float samples to a WAV Blob with a valid 44-byte header', () => {
      const sampleRate = 16000;
      const samples = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0]);
      
      const wavBlob = encodeWAV(samples, sampleRate);
      
      expect(wavBlob).toBeInstanceOf(Blob);
      expect(wavBlob.type).toBe('audio/wav');
      expect(wavBlob.size).toBe(44 + samples.length * 2); // 44 bytes header + 10 bytes PCM data
    });
  });

  describe('stitchAudioBuffers', () => {
    it('should stitch two audio buffers together sequentially', () => {
      const buffer1 = {
        sampleRate: 16000,
        length: 5,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5])),
      } as unknown as AudioBuffer;

      const buffer2 = {
        sampleRate: 16000,
        length: 3,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array([0.6, 0.7, 0.8])),
      } as unknown as AudioBuffer;

      const stitched = stitchAudioBuffers(buffer1, buffer2, mockAudioContextInstance);

      expect(mockAudioContextInstance.createBuffer).toHaveBeenCalledWith(1, 8, 16000);
      expect(stitched).toBeDefined();
    });
  });

  describe('appendAudioBlobs', () => {
    it('should fetch, decode, stitch, and return a combined WAV Blob', async () => {
      const existingBlob = new Blob([new ArrayBuffer(100)], { type: 'audio/webm' });
      const newBlob = new Blob([new ArrayBuffer(50)], { type: 'audio/webm' });

      // Mock blob.arrayBuffer()
      existingBlob.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(100));
      newBlob.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(50));

      const resultBlob = await appendAudioBlobs(existingBlob, newBlob);

      expect(resultBlob).toBeInstanceOf(Blob);
      expect(resultBlob.type).toBe('audio/wav');
      expect(mockAudioContextInstance.decodeAudioData).toHaveBeenCalledTimes(2);
      expect(mockAudioContextInstance.createBuffer).toHaveBeenCalled();
      expect(mockAudioContextInstance.close).toHaveBeenCalled();
    });
  });
});
