/**
 * クレジットカード承認アクションサービス
 * @namespace service.transaction.placeOrderInProgress.action.authorize.creditCard
 */

import * as GMO from '@motionpicture/gmo-service';
import * as factory from '@motionpicture/sskts-factory';
import * as createDebug from 'debug';

import { MongoRepository as ActionRepo } from '../../../../../repo/action';
import { MongoRepository as OrganizationRepo } from '../../../../../repo/organization';
import { MongoRepository as TransactionRepo } from '../../../../../repo/transaction';

const debug = createDebug('sskts-domain:service:transaction:placeOrderInProgress:action:authorize:creditCard');

export type ICreateOperation<T> = (
    actionRepo: ActionRepo,
    organizationRepo: OrganizationRepo,
    transactionRepo: TransactionRepo
) => Promise<T>;

/**
 * オーソリを取得するクレジットカード情報インターフェース
 */
export type ICreditCard4authorizeAction =
    factory.paymentMethod.paymentCard.creditCard.IUncheckedCardRaw |
    factory.paymentMethod.paymentCard.creditCard.IUncheckedCardTokenized |
    factory.paymentMethod.paymentCard.creditCard.IUnauthorizedCardOfMember;

/**
 * クレジットカードオーソリ取得
 */
export function create(
    agentId: string,
    transactionId: string,
    orderId: string,
    amount: number,
    method: GMO.utils.util.Method,
    creditCard: ICreditCard4authorizeAction
): ICreateOperation<factory.action.authorize.creditCard.IAction> {
    // tslint:disable-next-line:max-func-body-length
    return async (
        actionRepo: ActionRepo,
        organizationRepo: OrganizationRepo,
        transactionRepo: TransactionRepo
    ) => {
        const transaction = await transactionRepo.findPlaceOrderInProgressById(transactionId);

        if (transaction.agent.id !== agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        // GMOショップ情報取得
        const movieTheater = await organizationRepo.findMovieTheaterById(transaction.seller.id);

        // 承認アクションを開始する
        const actionAttributes = factory.action.authorize.creditCard.createAttributes({
            object: {
                typeOf: factory.action.authorize.authorizeActionPurpose.CreditCard,
                transactionId: transactionId,
                orderId: orderId,
                amount: amount,
                method: method,
                payType: GMO.utils.util.PayType.Credit
            },
            agent: transaction.agent,
            recipient: transaction.seller,
            purpose: transaction // purposeは取引
        });
        const action = await actionRepo.start<factory.action.authorize.creditCard.IAction>(actionAttributes);

        // GMOオーソリ取得
        let entryTranArgs: GMO.services.credit.IEntryTranArgs;
        let execTranArgs: GMO.services.credit.IExecTranArgs;
        let entryTranResult: GMO.services.credit.IEntryTranResult;
        let execTranResult: GMO.services.credit.IExecTranResult;
        try {
            entryTranArgs = {
                shopId: movieTheater.gmoInfo.shopId,
                shopPass: movieTheater.gmoInfo.shopPass,
                orderId: orderId,
                jobCd: GMO.utils.util.JobCd.Auth,
                amount: amount
            };
            entryTranResult = await GMO.services.credit.entryTran(entryTranArgs);
            debug('entryTranResult:', entryTranResult);

            execTranArgs = {
                accessId: entryTranResult.accessId,
                accessPass: entryTranResult.accessPass,
                orderId: orderId,
                method: method,
                siteId: <string>process.env.GMO_SITE_ID,
                sitePass: <string>process.env.GMO_SITE_PASS,
                cardNo: (<factory.paymentMethod.paymentCard.creditCard.IUncheckedCardRaw>creditCard).cardNo,
                cardPass: (<factory.paymentMethod.paymentCard.creditCard.IUncheckedCardRaw>creditCard).cardPass,
                expire: (<factory.paymentMethod.paymentCard.creditCard.IUncheckedCardRaw>creditCard).expire,
                token: (<factory.paymentMethod.paymentCard.creditCard.IUncheckedCardTokenized>creditCard).token,
                memberId: (<factory.paymentMethod.paymentCard.creditCard.IUnauthorizedCardOfMember>creditCard).memberId,
                cardSeq: (<factory.paymentMethod.paymentCard.creditCard.IUnauthorizedCardOfMember>creditCard).cardSeq,
                seqMode: GMO.utils.util.SeqMode.Physics
            };
            execTranResult = await GMO.services.credit.execTran(execTranArgs);
            debug('execTranResult:', execTranResult);
        } catch (error) {
            // actionにエラー結果を追加
            try {
                const actionError = (error instanceof Error) ? { ...error, ...{ message: error.message } } : error;
                await actionRepo.giveUp(action.typeOf, action.id, actionError);
            } catch (__) {
                // 失敗したら仕方ない
            }

            if (error.name === 'GMOServiceBadRequestError') {
                // consider E92000001,E92000002
                // GMO流量制限オーバーエラーの場合
                const serviceUnavailableError = error.errors.find((gmoError: any) => gmoError.info.match(/^E92000001|E92000002$/));
                if (serviceUnavailableError !== undefined) {
                    throw new factory.errors.RateLimitExceeded(serviceUnavailableError.userMessage);
                }

                // オーダーID重複エラーの場合
                const duplicateError = error.errors.find((gmoError: any) => gmoError.info.match(/^E01040010$/));
                if (duplicateError !== undefined) {
                    throw new factory.errors.AlreadyInUse('action.object', ['orderId'], duplicateError.userMessage);
                }

                // その他のGMOエラーに場合、なんらかのクライアントエラー
                throw new factory.errors.Argument('payment');
            }

            throw new Error(error);
        }

        // アクションを完了
        debug('ending authorize action...');

        const result: factory.action.authorize.creditCard.IResult = {
            price: amount,
            entryTranArgs: entryTranArgs,
            execTranArgs: execTranArgs,
            execTranResult: execTranResult
        };

        return actionRepo.complete<factory.action.authorize.creditCard.IAction>(action.typeOf, action.id, result);
    };
}

export function cancel(
    agentId: string,
    transactionId: string,
    actionId: string
) {
    return async (actionRepo: ActionRepo, transactionRepo: TransactionRepo) => {
        const transaction = await transactionRepo.findPlaceOrderInProgressById(transactionId);

        if (transaction.agent.id !== agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        const action = await actionRepo.cancel(factory.actionType.AuthorizeAction, actionId);
        const actionResult = <factory.action.authorize.creditCard.IResult>action.result;

        // オーソリ取消
        // 現時点では、ここで失敗したらオーソリ取消をあきらめる
        // GMO混雑エラーはここでも発生する(取消処理でも混雑エラーが発生することは確認済)
        try {
            await GMO.services.credit.alterTran({
                shopId: actionResult.entryTranArgs.shopId,
                shopPass: actionResult.entryTranArgs.shopPass,
                accessId: actionResult.execTranArgs.accessId,
                accessPass: actionResult.execTranArgs.accessPass,
                jobCd: GMO.utils.util.JobCd.Void
            });
            debug('alterTran processed', GMO.utils.util.JobCd.Void);
        } catch (error) {
            // no op
        }
    };
}
