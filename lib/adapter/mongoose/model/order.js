"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const safe = { j: 1, w: 'majority', wtimeout: 10000 };
/**
 * 注文スキーマ
 */
const schema = new mongoose.Schema({
    typeOf: {
        type: String,
        required: true
    },
    seller: mongoose.SchemaTypes.Mixed,
    orderNumber: String,
    priceCurrency: String,
    price: Number,
    acceptedOffers: [mongoose.SchemaTypes.Mixed],
    url: String,
    orderStatus: String,
    paymentMethod: mongoose.SchemaTypes.Mixed,
    paymentMethodId: String,
    orderDate: Date,
    isGift: Boolean,
    discount: Number,
    discountCurrency: String,
    customer: mongoose.SchemaTypes.Mixed,
    orderInquiryKey: mongoose.SchemaTypes.Mixed
}, {
    collection: 'orders',
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
exports.default = mongoose.model('Order', schema);
