import * as factory from '@motionpicture/sskts-factory';
import * as mongoose from 'mongoose';

import ClientEventModel from './mongoose/model/clientEvent';

/**
 * アプリケーションクライアントレポジトリー
 * @class respository.client
 */
export class MongoRepository {
    public readonly clientEventModel: typeof ClientEventModel;

    constructor(connection: mongoose.Connection) {
        this.clientEventModel = connection.model(ClientEventModel.modelName);
    }

    public async pushEvent(clientAttributes: factory.clientEvent.IAttributes): Promise<factory.clientEvent.IClientEvent> {
        // tslint:disable-next-line:no-suspicious-comment
        // TODO クライアントの存在確認?

        // ドキュメント作成(idが既に存在していればユニーク制約ではじかれる)
        return this.clientEventModel.create(clientAttributes).then((doc) => <factory.clientEvent.IClientEvent>doc.toObject());
    }
}
