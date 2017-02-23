/**
 * 在庫サービス
 *
 * @namespace StockService
 */

import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';
import Authorization from '../model/authorization';
import Transaction from '../model/transaction';
import TransactionStatus from '../model/transactionStatus';
import AssetRepository from '../repository/asset';
import TransactionRepository from '../repository/transaction';

const debug = createDebug('sskts-domain:service:stock');

/**
 * 資産承認解除(COA座席予約)
 *
 * @param {COASeatReservationAuthorization} authorization
 * @returns {COAOperation<void>}
 *
 * @memberOf StockServiceInterpreter
 */
export function unauthorizeCOASeatReservation(authorization: Authorization.COASeatReservationAuthorization) {
    return async (coaRepository: typeof COA) => {
        debug('calling deleteTmpReserve...');
        await coaRepository.deleteTmpReserveInterface.call({
            theater_code: authorization.coa_theater_code,
            date_jouei: authorization.coa_date_jouei,
            title_code: authorization.coa_title_code,
            title_branch_num: authorization.coa_title_branch_num,
            time_begin: authorization.coa_time_begin,
            tmp_reserve_num: authorization.coa_tmp_reserve_num
        });
    };
}

/**
 * 資産移動(COA座席予約)
 *
 * @param {COASeatReservationAuthorization} authorization
 * @returns {AssetOperation<void>}
 *
 * @memberOf StockServiceInterpreter
 */
export function transferCOASeatReservation(authorization: Authorization.COASeatReservationAuthorization) {
    return async (assetRepository: AssetRepository) => {

        // ウェブフロントで事前に本予約済みなので不要
        // await COA.updateReserveInterface.call({
        // });

        const promises = authorization.assets.map(async (asset) => {
            // 資産永続化
            debug('storing asset...', asset);
            await assetRepository.store(asset);
            debug('asset stored.');
        });

        await Promise.all(promises);
    };
}

/**
 * 取引照会を無効にする
 * COAのゴミ購入データを削除する
 *
 * @memberOf StockServiceInterpreter
 */
export function disableTransactionInquiry(transaction: Transaction) {
    return async (transactionRepository: TransactionRepository, coaRepository: typeof COA) => {
        if (!transaction.inquiry_key) {
            throw new Error('inquiry_key not created.');
        }

        // COAから内容抽出
        const reservation = await coaRepository.stateReserveInterface.call({
            theater_code: transaction.inquiry_key.theater_code,
            reserve_num: transaction.inquiry_key.reserve_num,
            tel_num: transaction.inquiry_key.tel
        });

        // COA購入チケット取消
        debug('calling deleteReserve...');
        await coaRepository.deleteReserveInterface.call({
            theater_code: transaction.inquiry_key.theater_code,
            reserve_num: transaction.inquiry_key.reserve_num,
            tel_num: transaction.inquiry_key.tel,
            date_jouei: reservation.date_jouei,
            title_code: reservation.title_code,
            title_branch_num: reservation.title_branch_num,
            time_begin: reservation.time_begin,
            list_seat: reservation.list_ticket
        });

        // 永続化
        const update = {
            $set: {
                inquiry_key: null
            }
        };
        debug('updating transaction...', update);
        await transactionRepository.findOneAndUpdate(
            {
                _id: transaction.id,
                status: TransactionStatus.UNDERWAY
            },
            update
        );
    };
}
