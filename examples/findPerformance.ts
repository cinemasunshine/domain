/* tslint:disable */
import * as mongoose from 'mongoose';
import * as sskts from '../lib/index';

async function main() {
    try {
        (<any>mongoose).Promise = global.Promise;
        const connection = mongoose.createConnection(process.env.MONGOLAB_URI);
        const performance = await sskts.service.master.findPerformance('11820170325162210101720')(sskts.adapter.performance(connection));
        console.log(performance);
    } catch (error) {
        console.error(error);
    }

    mongoose.disconnect();
}

main();
