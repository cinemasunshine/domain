"use strict";
/**
 * 予約番号から取引をキャンセルするフロー
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const COA = require("@motionpicture/coa-service");
const GMO = require("@motionpicture/gmo-service");
const createDebug = require("debug");
const moment = require("moment");
const mongoose = require("mongoose");
const sskts = require("../lib/index");
const debug = createDebug('sskts-domain:examples:cancelTransactionByReserveNum');
// tslint:disable-next-line:max-func-body-length
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        mongoose.Promise = global.Promise;
        const connection = mongoose.createConnection(process.env.MONGOLAB_URI);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const assetAdapter = sskts.adapter.asset(connection);
        // まず照会
        const inquiryKey = {
            theater_code: '018',
            reserve_num: 170,
            tel: '0362778824'
        };
        const originalTransactionOption = yield sskts.service.transaction.makeInquiry(inquiryKey)(transactionAdapter);
        if (originalTransactionOption.isEmpty) {
            throw new Error('transaction not found');
        }
        const originalTransaction = originalTransactionOption.get();
        debug('originalTransaction found', originalTransaction);
        const authorizations = yield transactionAdapter.findAuthorizationsById(originalTransaction.id);
        debug('authorizations found', authorizations);
        // 所有者から興行へ座席返却のオーソリ
        const originalCOASeatReservationAuthorization = sskts.factory.authorization.coaSeatReservation.create(authorizations.find((authorization) => authorization.group === sskts.factory.authorizationGroup.COA_SEAT_RESERVATION));
        const originalGMOAuthorization = sskts.factory.authorization.gmo.create(authorizations.find((authorization) => authorization.group === sskts.factory.authorizationGroup.GMO));
        const anonymousOwner = sskts.factory.owner.anonymous.create(originalTransaction.owners.find((owner) => owner.group === sskts.factory.ownerGroup.ANONYMOUS));
        // 取引開始
        const transaction = sskts.factory.transaction.create({
            status: sskts.factory.transactionStatus.UNDERWAY,
            owners: originalTransaction.owners,
            // tslint:disable-next-line:no-magic-numbers
            expires_at: moment().add(10, 'minutes').toDate(),
            started_at: moment().toDate()
        });
        const transactionDoc = Object.assign({}, transaction, {
            _id: transaction.id,
            owners: transaction.owners.map((owner) => owner.id)
        });
        yield transactionAdapter.transactionModel.create(transactionDoc);
        debug('trasaction started', transaction);
        // 所有者を逆にして座席予約承認を作成する
        const coaSeatReservationAuthorization = sskts.factory.authorization.coaSeatReservation.create(Object.assign({}, originalCOASeatReservationAuthorization, {
            id: undefined,
            owner_from: originalCOASeatReservationAuthorization.owner_to,
            owner_to: originalCOASeatReservationAuthorization.owner_from
        }));
        debug('adding coaSeatReservationAuthorization...', coaSeatReservationAuthorization);
        // 興行から所有者へGMO金額変更のオーソリ
        const gmoAuthorization = sskts.factory.authorization.gmo.create(Object.assign({}, originalGMOAuthorization, {
            id: undefined,
            owner_from: originalGMOAuthorization.owner_to,
            owner_to: originalGMOAuthorization.owner_from
        }));
        debug('adding gmoAuthorization...', gmoAuthorization);
        // 通知を追加
        const emailNotification = sskts.factory.notification.email.create({
            from: 'noreply@ticket-cinemasunshine.com',
            to: anonymousOwner.email,
            subject: '予約取消完了',
            content: `${anonymousOwner.name_last} ${anonymousOwner.name_first} 様



-------------------------------------------------------------------

下記購入について、返金処理が完了いたしました。

またのご利用、心よりお待ちしております。

-------------------------------------------------------------------



◆購入番号 ：${inquiryKey.reserve_num}

◆合計金額 ：${gmoAuthorization.price}円



※このアドレスは送信専用です。返信はできませんのであらかじめご了承下さい。

-------------------------------------------------------------------

シネマサンシャイン

http://www.cinemasunshine.co.jp/

-------------------------------------------------------------------
`
        });
        yield sskts.service.transactionWithId.addEmail(transaction.id, emailNotification)(transactionAdapter);
        debug('notification added', emailNotification);
        // 取引成立
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, {
            status: sskts.factory.transactionStatus.CLOSED,
            closed_at: moment().toDate()
        }).exec();
        // 非同期でCOA本予約取消
        // COAから内容抽出
        const stateReserveResult = yield COA.ReserveService.stateReserve({
            theater_code: inquiryKey.theater_code,
            reserve_num: inquiryKey.reserve_num,
            tel_num: inquiryKey.tel
        });
        debug('stateReserve processed', stateReserveResult);
        if (stateReserveResult !== null) {
            // COA購入チケット取消
            debug('calling deleteReserve...');
            yield COA.ReserveService.delReserve({
                theater_code: inquiryKey.theater_code,
                reserve_num: inquiryKey.reserve_num,
                tel_num: inquiryKey.tel,
                date_jouei: stateReserveResult.date_jouei,
                title_code: stateReserveResult.title_code,
                title_branch_num: stateReserveResult.title_branch_num,
                time_begin: stateReserveResult.time_begin,
                list_seat: stateReserveResult.list_ticket
            });
            debug('COA delReserve processed');
        }
        // 非同期で資産削除
        yield Promise.all(coaSeatReservationAuthorization.assets.map((asset) => __awaiter(this, void 0, void 0, function* () {
            const removedAsset = yield assetAdapter.model.findByIdAndRemove(asset.id).exec();
            debug('asset removed', removedAsset);
        })));
        // 非同期でGMO金額変更実行
        // 手数料がかかるのであれば、ChangeTran、かからないのであれば、AlterTran
        // const SERVICE_CHARGE = 100;
        try {
            const alterTranResult = yield GMO.CreditService.alterTran({
                shopId: originalGMOAuthorization.gmo_shop_id,
                shopPass: originalGMOAuthorization.gmo_shop_pass,
                accessId: originalGMOAuthorization.gmo_access_id,
                accessPass: originalGMOAuthorization.gmo_access_pass,
                jobCd: GMO.Util.JOB_CD_VOID
            });
            debug('GMO alterTran processed', alterTranResult);
        }
        catch (error) {
            console.error('GMO alterTran processed', error);
        }
        // もとの取引を照会不可能にする
        yield transactionAdapter.transactionModel.findOneAndUpdate({
            _id: originalTransaction.id
        }, { $unset: { inquiry_key: '' } } // 照会キーフィールドを削除する
        ).exec();
        debug('inquiryKey disabled');
        // 非同期で通知送信
        mongoose.disconnect();
    });
}
main().then(() => {
    debug('success!');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
