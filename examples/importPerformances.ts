/* tslint:disable */
import * as mongoose from 'mongoose';
import * as sskts from '../lib/index';

async function main() {
    try {
        (<any>mongoose).Promise = global.Promise;
        const connection = mongoose.createConnection(process.env.MONGOLAB_URI);
        await sskts.service.master.importPerformances('118', '20170201', '20170401')(
            sskts.createFilmAdapter(connection),
            sskts.createScreenAdapter(connection),
            sskts.createPerformanceAdapter(connection)
        );
    } catch (error) {
        console.error(error);
    }

    mongoose.disconnect();
}

main();
