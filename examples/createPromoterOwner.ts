/**
 * 興行所有者作成
 *
 * @ignore
 */
import * as createDebug from 'debug';
import * as mongoose from 'mongoose';
import * as sskts from '../lib/index';

const debug = createDebug('sskts-domain:examples');

(<any>mongoose).Promise = global.Promise;
mongoose.connect(process.env.MONGOLAB_URI);

async function main() {
    const ownerAdapter = sskts.adapter.owner(mongoose.connection);

    const owner = sskts.factory.owner.promoter.create({
        name: {
            ja: '佐々木興業株式会社',
            en: 'Cinema Sunshine Co., Ltd.'
        },
    });
    await ownerAdapter.model.findByIdAndUpdate(owner.id, owner, { new: true, upsert: true });

    mongoose.disconnect();
}

main().then(() => {
    debug('success!');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
