/**
 * 会員プログラムサービス
 */
import { pecorinoapi, repository, service } from '@cinerino/domain';
import * as GMO from '@motionpicture/gmo-service';
import * as createDebug from 'debug';
import * as moment from 'moment-timezone';
import * as util from 'util';

import * as PlaceOrderService from './transaction/placeOrderInProgress';

import { handlePecorinoError } from '../errorHandler';
import * as factory from '../factory';

const debug = createDebug('sskts-domain:service:programMembership');

export type ICreateRegisterTaskOperation<T> = (repos: {
    programMembership: repository.ProgramMembership;
    seller: repository.Seller;
    task: repository.Task;
}) => Promise<T>;
export type ICreateUnRegisterTaskOperation<T> = (repos: {
    ownershipInfo: repository.OwnershipInfo;
    task: repository.Task;
}) => Promise<T>;

export type IRegisterOperation<T> = (repos: {
    action: repository.Action;
    orderNumber: repository.OrderNumber;
    ownershipInfo: repository.OwnershipInfo;
    person: repository.Person;
    programMembership: repository.ProgramMembership;
    registerActionInProgressRepo: repository.action.RegisterProgramMembershipInProgress;
    seller: repository.Seller;
    transaction: repository.Transaction;
    depositService?: pecorinoapi.service.transaction.Deposit;
}) => Promise<T>;

/**
 * 会員プログラム登録タスクを作成する
 */
