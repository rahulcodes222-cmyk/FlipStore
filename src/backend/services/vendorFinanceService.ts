import mongoose from 'mongoose';
import {
  CommissionModel,
  CommissionConfigModel,
  FinancialLedgerModel,
  PayoutModel,
  SubOrderModel,
  SellerStoreModel,
  VendorModel,
  UserModel,
} from '@/backend/models';
import { toPaise, paiseToRupees, percentPaise, addPaise, subPaise, clampNonNegativePaise } from '@/backend/utils/money';

type AnySession = mongoose.ClientSession | null | undefined;

function toId(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && '_id' in (v as any)) return String((v as any)._id);
  return String(v);
}
function round2(n: number): number { return Math.round(n * 100) / 100; }

export function maskAccountNumber(account?: string | null): string {
  const s = String(account || '').replace(/\s+/g, '');
  if (!s) return '';
  if (s.length <= 4) return `XXXX${s}`;
  return `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}
export function maskIfsc(ifsc?: string | null): string {
  const s = String(ifsc || '').trim();
  if (!s) return '';
  if (s.length <= 4) return s;
  return `${s.slice(0, 4)}****`;
}

async function resolveCommissionRule(sellerId: string, category?: string) {
  const now = new Date();
  const timeOk = { $and: [ { $or: [{ effectiveFrom: { $exists: false } }, { effectiveFrom: null }, { effectiveFrom: { $lte: now } }] }, { $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: now } }] } ] };
  const base: any = { isActive: true, ...timeOk };
  const sid = mongoose.isValidObjectId(sellerId) ? new mongoose.Types.ObjectId(sellerId) : sellerId;
  const scopes: any[] = [
    { ...base, scope: 'SELLER', sellerId: sid },
    ...(category ? [{ ...base, scope: 'CATEGORY', category }] : []),
    { ...base, scope: 'GLOBAL' },
  ];
  for (const q of scopes) {
    const cfg: any = await CommissionConfigModel.findOne(q).sort({ priority: -1, createdAt: -1 }).lean().exec();
    if (cfg) return { commissionPercentage: Number(cfg.commissionPercentage || 0), fixedFeePaise: Number(cfg.fixedFeePaise || 0), scope: cfg.scope as string, configId: String(cfg._id), name: cfg.name as string };
  }
  return { commissionPercentage: 5, fixedFeePaise: 0, scope: 'DEFAULT', configId: undefined as string | undefined, name: 'Default platform commission' };
}

async function ensureLedgerEntry(input: {
  sellerId: string; type: string; direction: 'CREDIT'|'DEBIT'; status: 'PENDING'|'AVAILABLE'|'COMPLETED'|'REVERSED';
  amountPaise: number; balanceBucket: string; idempotencyKey: string; description?: string; metadata?: Record<string, unknown>;
  orderId?: string; subOrderId?: string; paymentId?: string; commissionId?: string; payoutId?: string; refundId?: string;
  referenceType?: string; referenceId?: string;
}, session?: AnySession) {
  const amountPaise = clampNonNegativePaise(input.amountPaise);
  if (amountPaise <= 0) return null;
  const q: any = { idempotencyKey: input.idempotencyKey };
  const existing = await FinancialLedgerModel.findOne(q).session(session || null).exec();
  if (existing) return existing;
  try {
    const payload: any = { ...input, amountPaise, currency: 'INR', metadata: input.metadata || {} };
    const [doc] = await FinancialLedgerModel.create([payload], session ? { session } : undefined);
    return doc;
  } catch (e: any) {
    if (e?.code === 11000) return FinancialLedgerModel.findOne(q).session(session || null).exec();
    throw e;
  }
}

export async function ensureSubOrderCommissionLedger(subOrderId: string, opts?: { session?: AnySession; paymentStatus?: string; actorId?: string }) {
  const session = opts?.session;
  const sub: any = await SubOrderModel.findById(subOrderId).session(session || null).exec();
  if (!sub) return { created: 0 };
  const sellerId = toId(sub.sellerId);
  const orderId = toId(sub.orderId);
  const items = Array.isArray(sub.items) ? sub.items : [];
  let created = 0;
  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity || 1));
    const grossPaise = toPaise(Number(item.price || 0) * qty);
    const calcKey = `commission:${sellerId}:${subOrderId}:${String(item.id || item.productId || 'item')}`;
    let comm: any = await CommissionModel.findOne({ calculationKey: calcKey }).session(session || null).exec();
    if (!comm) {
      const rule = await resolveCommissionRule(sellerId, item.category);
      const commissionPaise = clampNonNegativePaise(addPaise(percentPaise(grossPaise, rule.commissionPercentage), rule.fixedFeePaise || 0));
      const sellerNetPaise = clampNonNegativePaise(subPaise(grossPaise, commissionPaise));
      const paymentStatus = opts?.paymentStatus || sub.paymentStatus || 'PENDING';
      const earned = paymentStatus === 'PAID';
      try {
        const [doc] = await CommissionModel.create([{
          sellerId, orderId, subOrderId: String(sub._id), orderItemId: String(item.id || ''),
          productId: item.productId ? String(item.productId) : undefined,
          configId: rule.configId, ruleScope: rule.scope,
          sellingPrice: paiseToRupees(grossPaise),
          commissionPercentage: Number(rule.commissionPercentage || 0),
          commissionAmount: paiseToRupees(commissionPaise),
          sellerNetAmount: paiseToRupees(sellerNetPaise),
          grossAmountPaise: grossPaise, commissionAmountPaise: commissionPaise, sellerNetAmountPaise: sellerNetPaise,
          refundedCommissionPaise: 0, refundedSellerNetPaise: 0, currency: 'INR',
          status: earned ? 'EARNED' : 'PENDING', calculationKey: calcKey, notes: rule.name,
        } as any], session ? { session } : undefined);
        comm = doc; created += 1;
      } catch (e: any) {
        if (e?.code !== 11000) throw e;
        comm = await CommissionModel.findOne({ calculationKey: calcKey }).session(session || null).exec();
      }
    }
    if (!comm) continue;
    const earnedStatus = (opts?.paymentStatus || sub.paymentStatus) === 'PAID' ? 'AVAILABLE' : 'PENDING';
    await ensureLedgerEntry({ sellerId, type: 'EARNING_CREDIT', direction: 'CREDIT', status: earnedStatus,
      amountPaise: Number(comm.grossAmountPaise || toPaise(comm.sellingPrice)), balanceBucket: 'GROSS',
      idempotencyKey: `ledger:earning:${calcKey}`, description: `Earning for suborder ${sub.subOrderNumber || sub._id}`,
      orderId, subOrderId: String(sub._id), commissionId: String(comm._id), referenceType: 'SUBORDER_ITEM', referenceId: calcKey,
      metadata: { subOrderNumber: sub.subOrderNumber, productId: item.productId, quantity: qty } }, session);
    await ensureLedgerEntry({ sellerId, type: 'COMMISSION_DEBIT', direction: 'DEBIT', status: earnedStatus,
      amountPaise: Number(comm.commissionAmountPaise || toPaise(comm.commissionAmount)), balanceBucket: 'COMMISSION',
      idempotencyKey: `ledger:commission:${calcKey}`, description: `Platform commission for suborder ${sub.subOrderNumber || sub._id}`,
      orderId, subOrderId: String(sub._id), commissionId: String(comm._id), referenceType: 'SUBORDER_ITEM', referenceId: calcKey,
      metadata: { commissionPercentage: comm.commissionPercentage, ruleScope: comm.ruleScope } }, session);
  }
  return { created };
}

export async function markSubOrderLedgerAvailable(subOrderId: string, opts?: { session?: AnySession }) {
  const session = opts?.session;
  const comms = await CommissionModel.find({ subOrderId: String(subOrderId) }).session(session || null).exec();
  for (const c of comms as any[]) {
    if (c.status === 'PENDING') { c.status = 'EARNED'; await c.save(session ? { session } : undefined); }
  }
  await FinancialLedgerModel.updateMany(
    { subOrderId: String(subOrderId), type: { $in: ['EARNING_CREDIT','COMMISSION_DEBIT'] }, status: 'PENDING' },
    { $set: { status: 'AVAILABLE' } }, session ? { session } : undefined,
  ).exec();
}

export async function applyRefundReversalForSubOrder(subOrderId: string, opts?: { session?: AnySession; reason?: string }) {
  const session = opts?.session;
  const commissions: any[] = await CommissionModel.find({ subOrderId: String(subOrderId) }).session(session || null).exec();
  for (const comm of commissions) {
    const sellerId = toId(comm.sellerId);
    const orderId = toId(comm.orderId);
    const netPaise = Math.max(0, Number(comm.sellerNetAmountPaise || toPaise(comm.sellerNetAmount)) - Number(comm.refundedSellerNetPaise || 0));
    const commissionPaise = Math.max(0, Number(comm.commissionAmountPaise || toPaise(comm.commissionAmount)) - Number(comm.refundedCommissionPaise || 0));
    const refundGrossPaise = netPaise + commissionPaise;
    if (refundGrossPaise <= 0) continue;
    await ensureLedgerEntry({ sellerId, type: 'REFUND_DEBIT', direction: 'DEBIT', status: 'COMPLETED',
      amountPaise: refundGrossPaise, balanceBucket: 'REFUND', idempotencyKey: `ledger:refund:${String(comm.calculationKey || comm._id)}`,
      description: opts?.reason || `Refund reversal for suborder ${subOrderId}`,
      orderId, subOrderId: String(subOrderId), commissionId: String(comm._id), referenceType: 'SUBORDER', referenceId: String(subOrderId),
      metadata: { reverseNetPaise: netPaise, reverseCommissionPaise: commissionPaise } }, session);
    if (commissionPaise > 0) {
      await ensureLedgerEntry({ sellerId, type: 'ADJUSTMENT_CREDIT', direction: 'CREDIT', status: 'COMPLETED',
        amountPaise: commissionPaise, balanceBucket: 'COMMISSION', idempotencyKey: `ledger:refund-commission-reversal:${String(comm.calculationKey || comm._id)}`,
        description: 'Commission reversed due to refund/cancellation', orderId, subOrderId: String(subOrderId), commissionId: String(comm._id),
        referenceType: 'SUBORDER', referenceId: String(subOrderId) }, session);
    }
    comm.refundedSellerNetPaise = Number(comm.refundedSellerNetPaise || 0) + netPaise;
    comm.refundedCommissionPaise = Number(comm.refundedCommissionPaise || 0) + commissionPaise;
    comm.status = 'REFUNDED';
    await comm.save(session ? { session } : undefined);
  }
}

export async function ensureVendorFinanceBackfill(sellerId: string) {
  const existing = await FinancialLedgerModel.exists({ sellerId });
  const subs = await SubOrderModel.find({ sellerId }).select('_id paymentStatus').limit(500).lean().exec();
  for (const sub of subs as any[]) {
    try { await ensureSubOrderCommissionLedger(String(sub._id), { paymentStatus: sub.paymentStatus }); } catch {}
  }
  return { backfilled: !existing };
}

export async function computeVendorFinancialSummary(sellerId: string, opts?: { from?: string; to?: string }) {
  await ensureVendorFinanceBackfill(sellerId);
  const sid = mongoose.isValidObjectId(sellerId) ? new mongoose.Types.ObjectId(sellerId) : sellerId;
  const base: any = { sellerId: sid };
  if (opts?.from || opts?.to) {
    base.createdAt = {};
    if (opts.from) base.createdAt.$gte = new Date(opts.from);
    if (opts.to) base.createdAt.$lte = new Date(opts.to);
  }
  const [grossAgg, commissionAgg, refundAgg, pendingAgg, availableAgg, completedPayoutAgg, holdAgg] = await Promise.all([
    FinancialLedgerModel.aggregate([{ $match: { ...base, type: 'EARNING_CREDIT' } }, { $group: { _id: null, total: { $sum: '$amountPaise' } } }]).exec(),
    FinancialLedgerModel.aggregate([{ $match: { ...base, type: 'COMMISSION_DEBIT' } }, { $group: { _id: null, total: { $sum: '$amountPaise' } } }]).exec(),
    FinancialLedgerModel.aggregate([{ $match: { ...base, type: 'REFUND_DEBIT' } }, { $group: { _id: null, total: { $sum: '$amountPaise' } } }]).exec(),
    FinancialLedgerModel.aggregate([{ $match: { ...base, type: { $in: ['EARNING_CREDIT','COMMISSION_DEBIT'] }, status: 'PENDING' } }, { $group: { _id: '$type', total: { $sum: '$amountPaise' } } }]).exec(),
    FinancialLedgerModel.aggregate([{ $match: { ...base, type: { $in: ['EARNING_CREDIT','COMMISSION_DEBIT','REFUND_DEBIT','PAYOUT_REJECT_CREDIT','PAYOUT_FAIL_CREDIT','ADJUSTMENT_CREDIT','ADJUSTMENT_DEBIT'] }, status: 'AVAILABLE' } }, { $group: { _id: '$direction', total: { $sum: '$amountPaise' } } }]).exec(),
    FinancialLedgerModel.aggregate([{ $match: { ...base, type: 'PAYOUT_REQUEST_DEBIT', status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$amountPaise' } } }]).exec(),
    FinancialLedgerModel.aggregate([{ $match: { ...base, type: 'PAYOUT_REQUEST_DEBIT', status: { $in: ['PENDING', 'AVAILABLE'] } } }, { $group: { _id: null, total: { $sum: '$amountPaise' } } }]).exec(),
  ]);
  const grossPaise = Number((grossAgg as any[])[0]?.total || 0);
  const commissionPaise = Number((commissionAgg as any[])[0]?.total || 0);
  const refundPaise = Number((refundAgg as any[])[0]?.total || 0);
  const pMap = new Map<string, number>(); for (const r of pendingAgg as any[]) pMap.set(String(r._id || ''), r.total || 0);
  const pendingEarnPaise = Math.max(0, Number(pMap.get('EARNING_CREDIT') || 0) - Number(pMap.get('COMMISSION_DEBIT') || 0));
  let aCredit = 0, aDebit = 0; for (const r of availableAgg as any[]) { if (r._id === 'CREDIT') aCredit = r.total || 0; if (r._id === 'DEBIT') aDebit = r.total || 0; }
  const availablePaise = Math.max(0, aCredit - aDebit);
  const completedPayoutPaise = Number((completedPayoutAgg as any[])[0]?.total || 0);
  const netPaise = Math.max(0, grossPaise - commissionPaise - refundPaise);
  return {
    currency: 'INR', totalSalesPaise: grossPaise, grossRevenuePaise: grossPaise, netEarningsPaise: netPaise,
    pendingEarningsPaise: pendingEarnPaise, availableBalancePaise: availablePaise, completedPayoutsPaise: completedPayoutPaise,
    refundDeductionsPaise: refundPaise, commissionDeductionsPaise: commissionPaise,
    grossSales: paiseToRupees(grossPaise), grossRevenue: paiseToRupees(grossPaise), totalRevenue: paiseToRupees(grossPaise),
    platformCommission: paiseToRupees(commissionPaise), commissionDeductions: paiseToRupees(commissionPaise),
    refundDeductions: paiseToRupees(refundPaise), netEarnings: paiseToRupees(netPaise),
    pendingPayments: paiseToRupees(pendingEarnPaise), pendingEarnings: paiseToRupees(pendingEarnPaise),
    availableBalance: paiseToRupees(availablePaise), completedPayouts: paiseToRupees(completedPayoutPaise), totalPaid: paiseToRupees(completedPayoutPaise),
  };
}

export async function listVendorTransactions(sellerId: string, query: any = {}) {
  await ensureVendorFinanceBackfill(sellerId);
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const filter: any = { sellerId };
  if (query.from || query.to) { filter.createdAt = {}; if (query.from) filter.createdAt.$gte = new Date(query.from); if (query.to) filter.createdAt.$lte = new Date(query.to); }
  if (query.type) filter.type = query.type;
  const [rows, total] = await Promise.all([
    FinancialLedgerModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    FinancialLedgerModel.countDocuments(filter).exec(),
  ]);
  const data = rows.map((r: any) => ({ id: String(r._id), type: r.type, direction: r.direction, status: r.status,
    amount: paiseToRupees(r.amountPaise), amountPaise: r.amountPaise, currency: r.currency || 'INR',
    description: r.description || r.type, orderId: r.orderId ? String(r.orderId) : undefined, subOrderId: r.subOrderId,
    payoutId: r.payoutId, commissionId: r.commissionId, createdAt: r.createdAt, referenceId: r.referenceId }));
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total };
}

export async function listVendorCommissions(sellerId: string, query: any = {}) {
  await ensureVendorFinanceBackfill(sellerId);
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const filter: any = { sellerId };
  if (query.from || query.to) { filter.createdAt = {}; if (query.from) filter.createdAt.$gte = new Date(query.from); if (query.to) filter.createdAt.$lte = new Date(query.to); }
  const [rows, total] = await Promise.all([
    CommissionModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    CommissionModel.countDocuments(filter).exec(),
  ]);
  return { data: rows.map((c: any) => ({ id: String(c._id), sellerId: String(c.sellerId), orderId: String(c.orderId), subOrderId: c.subOrderId, orderItemId: c.orderItemId,
    grossAmount: paiseToRupees(Number(c.grossAmountPaise || toPaise(c.sellingPrice))), commissionPercentage: c.commissionPercentage,
    commissionAmount: paiseToRupees(Number(c.commissionAmountPaise || toPaise(c.commissionAmount))),
    sellerNetAmount: paiseToRupees(Number(c.sellerNetAmountPaise || toPaise(c.sellerNetAmount))),
    refundedCommissionAmount: paiseToRupees(Number(c.refundedCommissionPaise || 0)), refundedSellerNetAmount: paiseToRupees(Number(c.refundedSellerNetPaise || 0)),
    status: c.status, ruleScope: c.ruleScope, createdAt: c.createdAt })), total, page, limit, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total };
}

export async function getVendorDateWiseEarnings(sellerId: string, query: any = {}) {
  await ensureVendorFinanceBackfill(sellerId);
  const groupBy = query.groupBy === 'month' ? 'month' : 'day';
  const from = query.from ? new Date(query.from) : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date();
  const sid = mongoose.isValidObjectId(sellerId) ? new mongoose.Types.ObjectId(sellerId) : sellerId;
  const fmt = groupBy === 'month' ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } } : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  const rows = await FinancialLedgerModel.aggregate([
    { $match: { sellerId: sid, createdAt: { $gte: from, $lte: to }, type: { $in: ['EARNING_CREDIT','COMMISSION_DEBIT','REFUND_DEBIT'] } } },
    { $group: { _id: { bucket: fmt, type: '$type' }, total: { $sum: '$amountPaise' } } },
  ]).exec();
  const map = new Map<string, any>();
  for (const r of rows as any[]) {
    const bucket = r._id.bucket;
    if (!map.has(bucket)) map.set(bucket, { date: bucket, grossSales: 0, commission: 0, refunds: 0, netEarnings: 0 });
    const row = map.get(bucket);
    if (r._id.type === 'EARNING_CREDIT') row.grossSales += paiseToRupees(r.total || 0);
    if (r._id.type === 'COMMISSION_DEBIT') row.commission += paiseToRupees(r.total || 0);
    if (r._id.type === 'REFUND_DEBIT') row.refunds += paiseToRupees(r.total || 0);
  }
  for (const row of map.values()) row.netEarnings = round2(Math.max(0, row.grossSales - row.commission - row.refunds));
  return Array.from(map.values()).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}

function payoutNumber() { return `PAY-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`; }

async function getVendorBankSnapshot(sellerId: string) {
  const store: any = await SellerStoreModel.findOne({ sellerId }).select('+accountNumber bankName bankAccountHolder ifscCode verificationStatus').lean().exec();
  const vendor: any = await VendorModel.findOne({ userId: sellerId }).lean().exec();
  const account = store?.accountNumber || vendor?.bankDetails?.accountNumberMasked || '';
  const holder = store?.bankAccountHolder || vendor?.bankDetails?.accountHolderName || '';
  const bankName = store?.bankName || vendor?.bankDetails?.bankName || '';
  const ifsc = store?.ifscCode || vendor?.bankDetails?.ifscCode || '';
  const verified = String(store?.verificationStatus || vendor?.applicationStatus || '').toLowerCase() === 'approved' || String(store?.verificationStatus || '').toLowerCase() === 'verified';
  return {
    bankAccount: maskAccountNumber(account), accountHolderName: holder, bankName, ifscCodeMasked: maskIfsc(ifsc),
    bankVerificationStatus: (verified ? 'VERIFIED' : (account && ifsc ? 'PENDING' : 'UNVERIFIED')) as 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | 'FAILED',
    hasDetails: !!(account && ifsc && bankName),
  };
}

export async function requestVendorPayout(sellerId: string, amountRupees: number, note?: string, idempotencyKey?: string) {
  const amountPaise = toPaise(amountRupees);
  if (amountPaise <= 0) throw new Error('Invalid payout amount.');
  const idem = idempotencyKey || `payout:req:${sellerId}:${amountPaise}:${(note || '').slice(0,40)}`;
  const existing: any = await PayoutModel.findOne({ idempotencyKey: idem, sellerId }).lean().exec();
  if (existing) return existing;
  const session = await mongoose.startSession().catch(() => null);
  const run = async (s?: AnySession) => {
    const bank = await getVendorBankSnapshot(sellerId);
    if (!bank.hasDetails) throw new Error('Verified bank details are required before requesting payout.');
    if (bank.bankVerificationStatus === 'FAILED') throw new Error('Bank verification failed. Update bank details before requesting payout.');
    const summary = await computeVendorFinancialSummary(sellerId);
    const availablePaise = Math.max(0, Number(summary.availableBalancePaise || 0));
    if (amountPaise > availablePaise) throw new Error('Requested amount exceeds available balance.');
    const active = await PayoutModel.find({ sellerId, status: { $in: ['PENDING','UNDER_REVIEW','APPROVED','PROCESSING'] } }).session(s || null).lean().exec();
    const activeHold = active.reduce((sum: number, p: any) => sum + Number(p.amountPaise || toPaise(p.amount)), 0);
    if (activeHold + amountPaise > availablePaise + 1) throw new Error('Another payout request is in progress or exceeds available balance.');
    const payoutDoc: any = {
      sellerId, payoutNumber: payoutNumber(), amount: paiseToRupees(amountPaise), amountPaise, currency: 'INR', date: new Date(), requestedAt: new Date(),
      status: bank.bankVerificationStatus === 'VERIFIED' ? 'PENDING' : 'UNDER_REVIEW',
      bankAccount: bank.bankAccount, bankName: bank.bankName, accountHolderName: bank.accountHolderName, ifscCodeMasked: bank.ifscCodeMasked,
      bankVerificationStatus: bank.bankVerificationStatus, requestNote: note, idempotencyKey: idem, reconciliationStatus: 'PENDING',
      statusHistory: [{ status: bank.bankVerificationStatus === 'VERIFIED' ? 'PENDING' : 'UNDER_REVIEW', note: note || 'Payout requested', actorId: sellerId, actorRole: 'vendor', timestamp: new Date() }],
    };
    let payout: any;
    try { const [created] = await PayoutModel.create([payoutDoc], s ? { session: s } : undefined); payout = created; }
    catch (e: any) { if (e?.code === 11000) return PayoutModel.findOne({ idempotencyKey: idem, sellerId }).lean().exec(); throw e; }
    await ensureLedgerEntry({ sellerId, type: 'PAYOUT_REQUEST_DEBIT', direction: 'DEBIT', status: 'PENDING', amountPaise, balanceBucket: 'PAYOUT',
      idempotencyKey: `ledger:payout:req:${String(payout._id)}`, description: 'Payout requested - amount held', payoutId: String(payout._id),
      referenceType: 'PAYOUT', referenceId: String(payout._id), metadata: { payoutNumber: payout.payoutNumber } }, s);
    return PayoutModel.findById(payout._id).lean().exec();
  };
  try { if (session) { let result: any = null; await session.withTransaction(async () => { result = await run(session); }); return result; } return await run(null); }
  finally { if (session) await session.endSession(); }
}

function mapPayout(p: any) {
  return { id: String(p._id), payoutNumber: p.payoutNumber, amount: paiseToRupees(Number(p.amountPaise || toPaise(p.amount))), amountPaise: Number(p.amountPaise || toPaise(p.amount)),
    date: p.date || p.requestedAt || p.createdAt, requestedAt: p.requestedAt, reviewedAt: p.reviewedAt, completedAt: p.completedAt, status: p.status,
    bankAccount: p.bankAccount, bankName: p.bankName, accountHolderName: p.accountHolderName, referenceId: p.referenceId, transactionReference: p.transactionReference,
    provider: p.provider, reconciliationStatus: p.reconciliationStatus, requestNote: p.requestNote, adminNote: p.adminNote, rejectionReason: p.rejectionReason, failureReason: p.failureReason };
}

export async function listVendorPayouts(sellerId: string, query: any = {}) {
  const page = Math.max(1, Number(query.page || 1)); const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const filter: any = { sellerId }; if (query.status) filter.status = query.status;
  const [rows, total] = await Promise.all([ PayoutModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(), PayoutModel.countDocuments(filter).exec() ]);
  return { data: rows.map(mapPayout), total, page, limit, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total };
}

export async function listAdminPayouts(query: any = {}) {
  const page = Math.max(1, Number(query.page || 1)); const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const filter: any = {}; if (query.status) filter.status = query.status; if (query.sellerId) filter.sellerId = query.sellerId;
  const [rows, total] = await Promise.all([ PayoutModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(), PayoutModel.countDocuments(filter).exec() ]);
  const sellerIds = Array.from(new Set(rows.map((r: any) => toId(r.sellerId)).filter(Boolean)));
  const sellers = sellerIds.length ? await UserModel.find({ _id: { $in: sellerIds } }).select('_id name email storeName').lean().exec() : [];
  const sMap = new Map(sellers.map((s: any) => [String(s._id), s]));
  return { data: rows.map((p: any) => { const s: any = sMap.get(toId(p.sellerId)); return { ...mapPayout(p), sellerId: toId(p.sellerId), seller: s ? { id: String(s._id), name: s.name, email: s.email, storeName: s.storeName } : null, bankVerificationStatus: p.bankVerificationStatus }; }), total, page, limit, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total };
}

export async function updateAdminPayoutStatus(payoutId: string, admin: { id: string; role: string }, input: any) {
  const session = await mongoose.startSession().catch(() => null);
  const run = async (s?: AnySession) => {
    const payout: any = await PayoutModel.findById(payoutId).session(s || null).exec();
    if (!payout) throw new Error('Payout not found.');
    const sellerId = toId(payout.sellerId);
    if (sellerId === String(admin.id)) throw new Error('Vendors cannot approve or manage their own payouts.');
    const next = String(input.status || '').toUpperCase();
    const current = String(payout.status || '').toUpperCase();
    if (current === next) return PayoutModel.findById(payoutId).lean().exec();
    const allowed: Record<string, Set<string>> = {
      PENDING: new Set(['UNDER_REVIEW','APPROVED','REJECTED','FAILED']), UNDER_REVIEW: new Set(['APPROVED','REJECTED','FAILED','PENDING']),
      APPROVED: new Set(['PROCESSING','FAILED','REJECTED']), PROCESSING: new Set(['COMPLETED','FAILED']),
      COMPLETED: new Set([]), REJECTED: new Set([]), FAILED: new Set([]), PAID: new Set([]), CANCELLED: new Set([]),
    };
    if (!(allowed[current] || new Set()).has(next)) throw new Error(`Cannot transition payout from ${current} to ${next}.`);
    if (next === 'REJECTED' && !String(input.rejectionReason || input.adminNote || '').trim()) throw new Error('Rejection reason is required.');
    if (next === 'FAILED' && !String(input.failureReason || input.adminNote || '').trim()) throw new Error('Failure reason is required.');
    if (next === 'COMPLETED') {
      const txRef = String(input.transactionReference || payout.transactionReference || '').trim();
      const reconConfirmed = input.reconciliationConfirmed === true || payout.reconciliationStatus === 'CONFIRMED';
      if (!txRef) throw new Error('Transaction reference is required to complete payout.');
      if (!reconConfirmed) throw new Error('Payout cannot be completed until provider/authorized reconciliation confirms settlement.');
      payout.transactionReference = txRef; payout.reconciliationStatus = 'CONFIRMED'; payout.reconciledAt = new Date(); payout.reconciledBy = admin.id;
      payout.completedAt = new Date(); payout.processedAt = payout.processedAt || new Date();
      payout.provider = input.provider || payout.provider; payout.providerPayoutId = input.providerPayoutId || payout.providerPayoutId;
    }
    if (next === 'APPROVED') { if (payout.bankVerificationStatus === 'FAILED') throw new Error('Cannot approve payout with failed bank verification.'); payout.reviewedAt = new Date(); payout.reviewedBy = admin.id; }
    if (next === 'PROCESSING') { payout.processedAt = new Date(); payout.provider = input.provider || payout.provider; payout.providerPayoutId = input.providerPayoutId || payout.providerPayoutId; }
    if (next === 'REJECTED') { payout.rejectionReason = input.rejectionReason || input.adminNote || payout.rejectionReason; payout.reviewedAt = payout.reviewedAt || new Date(); payout.reviewedBy = payout.reviewedBy || admin.id; }
    if (next === 'FAILED') { payout.failureReason = input.failureReason || input.adminNote || payout.failureReason; }
    if (input.adminNote) payout.adminNote = input.adminNote;
    if (input.transactionReference) payout.transactionReference = input.transactionReference;
    payout.status = next;
    payout.statusHistory = [...(payout.statusHistory || []), { status: next, note: input.adminNote || input.rejectionReason || input.failureReason || `Status changed to ${next}`, actorId: admin.id, actorRole: admin.role, timestamp: new Date() }];
    await payout.save(s ? { session: s } : undefined);
    if (next === 'COMPLETED') {
      const held: any = await FinancialLedgerModel.findOne({ idempotencyKey: `ledger:payout:req:${String(payout._id)}` }).session(s || null).exec();
      if (held && held.status !== 'COMPLETED') { held.status = 'COMPLETED'; await held.save(s ? { session: s } : undefined); }
    }
    if (next === 'REJECTED' || next === 'FAILED') {
      const held: any = await FinancialLedgerModel.findOne({ idempotencyKey: `ledger:payout:req:${String(payout._id)}` }).session(s || null).exec();
      if (held && held.status !== 'REVERSED') { held.status = 'REVERSED'; await held.save(s ? { session: s } : undefined); }
      await ensureLedgerEntry({ sellerId, type: next === 'REJECTED' ? 'PAYOUT_REJECT_CREDIT' : 'PAYOUT_FAIL_CREDIT', direction: 'CREDIT', status: 'AVAILABLE',
        amountPaise: Number(payout.amountPaise || toPaise(payout.amount)), balanceBucket: 'AVAILABLE', idempotencyKey: `ledger:payout:${next.toLowerCase()}:${String(payout._id)}`,
        description: next === 'REJECTED' ? 'Payout rejected - funds returned' : 'Payout failed - funds returned',
        payoutId: String(payout._id), referenceType: 'PAYOUT', referenceId: String(payout._id) }, s);
    }
    return PayoutModel.findById(payoutId).lean().exec();
  };
  try { if (session) { let result: any = null; await session.withTransaction(async () => { result = await run(session); }); return result; } return await run(null); }
  finally { if (session) await session.endSession(); }
}