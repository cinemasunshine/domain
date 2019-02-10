/**
 * 口座決済承認アクションサービス
 */
import { pecorinoapi } from '@cinerino/domain';
import * as createDebug from 'debug';
import * as moment from 'moment';

import * as factory from '../../../../../../factory';
import { MongoRepository as ActionRepo } from '../../../../../../repo/action';
import { MongoRepository as OwnershipInfoRepo } from '../../../../../../repo/ownershipInfo';
import { MongoRepository as SellerRepo } from '../../../../../../repo/seller';
import { MongoRepository as TransactionRepo } from '../../../../../../repo/transaction';

import { handlePecorinoError } from '../../../../../../errorHandler';

const debug = createDebug('cinerino-domain:service');

export type ICreateOperation<T> = (repos: {
    action: ActionRepo;
    ownershipInfo: OwnershipInfoRepo;
    seller: SellerRepo;
    transaction: TransactionRepo;
    withdrawTransactionService?: pecorinoapi.service.transaction.Withdraw;
    transferTransactionService?: pecorinoapi.service.transaction.Transfer;
}) => Promise<T>;

/**
 * 口座残高差し押さえ
 * 口座取引は、出金取引あるいは転送取引のどちらかを選択できます。
 */
export function create<T extends factory.accountType>(params: {
    object: factory.action.authorize.paymentMethod.account.IObject<T> & {
        fromAccount: factory.action.authorize.paymentMethod.account.IAccount<T>;
    };
    agent: { id: string };
    transaction: { id: string };
}): ICreateOperation<factory.action.authorize.paymentMethod.account.IAction<T>> {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        action: ActionRepo;
        ownershipInfo: OwnershipInfoRepo;
        seller: SellerRepo;
        transaction: TransactionRepo;
        /**
         * 出金取引サービス
         */
        withdrawTransactionService?: pecorinoapi.service.transaction.Withdraw;
        /**
         * 転送取引サービス
         */
        transferTransactionService?: pecorinoapi.service.transaction.Transfer;
    }) => {
        const now = new Date();

        const transaction = await repos.transaction.findInProgressById({
            typeOf: factory.transactionType.PlaceOrder,
            id: params.transaction.id
        });

        // 他者口座による決済も可能にするためにコメントアウト
        // 基本的に、自分の口座のオーソリを他者に与えても得しないので、
        // これが問題になるとすれば、本当にただサービスを荒らしたい悪質な攻撃のみ、ではある
        // if (transaction.agent.id !== agentId) {
        //     throw new factory.errors.Forbidden('A specified transaction is not yours.');
        // }

        // インセンティブ付与可能条件は、会員プログラム特典に加入しているかどうか
        if (transaction.agent.memberOf === undefined) {
            throw new factory.errors.Forbidden('Membership required');
        }
        const programMemberships = await repos.ownershipInfo.search<factory.programMembership.ProgramMembershipType>({
            typeOfGood: {
                typeOf: 'ProgramMembership'
            },
            ownedBy: { id: transaction.agent.id },
            ownedFrom: now,
            ownedThrough: now
        });
        const pecorinoPaymentAward = programMemberships.reduce((a, b) => [...a, ...b.typeOfGood.award], [])
            .find((a) => a === factory.programMembership.Award.PecorinoPayment);
        if (pecorinoPaymentAward === undefined) {
            throw new factory.errors.Forbidden('Membership program requirements not satisfied');
        }

        // 承認アクションを開始する
        const actionAttributes: factory.action.authorize.paymentMethod.account.IAttributes<T> = {
            typeOf: factory.actionType.AuthorizeAction,
            object: params.object,
            agent: transaction.agent,
            recipient: transaction.seller,
            purpose: { typeOf: transaction.typeOf, id: transaction.id }
        };
        const action = await repos.action.start(actionAttributes);

        // Pecorino取引開始
        let pendingTransaction: factory.action.authorize.paymentMethod.account.IPendingTransaction<T>;
        try {
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else *//* istanbul ignore next */
            if (repos.withdrawTransactionService !== undefined) {
                debug('starting pecorino pay transaction...', params.object.amount);
                pendingTransaction = await repos.withdrawTransactionService.start({
                    // 最大1ヵ月のオーソリ
                    expires: moment()
                        .add(1, 'month')
                        .toDate(),
                    agent: {
                        typeOf: transaction.agent.typeOf,
                        id: transaction.agent.id,
                        name: `sskts-transaction-${transaction.id}`,
                        url: transaction.agent.url
                    },
                    recipient: {
                        typeOf: transaction.seller.typeOf,
                        id: transaction.seller.id,
                        name: transaction.seller.name.ja,
                        url: transaction.seller.url
                    },
                    amount: params.object.amount,
                    notes: (params.object.notes !== undefined) ? params.object.notes : 'シネマサンシャイン 注文取引',
                    accountType: params.object.fromAccount.accountType,
                    fromAccountNumber: params.object.fromAccount.accountNumber
                });
                debug('Acount transaction started.', pendingTransaction.id);
            } else if (repos.transferTransactionService !== undefined) {
                // 組織から転送先口座IDを取得する
                const seller = await repos.seller.findById({
                    id: transaction.seller.id
                });
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore if */
                if (seller.paymentAccepted === undefined) {
                    throw new factory.errors.Argument('transaction', 'Pecorino payment not accepted.');
                }
                const accountPaymentsAccepted = <factory.seller.IPaymentAccepted<factory.paymentMethodType.Account>[]>
                    seller.paymentAccepted.filter((a) => a.paymentMethodType === factory.paymentMethodType.Account);
                const paymentAccepted = accountPaymentsAccepted.find((a) => a.accountType === params.object.fromAccount.accountType);
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore if */
                if (paymentAccepted === undefined) {
                    throw new factory.errors.Argument('transaction', `${params.object.fromAccount.accountType} payment not accepted`);
                }

                debug('starting pecorino pay transaction...', params.object.amount);
                pendingTransaction = await repos.transferTransactionService.start({
                    // 最大1ヵ月のオーソリ
                    expires: moment()
                        .add(1, 'month')
                        .toDate(),
                    agent: {
                        typeOf: transaction.agent.typeOf,
                        id: transaction.agent.id,
                        name: `sskts-transaction-${transaction.id}`,
                        url: transaction.agent.url
                    },
                    recipient: {
                        typeOf: transaction.seller.typeOf,
                        id: transaction.seller.id,
                        name: transaction.seller.name.ja,
                        url: transaction.seller.url
                    },
                    amount: params.object.amount,
                    // tslint:disable-next-line:no-single-line-block-comment
                    notes: (params.object.notes !== undefined) ? /* istanbul ignore next */ params.object.notes : 'シネマサンシャイン 注文取引',
                    accountType: params.object.fromAccount.accountType,
                    fromAccountNumber: params.object.fromAccount.accountNumber,
                    toAccountNumber: paymentAccepted.accountNumber
                });
                debug('Acount transaction started.', pendingTransaction.id);
            } else {
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore next */
                throw new factory.errors.Argument('repos', 'withdrawTransactionService or transferTransactionService required.');
            }
        } catch (error) {
            // actionにエラー結果を追加
            try {
                // tslint:disable-next-line:max-line-length no-single-line-block-comment
                const actionError = { ...error, name: error.name, message: error.message };
                await repos.action.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
            } catch (__) {
                // 失敗したら仕方ない
            }

            // PecorinoAPIのエラーｗｐハンドリング
            error = handlePecorinoError(error);
            throw error;
        }

        // アクションを完了
        debug('ending authorize action...');
        const actionResult: factory.action.authorize.paymentMethod.account.IResult<T> = {
            accountId: params.object.fromAccount.accountNumber,
            amount: params.object.amount,
            paymentMethod: factory.paymentMethodType.Account,
            paymentStatus: factory.paymentStatusType.PaymentDue,
            paymentMethodId: params.object.fromAccount.accountNumber,
            name: params.object.fromAccount.accountType,
            fromAccount: params.object.fromAccount,
            additionalProperty: params.object.additionalProperty,
            pendingTransaction: pendingTransaction,
            totalPaymentDue: {
                typeOf: 'MonetaryAmount',
                currency: factory.priceCurrency.JPY,
                value: params.object.amount
            }
        };

        return repos.action.complete({ typeOf: action.typeOf, id: action.id, result: actionResult });
    };
}

