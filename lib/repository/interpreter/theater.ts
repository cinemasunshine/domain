/**
 * 劇場リポジトリ
 *
 * @class TheaterRepositoryInterpreter
 */

import * as monapt from 'monapt';
import * as mongoose from 'mongoose';
import Theater from '../../model/theater';
import TheaterRepository from '../theater';
import TheaterModel from './mongoose/model/theater';

export default class TheaterRepositoryInterpreter implements TheaterRepository {
    constructor(readonly connection: mongoose.Connection) {
    }

    public async findById(id: string) {
        const model = this.connection.model(TheaterModel.modelName, TheaterModel.schema);
        const theater = <Theater>await model.findOne({ _id: id }).lean().exec();

        return (theater) ? monapt.Option(theater) : monapt.None;
    }

    public async store(theater: Theater) {
        const model = this.connection.model(TheaterModel.modelName, TheaterModel.schema);
        await model.findOneAndUpdate({ _id: theater._id }, theater, {
            new: true,
            upsert: true
        }).lean().exec();
    }
}
