import { PlatformSettingModel } from '@/backend/models';

export interface DeliverySettings {
  standardDeliveryCharge: number;
  freeDeliveryAboveAmount: number;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  standardDeliveryCharge: 40,
  freeDeliveryAboveAmount: 499,
};

function sanitizeNumber(value: unknown, fallback: number, min = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.round(n * 100) / 100);
}

export function normalizeDeliverySettings(input?: Partial<DeliverySettings> | null): DeliverySettings {
  return {
    standardDeliveryCharge: sanitizeNumber(input?.standardDeliveryCharge, DEFAULT_DELIVERY_SETTINGS.standardDeliveryCharge, 0),
    freeDeliveryAboveAmount: sanitizeNumber(input?.freeDeliveryAboveAmount, DEFAULT_DELIVERY_SETTINGS.freeDeliveryAboveAmount, 0),
  };
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const doc = await PlatformSettingModel.findOne({ key: 'global' }).lean().exec();
    return normalizeDeliverySettings((doc as any)?.delivery || null);
  } catch {
    return { ...DEFAULT_DELIVERY_SETTINGS };
  }
}

export async function updateDeliverySettings(
  input: Partial<DeliverySettings>,
  actorId?: string | null,
): Promise<DeliverySettings> {
  const current = await getDeliverySettings();
  const next = normalizeDeliverySettings({
    standardDeliveryCharge: input.standardDeliveryCharge ?? current.standardDeliveryCharge,
    freeDeliveryAboveAmount: input.freeDeliveryAboveAmount ?? current.freeDeliveryAboveAmount,
  });
  await PlatformSettingModel.findOneAndUpdate(
    { key: 'global' },
    {
      $set: {
        key: 'global',
        delivery: next,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
  return next;
}
