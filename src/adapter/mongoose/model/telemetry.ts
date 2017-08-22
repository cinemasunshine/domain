import * as mongoose from 'mongoose';

const safe: any = { j: 1, w: 'majority', wtimeout: 10000 };

/**
 * 測定スキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema(
    {
        flow: {
            transactions: mongoose.Schema.Types.Mixed,
            tasks: mongoose.Schema.Types.Mixed,
            measured_from: Date,
            measured_to: Date

        },
        stock: {
            transactions: mongoose.Schema.Types.Mixed,
            tasks: mongoose.Schema.Types.Mixed,
            measured_at: Date
        }
    },
    {
        collection: 'telemetries',
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

// レポート参照時に使用
schema.index(
    { 'stock.measured_at': 1 }
);

export default mongoose.model('Telemetry', schema);
