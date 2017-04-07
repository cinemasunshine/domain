import * as mongoose from 'mongoose';

/**
 * 所有者スキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema(
    {
        group: String,

        name_first: String,
        name_last: String,
        email: String,
        tel: String,

        name: {
            ja: String,
            en: String
        }
    },
    {
        collection: 'owners',
        id: true,
        read: 'primaryPreferred',
        safe: <any>{ j: 1, w: 'majority', wtimeout: 10000 },
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

// 所有者を特定する時に使用
schema.index(
    { group: 1 }
);

export default mongoose.model('Owner', schema);