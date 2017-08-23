"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const owner_1 = require("./owner");
const transactionInquiryKey_1 = require("../schemaTypes/transactionInquiryKey");
const safe = { j: 1, w: 'majority', wtimeout: 10000 };
/**
 * 取引スキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema({
    expires_at: Date,
    status: String,
    owners: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: owner_1.default.modelName
        }],
    client_user: mongoose.Schema.Types.Mixed,
    inquiry_key: transactionInquiryKey_1.default,
    expired_at: Date,
    started_at: Date,
    closed_at: Date,
    tasks_exported_at: Date,
    tasks_exportation_status: String,
    tasks: [mongoose.Schema.Types.Mixed]
}, {
    collection: 'transactions',
    id: true,
    read: 'primaryPreferred',
    safe: safe,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    toJSON: { getters: true },
    toObject: { getters: true }
});
// タスクエクスポート時の検索で使用
schema.index({ status: 1, tasks_exportation_status: 1 });
// 取引期限切れ確認等に使用
schema.index({ status: 1, expires_at: 1 });
// 実行中タスクエクスポート監視に使用
schema.index({ tasks_exportation_status: 1, updated_at: 1 });
// 取引進行中は、基本的にIDとステータスで参照する
schema.index({ _id: 1, status: 1 });
// 購入番号から照会の際に使用
schema.index({ 'inquiry_key.reserve_num': 1, 'inquiry_key.tel': 1, 'inquiry_key.theater_code': 1, status: 1 });
// レポート作成時に使用
schema.index({ closed_at: 1 });
schema.index({ expired_at: 1 });
schema.index({ started_at: 1 });
schema.index({ started_at: 1, closed_at: 1 });
schema.index({ started_at: 1, expired_at: 1 });
schema.index({ status: 1, started_at: 1 });
exports.default = mongoose.model('Transaction', schema);
