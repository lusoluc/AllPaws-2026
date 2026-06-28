import { syncWithCloud } from '@/lib/syncManager';
import { db } from '@/lib/db';

// Mock mock functions for Supabase queries
const mockFrom = jest.fn();

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    storage: {
      from: jest.fn(),
    },
  },
}));

// Mock Dexie DB
let mockSubscribers: any[] = [];
let mockUiTexts: any[] = [];
let mockCustomBlocks: any[] = [];
let mockAnimalRevisions: any[] = [];

const mockSubscribersWhere = jest.fn();
const mockSubscribersOrderBy = jest.fn();
const mockSubscribersDelete = jest.fn();
const mockSubscribersPut = jest.fn();
const mockSubscribersUpdate = jest.fn();

const mockUiTextsGet = jest.fn();
const mockUiTextsWhere = jest.fn();
const mockUiTextsOrderBy = jest.fn();
const mockUiTextsPut = jest.fn();
const mockUiTextsUpdate = jest.fn();

const mockCustomBlocksGet = jest.fn();
const mockCustomBlocksWhere = jest.fn();
const mockCustomBlocksOrderBy = jest.fn();
const mockCustomBlocksDelete = jest.fn();
const mockCustomBlocksPut = jest.fn();
const mockCustomBlocksUpdate = jest.fn();

const mockAnimalRevisionsWhere = jest.fn();
const mockAnimalRevisionsOrderBy = jest.fn();
const mockAnimalRevisionsDelete = jest.fn();
const mockAnimalRevisionsPut = jest.fn();
const mockAnimalRevisionsUpdate = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    shelters: {
      where: () => ({ equals: () => ({ toArray: () => Promise.resolve([]) }) }),
      orderBy: () => ({ last: () => Promise.resolve(undefined) }),
    },
    animals: {
      where: () => ({ equals: () => ({ toArray: () => Promise.resolve([]) }) }),
      orderBy: () => ({ last: () => Promise.resolve(undefined) }),
    },
    internalNotes: {
      where: () => ({ equals: () => ({ toArray: () => Promise.resolve([]) }) }),
      orderBy: () => ({ last: () => Promise.resolve(undefined) }),
    },
    inquiries: {
      where: () => ({ equals: () => ({ toArray: () => Promise.resolve([]) }) }),
      orderBy: () => ({ last: () => Promise.resolve(undefined) }),
    },
    subscribers: {
      where: (f: string) => mockSubscribersWhere(f),
      orderBy: (f: string) => mockSubscribersOrderBy(f),
      delete: (id: number) => mockSubscribersDelete(id),
      put: (item: any) => mockSubscribersPut(item),
      update: (id: any, changes: any) => mockSubscribersUpdate(id, changes),
    },
    uiTexts: {
      get: (key: string) => mockUiTextsGet(key),
      where: (f: string) => mockUiTextsWhere(f),
      orderBy: (f: string) => mockUiTextsOrderBy(f),
      put: (item: any) => mockUiTextsPut(item),
      update: (key: string, changes: any) => mockUiTextsUpdate(key, changes),
    },
    customBlocks: {
      get: (id: number) => mockCustomBlocksGet(id),
      where: (f: string) => mockCustomBlocksWhere(f),
      orderBy: (f: string) => mockCustomBlocksOrderBy(f),
      delete: (id: number) => mockCustomBlocksDelete(id),
      put: (item: any) => mockCustomBlocksPut(item),
      update: (id: any, changes: any) => mockCustomBlocksUpdate(id, changes),
    },
    animalRevisions: {
      where: (f: string) => mockAnimalRevisionsWhere(f),
      orderBy: (f: string) => mockAnimalRevisionsOrderBy(f),
      delete: (id: number) => mockAnimalRevisionsDelete(id),
      put: (item: any) => mockAnimalRevisionsPut(item),
      update: (id: any, changes: any) => mockAnimalRevisionsUpdate(id, changes),
    },
  },
}));


