"use strict";
const mongoose = require("mongoose");
/**
 * 劇場スキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema({
    _id: String,
    name: {
        ja: String,
        en: String
    },
    name_kana: String,
    address: {
        ja: String,
        en: String
    }
}, {
    collection: 'theaters',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mongoose.model('Theater', schema);
