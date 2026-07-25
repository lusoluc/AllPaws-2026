import { lookupChipInRegistries } from '../lib/services/missingPetLookupService';
import { autoRegisterUnfoundChip } from '../lib/services/registrySyncService';

describe('Smart Animal Intake & European Registry Ecosystem', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matched: false }),
    } as any);
  });

  test('Sanitizes chip IDs and validates 15-digit ISO 11784 format', async () => {
    const rawInput = '\x02 276098100123456 \r\n';
    const result = await lookupChipInRegistries(rawInput);
    expect(result.chipId).toBe('276098100123456');
    expect(result.status).not.toBe('error');
  });

  test('Rejects invalid chip length gracefully without throwing', async () => {
    const shortInput = '12345';
    const result = await lookupChipInRegistries(shortInput);
    expect(result.status).toBe('error');
    expect(result.rawDetails).toContain('Ungültige Transponder-ID');
  });

  test('Identifies registry match for test chip starting with 99900', async () => {
    const matchedInput = '999001234567890';
    const result = await lookupChipInRegistries(matchedInput);
    expect(result.status).toBe('foundRegistered');
    expect(result.matchedRegistries).toContain('TASSO');
    expect(result.ownerName).toBeDefined();
    expect(result.ownerPhone).toBeDefined();
  });

  test('Auto-registers unfound chip successfully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as any);

    const newAnimal: any = {
      id: 101,
      name: 'Rescued Stray',
      type: 'Hund',
      chip_id: '440098100999888',
      registry_status: 'notFound'
    };

    const autoRegSuccess = await autoRegisterUnfoundChip(newAnimal);
    expect(autoRegSuccess).toBe(true);
  });
});
