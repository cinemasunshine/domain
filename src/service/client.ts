/**
 * アプリケーションクライアントサービス
 *
 * @namespace service/client
 */

import * as factory from '@motionpicture/sskts-factory';
import * as bcrypt from 'bcryptjs';
import * as createDebug from 'debug';

import ArgumentError from '../error/argument';

import ClientAdapter from '../adapter/client';

const debug = createDebug('sskts-domain:service:client');

export type ClientOperation<T> = (clientAdapter: ClientAdapter) => Promise<T>;

export interface ICreateArgs {
    /**
     * ID
     */
    id: string;
    /**
     * シークレット
     */
    secret: string;
    /**
     * 名称
     */
    name: factory.multilingualString;
    /**
     * 説明
     */
    description: factory.multilingualString;
    /**
     * 備考
     */
    notes: factory.multilingualString;
    /**
     * メールアドレス
     */
    email: string;
}

/**
 * クライアントを更新する
 *
 * @param {clientFactory.IClient} args クライアントインターフェース
 * @returns {ClientOperation<void>} クライアントアダプターを使った操作
 */
export function create(args: ICreateArgs): ClientOperation<void> {
    return async (clientAdapter: ClientAdapter) => {
        // シークレットをハッシュ化
        const SALT_LENGTH = 8;
        const hash = await bcrypt.hash(args.secret, SALT_LENGTH);

        const client = factory.client.create({
            id: args.id,
            secret_hash: hash,
            name: args.name,
            description: args.description,
            notes: args.notes,
            email: args.email
        });
        debug('creating a client...', client);

        // ドキュメント作成(idが既に存在していればユニーク制約ではじかれる)
        await clientAdapter.clientModel.findByIdAndUpdate(client.id, client, { upsert: true }).exec();
    };
}

export interface IPushEventArgs {
    client: string;
    occurredAt: Date;
    url?: string;
    label: string;
    category?: string;
    action?: string;
    message?: string;
    notes?: string;
    useragent?: string;
    location?: number[];
    transaction?: string;
}

export function pushEvent(args: IPushEventArgs): ClientOperation<factory.clientEvent.IClientEvent> {
    return async (clientAdapter: ClientAdapter) => {
        // クライアントの存在確認
        const clientDoc = await clientAdapter.clientModel.findById(args.client, '_id').exec();
        if (clientDoc === null) {
            throw new ArgumentError('client', `client[${args.client}] not found.`);
        }

        // イベント作成
        const clientEvent = factory.clientEvent.create(args);
        debug('creating a clientEvent...', clientEvent);

        // ドキュメント作成(idが既に存在していればユニーク制約ではじかれる)
        await clientAdapter.clientEventModel.findByIdAndUpdate(clientEvent.id, clientEvent, { upsert: true }).exec();

        return clientEvent;
    };
}
