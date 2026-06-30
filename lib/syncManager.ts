import { db } from './db';
import { supabase } from './supabaseClient';
import { readFromOpfs, removeFromOpfs } from './opfsStorage';
import { logger } from './logger';

let isSyncing = false;

function dispatchSyncStatus(state: 'idle' | 'syncing' | 'success' | 'error', updated = false) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bmd-sync-status', { 
      detail: { state, updated } 
    }));
  }
}

export async function syncWithCloud(): Promise<void> {
  if (!supabase) {
    console.log('Sync skipped: Supabase client is not configured.');
    return;
  }

  if (isSyncing) {
    console.log('Sync skipped: Another synchronization cycle is already in progress.');
    return;
  }

  isSyncing = true;
  dispatchSyncStatus('syncing');

  try {
    await logger.info('SyncManager', 'Starting synchronization cycle...');
    await pushLocalChanges();

    // Check latest animal timestamp before pulling
    const latestLocalAnimalBefore = await db.animals.orderBy('updated_at').last();
    const lastAnimalTimeBefore = latestLocalAnimalBefore?.updated_at || '1970-01-01T00:00:00Z';

    await pullCloudChanges();

    // Check latest animal timestamp after pulling
    const latestLocalAnimalAfter = await db.animals.orderBy('updated_at').last();
    const lastAnimalTimeAfter = latestLocalAnimalAfter?.updated_at || '1970-01-01T00:00:00Z';

    const hasNewData = lastAnimalTimeAfter !== lastAnimalTimeBefore;

    await logger.info('SyncManager', 'Synchronization cycle completed successfully.');
    dispatchSyncStatus('success', hasNewData);
  } catch (error) {
    await logger.error('SyncManager', 'Error during synchronization', error);
    dispatchSyncStatus('error');
  } finally {
    isSyncing = false;
    setTimeout(() => {
      dispatchSyncStatus('idle');
    }, 4000);
  }
}


// Helper to check if a parent animal is still unsynced
async function isAnimalUnsynced(animalId: number): Promise<boolean> {
  const animal = await db.animals.get(animalId);
  return !animal || animal.sync_pending === 1;
}

