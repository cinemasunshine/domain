/**
 * 資産リポジトリ
 *
 * @class AssetAdapterInterpreter
 */

import * as clone from 'clone';
import { Connection } from 'mongoose';
import * as Asset from '../../factory/asset';
import AssetAdapter from '../asset';
import assetModel from './mongoose/model/asset';

export default class AssetAdapterInterpreter implements AssetAdapter {
    private model: typeof assetModel;

    constructor(readonly connection: Connection) {
        this.model = this.connection.model(assetModel.modelName);
    }

    public async store(asset: Asset.IAsset) {
        const update = clone(asset, false);
        await this.model.findByIdAndUpdate(update.id, update, {
            new: true,
            upsert: true
        }).lean().exec();
    }
}