describe('Expanded Cloud Sync Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribers = [];
    mockUiTexts = [];
    mockCustomBlocks = [];
    mockAnimalRevisions = [];

    // Default mock behaviors
    mockSubscribersWhere.mockReturnValue({
      equals: (val: any) => ({
        toArray: () => Promise.resolve(mockSubscribers.filter(s => s.sync_pending === val))
      }),
      equalsIgnoreCase: (email: string) => ({
        first: () => Promise.resolve(mockSubscribers.find(s => s.email.toLowerCase() === email.toLowerCase()) || undefined)
      })
    });
    mockSubscribersOrderBy.mockReturnValue({
      last: () => Promise.resolve(mockSubscribers[mockSubscribers.length - 1]),
    });
    mockUiTextsGet.mockResolvedValue(undefined);
    mockUiTextsWhere.mockReturnValue({
      equals: (val: any) => ({
        toArray: () => Promise.resolve(mockUiTexts.filter(t => t.sync_pending === val))
      }),
    });
    mockUiTextsOrderBy.mockReturnValue({
      last: () => Promise.resolve(mockUiTexts[mockUiTexts.length - 1]),
    });
    mockCustomBlocksGet.mockResolvedValue(undefined);
    mockCustomBlocksWhere.mockReturnValue({
      equals: (val: any) => ({
        toArray: () => Promise.resolve(mockCustomBlocks.filter(b => b.sync_pending === val))
      }),
    });
    mockCustomBlocksOrderBy.mockReturnValue({
      last: () => Promise.resolve(mockCustomBlocks[mockCustomBlocks.length - 1]),
    });

    mockAnimalRevisionsWhere.mockImplementation((field: string) => ({
      equals: (val: any) => ({
        toArray: () => {
          if (field === 'animal_id') {
            return Promise.resolve(mockAnimalRevisions.filter(r => r.animal_id === val));
          }
          if (field === 'sync_pending') {
            return Promise.resolve(mockAnimalRevisions.filter(r => r.sync_pending === val));
          }
          return Promise.resolve([]);
        }
      })
    }));
    mockAnimalRevisionsOrderBy.mockReturnValue({
      last: () => Promise.resolve(mockAnimalRevisions[mockAnimalRevisions.length - 1]),
    });
    mockAnimalRevisionsDelete.mockImplementation((id: number) => {
      mockAnimalRevisions = mockAnimalRevisions.filter(r => r.id !== id);
      return Promise.resolve();
    });
    mockAnimalRevisionsPut.mockImplementation((item: any) => {
      mockAnimalRevisions.push(item);
      return Promise.resolve(item.id || Date.now());
    });
    mockAnimalRevisionsUpdate.mockImplementation((id: number, changes: any) => {
      const idx = mockAnimalRevisions.findIndex(r => r.id === id);
      if (idx !== -1) {
        mockAnimalRevisions[idx] = { ...mockAnimalRevisions[idx], ...changes };
      }
      return Promise.resolve();
    });
  });


  test('pushes local pending changes for subscribers, uiTexts, and customBlocks', async () => {
    // Pre-seed local unsynced records
    mockSubscribers = [
      { id: 10, email: 'new@example.com', name: 'John Doe', created_at: '2026-01-01', preferences: ['adoptions'], sync_pending: 1 },
    ];
    mockUiTexts = [
      { key: 'home.heroTag', DE: 'Test DE', LT: 'Test LT', sync_pending: 1 },
    ];
    mockCustomBlocks = [
      { id: 20, page: 'home', type: 'title', de: 'Block DE', lt: 'Block LT', sort_order: 1, sync_pending: 1 },
    ];

    // Mock Supabase select/insert/update responses
    mockFrom.mockImplementation((table) => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.insert = jest.fn().mockReturnValue(builder);
      builder.update = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.gt = jest.fn().mockResolvedValue({ data: [], error: null }); // for pull
      builder.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      builder.single = jest.fn().mockImplementation(() => {
        if (table === 'subscribers') {
          return Promise.resolve({ data: { id: 100, email: 'new@example.com' }, error: null });
        }
        if (table === 'custom_blocks') {
          return Promise.resolve({ data: { id: 200, page: 'home' }, error: null });
        }
        return Promise.resolve({ data: {}, error: null });
      });
      return builder;
    });

    await syncWithCloud();

    // Verify Supabase calls
    expect(mockFrom).toHaveBeenCalledWith('subscribers');
    expect(mockFrom).toHaveBeenCalledWith('ui_texts');
    expect(mockFrom).toHaveBeenCalledWith('custom_blocks');

    // Verify local DB was updated (sync_pending: 0)
    expect(mockSubscribersDelete).toHaveBeenCalledWith(10);
    expect(mockSubscribersPut).toHaveBeenCalledWith(expect.objectContaining({ id: 100, sync_pending: 0 }));
    expect(mockUiTextsUpdate).toHaveBeenCalledWith('home.heroTag', expect.objectContaining({ sync_pending: 0 }));
    expect(mockCustomBlocksDelete).toHaveBeenCalledWith(20);
    expect(mockCustomBlocksPut).toHaveBeenCalledWith(expect.objectContaining({ id: 200, sync_pending: 0 }));
  });

  test('pulls cloud changes for subscribers, uiTexts, and customBlocks and merges them locally', async () => {
    // Pre-seed local synced records (with high updated_at time)
    mockSubscribers = [{ id: 100, email: 'old@example.com', name: 'Old', updated_at: '2026-06-20T00:00:00Z' }];
    mockUiTexts = [{ key: 'home.heroTag', DE: 'Old DE', LT: 'Old LT', updated_at: '2026-06-20T00:00:00Z' }];
    mockCustomBlocks = [{ id: 200, page: 'home', type: 'title', de: 'Old DE', lt: 'Old LT', sort_order: 1, updated_at: '2026-06-20T00:00:00Z' }];

    // Mock Supabase select responses for pull
    mockFrom.mockImplementation((table) => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.gt = jest.fn().mockImplementation(() => {
        if (table === 'subscribers') {
          return Promise.resolve({
            data: [
              { id: 101, email: 'pulled@example.com', name: 'Pulled User', created_at: '2026-06-21', preferences: ['guides'], ip_address: '127.0.0.1', updated_at: '2026-06-22T00:00:00Z' }
            ],
            error: null
          });
        }
        if (table === 'ui_texts') {
          return Promise.resolve({
            data: [
              { key: 'home.heroTag', de: 'New Pulled DE', lt: 'New Pulled LT', updated_at: '2026-06-22T00:00:00Z' }
            ],
            error: null
          });
        }
        if (table === 'custom_blocks') {
          return Promise.resolve({
            data: [
              { id: 201, page: 'home', type: 'paragraph', de: 'Pulled DE Block', lt: 'Pulled LT Block', sort_order: 2, updated_at: '2026-06-22T00:00:00Z' }
            ],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });
      return builder;
    });

    await syncWithCloud();

    // Verify local DB puts
    expect(mockSubscribersPut).toHaveBeenCalledWith(expect.objectContaining({
      id: 101,
      email: 'pulled@example.com',
      name: 'Pulled User',
      sync_pending: 0,
    }));
    expect(mockUiTextsPut).toHaveBeenCalledWith(expect.objectContaining({
      key: 'home.heroTag',
      DE: 'New Pulled DE',
      LT: 'New Pulled LT',
      sync_pending: 0,
    }));
    expect(mockCustomBlocksPut).toHaveBeenCalledWith(expect.objectContaining({
      id: 201,
      de: 'Pulled DE Block',
      sync_pending: 0,
    }));
  });
});
