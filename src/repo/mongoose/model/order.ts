import * as mongoose from 'mongoose';

const safe: any = { j: 1, w: 'majority', wtimeout: 10000 };

/**
 * 注文スキーマ
 * @ignore
 */
const schema = new mongoose.Schema(
    {
        typeOf: {
            type: String,
            required: true
        },
        seller: mongoose.SchemaTypes.Mixed,
        customer: mongoose.SchemaTypes.Mixed,
        confirmationNumber: String,
        orderNumber: String,
        price: Number,
        priceCurrency: String,
        acceptedOffers: [mongoose.SchemaTypes.Mixed],
        paymentMethods: [mongoose.SchemaTypes.Mixed],
        discounts: [mongoose.SchemaTypes.Mixed],
        url: String,
        orderStatus: String,
        orderDate: Date,
        isGift: Boolean,
        orderInquiryKey: mongoose.SchemaTypes.Mixed
    },
    {
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
    }
);

// 注文番号からの注文取得に使用
schema.index(
    { orderNumber: 1 }
);

// 注文番号はユニークなはず
schema.index(
    { orderNumber: 1 },
    { unique: true }
);

export default mongoose.model('Order', schema);