export async function uploadMediaBlob(folder: string, fileName: string, blob: Blob): Promise<string | null> {
  if (!supabase) return null;
  // Sanitize fileName to prevent path traversal issues
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${Date.now()}_${sanitizedName}`;
  const filePath = `${folder}/${uniqueName}`;
  
  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    await logger.error('SyncManager', `Failed to upload ${filePath} to storage: ${error.message || JSON.stringify(error)}`, error);
    throw error;
  }

  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
}


async function pushLocalChanges(): Promise<void> {
  if (!supabase) return;

  // 1. Sync Shelters
  const pendingShelters = await db.shelters.where('sync_pending').equals(1).toArray();
  for (const shelter of pendingShelters) {
    const dbData = {
      name: shelter.name,
      code: shelter.code,
      address: shelter.address,
      gps_latitude: shelter.gpsLatitude,
      gps_longitude: shelter.gpsLongitude,
      phone: shelter.phone,
      email_lt: shelter.emailLt,
      email_de: shelter.emailDe,
      bank_name: shelter.bankName,
      bic: shelter.bic,
      iban: shelter.iban,
      donation_purpose_de: shelter.donationPurposeDe,
      paypal_email: shelter.paypalEmail,
      wishlist_url: shelter.wishlistUrl,
      updated_at: new Date().toISOString()
    };

    let error: any = null;
    if (shelter.id) {
      // Check if it exists on Supabase
      const { data: existing } = await supabase
        .from('shelters')
        .select('id')
        .eq('id', shelter.id)
        .single();

      if (existing) {
        ({ error } = await supabase
          .from('shelters')
          .update(dbData)
          .eq('id', shelter.id));
      } else {
        ({ error } = await supabase
          .from('shelters')
          .insert({ id: shelter.id, ...dbData }));
      }
    }

    if (!error) {
      await db.shelters.update(shelter.id!, { sync_pending: 0, updated_at: dbData.updated_at });
    } else {
      console.error('Failed to sync shelter:', error);
    }
  }

  // 2. Sync Animals
  const pendingAnimals = await db.animals.where('sync_pending').equals(1).toArray();
  for (const animal of pendingAnimals) {
    // Attempt uploading any local media blobs to Supabase Storage
    const uploadedPhotos: string[] = (animal.media_urls || []).filter(url => !url.startsWith('data:'));
    const uploadedPassports: string[] = (animal.passport_urls || []).filter(url => !url.startsWith('data:'));
    const uploadedVideos: string[] = (animal.video_urls || []).filter(url => !url.startsWith('data:'));
    let uploadedAudio = animal.audio_draft_url && animal.audio_draft_url.startsWith('data:') ? undefined : animal.audio_draft_url;

    let mediaUploadFailedOrPending = false;
    const remainingLocalPhotos: typeof animal.local_photos = [];
    const remainingLocalPassports: typeof animal.local_passports = [];
    const remainingLocalVideos: typeof animal.local_videos = [];
    let remainingLocalAudio: typeof animal.local_audio = animal.local_audio;

    // Upload local_photos
    if (animal.local_photos && animal.local_photos.length > 0) {
      for (const item of animal.local_photos) {
        if (!item.blob) {
          mediaUploadFailedOrPending = true;
          remainingLocalPhotos.push(item);
          continue;
        }
        try {
          const url = await uploadMediaBlob('photos', item.name, item.blob);
          if (url) {
            uploadedPhotos.push(url);
          } else {
            mediaUploadFailedOrPending = true;
            remainingLocalPhotos.push(item);
          }
        } catch (e) {
          console.error(`Failed to upload photo ${item.name}:`, e);
          mediaUploadFailedOrPending = true;
          remainingLocalPhotos.push(item);
        }
      }
    }

    // Upload local_passports
    if (animal.local_passports && animal.local_passports.length > 0) {
      for (const item of animal.local_passports) {
        if (!item.blob) {
          mediaUploadFailedOrPending = true;
          remainingLocalPassports.push(item);
          continue;
        }
        try {
          const url = await uploadMediaBlob('documents', item.name, item.blob);
          if (url) {
            uploadedPassports.push(url);
          } else {
            mediaUploadFailedOrPending = true;
            remainingLocalPassports.push(item);
          }
        } catch (e) {
          console.error(`Failed to upload document ${item.name}:`, e);
          mediaUploadFailedOrPending = true;
          remainingLocalPassports.push(item);
        }
      }
    }

    // Upload local_videos
    if (animal.local_videos && animal.local_videos.length > 0) {
      for (const item of animal.local_videos) {
        let videoBlob: Blob | null = item.blob || null;
        
        // If blob is missing but opfsKey is present, read from OPFS
        if (!videoBlob && item.opfsKey) {
          try {
            videoBlob = await readFromOpfs(item.opfsKey);
          } catch (e) {
            console.error(`Failed to read video ${item.name} from OPFS key ${item.opfsKey}:`, e);
          }
        }

        if (!videoBlob) {
          mediaUploadFailedOrPending = true;
          remainingLocalVideos.push(item);
          continue;
        }

        try {
          const url = await uploadMediaBlob('videos', item.name, videoBlob);
          if (url) {
            uploadedVideos.push(url);
            // Clean up OPFS storage if opfsKey exists
            if (item.opfsKey) {
              await removeFromOpfs(item.opfsKey).catch((err) => 
                console.warn(`Could not clean up OPFS for ${item.opfsKey}:`, err)
              );
            }
          } else {
            mediaUploadFailedOrPending = true;
            remainingLocalVideos.push(item);
          }
        } catch (e) {
          console.error(`Failed to upload video ${item.name}:`, e);
          mediaUploadFailedOrPending = true;
          remainingLocalVideos.push(item);
        }
      }
    }

    // Upload local_audio
    if (animal.local_audio) {
      if (!animal.local_audio.blob) {
        mediaUploadFailedOrPending = true;
      } else {
        try {
          const url = await uploadMediaBlob('audios', animal.local_audio.name, animal.local_audio.blob);
          if (url) {
            uploadedAudio = url;
            remainingLocalAudio = undefined;
          } else {
            mediaUploadFailedOrPending = true;
          }
        } catch (e) {
          console.error(`Failed to upload audio:`, e);
          mediaUploadFailedOrPending = true;
        }
      }
    }

    const { 
      id: oldId, 
      sync_pending, 
      local_photos, 
      local_passports, 
      local_videos, 
      local_audio, 
      ...cleanAnimal 
    } = animal;
    
    const updatedAt = new Date().toISOString();
    const dbData = { 
      ...cleanAnimal, 
      media_urls: uploadedPhotos,
      passport_urls: uploadedPassports,
      video_urls: uploadedVideos,
      audio_draft_url: uploadedAudio,
      media_pending: mediaUploadFailedOrPending ? 1 : 0,
      updated_at: updatedAt 
    };

    let response: any = null;
    let isNewRecord = true;

    if (oldId) {
      const { data: existing } = await supabase
        .from('animals')
        .select('id')
        .eq('id', oldId)
        .single();

      if (existing) {
        isNewRecord = false;
        response = await supabase
          .from('animals')
          .update(dbData)
          .eq('id', oldId)
          .select()
          .single();
      }
    }

    if (isNewRecord) {
      // Insert without id so Supabase generates the real ID
      response = await supabase
        .from('animals')
        .insert(dbData)
        .select()
        .single();
    }

    if (response && !response.error && response.data) {
      const syncedAnimal = response.data;
      const newId = syncedAnimal.id;

      const localAnimalData = {
        ...animal,
        id: isNewRecord ? newId : animal.id,
        media_urls: uploadedPhotos,
        passport_urls: uploadedPassports,
        video_urls: uploadedVideos,
        audio_draft_url: uploadedAudio,
        local_photos: remainingLocalPhotos.length > 0 ? remainingLocalPhotos : undefined,
        local_passports: remainingLocalPassports.length > 0 ? remainingLocalPassports : undefined,
        local_videos: remainingLocalVideos.length > 0 ? remainingLocalVideos : undefined,
        local_audio: remainingLocalAudio,
        sync_pending: mediaUploadFailedOrPending ? 1 : 0,
        media_pending: mediaUploadFailedOrPending ? 1 : 0,
        updated_at: updatedAt
      };

      if (isNewRecord && oldId && oldId !== newId) {
        // Cascade update related tables with new ID
        await db.animals.delete(oldId);
        await db.animals.put(localAnimalData);

        // Update related notes
        await db.internalNotes.where('animal_id').equals(oldId).modify({ animal_id: newId, sync_pending: 1 });
        // Update related inquiries
        await db.inquiries.where('animal_id').equals(oldId).modify({ animal_id: newId, sync_pending: 1 });
      } else {
        await db.animals.put(localAnimalData);
      }
    } else {
      await logger.error('SyncManager', `Failed to sync animal: ${response?.error?.message || JSON.stringify(response?.error)}`, response?.error);
    }
  }

  // 3. Sync Internal Notes
  const pendingNotes = await db.internalNotes.where('sync_pending').equals(1).toArray();
  for (const note of pendingNotes) {
    // Skip if parent animal is still unsynced
    if (await isAnimalUnsynced(note.animal_id)) {
      console.log(`Skipping note ${note.id} because parent animal ${note.animal_id} is not synced yet.`);
      continue;
    }

    const { id: oldId, sync_pending, ...cleanNote } = note;
    const updatedAt = new Date().toISOString();
    const dbData = { ...cleanNote, updated_at: updatedAt };

    let response: any = null;
    let isNewRecord = true;

    if (oldId) {
      const { data: existing } = await supabase
        .from('internal_notes')
        .select('id')
        .eq('id', oldId)
        .single();

      if (existing) {
        isNewRecord = false;
        response = await supabase
          .from('internal_notes')
          .update(dbData)
          .eq('id', oldId)
          .select()
          .single();
      }
    }

    if (isNewRecord) {
      response = await supabase
        .from('internal_notes')
        .insert(dbData)
        .select()
        .single();
    }

    if (response && !response.error && response.data) {
      const syncedNote = response.data;
      const newId = syncedNote.id;

      if (isNewRecord && oldId && oldId !== newId) {
        await db.internalNotes.delete(oldId);
        await db.internalNotes.put({ ...note, id: newId, sync_pending: 0, updated_at: updatedAt });
      } else {
        await db.internalNotes.update(oldId!, { sync_pending: 0, updated_at: updatedAt });
      }
    } else {
      console.error('Failed to sync note:', response?.error);
    }
  }

  // 4. Sync Inquiries
  const pendingInquiries = await db.inquiries.where('sync_pending').equals(1).toArray();
  for (const inquiry of pendingInquiries) {
    if (await isAnimalUnsynced(inquiry.animal_id)) {
      console.log(`Skipping inquiry ${inquiry.id} because parent animal ${inquiry.animal_id} is not synced yet.`);
      continue;
    }

    const { id: oldId, sync_pending, ...cleanInquiry } = inquiry;
    const updatedAt = new Date().toISOString();
    const dbData = { ...cleanInquiry, updated_at: updatedAt };

    let response: any = null;
    let isNewRecord = true;

    if (oldId) {
      const { data: existing } = await supabase
        .from('inquiries')
        .select('id')
        .eq('id', oldId)
        .single();

      if (existing) {
        isNewRecord = false;
        response = await supabase
          .from('inquiries')
          .update(dbData)
          .eq('id', oldId)
          .select()
          .single();
      }
    }

    if (isNewRecord) {
      response = await supabase
        .from('inquiries')
        .insert(dbData)
        .select()
        .single();
    }

    if (response && !response.error && response.data) {
      const syncedInquiry = response.data;
      const newId = syncedInquiry.id;

      if (isNewRecord && oldId && oldId !== newId) {
        await db.inquiries.delete(oldId);
        await db.inquiries.put({ ...inquiry, id: newId, sync_pending: 0, updated_at: updatedAt });
      } else {
        await db.inquiries.update(oldId!, { sync_pending: 0, updated_at: updatedAt });
      }
    } else {
      console.error('Failed to sync inquiry:', response?.error);
    }
  }

  // 5. Sync Subscribers
  const pendingSubscribers = await db.subscribers.where('sync_pending').equals(1).toArray();
  for (const sub of pendingSubscribers) {
    const { id: oldId, sync_pending, ...cleanSub } = sub;
    const updatedAt = new Date().toISOString();
    const dbData = { ...cleanSub, updated_at: updatedAt };

    let response: any = null;
    let isNewRecord = true;

    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', sub.email)
      .maybeSingle();

    if (existing) {
      isNewRecord = false;
      const existingId = existing.id;
      response = await supabase
        .from('subscribers')
        .update(dbData)
        .eq('id', existingId)
        .select()
        .single();
    } else {
      response = await supabase
        .from('subscribers')
        .insert(dbData)
        .select()
        .single();
    }

    if (response && !response.error && response.data) {
      const syncedSub = response.data;
      const newId = syncedSub.id;

      if (isNewRecord && oldId && oldId !== newId) {
        await db.subscribers.delete(oldId);
        await db.subscribers.put({ ...sub, id: newId, sync_pending: 0, updated_at: updatedAt });
      } else {
        await db.subscribers.update(oldId || newId, { sync_pending: 0, updated_at: updatedAt });
      }
    } else {
      console.error('Failed to sync subscriber:', response?.error);
    }
  }

  // 6. Sync UI Texts
  const pendingUiTexts = await db.uiTexts.where('sync_pending').equals(1).toArray();
  for (const text of pendingUiTexts) {
    const { sync_pending, ...cleanText } = text;
    const updatedAt = new Date().toISOString();

    const { data: existing } = await supabase
      .from('ui_texts')
      .select('key')
      .eq('key', text.key)
      .maybeSingle();

    let error: any = null;
    if (existing) {
      ({ error } = await supabase
        .from('ui_texts')
        .update({ de: text.DE, lt: text.LT, updated_at: updatedAt })
        .eq('key', text.key));
    } else {
      ({ error } = await supabase
        .from('ui_texts')
        .insert({ key: text.key, de: text.DE, lt: text.LT, updated_at: updatedAt }));
    }

    if (!error) {
      await db.uiTexts.update(text.key, { sync_pending: 0, updated_at: updatedAt });
    } else {
      console.error('Failed to sync UI text:', error);
    }
  }

  // 7. Sync Custom Blocks
  const pendingBlocks = await db.customBlocks.where('sync_pending').equals(1).toArray();
  for (const block of pendingBlocks) {
    const { id: oldId, sync_pending, ...cleanBlock } = block;
    const updatedAt = new Date().toISOString();
    const dbData = { ...cleanBlock, updated_at: updatedAt };

    let response: any = null;
    let isNewRecord = true;

    if (oldId) {
      const { data: existing } = await supabase
        .from('custom_blocks')
        .select('id')
        .eq('id', oldId)
        .maybeSingle();

      if (existing) {
        isNewRecord = false;
        response = await supabase
          .from('custom_blocks')
          .update(dbData)
          .eq('id', oldId)
          .select()
          .single();
      }
    }

    if (isNewRecord) {
      response = await supabase
        .from('custom_blocks')
        .insert(dbData)
        .select()
        .single();
    }

    if (response && !response.error && response.data) {
      const syncedBlock = response.data;
      const newId = syncedBlock.id;

      if (isNewRecord && oldId && oldId !== newId) {
        await db.customBlocks.delete(oldId);
        await db.customBlocks.put({ ...block, id: newId, sync_pending: 0, updated_at: updatedAt });
      } else {
        await db.customBlocks.update(oldId!, { sync_pending: 0, updated_at: updatedAt });
      }
    } else {
      console.error('Failed to sync custom block:', response?.error);
    }
  }

  // 8. Sync Animal Revisions
  const pendingRevisions = await db.animalRevisions.where('sync_pending').equals(1).toArray();
  for (const rev of pendingRevisions) {
    if (await isAnimalUnsynced(rev.animal_id)) {
      console.log(`Skipping revision ${rev.id} because parent animal ${rev.animal_id} is not synced yet.`);
      continue;
    }

    const { id: oldId, sync_pending, ...cleanRev } = rev;
    const updatedAt = new Date().toISOString();
    const dbData = { ...cleanRev, updated_at: updatedAt };

    let response: any = null;
    let isNewRecord = true;

    if (oldId) {
      const { data: existing } = await supabase
        .from('animal_revisions')
        .select('id')
        .eq('id', oldId)
        .single();

      if (existing) {
        isNewRecord = false;
        response = await supabase
          .from('animal_revisions')
          .update(dbData)
          .eq('id', oldId)
          .select()
          .single();
      }
    }

    if (isNewRecord) {
      response = await supabase
        .from('animal_revisions')
        .insert(dbData)
        .select()
        .single();
    }

    if (response && !response.error && response.data) {
      const syncedRev = response.data;
      const newId = syncedRev.id;

      if (isNewRecord && oldId && oldId !== newId) {
        await db.animalRevisions.delete(oldId);
        await db.animalRevisions.put({ ...rev, id: newId, sync_pending: 0, updated_at: updatedAt });
      } else {
        await db.animalRevisions.update(oldId!, { sync_pending: 0, updated_at: updatedAt });
      }

      await pruneRevisions(rev.animal_id);
    } else {
      await logger.error('SyncManager', `Failed to sync animal revision: ${response?.error?.message || JSON.stringify(response?.error)}`, response?.error);
    }
  }
}
async function pullCloudChanges(): Promise<void> {
  if (!supabase) return;

  // 1. Pull Shelters
  const latestLocalShelter = await db.shelters.orderBy('updated_at').last();
  const lastShelterTime = latestLocalShelter?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudShelters } = await supabase
    .from('shelters')
    .select('*')
    .gt('updated_at', lastShelterTime);

  if (cloudShelters && cloudShelters.length > 0) {
    for (const cs of cloudShelters) {
      const mapped = {
        id: cs.id,
        name: cs.name,
        code: cs.code,
        address: cs.address,
        gpsLatitude: cs.gps_latitude,
        gpsLongitude: cs.gps_longitude,
        phone: cs.phone,
        emailLt: cs.email_lt,
        emailDe: cs.email_de,
        bankName: cs.bank_name,
        bic: cs.bic,
        iban: cs.iban,
        donationPurposeDe: cs.donation_purpose_de,
        paypalEmail: cs.paypal_email,
        wishlistUrl: cs.wishlist_url,
        sync_pending: 0,
        updated_at: cs.updated_at
      };
      await db.shelters.put(mapped);
    }
  }

  // 2. Pull Animals
  const latestLocalAnimal = await db.animals.orderBy('updated_at').last();
  const lastAnimalTime = latestLocalAnimal?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudAnimals } = await supabase
    .from('animals')
    .select('*')
    .gt('updated_at', lastAnimalTime);

  if (cloudAnimals && cloudAnimals.length > 0) {
    for (const ca of cloudAnimals) {
      // Check if local animal has sync_pending === 1 to avoid overwriting un-pushed local edits
      const local = await db.animals.get(ca.id);
      if (local && local.sync_pending === 1) {
        console.log(`Conflict: skipping pull overwrite for animal ${ca.id} as local edits are pending upload.`);
        continue;
      }

      await db.animals.put({
        ...ca,
        sync_pending: 0
      });
    }
  }

  // 3. Pull Internal Notes
  const latestLocalNote = await db.internalNotes.orderBy('updated_at').last();
  const lastNoteTime = latestLocalNote?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudNotes } = await supabase
    .from('internal_notes')
    .select('*')
    .gt('updated_at', lastNoteTime);

  if (cloudNotes && cloudNotes.length > 0) {
    for (const cn of cloudNotes) {
      const local = await db.internalNotes.get(cn.id);
      if (local && local.sync_pending === 1) continue;

      await db.internalNotes.put({
        ...cn,
        sync_pending: 0
      });
    }
  }

  // 4. Pull Inquiries
  const latestLocalInquiry = await db.inquiries.orderBy('updated_at').last();
  const lastInquiryTime = latestLocalInquiry?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudInquiries } = await supabase
    .from('inquiries')
    .select('*')
    .gt('updated_at', lastInquiryTime);

  if (cloudInquiries && cloudInquiries.length > 0) {
    for (const ci of cloudInquiries) {
      const local = await db.inquiries.get(ci.id);
      if (local && local.sync_pending === 1) continue;

      await db.inquiries.put({
        ...ci,
        sync_pending: 0
      });
    }
  }

  // 5. Pull Subscribers
  const latestLocalSubscriber = await db.subscribers.orderBy('updated_at').last();
  const lastSubscriberTime = latestLocalSubscriber?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudSubscribers } = await supabase
    .from('subscribers')
    .select('*')
    .gt('updated_at', lastSubscriberTime);

  if (cloudSubscribers && cloudSubscribers.length > 0) {
    for (const cs of cloudSubscribers) {
      const local = await db.subscribers.where('email').equalsIgnoreCase(cs.email).first();
      if (local && local.sync_pending === 1) {
        console.log(`Conflict: skipping pull overwrite for subscriber ${cs.email} as local edits are pending upload.`);
        continue;
      }

      await db.subscribers.put({
        id: cs.id,
        email: cs.email,
        name: cs.name,
        created_at: cs.created_at,
        preferences: cs.preferences,
        ip_address: cs.ip_address,
        sync_pending: 0,
        updated_at: cs.updated_at
      });
    }
  }

  // 6. Pull UI Texts
  const latestLocalUiText = await db.uiTexts.orderBy('updated_at').last();
  const lastUiTextTime = latestLocalUiText?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudUiTexts } = await supabase
    .from('ui_texts')
    .select('*')
    .gt('updated_at', lastUiTextTime);

  if (cloudUiTexts && cloudUiTexts.length > 0) {
    for (const ct of cloudUiTexts) {
      const local = await db.uiTexts.get(ct.key);
      if (local && local.sync_pending === 1) {
        console.log(`Conflict: skipping pull overwrite for ui text ${ct.key} as local edits are pending upload.`);
        continue;
      }

      await db.uiTexts.put({
        key: ct.key,
        DE: ct.de !== undefined ? ct.de : ct.DE,
        LT: ct.lt !== undefined ? ct.lt : ct.LT,
        sync_pending: 0,
        updated_at: ct.updated_at
      });
    }
  }

  // 7. Pull Custom Blocks
  const latestLocalBlock = await db.customBlocks.orderBy('updated_at').last();
  const lastBlockTime = latestLocalBlock?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudBlocks } = await supabase
    .from('custom_blocks')
    .select('*')
    .gt('updated_at', lastBlockTime);

  if (cloudBlocks && cloudBlocks.length > 0) {
    for (const cb of cloudBlocks) {
      const local = await db.customBlocks.get(cb.id);
      if (local && local.sync_pending === 1) {
        console.log(`Conflict: skipping pull overwrite for custom block ${cb.id} as local edits are pending upload.`);
        continue;
      }

      await db.customBlocks.put({
        id: cb.id,
        page: cb.page,
        type: cb.type,
        de: cb.de,
        lt: cb.lt,
        sort_order: cb.sort_order,
        sync_pending: 0,
        updated_at: cb.updated_at
      });
    }
  }

  // 8. Pull Animal Revisions
  const latestLocalRev = await db.animalRevisions.orderBy('updated_at').last();
  const lastRevTime = latestLocalRev?.updated_at || '1970-01-01T00:00:00Z';

  const { data: cloudRevs } = await supabase
    .from('animal_revisions')
    .select('*')
    .gt('updated_at', lastRevTime);

  if (cloudRevs && cloudRevs.length > 0) {
    for (const cr of cloudRevs) {
      const local = await db.animalRevisions.get(cr.id);
      if (local && local.sync_pending === 1) continue;

      await db.animalRevisions.put({
        ...cr,
        sync_pending: 0
      });

      await pruneRevisions(cr.animal_id);
    }
  }

  // 9. Prune deleted records (to mirror cloud hard deletions locally)
  await pruneDeletedRecords();
}

async function pruneDeletedRecords(): Promise<void> {
  if (!supabase) return;

  try {
    // A. Prune Animals
    const { data: cloudAnimals } = await supabase.from('animals').select('id');
    if (cloudAnimals) {
      const cloudIds = new Set(cloudAnimals.map(c => c.id));
      const localAnimals = await db.animals.toArray();
      for (const la of localAnimals) {
        if (la.sync_pending === 0 && la.id && !cloudIds.has(la.id)) {
          await db.animals.delete(la.id);
          await logger.info('SyncManager', `Pruned deleted animal ${la.id} locally.`);
        }
      }
    }

    // B. Prune Shelters
    const { data: cloudShelters } = await supabase.from('shelters').select('id');
    if (cloudShelters) {
      const cloudIds = new Set(cloudShelters.map(c => c.id));
      const localShelters = await db.shelters.toArray();
      for (const ls of localShelters) {
        if (ls.sync_pending === 0 && ls.id && !cloudIds.has(ls.id)) {
          await db.shelters.delete(ls.id);
          await logger.info('SyncManager', `Pruned deleted shelter ${ls.id} locally.`);
        }
      }
    }

    // C. Prune Internal Notes
    const { data: cloudNotes } = await supabase.from('internal_notes').select('id');
    if (cloudNotes) {
      const cloudIds = new Set(cloudNotes.map(c => c.id));
      const localNotes = await db.internalNotes.toArray();
      for (const ln of localNotes) {
        if (ln.sync_pending === 0 && ln.id && !cloudIds.has(ln.id)) {
          await db.internalNotes.delete(ln.id);
        }
      }
    }

    // D. Prune Inquiries
    const { data: cloudInquiries } = await supabase.from('inquiries').select('id');
    if (cloudInquiries) {
      const cloudIds = new Set(cloudInquiries.map(c => c.id));
      const localInquiries = await db.inquiries.toArray();
      for (const li of localInquiries) {
        if (li.sync_pending === 0 && li.id && !cloudIds.has(li.id)) {
          await db.inquiries.delete(li.id);
        }
      }
    }

    // E. Prune Custom Blocks
    const { data: cloudBlocks } = await supabase.from('custom_blocks').select('id');
    if (cloudBlocks) {
      const cloudIds = new Set(cloudBlocks.map(c => c.id));
      const localBlocks = await db.customBlocks.toArray();
      for (const lb of localBlocks) {
        if (lb.sync_pending === 0 && lb.id && !cloudIds.has(lb.id)) {
          await db.customBlocks.delete(lb.id);
        }
      }
    }
  } catch (err) {
    await logger.error('SyncManager', 'Error pruning deleted records', err);
  }
}

export async function pruneRevisions(animalId: number): Promise<void> {
  try {
    const revisions = await db.animalRevisions
      .where('animal_id')
      .equals(animalId)
      .toArray();

    if (revisions.length <= 10) return;

    revisions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const excessCount = revisions.length - 10;
    const toDelete = revisions.slice(0, excessCount);

    for (const rev of toDelete) {
      if (rev.id) {
        await db.animalRevisions.delete(rev.id);

        if (supabase) {
          try {
            await supabase
              .from('animal_revisions')
              .delete()
              .eq('id', rev.id);
          } catch (e) {
            console.warn(`Failed to delete pruned revision ${rev.id} from Supabase:`, e);
          }
        }

      }
    }
  } catch (err) {
    console.error(`Failed to prune revisions for animal ${animalId}:`, err);
  }
}
