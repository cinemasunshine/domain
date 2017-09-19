import { Connection } from 'mongoose';
import filmModel from './mongoose/model/film';

/**
 * 作品レポジトリー
 *
 * @class FilmAdapter
 */
export default class FilmAdapter {
    public readonly model: typeof filmModel;

    constructor(connection: Connection) {
        this.model = connection.model(filmModel.modelName);
    }
}
