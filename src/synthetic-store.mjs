import { createHash } from "node:crypto";

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** In-memory only. This object has no network, database or external connector. */
export class SyntheticStore {
  #records = [];
  #receipts = new Map();

  append({ target, record, idempotencyKey }) {
    const fingerprint = digest({ target, record });
    const previous = this.#receipts.get(idempotencyKey);

    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        return { status: "REJECTED_KEY_REUSE", written: false };
      }
      return { status: "IDEMPOTENT_REPLAY", written: false, receiptId: previous.receiptId };
    }

    const receiptId = `synthetic-${String(this.#records.length + 1).padStart(3, "0")}`;
    this.#records.push({ receiptId, target, record: structuredClone(record) });
    this.#receipts.set(idempotencyKey, { fingerprint, receiptId });
    return { status: "SYNTHETIC_COMMITTED", written: true, receiptId };
  }

  getByReceipt(receiptId) {
    const match = this.#records.find((item) => item.receiptId === receiptId);
    return match ? structuredClone(match) : null;
  }

  get size() {
    return this.#records.length;
  }
}
