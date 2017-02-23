"use strict";
const mongoose = require("mongoose");
/**
 * キュースキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema({
    group: String,
    status: String,
    run_at: Date,
    max_count_try: Number,
    last_tried_at: Date,
    count_tried: Number,
    results: [String],
    authorization: mongoose.Schema.Types.Mixed,
    notification: mongoose.Schema.Types.Mixed,
    transaction_id: mongoose.Schema.Types.ObjectId // 取引タスク
}, {
    collection: 'queues',
    read: 'primaryPreferred',
    safe: { j: 1, w: 'majority', wtimeout: 5000 },
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mongoose.model('Queue', schema);
