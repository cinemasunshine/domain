import * as mongoose from 'mongoose';

import MultilingualStringSchemaType from '../schemaTypes/multilingualString';

const safe: any = { j: 1, w: 'majority', wtimeout: 10000 };

/**
 * アプリケーションクライアントスキーマ
 */
const schema = new mongoose.Schema(
    {
        _id: String, // クライアントIDは適宜ユニークに命名する
        secretHash: {
            type: String,
            required: true
        },
        name: MultilingualStringSchemaType,
        description: MultilingualStringSchemaType,
        notes: MultilingualStringSchemaType,
        email: String
    },
    {
        collection: 'clients',
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

export default mongoose.model('Client', schema);
