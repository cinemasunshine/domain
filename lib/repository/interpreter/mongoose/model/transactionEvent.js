"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const transaction_1 = require("./transaction");
/**
 * 取引イベントスキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: transaction_1.default.modelName
    },
    group: String,
    occurred_at: Date,
    authorization: mongoose.Schema.Types.Mixed,
    notification: mongoose.Schema.Types.Mixed
}, {
    collection: 'transaction_events',
    id: true,
    read: 'primaryPreferred',
    safe: { j: 1, w: 'majority', wtimeout: 5000 },
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    toJSON: { getters: true },
    toObject: { getters: true }
});
exports.default = mongoose.model('TransactionEvent', schema);
