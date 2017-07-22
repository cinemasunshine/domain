"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const multilingualString_1 = require("../schemaTypes/multilingualString");
const safe = { j: 1, w: 'majority', wtimeout: 10000 };
/**
 * 組織スキーマ
 */
const schema = new mongoose.Schema({
    typeOf: String,
    identifier: String,
    name: multilingualString_1.default,
    legalName: multilingualString_1.default,
    sameAs: String,
    gmoInfo: mongoose.SchemaTypes.Mixed,
    parentOrganization: mongoose.SchemaTypes.Mixed,
    location: mongoose.SchemaTypes.Mixed
}, {
    collection: 'organizations',
    id: true,
    read: 'primaryPreferred',
    safe: safe,
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    },
    toJSON: { getters: true },
    toObject: { getters: true }
});
exports.default = mongoose.model('Organization', schema);
