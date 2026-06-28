export function isOpfsSupported(): boolean {
  return typeof window !== 'undefined' && 
         typeof navigator !== 'undefined' && 
         !!navigator.storage && 
         typeof navigator.storage.getDirectory === 'function';
}

export async function saveToOpfs(key: string, blob: Blob): Promise<void> {
  if (!isOpfsSupported()) {
    throw new Error('OPFS is not supported in this environment');
  }
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(key, { create: true });
  
  if (typeof fileHandle.createWritable === 'function') {
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    throw new Error('Writable stream not supported on file handle in this context');
  }
}

export async function readFromOpfs(key: string): Promise<Blob | null> {
  if (!isOpfsSupported()) return null;
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(key);
    const file = await fileHandle.getFile();
    return file;
  } catch (e) {
    console.error(`Error reading from OPFS with key ${key}:`, e);
    return null;
  }
}

export async function removeFromOpfs(key: string): Promise<void> {
  if (!isOpfsSupported()) return;
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(key);
  } catch (e) {
    console.warn(`Error removing entry from OPFS with key ${key}:`, e);
  }
}