export function createRegisterTask(params: {
    agent: factory.person.IPerson;
    seller: {
        /**
         * 販売者タイプ
         * どの販売者に属した会員プログラムを登録するか
         */
        typeOf: factory.organizationType;
        /**
         * 販売者ID
         * どの販売者に属した会員プログラムを登録するか
         */
        id: string;
    };
    /**
     * 会員プログラムID
     */
    programMembershipId: string;
    /**
     * 会員プログラムのオファー識別子
     */
    offerIdentifier: string;
}): ICreateRegisterTaskOperation<factory.task.ITask<factory.taskName.RegisterProgramMembership>> {
    return async (repos: {
        programMembership: repository.ProgramMembership;
        seller: repository.Seller;
        task: repository.Task;
    }) => {
        const now = new Date();
        const programMemberships = await repos.programMembership.search({ id: params.programMembershipId });
        const programMembership = programMemberships.shift();
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (programMembership === undefined) {
            throw new factory.errors.NotFound('ProgramMembership');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (programMembership.offers === undefined) {
            throw new factory.errors.NotFound('ProgramMembership.offers');
        }
        const offer = programMembership.offers.find((o) => o.identifier === params.offerIdentifier);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (offer === undefined) {
            throw new factory.errors.NotFound('Offer');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (offer.price === undefined) {
            throw new factory.errors.NotFound('Offer Price undefined');
        }

        const seller = await repos.seller.findById({
            id: params.seller.id
        });
        // 会員プログラムのホスト組織確定(この組織が決済対象となる)
        programMembership.hostingOrganization = {
            id: seller.id,
            identifier: seller.identifier,
            name: seller.name,
            legalName: seller.legalName,
            location: seller.location,
            typeOf: seller.typeOf,
            telephone: seller.telephone,
            url: seller.url
        };

        const itemOffered = {
            ...programMembership,
            offers: programMembership.offers.map((o) => {
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore if */
                if (o.price === undefined) {
                    throw new factory.errors.NotFound('Offer Price undefined');
                }

                return {
                    ...o,
                    price: o.price
                };
            })
        };

        // 受け入れれたオファーオブジェクトを作成
        const acceptedOffer: factory.order.IAcceptedOffer<factory.programMembership.IProgramMembership> = {
            typeOf: 'Offer',
            identifier: offer.identifier,
            price: offer.price,
            priceCurrency: offer.priceCurrency,
            eligibleDuration: offer.eligibleDuration,
            itemOffered: itemOffered,
            seller: {
                typeOf: seller.typeOf,
                name: seller.name.ja
            }
        };
        // 登録アクション属性を作成
        const registerActionAttributes: factory.action.interact.register.programMembership.IAttributes = {
            typeOf: factory.actionType.RegisterAction,
            agent: params.agent,
            object: acceptedOffer
            // potentialActions?: any;
        };
        // 会員プログラム登録タスクを作成する
        const taskAttributes: factory.task.IAttributes<factory.taskName.RegisterProgramMembership> = {
            name: factory.taskName.RegisterProgramMembership,
            status: factory.taskStatus.Ready,
            runsAt: now,
            remainingNumberOfTries: 10,
            numberOfTried: 0,
            executionResults: [],
            data: registerActionAttributes
        };

        return repos.task.save<factory.taskName.RegisterProgramMembership>(taskAttributes);
    };
}

/**
 * 会員プログラム登録
 */
// tslint:disable-next-line:max-func-body-length
export function register(
    params: factory.action.interact.register.programMembership.IAttributes
): IRegisterOperation<void> {
    return async (repos: {
        action: repository.Action;
        orderNumber: repository.OrderNumber;
        ownershipInfo: repository.OwnershipInfo;
        person: repository.Person;
        programMembership: repository.ProgramMembership;
        registerActionInProgressRepo: repository.action.RegisterProgramMembershipInProgress;
        seller: repository.Seller;
        transaction: repository.Transaction;
        depositService: pecorinoapi.service.transaction.Deposit;
    }) => {
        const now = new Date();

        const customer = (<factory.person.IPerson>params.agent);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (customer.memberOf === undefined) {
            throw new factory.errors.NotFound('params.agent.memberOf');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (customer.memberOf.membershipNumber === undefined) {
            throw new factory.errors.NotFound('params.agent.memberOf.membershipNumber');
        }
        const programMembershipId = params.object.itemOffered.id;
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (programMembershipId === undefined) {
            throw new factory.errors.NotFound('params.object.itemOffered.id');
        }

        const programMemberships = await repos.ownershipInfo.search<factory.programMembership.ProgramMembershipType>({
            typeOfGood: {
                typeOf: 'ProgramMembership'
            },
            ownedBy: {
                id: customer.id
            },
            ownedFrom: now,
            ownedThrough: now
        });
        // すでに会員プログラムに加入済であれば何もしない
        const selectedProgramMembership = programMemberships.find((p) => p.typeOfGood.id === params.object.itemOffered.id);
        if (selectedProgramMembership !== undefined) {
            debug('Already registered.');

            return;
        }

        // アクション開始
        const action = await repos.action.start(params);

        let order: factory.order.IOrder;
        let lockNumber: number | undefined;
        try {
            // 登録処理を進行中に変更。進行中であれば競合エラー。
            lockNumber = await repos.registerActionInProgressRepo.lock(
                {
                    membershipNumber: customer.memberOf.membershipNumber,
                    programMembershipId: programMembershipId
                },
                action.id
            );

            order = await processPlaceOrder({
                registerActionAttributes: params
            })(repos);
        } catch (error) {
            // actionにエラー結果を追加
            try {
                // tslint:disable-next-line:max-line-length no-single-line-block-comment
                const actionError = { ...error, ...{ message: error.message, name: error.name } };
                await repos.action.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
            } catch (__) {
                // 失敗したら仕方ない
            }

            try {
                // 本プロセスがlockした場合は解除する。解除しなければタスクのリトライが無駄になってしまう。
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore else */
                if (lockNumber !== undefined) {
                    await repos.registerActionInProgressRepo.unlock({
                        membershipNumber: customer.memberOf.membershipNumber,
                        programMembershipId: programMembershipId
                    });
                }
            } catch (error) {
                // 失敗したら仕方ない
            }

            throw error;
        }

        // アクション完了
        debug('ending action...');
        const actionResult: factory.action.interact.register.programMembership.IResult = {
            order: order
        };

        await repos.action.complete({ typeOf: action.typeOf, id: action.id, result: actionResult });
    };
}

/**
 * 会員プログラム登録解除タスクを作成する
 */
export function createUnRegisterTask(params: {
    agent: factory.person.IPerson;
    /**
     * 所有権識別子
     */
    ownershipInfoIdentifier: string;
}): ICreateUnRegisterTaskOperation<factory.task.ITask<factory.taskName.UnRegisterProgramMembership>> {
    return async (repos: {
        ownershipInfo: repository.OwnershipInfo;
        task: repository.Task;
    }) => {
        // 所有している会員プログラムを検索
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (params.agent.memberOf === undefined) {
            throw new factory.errors.NotFound('params.agent.memberOf');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (params.agent.memberOf.membershipNumber === undefined) {
            throw new factory.errors.NotFound('params.agent.memberOf.membershipNumber');
        }
        const now = new Date();
        const ownershipInfos = await repos.ownershipInfo.search<factory.programMembership.ProgramMembershipType>({
            typeOfGood: { typeOf: 'ProgramMembership' },
            ownedBy: { id: params.agent.id },
            ownedFrom: now,
            ownedThrough: now,
            ...{
                identifiers: [params.ownershipInfoIdentifier]
            }
        });
        const ownershipInfo = ownershipInfos.shift();
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if: please write tests */
        if (ownershipInfo === undefined) {
            throw new factory.errors.NotFound('OwnershipInfo');
        }

        // 所有が確認できれば、会員プログラム登録解除タスクを作成する
        const unRegisterActionAttributes: factory.action.interact.unRegister.programMembership.IAttributes = {
            typeOf: factory.actionType.UnRegisterAction,
            agent: params.agent,
            object: ownershipInfo
        };
        const taskAttributes: factory.task.IAttributes<factory.taskName.UnRegisterProgramMembership> = {
            name: factory.taskName.UnRegisterProgramMembership,
            status: factory.taskStatus.Ready,
            runsAt: now,
            remainingNumberOfTries: 10,
            numberOfTried: 0,
            executionResults: [],
            data: unRegisterActionAttributes
        };

        return repos.task.save<factory.taskName.UnRegisterProgramMembership>(taskAttributes);
    };
}

/**
 * 会員プログラム登録解除
 */
export function unRegister(params: factory.action.interact.unRegister.programMembership.IAttributes) {
    return async (repos: {
        action: repository.Action;
        ownershipInfo: repository.OwnershipInfo;
        task: repository.Task;
    }) => {
        // アクション開始
        const action = await repos.action.start(params);

        try {
            const memberOf = (<factory.person.IPerson>params.object.ownedBy).memberOf;
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore if */
            if (memberOf === undefined) {
                throw new factory.errors.NotFound('params.object.ownedBy.memberOf');
            }
            const membershipNumber = memberOf.membershipNumber;
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore if */
            if (membershipNumber === undefined) {
                throw new factory.errors.NotFound('params.object.ownedBy.memberOf.membershipNumber');
            }
            const programMembershipId = params.object.typeOfGood.id;
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore if */
            if (programMembershipId === undefined) {
                throw new factory.errors.NotFound('params.object.typeOfGood.id');
            }

            // 会員プログラム更新タスク(継続課金タスク)をキャンセル
            await repos.task.taskModel.findOneAndUpdate(
                {
                    name: factory.taskName.RegisterProgramMembership,
                    status: factory.taskStatus.Ready,
                    'data.agent.memberOf.membershipNumber': {
                        $exists: true,
                        $eq: membershipNumber

                    },
                    'data.object.itemOffered.id': {
                        $exists: true,
                        $eq: programMembershipId
                    }
                },
                { status: factory.taskStatus.Aborted }
            ).exec();

            // 所有権の期限変更
            await repos.ownershipInfo.ownershipInfoModel.findOneAndUpdate(
                { identifier: params.object.identifier },
                { ownedThrough: new Date() }
            ).exec();
        } catch (error) {
            // actionにエラー結果を追加
            try {
                // tslint:disable-next-line:max-line-length no-single-line-block-comment
                const actionError = { ...error, ...{ message: error.message, name: error.name } };
                await repos.action.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
            } catch (__) {
                // 失敗したら仕方ない
            }

            throw error;
        }

        // アクション完了
        debug('ending action...');
        const actionResult: factory.action.interact.unRegister.programMembership.IResult = {};

        await repos.action.complete({ typeOf: action.typeOf, id: action.id, result: actionResult });
    };
}

/**
 * 会員プログラム登録アクション属性から、会員プログラムを注文する
 */
function processPlaceOrder(params: {
    registerActionAttributes: factory.action.interact.register.programMembership.IAttributes;
}) {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        action: repository.Action;
        orderNumber: repository.OrderNumber;
        person: repository.Person;
        programMembership: repository.ProgramMembership;
        seller: repository.Seller;
        transaction: repository.Transaction;
        depositService: pecorinoapi.service.transaction.Deposit;
        ownershipInfo: repository.OwnershipInfo;
    }) => {
        const programMembership = params.registerActionAttributes.object.itemOffered;
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (programMembership.offers === undefined) {
            throw new factory.errors.NotFound('ProgramMembership.offers');
        }
        const acceptedOffer = params.registerActionAttributes.object;
        const seller = programMembership.hostingOrganization;
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (seller === undefined) {
            throw new factory.errors.NotFound('ProgramMembership.hostingOrganization');
        }
        const customer = (<factory.person.IPerson>params.registerActionAttributes.agent);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (customer.memberOf === undefined) {
            throw new factory.errors.NotFound('params.agent.memberOf');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (customer.memberOf.membershipNumber === undefined) {
            throw new factory.errors.NotFound('params.agent.memberOf.membershipNumber');
        }

        // 会員プログラム注文取引進行
        // 会員プログラム更新タスク作成は、注文後のアクションに定義すればよいか
        const transaction = await PlaceOrderService.start({
            // tslint:disable-next-line:no-magic-numbers
            expires: moment().add(5, 'minutes').toDate(),
            agent: customer,
            seller: { typeOf: seller.typeOf, id: seller.id },
            object: {}
        })(repos);
        debug('transaction started', transaction.id);

        // シネサンのスマフォアプリ登録時、元から1ポイント追加される
        if (repos.depositService !== undefined) {
            const now = new Date();
            const accountOwnershipInfos = await repos.ownershipInfo.search<factory.ownershipInfo.AccountGoodType.Account>({
                typeOfGood: {
                    typeOf: factory.ownershipInfo.AccountGoodType.Account,
                    accountType: factory.accountType.Point
                },
                ownedBy: {
                    id: customer.id
                },
                ownedFrom: now,
                ownedThrough: now
            });

            if (accountOwnershipInfos.length === 0) {
                throw new factory.errors.NotFound('accountOwnershipInfos');
            }

            // 承認アクションを開始する
            const actionAttributes: factory.action.authorize.award.point.IAttributes = {
                typeOf: factory.actionType.AuthorizeAction,
                object: {
                    typeOf: factory.action.authorize.award.point.ObjectType.PointAward,
                    transactionId: transaction.id,
                    amount: 1
                },
                agent: transaction.seller,
                recipient: transaction.agent,
                purpose: transaction
            };
            const action = await repos.action.start(actionAttributes);

            let pointAPIEndpoint: string;

            // Pecorinoオーソリ取得
            let pointTransaction: factory.action.authorize.award.point.IPointTransaction;

            try {
                pointAPIEndpoint = repos.depositService.options.endpoint;

                debug('starting pecorino pay transaction...', 1);
                pointTransaction = await repos.depositService.start({
                    // 最大1ヵ月のオーソリ
                    expires: moment().add(1, 'month').toDate(),
                    agent: {
                        typeOf: transaction.seller.typeOf,
                        id: transaction.seller.id,
                        name: transaction.seller.name.ja,
                        url: transaction.seller.url
                    },
                    recipient: {
                        typeOf: transaction.agent.typeOf,
                        id: transaction.agent.id,
                        name: `sskts-transaction-${transaction.id}`,
                        url: transaction.agent.url
                    },
                    amount: 1,
                    notes: 'シネマサンシャイン 新規登録インセンティブ',
                    accountType: factory.accountType.Point,
                    toAccountNumber: accountOwnershipInfos[0].typeOfGood.accountNumber
                });
                debug('pointTransaction started.', pointTransaction.id);
            } catch (error) {
                // actionにエラー結果を追加
                try {
                    // tslint:disable-next-line:max-line-length no-single-line-block-comment
                    const actionError = { ...error, ...{ name: error.name, message: error.message } };
                    await repos.action.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
                } catch (__) {
                    // 失敗したら仕方ない
                }

                error = handlePecorinoError(error);
                throw error;
            }

            // アクションを完了
            debug('ending authorize action...');
            const actionResult: factory.action.authorize.award.point.IResult = {
                price: 0, // JPYとして0円
                amount: 1,
                pointTransaction: pointTransaction,
                pointAPIEndpoint: pointAPIEndpoint
            };

            await repos.action.complete({ typeOf: action.typeOf, id: action.id, result: actionResult });
        }

        // 会員プログラムオファー承認
        await PlaceOrderService.action.authorize.offer.programMembership.create({
            agentId: params.registerActionAttributes.agent.id,
            transactionId: transaction.id,
            acceptedOffer: acceptedOffer
        })(repos);

        // 会員クレジットカード検索
        // 事前にクレジットカードを登録しているはず
        const creditCards = await service.person.creditCard.find(customer.memberOf.membershipNumber)();
        // tslint:disable-next-line:no-suspicious-comment
        // TODO 絞る
        // creditCards = creditCards.filter((c) => c.defaultFlag === '1');
        const creditCard = creditCards.shift();
        if (creditCard === undefined) {
            throw new factory.errors.NotFound('CreditCard');
        }
        debug('creditCard found.', creditCard.cardSeq);

        // クレジットカードオーソリ
        // GMOオーダーIDは27バイト制限。十分ユニークになるようにとりあえず22バイトで作成。
        const orderId = util.format(
            'PM-%s-%s', // ProgramMembershipのオーダー
            // tslint:disable-next-line:no-magic-numbers
            `${customer.memberOf.membershipNumber}------`.slice(0, 6).toUpperCase(), // ユーザーネームの頭数文字
            moment().tz('Asia/Tokyo').format('YYMMDDhhmmss') // 秒
        );
        await PlaceOrderService.action.authorize.paymentMethod.creditCard.create({
            agent: params.registerActionAttributes.agent,
            transaction: transaction,
            object: {
                typeOf: factory.paymentMethodType.CreditCard,
                orderId: orderId,
                amount: <number>acceptedOffer.price,
                method: GMO.utils.util.Method.Lump,
                creditCard: {
                    memberId: customer.memberOf.membershipNumber,
                    cardSeq: parseInt(creditCard.cardSeq, 10)
                }
            }
        })(repos);
        debug('creditCard authorization created.');

        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if ((<factory.person.IPerson>params.registerActionAttributes.agent).memberOf === undefined) {
            throw new factory.errors.NotFound('params.agent.memberOf');
        }
        const contact = await repos.person.getUserAttributes({
            userPooId: <string>process.env.COGNITO_USER_POOL_ID,
            username: customer.memberOf.membershipNumber
        });
        await PlaceOrderService.setCustomerContact({
            id: transaction.id,
            agent: { id: params.registerActionAttributes.agent.id },
            object: {
                customerContact: contact
            }
        })(repos);
        debug('customer contact set.');

        // 取引確定
        debug('confirming transaction...', transaction.id);

        return PlaceOrderService.confirm({
            id: transaction.id,
            agent: { id: params.registerActionAttributes.agent.id },
            result: {
                order: { orderDate: new Date() }
            },
            options: { sendEmailMessage: false }
        })(repos);
    };
}
