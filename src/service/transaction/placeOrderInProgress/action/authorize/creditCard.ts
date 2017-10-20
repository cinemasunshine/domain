/**
 * クレジットカード承認アクションサービス
 * @namespace service.transaction.placeOrderInProgress.action.authorize.creditCard
 */

import * as GMO from '@motionpicture/gmo-service';
import * as factory from '@motionpicture/sskts-factory';
import * as createDebug from 'debug';

import { MongoRepository as CreditCardAuthorizeActionRepo } from '../../../../../repo/action/authorize/creditCard';
import { MongoRepository as OrganizationRepo } from '../../../../../repo/organization';
import { MongoRepository as TransactionRepo } from '../../../../../repo/transaction';

const debug = createDebug('sskts-domain:service:transaction:placeOrderInProgress:action:authorize:creditCard');

export type IActionAndOrganizationAndTransactionOperation<T> = (
    creditCardAuthorizeActionRepo: CreditCardAuthorizeActionRepo,
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
): IActionAndOrganizationAndTransactionOperation<factory.action.authorize.creditCard.IAction> {
    // tslint:disable-next-line:max-func-body-length
    return async (
        creditCardAuthorizeActionRepo: CreditCardAuthorizeActionRepo,
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
        const action = await creditCardAuthorizeActionRepo.start(
            transaction.agent,
            transaction.seller,
            {
                transactionId: transactionId,
                orderId: orderId,
                amount: amount,
                method: method,
                payType: GMO.utils.util.PayType.Credit
            }
        );

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
                ...{
                    accessId: entryTranResult.accessId,
                    accessPass: entryTranResult.accessPass,
                    orderId: orderId,
                    method: method,
                    siteId: <string>process.env.GMO_SITE_ID,
                    sitePass: <string>process.env.GMO_SITE_PASS
                },
                ...creditCard,
                ...{
                    seqMode: GMO.utils.util.SeqMode.Physics
                }
            };
            execTranResult = await GMO.services.credit.execTran(execTranArgs);
            debug('execTranResult:', execTranResult);
        } catch (error) {
            // actionにエラー結果を追加
            try {
                await creditCardAuthorizeActionRepo.giveUp(action.id, error);
            } catch (__) {
                // 失敗したら仕方ない
            }

            if (error.name === 'GMOServiceBadRequestError') {
                // consider E92000001,E92000002
                // GMO流量制限オーバーエラーの場合
                const serviceUnavailableError = error.errors.find((gmoError: any) => gmoError.info.match(/^E92000001|E92000002$/));
                if (serviceUnavailableError !== undefined) {
                    throw new factory.errors.ServiceUnavailable(serviceUnavailableError.userMessage);
                }

                // オーダーID重複エラーの場合
                const duplicateError = error.errors.find((gmoError: any) => gmoError.info.match(/^E01040010$/));
                if (duplicateError !== undefined) {
                    throw new factory.errors.AlreadyInUse('action.object', ['orderId'], duplicateError.userMessage);
                }

                console.error('action.authorize.creditCard.create() threw', error);

                // その他のGMOエラーに場合、なんらかのクライアントエラー
                throw new factory.errors.Argument('payment');
            }

            console.error('action.authorize.creditCard.create() threw', error);

            throw new Error(error);
        }

        // アクションを完了
        debug('ending authorize action...');

        return await creditCardAuthorizeActionRepo.complete(
            action.id,
            {
                price: amount,
                entryTranArgs: entryTranArgs,
                execTranArgs: execTranArgs,
                execTranResult: execTranResult
            }
        );
    };
}

export function cancel(
    agentId: string,
    transactionId: string,
    actionId: string
) {
    return async (creditCardAuthorizeActionRepo: CreditCardAuthorizeActionRepo, transactionRepo: TransactionRepo) => {
        const transaction = await transactionRepo.findPlaceOrderInProgressById(transactionId);

        if (transaction.agent.id !== agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        const action = await creditCardAuthorizeActionRepo.cancel(actionId, transactionId);
        const actionResult = <factory.action.authorize.creditCard.IResult>action.result;

        // オーソリ取消
        // 現時点では、ここで失敗したらオーソリ取消をあきらめる
        // リトライするには処理を非同期に変更する必要あり
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
            console.error('cancelCreditCardAuth threw', error);
            // tslint:disable-next-line:no-suspicious-comment
            // TODO GMO混雑エラーを判別(取消処理でも混雑エラーが発生することは確認済)
        }
    };
}
