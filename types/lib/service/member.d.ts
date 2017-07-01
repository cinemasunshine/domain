import * as monapt from 'monapt';
import AssetAdapter from '../adapter/asset';
import OwnerAdapter from '../adapter/owner';
import * as SeatReservationAssetFactory from '../factory/asset/seatReservation';
import * as GMOCardFactory from '../factory/card/gmo';
import * as MemberOwnerFactory from '../factory/owner/member';
export declare type IOperation<T> = () => Promise<T>;
export declare type IAssetOperation<T> = (assetAdapter: AssetAdapter) => Promise<T>;
export declare type IOwnerOperation<T> = (ownerAdapter: OwnerAdapter) => Promise<T>;
export declare type IAssetAndOwnerOperation<T> = (assetAdapter: AssetAdapter, ownerAdapter: OwnerAdapter) => Promise<T>;
export interface ILoginResult {
    id: string;
    username: string;
}
/**
 * 新規登録
 *
 * @export
 * @param {MemberOwnerFactory.IMemberOwner} owner 会員所有者
 * @returns {IOwnerOperation<void>} 結果を取得する操作
 */
export declare function signUp(owner: MemberOwnerFactory.IOwner): IOwnerOperation<void>;
/**
 * ログイン
 *
 * @export
 * @param {string} username ユーザーネーム
 * @param {string} password パスワード
 * @returns {IOwnerOperation<monapt.Option<MemberOwnerFactory.IUnhashedFields>>} 所有者に対する操作
 * @memberof service/member
 */
export declare function login(username: string, password: string): IOwnerOperation<monapt.Option<ILoginResult>>;
/**
 * プロフィール取得
 *
 * @export
 * @param {string} ownerId 所有者ID
 * @returns {IOwnerOperation<monapt.Option<MemberOwnerFactory.IUnhashedFields>>} 会員のハッシュ化されていないフィールドを取得するための、所有者に対する操作
 */
export declare function getProfile(ownerId: string): IOwnerOperation<monapt.Option<MemberOwnerFactory.IUnhashedFields>>;
/**
 * プロフィール更新
 * 更新フィールドを全て上書きするので注意
 *
 * @export
 * @param {string} ownerId 所有者ID
 * @param {MemberOwnerFactory.IVariableFields} update 更新フィールド
 * @returns {IOwnerOperation<void>} 所有者に対する操作
 * @memberof service/member
 */
export declare function updateProfile(ownerId: string, update: MemberOwnerFactory.IVariableFields): IOwnerOperation<void>;
/**
 * カードを追加する
 *
 * @export
 * @param {string} ownerId 所有者ID
 * @param {(GMOCardFactory.IGMOCardRaw | GMOCardFactory.IGMOCardTokenized)} card GMOカードオブジェクト
 * @returns {IOperation<GMOCardFactory.ICheckedCard>} 登録後カードを返す操作
 * @memberof service/member
 */
export declare function addCard(ownerId: string, card: GMOCardFactory.IUncheckedCardRaw | GMOCardFactory.IUncheckedCardTokenized): IOperation<GMOCardFactory.ICheckedCard>;
/**
 * カード削除
 *
 * @export
 * @param {string} ownerId 所有者ID
 * @param {string} cardId カードID
 * @returns {IOperation<void>} 操作
 * @memberof service/member
 */
export declare function removeCard(ownerId: string, cardId: string): IOperation<void>;
/**
 * 会員カード検索
 *
 * @export
 * @param {string} ownerId 所有者ID
 * @returns {IOperation<GMOCardFactory.ICheckedCard[]>} カードリストを取得する操作
 * @memberof service/member
 */
export declare function findCards(ownerId: string): IOperation<GMOCardFactory.ICheckedCard[]>;
/**
 * 会員の座席予約資産を検索する
 *
 * @export
 * @param {string} ownerId 所有者ID
 * @returns {IAssetOperation<SeatReservationAssetFactory.ISeatReservationAsset[]>} 資産に対する操作
 * @memberof service/member
 */
export declare function findSeatReservationAssets(ownerId: string): IAssetOperation<SeatReservationAssetFactory.IAsset[]>;
