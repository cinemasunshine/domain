/**
 * 映画作品インポートサンプル
 *
 * @ignore
 */

import * as mongoose from 'mongoose';
import * as sskts from '../lib/index';

async function main() {
    try {
        (<any>mongoose).Promise = global.Promise;
        const connection = mongoose.createConnection(process.env.MONGOLAB_URI);
        await sskts.service.creativeWork.importMovies('118')(
            sskts.adapter.creativeWork(connection)
        );
    } catch (error) {
        console.error(error);
    }

    mongoose.disconnect();
}

main();
