/**
 * 会員サービス
 *
 * @namespace service/member
 */

import * as bcrypt from 'bcryptjs';
import * as createDebug from 'debug';
import * as monapt from 'monapt';

import ArgumentError from '../error/argument';

import AssetAdapter from '../adapter/asset';
import OwnerAdapter from '../adapter/owner';

import * as SeatReservationAssetFactory from '../factory/asset/seatReservation';
import AssetGroup from '../factory/assetGroup';
import * as GMOCardFactory from '../factory/card/gmo';
import * as MemberOwnerFactory from '../factory/owner/member';
import OwnerGroup from '../factory/ownerGroup';

const debug = createDebug('sskts-domain:service:member');

export type IOwnerOperation<T> = (ownerAdapter: OwnerAdapter) => Promise<T>;
export type IAssetAndOwnerOperation<T> = (assetAdapter: AssetAdapter, ownerAdapter: OwnerAdapter) => Promise<T>;

export function login(username: string, password: string): IOwnerOperation<monapt.Option<MemberOwnerFactory.IUnhashedFields>> {
    return async (ownerAdapter: OwnerAdapter) => {
        // ユーザーネームで検索
        const memberOwnerDoc = await ownerAdapter.model.findOne({
            username: username,
            group: OwnerGroup.MEMBER
        }).exec();
        debug('member owner doc found', memberOwnerDoc);

        if (memberOwnerDoc === null) {
            return monapt.None;
        }

        // パスワード整合性確認
        debug('comparing passwords...');
        if (!await bcrypt.compare(password, memberOwnerDoc.get('password_hash'))) {
            return monapt.None;
        }

        const memberOwner = <MemberOwnerFactory.IMemberOwner>memberOwnerDoc.toObject();
        // ハッシュ化パスワードは返さない
        delete memberOwner.password_hash;

        return monapt.Option(memberOwner);
    };
}

export function updateProfile(ownerId: string, update: MemberOwnerFactory.IVariableFields): IOwnerOperation<void> {
    return async (ownerAdapter: OwnerAdapter) => {
        const memberOwnerDoc = await ownerAdapter.model.findByIdAndUpdate(ownerId, update).exec();
        if (memberOwnerDoc === null) {
            throw new ArgumentError('ownerId', `owner[id:${ownerId}] not found`);
        }
    };
}

export function addCard(ownerId: string, card: GMOCardFactory.IGMOCardRaw | GMOCardFactory.IGMOCardTokenized): IOwnerOperation<void> {
    return async (ownerAdapter: OwnerAdapter) => {
        // 会員存在確認
        const memberOwnerDoc = await ownerAdapter.model.findById(ownerId, '_id').exec();
        debug('member owner doc found', memberOwnerDoc);

        // GMOカード登録
        debug('saving a card to GMO...', card);
    };
}

export function removeCard(ownerId: string, cardSeq: string): IOwnerOperation<void> {
    return async (ownerAdapter: OwnerAdapter) => {
        // 会員存在確認
        const memberOwnerDoc = await ownerAdapter.model.findById(ownerId, '_id').exec();
        debug('member owner doc found', memberOwnerDoc);

        // GMOカード登録
        debug('removing a card from GMO...cardSeq:', cardSeq);
    };
}

export function findSeatReservationAssets(ownerId: string): IAssetAndOwnerOperation<SeatReservationAssetFactory.ISeatReservationAsset[]> {
    return async (assetAdapter: AssetAdapter, ownerAdapter: OwnerAdapter) => {
        // 会員存在確認
        const memberOwnerDoc = await ownerAdapter.model.findById(ownerId, '_id').exec();
        debug('member owner doc found', memberOwnerDoc);

        // 資産検索
        const assets = await assetAdapter.model.find({
            group: AssetGroup.SEAT_RESERVATION,
            owner: ownerId
        }).lean().exec();

        return <SeatReservationAssetFactory.ISeatReservationAsset[]>assets;
    };
}