/**
 * 口座承認を取り消す
 */
export function cancel(params: {
    /**
     * 承認アクションID
     */
    id: string;
    /**
     * 取引進行者
     */
    agent: { id: string };
    /**
     * 取引
     */
    transaction: { id: string };
}) {
    return async (repos: {
        action: ActionRepo;
        transaction: TransactionRepo;
        withdrawTransactionService?: pecorinoapi.service.transaction.Withdraw;
        transferTransactionService?: pecorinoapi.service.transaction.Transfer;
    }) => {
        debug('canceling pecorino authorize action...');
        const transaction = await repos.transaction.findInProgressById({
            typeOf: factory.transactionType.PlaceOrder,
            id: params.transaction.id
        });

        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (transaction.agent.id !== params.agent.id) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        // まずアクションをキャンセル
        const action = await repos.action.cancel({ typeOf: factory.actionType.AuthorizeAction, id: params.id });
        const actionResult = <factory.action.authorize.paymentMethod.account.IResult<factory.accountType>>action.result;

        // Pecorinoで取消中止実行
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else *//* istanbul ignore next */
        if (repos.withdrawTransactionService !== undefined) {
            await repos.withdrawTransactionService.cancel({
                transactionId: actionResult.pendingTransaction.id
            });
        } else if (repos.transferTransactionService !== undefined) {
            await repos.transferTransactionService.cancel({
                transactionId: actionResult.pendingTransaction.id
            });
        } else {
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore next */
            throw new factory.errors.Argument('resos', 'withdrawTransactionService or transferTransactionService required.');
        }
    };
}
