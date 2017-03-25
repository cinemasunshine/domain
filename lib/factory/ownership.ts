/**
 * 所有権ファクトリー
 * 誰が、何を、所有するのか
 *
 * @namespace AssetFactory
 */
import * as validator from 'validator';

import ArgumentNullError from '../error/argumentNull';

import ObjectId from './objectId';

/**
 * 所有権インターフェース
 *
 * @param {string} id
 * @param {string} owner 所有者
 * @param {boolean} authenticated 認証済みかどうか
 */
export interface IOwnership {
    id: string;
    owner: string;
    authenticated: boolean;
}

export function create(args: {
    id?: string,
    owner: string,
    authenticated: boolean
}): IOwnership {
    if (validator.isEmpty(args.owner)) throw new ArgumentNullError('owner');

    return {
        id: (args.id === undefined) ? ObjectId().toString() : args.id,
        owner: args.owner,
        authenticated: args.authenticated
    };
}
