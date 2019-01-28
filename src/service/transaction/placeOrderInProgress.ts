/**
 * 進行中注文取引サービス
 */
import * as waiter from '@waiter/domain';
import * as createDebug from 'debug';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import * as moment from 'moment-timezone';
import * as pug from 'pug';
import * as util from 'util';

import { MongoRepository as ActionRepo } from '../../repo/action';
import { RedisRepository as OrderNumberRepo } from '../../repo/orderNumber';
import { MongoRepository as OrganizationRepo } from '../../repo/organization';
import { MongoRepository as TransactionRepo } from '../../repo/transaction';

import * as PecorinoAwardAuthorizeActionService from './placeOrderInProgress/action/authorize/award/pecorino';
import * as MvtkAuthorizeActionService from './placeOrderInProgress/action/authorize/discount/mvtk';
import * as ProgramMembershipAuthorizeActionService from './placeOrderInProgress/action/authorize/offer/programMembership';
import * as SeatReservationAuthorizeActionService from './placeOrderInProgress/action/authorize/offer/seatReservation';
import * as AccountAuthorizeActionService from './placeOrderInProgress/action/authorize/paymentMethod/account';
import * as CreditCardAuthorizeActionService from './placeOrderInProgress/action/authorize/paymentMethod/creditCard';

import * as factory from '../../factory';

const debug = createDebug('sskts-domain:service:transaction:placeOrderInProgress');

export type ITransactionOperation<T> = (repos: { transaction: TransactionRepo }) => Promise<T>;
export type IOrganizationAndTransactionAndTransactionCountOperation<T> = (repos: {
    organization: OrganizationRepo;
    transaction: TransactionRepo;
}) => Promise<T>;
export type IAuthorizeAnyPaymentResult = factory.action.authorize.paymentMethod.any.IResult<factory.paymentMethodType>;

/**
 * 取引開始パラメーターインターフェース
 */
export interface IStartParams {
    /**
     * 取引期限
     */
    expires: Date;
    /**
     * 消費者
     */
    customer: factory.person.IPerson;
    /**
     * 販売者
     */
    seller: {
        typeOf: factory.organizationType;
        id: string;
    };
    /**
     * APIクライアント
     */
    clientUser: factory.clientUser.IClientUser;
    /**
     * WAITER許可証トークン
     */
    passportToken?: waiter.factory.passport.IEncodedPassport;
}

/**
 * 取引開始
 */
export function start(params: IStartParams):
    IOrganizationAndTransactionAndTransactionCountOperation<factory.transaction.placeOrder.ITransaction> {
    return async (repos: {
        organization: OrganizationRepo;
        transaction: TransactionRepo;
    }) => {
        // 売り手を取得
        const seller = await repos.organization.findById(params.seller.typeOf, params.seller.id);

        let passport: waiter.factory.passport.IPassport | undefined;

        // WAITER許可証トークンがあれば検証する
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignroe else */
        if (params.passportToken !== undefined) {
            try {
                passport = await waiter.service.passport.verify({
                    token: params.passportToken,
                    secret: <string>process.env.WAITER_SECRET
                });
            } catch (error) {
                throw new factory.errors.Argument('passportToken', `Invalid token. ${error.message}`);
            }

            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore next */
            if (seller.identifier === undefined) {
                throw new factory.errors.ServiceUnavailable('Seller identifier undefined');
            }

            // スコープを判別
            if (!validatePassport(passport, seller.identifier)) {
                throw new factory.errors.Argument('passportToken', 'Invalid passport.');
            }
        } else {
            // tslint:disable-next-line:no-suspicious-comment
            // TODO いったん許可証トークンなしでも通過するようにしているが、これでいいのかどうか。保留事項。
            // throw new factory.errors.ArgumentNull('passportToken');
            params.passportToken = moment().valueOf().toString(); // ユニークインデックスがDBにはられているため
            passport = <any>{};
        }

        // 取引ファクトリーで新しい進行中取引オブジェクトを作成
        const transactionAttributes: factory.transaction.placeOrder.IStartParams = {
            typeOf: factory.transactionType.PlaceOrder,
            agent: params.customer,
            seller: seller,
            object: {
                passportToken: params.passportToken,
                passport: <any>passport,
                clientUser: params.clientUser,
                authorizeActions: []
            },
            expires: params.expires
        };

        let transaction: factory.transaction.placeOrder.ITransaction;
        try {
            transaction = await repos.transaction.start<factory.transactionType.PlaceOrder>(transactionAttributes);
        } catch (error) {
            if (error.name === 'MongoError') {
                // 許可証を重複使用しようとすると、MongoDBでE11000 duplicate key errorが発生する
                // name: 'MongoError',
                // message: 'E11000 duplicate key error collection: sskts-development-v2.transactions...',
                // code: 11000,

                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore else */
                // tslint:disable-next-line:no-magic-numbers
                if (error.code === 11000) {
                    throw new factory.errors.AlreadyInUse('transaction', ['passportToken'], 'Passport already used.');
                }
            }

            throw error;
        }

        return transaction;
    };
}

/**
 * WAITER許可証の有効性チェック
 * @param passport WAITER許可証
 * @param sellerIdentifier 販売者識別子
 */
function validatePassport(passport: waiter.factory.passport.IPassport, sellerIdentifier: string) {
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignroe next */
    if (process.env.WAITER_PASSPORT_ISSUER === undefined) {
        throw new Error('WAITER_PASSPORT_ISSUER unset');
    }
    const issuers = process.env.WAITER_PASSPORT_ISSUER.split(',');
    const validIssuer = issuers.indexOf(passport.iss) >= 0;

    // スコープのフォーマットは、placeOrderTransaction.{sellerId}
    const explodedScopeStrings = passport.scope.split('.');
    const validScope = (
        // tslint:disable-next-line:no-magic-numbers
        explodedScopeStrings.length === 2 &&
        explodedScopeStrings[0] === 'placeOrderTransaction' && // スコープ接頭辞確認
        explodedScopeStrings[1] === sellerIdentifier // 販売者識別子確認
    );

    return validIssuer && validScope;
}

/**
 * 取引に対するアクション
 */
export namespace action {
    /**
     * 取引に対する承認アクション
     */
    export namespace authorize {
        export namespace award {
            export import pecorino = PecorinoAwardAuthorizeActionService;
        }
        export namespace discount {
            /**
             * ムビチケ承認アクションサービス
             */
            export import mvtk = MvtkAuthorizeActionService;
        }
        export namespace offer {
            /**
             * 会員プログラム承認アクションサービス
             */
            export import programMembership = ProgramMembershipAuthorizeActionService;
            /**
             * 座席予約承認アクションサービス
             */
            export import seatReservation = SeatReservationAuthorizeActionService;
        }
        export namespace paymentMethod {
            /**
             * 口座承認アクションサービス
             */
            export import account = AccountAuthorizeActionService;
            /**
             * クレジットカード承認アクションサービス
             */
            export import creditCard = CreditCardAuthorizeActionService;
        }
    }
}

/**
 * 取引中の購入者情報を変更する
 */
export function setCustomerContact(params: {
    agentId: string;
    transactionId: string;
    contact: factory.transaction.placeOrder.ICustomerContact;
}): ITransactionOperation<factory.transaction.placeOrder.ICustomerContact> {
    return async (repos: { transaction: TransactionRepo }) => {
        let formattedTelephone: string;
        try {
            const phoneUtil = PhoneNumberUtil.getInstance();
            const phoneNumber = phoneUtil.parse(params.contact.telephone, 'JP'); // 日本の電話番号前提仕様
            if (!phoneUtil.isValidNumber(phoneNumber)) {
                throw new Error('invalid phone number format.');
            }

            formattedTelephone = phoneUtil.format(phoneNumber, PhoneNumberFormat.E164);
        } catch (error) {
            throw new factory.errors.Argument('contact.telephone', error.message);
        }

        // 連絡先を再生成(validationの意味も含めて)
        const customerContact: factory.transaction.placeOrder.ICustomerContact = {
            familyName: params.contact.familyName,
            givenName: params.contact.givenName,
            email: params.contact.email,
            telephone: formattedTelephone
        };

        const transaction = await repos.transaction.findInProgressById({
            typeOf: factory.transactionType.PlaceOrder,
            id: params.transactionId
        });

        if (transaction.agent.id !== params.agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        await repos.transaction.setCustomerContactOnPlaceOrderInProgress({
            id: params.transactionId,
            contact: customerContact
        });

        return customerContact;
    };
}

/**
 * 注文取引を確定する
 */
export function confirm(params: {
    /**
     * 取引進行者ID
     */
    agentId: string;
    /**
     * 取引ID
     */
    transactionId: string;
    /**
     * 注文メールを送信するかどうか
     */
    sendEmailMessage?: boolean;
    /**
     * 注文日時
     */
    orderDate: Date;
}) {
    return async (repos: {
        action: ActionRepo;
        transaction: TransactionRepo;
        organization: OrganizationRepo;
        orderNumber: OrderNumberRepo;
    }) => {
        const transaction = await repos.transaction.findInProgressById({
            typeOf: factory.transactionType.PlaceOrder,
            id: params.transactionId
        });
        if (transaction.agent.id !== params.agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        const seller = await repos.organization.findById(
            <factory.organizationType.MovieTheater>transaction.seller.typeOf,
            transaction.seller.id
        );
        debug('seller found.', seller.identifier);

        const customerContact = transaction.object.customerContact;
        if (customerContact === undefined) {
            throw new factory.errors.Argument('Customer contact required');
        }

        // 取引に対する全ての承認アクションをマージ
        let authorizeActions = await repos.action.findAuthorizeByTransactionId(params.transactionId);
        // 万が一このプロセス中に他処理が発生してもそれらを無視するように、endDateでフィルタリング
        authorizeActions = authorizeActions.filter((a) => (a.endDate !== undefined && a.endDate < params.orderDate));
        transaction.object.authorizeActions = authorizeActions;

        // 取引の確定条件が全て整っているかどうか確認
        validateTransaction(transaction);

        // 注文番号を発行
        const orderNumber = await repos.orderNumber.publish({
            orderDate: params.orderDate,
            sellerType: seller.typeOf,
            sellerBranchCode: seller.location.branchCode
        });
        // 結果作成
        const order = createOrderFromTransaction({
            transaction: transaction,
            orderNumber: orderNumber,
            orderDate: params.orderDate,
            orderStatus: factory.orderStatus.OrderProcessing,
            isGift: false,
            seller: seller
        });
        const ownershipInfos = createOwnershipInfosFromTransaction({
            transaction: transaction,
            order: order
        });
        const result: factory.transaction.placeOrder.IResult = {
            order: order,
            ownershipInfos: ownershipInfos
        };

        // ポストアクションを作成
        const potentialActions = await createPotentialActionsFromTransaction({
            transaction: transaction,
            customerContact: customerContact,
            order: order,
            seller: seller,
            sendEmailMessage: params.sendEmailMessage
        });

        // ステータス変更
        debug('updating transaction...');
        await repos.transaction.confirmPlaceOrder({
            id: params.transactionId,
            authorizeActions: authorizeActions,
            result: result,
            potentialActions: potentialActions
        });

        return order;
    };
}

/**
 * 取引が確定可能な状態かどうかをチェックする
 */
// tslint:disable-next-line:max-func-body-length
export function validateTransaction(transaction: factory.transaction.placeOrder.ITransaction) {
    type IAuthorizeActionResultBySeller =
        factory.action.authorize.offer.programMembership.IResult |
        factory.action.authorize.offer.seatReservation.IResult |
        factory.action.authorize.award.pecorino.IResult;
    const authorizeActions = transaction.object.authorizeActions;

    // クレジットカードオーソリをひとつに限定
    const creditCardAuthorizeActions = authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.paymentMethodType.CreditCard);
    if (creditCardAuthorizeActions.length > 1) {
        throw new factory.errors.Argument('transactionId', 'The number of credit card authorize actions must be one');
    }

    // ムビチケ着券情報をひとつに限定
    const mvtkAuthorizeActions = authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.action.authorize.discount.mvtk.ObjectType.Mvtk);
    if (mvtkAuthorizeActions.length > 1) {
        throw new factory.errors.Argument('transactionId', 'The number of mvtk authorize actions must be one');
    }

    // Pecorinoオーソリは複数可

    // Pecorinoインセンティブは複数可だが、現時点で1注文につき1ポイントに限定
    const pecorinoAwardAuthorizeActions = <factory.action.authorize.award.pecorino.IAction[]>authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.action.authorize.award.pecorino.ObjectType.PecorinoAward);
    const givenAmount = pecorinoAwardAuthorizeActions.reduce((a, b) => a + b.object.amount, 0);
    if (givenAmount > 1) {
        throw new factory.errors.Argument('transactionId', 'Incentive amount must be 1');
    }

    // agentとsellerで、承認アクションの金額が合うかどうか
    let priceByAgent = 0;
    let priceBySeller = 0;

    // 現時点で購入者に金額が発生するのはクレジットカード決済のみ
    priceByAgent += creditCardAuthorizeActions.reduce((a, b) => a + Number((<IAuthorizeAnyPaymentResult>b.result).amount), 0);
    // priceByAgent = transaction.object.authorizeActions
    //     .filter((authorizeAction) => authorizeAction.actionStatus === factory.actionStatusType.CompletedActionStatus)
    //     .filter((authorizeAction) => authorizeAction.agent.id === transaction.agent.id)
    //     .reduce((a, b) => a + (<IAuthorizeActionResult>b.result).price, 0);

    // 販売者が提供するアイテムの発生金額
    priceBySeller += transaction.object.authorizeActions
        .filter((authorizeAction) => authorizeAction.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((authorizeAction) => authorizeAction.agent.id === transaction.seller.id)
        .reduce((a, b) => a + (<IAuthorizeActionResultBySeller>b.result).price, 0);
    debug('priceByAgent priceBySeller:', priceByAgent, priceBySeller);

    // ポイント鑑賞券によって必要なポイントがどのくらいあるか算出
    let requiredPoint = 0;
    const seatReservationAuthorizeActions = <factory.action.authorize.offer.seatReservation.IAction[]>transaction.object.authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation);
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    if (seatReservationAuthorizeActions.length > 1) {
        throw new factory.errors.Argument('transactionId', 'The number of seat reservation authorize actions must be one');
    }
    const seatReservationAuthorizeAction = seatReservationAuthorizeActions.shift();
    if (seatReservationAuthorizeAction !== undefined) {
        requiredPoint = (<factory.action.authorize.offer.seatReservation.IResult>seatReservationAuthorizeAction.result).pecorinoAmount;
        // 必要ポイントがある場合、Pecorinoのオーソリ金額と比較
        if (requiredPoint > 0) {
            const authorizedPecorinoAmount =
                (<factory.action.authorize.paymentMethod.account.IAction<factory.accountType.Point>[]>transaction.object.authorizeActions)
                    .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
                    .filter((a) => a.object.typeOf === factory.paymentMethodType.Account)
                    .filter(
                        (a) => (<factory.action.authorize.paymentMethod.account.IAccount<factory.accountType.Point>>
                            a.object.fromAccount).accountType === factory.accountType.Point
                    )
                    .reduce((a, b) => a + b.object.amount, 0);
            if (requiredPoint !== authorizedPecorinoAmount) {
                throw new factory.errors.Argument('transactionId', 'Required pecorino amount not satisfied');
            }
        }
    }

    // JPYオーソリ金額もPecorinoオーソリポイントも0より大きくなければ取引成立不可
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    // if (priceByAgent <= 0 && requiredPoint <= 0) {
    //     throw new factory.errors.Argument('transactionId', 'Price or point must be over 0');
    // }
    if (priceByAgent !== priceBySeller) {
        throw new factory.errors.Argument('transactionId', 'Transaction cannot be confirmed because prices are not matched');
    }
}

/**
 * 取引オブジェクトから注文オブジェクトを生成する
 */
// tslint:disable-next-line:max-func-body-length
export function createOrderFromTransaction(params: {
    transaction: factory.transaction.placeOrder.ITransaction;
    orderNumber: string;
    orderDate: Date;
    orderStatus: factory.orderStatus;
    isGift: boolean;
    seller: factory.organization.movieTheater.IOrganization;
}): factory.order.IOrder {
    // 座席予約に対する承認アクション取り出す
    const seatReservationAuthorizeActions = <factory.action.authorize.offer.seatReservation.IAction[]>
        params.transaction.object.authorizeActions
            .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
            .filter((a) => a.object.typeOf === factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation);
    if (seatReservationAuthorizeActions.length > 1) {
        throw new factory.errors.NotImplemented('Number of seat reservation authorizeAction must be 1.');
    }
    const seatReservationAuthorizeAction = seatReservationAuthorizeActions.shift();
    // if (seatReservationAuthorizeAction === undefined) {
    //     throw new factory.errors.Argument('transaction', 'Seat reservation does not exist.');
    // }

    // 会員プログラムに対する承認アクションを取り出す
    const programMembershipAuthorizeActions = params.transaction.object.authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === 'Offer')
        .filter((a) => a.object.itemOffered.typeOf === 'ProgramMembership');
    if (programMembershipAuthorizeActions.length > 1) {
        throw new factory.errors.NotImplemented('Number of programMembership authorizeAction must be 1.');
    }
    const programMembershipAuthorizeAction = programMembershipAuthorizeActions.shift();
    // if (seatReservationAuthorizeAction === undefined) {
    //     throw new factory.errors.Argument('transaction', 'Seat reservation does not exist.');
    // }

    if (params.transaction.object.customerContact === undefined) {
        throw new factory.errors.Argument('transaction', 'Customer contact does not exist');
    }

    const cutomerContact = params.transaction.object.customerContact;
    const seller: factory.order.ISeller = {
        id: params.transaction.seller.id,
        identifier: params.transaction.seller.identifier,
        name: params.transaction.seller.name.ja,
        legalName: params.transaction.seller.legalName,
        typeOf: params.transaction.seller.typeOf,
        telephone: params.transaction.seller.telephone,
        url: params.transaction.seller.url
    };

    // 購入者を識別する情報をまとめる
    const customerIdentifier = (Array.isArray(params.transaction.agent.identifier)) ? params.transaction.agent.identifier : [];
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore else */
    if (params.transaction.object.clientUser !== undefined) {
        customerIdentifier.push(
            {
                name: 'tokenIssuer',
                value: params.transaction.object.clientUser.iss
            },
            {
                name: 'clientId',
                value: params.transaction.object.clientUser.client_id
            }
        );
    }
    const customer: factory.order.ICustomer = {
        id: params.transaction.agent.id,
        typeOf: params.transaction.agent.typeOf,
        name: `${cutomerContact.familyName} ${cutomerContact.givenName}`,
        url: '',
        identifier: customerIdentifier,
        ...params.transaction.object.customerContact
    };
    if (params.transaction.agent.memberOf !== undefined) {
        customer.memberOf = params.transaction.agent.memberOf;
    }

    // とりいそぎ確認番号のデフォルトを0に設定しているが、座席予約以外の注文も含めて、本来はもっと丁寧に設計すべき。
    let confirmationNumber = 0;
    const acceptedOffers: factory.order.IAcceptedOffer<factory.order.IItemOffered>[] = [];

    // 座席予約がある場合
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore else */
    if (seatReservationAuthorizeAction !== undefined) {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore next */
        if (seatReservationAuthorizeAction.result === undefined) {
            throw new factory.errors.Argument('transaction', 'Seat reservation result does not exist.');
        }

        const updTmpReserveSeatResult = seatReservationAuthorizeAction.result.updTmpReserveSeatResult;
        const screeningEvent = seatReservationAuthorizeAction.object.individualScreeningEvent;

        // 確認番号はCOAの仮予約番号と同じ
        confirmationNumber = seatReservationAuthorizeAction.result.updTmpReserveSeatResult.tmpReserveNum;

        // 座席仮予約からオファー情報を生成する
        acceptedOffers.push(...updTmpReserveSeatResult.listTmpReserve.map((tmpReserve, index) => {
            const requestedOffer = seatReservationAuthorizeAction.object.offers.filter((offer) => {
                return (offer.seatNumber === tmpReserve.seatNum && offer.seatSection === tmpReserve.seatSection);
            })[0];
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore next */
            if (requestedOffer === undefined) {
                throw new factory.errors.Argument('offers', '要求された供給情報と仮予約結果が一致しません。');
            }

            // チケットトークン(QRコード文字列)を作成
            const ticketToken = [
                screeningEvent.coaInfo.theaterCode,
                screeningEvent.coaInfo.dateJouei,
                // tslint:disable-next-line:no-magic-numbers
                (`00000000${updTmpReserveSeatResult.tmpReserveNum}`).slice(-8),
                // tslint:disable-next-line:no-magic-numbers
                (`000${index + 1}`).slice(-3)
            ].join('');

            const eventReservation: factory.reservation.event.IEventReservation<factory.event.screeningEvent.IEvent> = {
                typeOf: factory.reservationType.EventReservation,
                id: `${updTmpReserveSeatResult.tmpReserveNum}-${index.toString()}`,
                checkedIn: false,
                attended: false,
                additionalTicketText: '',
                modifiedTime: params.orderDate,
                numSeats: 1,
                price: requestedOffer.price,
                priceCurrency: requestedOffer.priceCurrency,
                reservationFor: screeningEvent,
                reservationNumber: `${updTmpReserveSeatResult.tmpReserveNum}`,
                reservationStatus: factory.reservationStatusType.ReservationConfirmed,
                reservedTicket: {
                    typeOf: 'Ticket',
                    coaTicketInfo: requestedOffer.ticketInfo,
                    dateIssued: params.orderDate,
                    issuedBy: {
                        typeOf: screeningEvent.superEvent.organizer.typeOf,
                        name: screeningEvent.superEvent.organizer.name.ja
                    },
                    totalPrice: requestedOffer.price,
                    priceCurrency: requestedOffer.priceCurrency,
                    ticketedSeat: {
                        typeOf: factory.placeType.Seat,
                        seatingType: {
                            typeOf: 'Default'
                        },
                        seatNumber: tmpReserve.seatNum,
                        seatRow: '',
                        seatSection: tmpReserve.seatSection
                    },
                    ticketNumber: ticketToken,
                    ticketToken: ticketToken,
                    underName: {
                        typeOf: factory.personType.Person,
                        name: customer.name
                    },
                    ticketType: <any>{
                        id: requestedOffer.ticketInfo.ticketCode,
                        name: {
                            ja: requestedOffer.ticketInfo.ticketName,
                            en: requestedOffer.ticketInfo.ticketNameEng
                        }
                    }
                },
                underName: {
                    typeOf: factory.personType.Person,
                    name: customer.name
                }
            };

            return {
                typeOf: <factory.offer.OfferType>'Offer',
                itemOffered: eventReservation,
                price: eventReservation.price,
                priceCurrency: factory.priceCurrency.JPY,
                seller: {
                    typeOf: params.seller.typeOf,
                    name: screeningEvent.superEvent.location.name.ja
                }
            };
        }));
    }

    // 会員プログラムがある場合
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore else */
    if (programMembershipAuthorizeAction !== undefined) {
        acceptedOffers.push(programMembershipAuthorizeAction.object);
    }

    // 注文照会キーを作成
    const orderInquiryKey: factory.order.IOrderInquiryKey = {
        theaterCode: params.seller.location.branchCode,
        confirmationNumber: confirmationNumber,
        telephone: cutomerContact.telephone
    };

    // 結果作成
    const discounts: factory.order.IDiscount[] = [];
    params.transaction.object.authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.action.authorize.discount.mvtk.ObjectType.Mvtk)
        .forEach((mvtkAuthorizeAction: factory.action.authorize.discount.mvtk.IAction) => {
            const discountCode = mvtkAuthorizeAction.object.seatInfoSyncIn.knyknrNoInfo.map(
                (knshInfo) => knshInfo.knyknrNo
            ).join(',');

            discounts.push({
                typeOf: 'Discount',
                name: 'ムビチケカード',
                discount: (<factory.action.authorize.discount.mvtk.IResult>mvtkAuthorizeAction.result).price,
                discountCode: discountCode,
                discountCurrency: factory.priceCurrency.JPY
            });
        });

    const paymentMethods: factory.order.IPaymentMethod<factory.paymentMethodType>[] = [];

    // クレジットカード決済があれば決済方法に追加
    params.transaction.object.authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.paymentMethodType.CreditCard)
        .forEach((creditCardAuthorizeAction: factory.action.authorize.paymentMethod.creditCard.IAction) => {
            const actionResult = <factory.action.authorize.paymentMethod.creditCard.IResult>creditCardAuthorizeAction.result;
            paymentMethods.push({
                name: 'クレジットカード',
                typeOf: factory.paymentMethodType.CreditCard,
                paymentMethodId: actionResult.execTranResult.orderId,
                additionalProperty: []
            });
        });

    // ポイント口座決済があれば決済方法に追加
    params.transaction.object.authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.paymentMethodType.Account)
        .forEach((pecorinoAuthorizeAction: factory.action.authorize.paymentMethod.account.IAction<factory.accountType.Point>) => {
            const actionResult =
                <factory.action.authorize.paymentMethod.account.IResult<factory.accountType.Point>>pecorinoAuthorizeAction.result;
            paymentMethods.push({
                name: 'ポイント口座',
                typeOf: factory.paymentMethodType.Account,
                paymentMethodId: actionResult.pendingTransaction.object.fromAccountNumber,
                additionalProperty: []
            });
        });

    // ムビチケ決済があれば決済方法に追加
    params.transaction.object.authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .filter((a) => a.object.typeOf === factory.action.authorize.discount.mvtk.ObjectType.Mvtk)
        .forEach((mvtkAuthorizeAction: factory.action.authorize.discount.mvtk.IAction) => {
            // ムビチケ購入管理番号を決済IDに指定
            paymentMethods.push(...mvtkAuthorizeAction.object.seatInfoSyncIn.knyknrNoInfo.map(
                (knshInfo) => {
                    return {
                        name: 'ムビチケ',
                        typeOf: factory.paymentMethodType.MovieTicket,
                        paymentMethod: factory.paymentMethodType.MovieTicket,
                        paymentMethodId: knshInfo.knyknrNo,
                        additionalProperty: []
                    };
                }
            ));
        });

    const url = util.format(
        '%s/inquiry/login?theater=%s&reserve=%s',
        process.env.ORDER_INQUIRY_ENDPOINT,
        orderInquiryKey.theaterCode,
        orderInquiryKey.confirmationNumber
    );

    return {
        typeOf: 'Order',
        seller: seller,
        customer: customer,
        price: acceptedOffers.reduce((a, b) => a + b.price, 0) - discounts.reduce((a, b) => a + b.discount, 0),
        priceCurrency: factory.priceCurrency.JPY,
        paymentMethods: paymentMethods,
        discounts: discounts,
        confirmationNumber: confirmationNumber,
        orderNumber: params.orderNumber,
        acceptedOffers: acceptedOffers,
        url: url,
        orderStatus: params.orderStatus,
        orderDate: params.orderDate,
        isGift: params.isGift,
        orderInquiryKey: orderInquiryKey
    };
}

export async function createEmailMessageFromTransaction(params: {
    transaction: factory.transaction.placeOrder.ITransaction;
    customerContact: factory.transaction.placeOrder.ICustomerContact;
    order: factory.order.IOrder;
    seller: factory.organization.movieTheater.IOrganization;
}): Promise<factory.creativeWork.message.email.ICreativeWork> {
    return new Promise<factory.creativeWork.message.email.ICreativeWork>((resolve, reject) => {
        const seller = params.transaction.seller;
        if (params.order.acceptedOffers[0].itemOffered.typeOf === factory.reservationType.EventReservation) {
            const event = params.order.acceptedOffers[0].itemOffered.reservationFor;

            pug.renderFile(
                `${__dirname}/../../../emails/sendOrder/text.pug`,
                {
                    familyName: params.customerContact.familyName,
                    givenName: params.customerContact.givenName,
                    confirmationNumber: params.order.confirmationNumber,
                    eventStartDate: util.format(
                        '%s - %s',
                        moment(event.startDate).locale('ja').tz('Asia/Tokyo').format('YYYY年MM月DD日(ddd) HH:mm'),
                        moment(event.endDate).tz('Asia/Tokyo').format('HH:mm')
                    ),
                    workPerformedName: event.workPerformed.name,
                    screenName: event.location.name.ja,
                    reservedSeats: params.order.acceptedOffers.map((o) => {
                        const reservation = (<factory.reservation.event.IEventReservation<any>>o.itemOffered);
                        const ticketedSeat = reservation.reservedTicket.ticketedSeat;

                        return util.format(
                            '%s %s ￥%s',
                            (ticketedSeat !== undefined) ? ticketedSeat.seatNumber : '',
                            reservation.reservedTicket.coaTicketInfo.ticketName,
                            reservation.reservedTicket.coaTicketInfo.salePrice
                        );
                    }).join('\n'),
                    price: params.order.price,
                    inquiryUrl: params.order.url,
                    sellerName: params.order.seller.name,
                    sellerTelephone: params.seller.telephone
                },
                (renderMessageErr, message) => {
                    if (renderMessageErr instanceof Error) {
                        reject(renderMessageErr);

                        return;
                    }

                    debug('message:', message);
                    pug.renderFile(
                        `${__dirname}/../../../emails/sendOrder/subject.pug`,
                        {
                            sellerName: params.order.seller.name
                        },
                        (renderSubjectErr, subject) => {
                            if (renderSubjectErr instanceof Error) {
                                reject(renderSubjectErr);

                                return;
                            }

                            debug('subject:', subject);

                            const email: factory.creativeWork.message.email.ICreativeWork = {
                                typeOf: factory.creativeWorkType.EmailMessage,
                                identifier: `placeOrderTransaction-${params.transaction.id}`,
                                name: `placeOrderTransaction-${params.transaction.id}`,
                                sender: {
                                    typeOf: seller.typeOf,
                                    name: seller.name.ja,
                                    email: 'noreply@ticket-cinemasunshine.com'
                                },
                                toRecipient: {
                                    typeOf: params.transaction.agent.typeOf,
                                    name: `${params.customerContact.familyName} ${params.customerContact.givenName}`,
                                    email: params.customerContact.email
                                },
                                about: subject,
                                text: message
                            };
                            resolve(email);
                        }
                    );
                }
            );
        }
    });
}

/**
 * 取引から所有権を作成する
 */
export function createOwnershipInfosFromTransaction(params: {
    transaction: factory.transaction.placeOrder.ITransaction;
    order: factory.order.IOrder;
}): factory.ownershipInfo.IOwnershipInfo<factory.ownershipInfo.IGoodType>[] {
    return params.order.acceptedOffers.map((acceptedOffer, offerIndex) => {
        const itemOffered = acceptedOffer.itemOffered;
        let ownershipInfo: factory.ownershipInfo.IOwnershipInfo<factory.ownershipInfo.IGoodType>;
        const identifier = util.format(
            '%s-%s-%s',
            itemOffered.typeOf,
            params.order.orderNumber,
            offerIndex
        );
        const ownedFrom = params.order.orderDate;
        let ownedThrough: Date;

        switch (itemOffered.typeOf) {
            case 'ProgramMembership':
                // どういう期間でいくらのオファーなのか
                const eligibleDuration = acceptedOffer.eligibleDuration;
                if (eligibleDuration === undefined) {
                    throw new factory.errors.NotFound('Order.acceptedOffers.eligibleDuration');
                }
                // 期間単位としては秒のみ実装
                if (eligibleDuration.unitCode !== factory.unitCode.Sec) {
                    throw new factory.errors.NotImplemented('Only \'SEC\' is implemented for eligibleDuration.unitCode ');
                }
                ownedThrough = moment(params.order.orderDate).add(eligibleDuration.value, 'seconds').toDate();
                ownershipInfo = {
                    typeOf: <factory.ownershipInfo.OwnershipInfoType>'OwnershipInfo',
                    identifier: identifier,
                    ownedBy: params.transaction.agent,
                    acquiredFrom: params.transaction.seller,
                    ownedFrom: ownedFrom,
                    ownedThrough: ownedThrough,
                    typeOfGood: itemOffered
                };

                break;

            case factory.reservationType.EventReservation:
                // ownershipInfoのidentifierはコレクション内でuniqueである必要があるので、この仕様には要注意
                // saveする際に、identifierでfindOneAndUpdateしている
                // const identifier = `${acceptedOffer.itemOffered.typeOf}-${acceptedOffer.itemOffered.reservedTicket.ticketToken}`;
                // イベント予約に対する所有権の有効期限はイベント終了日時までで十分だろう
                // 現時点では所有権対象がイベント予約のみなので、これで問題ないが、
                // 対象が他に広がれば、有効期間のコントロールは別でしっかり行う必要があるだろう
                ownedThrough = itemOffered.reservationFor.endDate;

                ownershipInfo = {
                    typeOf: <factory.ownershipInfo.OwnershipInfoType>'OwnershipInfo',
                    identifier: identifier,
                    ownedBy: params.transaction.agent,
                    acquiredFrom: params.transaction.seller,
                    ownedFrom: ownedFrom,
                    ownedThrough: ownedThrough,
                    typeOfGood: itemOffered
                };

                break;

            default:
                throw new factory.errors.NotImplemented(`Offered item type ${(<any>itemOffered).typeOf} not implemented`);
        }

        return ownershipInfo;
    });
}

/**
 * 取引のポストアクションを作成する
 */
// tslint:disable-next-line:max-func-body-length
export async function createPotentialActionsFromTransaction(params: {
    transaction: factory.transaction.placeOrder.ITransaction;
    customerContact: factory.transaction.placeOrder.ICustomerContact;
    order: factory.order.IOrder;
    seller: factory.organization.movieTheater.IOrganization;
    sendEmailMessage?: boolean;
}): Promise<factory.transaction.placeOrder.IPotentialActions> {
    // クレジットカード支払いアクション
    let payCreditCardAction: factory.action.trade.pay.IAttributes<factory.paymentMethodType.CreditCard> | null = null;
    const creditCardPayment = params.order.paymentMethods.find((m) => m.typeOf === factory.paymentMethodType.CreditCard);
    if (creditCardPayment !== undefined) {
        payCreditCardAction = {
            typeOf: factory.actionType.PayAction,
            object: [{
                typeOf: <'PaymentMethod'>'PaymentMethod',
                paymentMethod: <factory.order.IPaymentMethod<factory.paymentMethodType.CreditCard>>creditCardPayment,
                price: params.order.price,
                priceCurrency: params.order.priceCurrency
            }],
            agent: params.transaction.agent,
            purpose: params.order
        };
    }

    // 口座支払いアクション
    const authorizeAccountActions = <factory.action.authorize.paymentMethod.account.IAction<factory.accountType>[]>
        params.transaction.object.authorizeActions
            .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
            .filter((a) => a.result !== undefined)
            .filter((a) => a.result.paymentMethod === factory.paymentMethodType.Account);
    const payAccountActions: factory.action.trade.pay.IAttributes<factory.paymentMethodType.Account>[] =
        authorizeAccountActions.map((a) => {
            const result = <factory.action.authorize.paymentMethod.account.IResult<factory.accountType>>a.result;

            return {
                typeOf: <factory.actionType.PayAction>factory.actionType.PayAction,
                object: [{
                    typeOf: <'PaymentMethod'>'PaymentMethod',
                    paymentMethod: {
                        name: result.name,
                        typeOf: <factory.paymentMethodType.Account>result.paymentMethod,
                        paymentMethodId: result.paymentMethodId,
                        totalPaymentDue: result.totalPaymentDue,
                        additionalProperty: (Array.isArray(result.additionalProperty)) ? result.additionalProperty : []
                    },
                    pendingTransaction:
                        (<factory.action.authorize.paymentMethod.account.IResult<factory.accountType>>a.result).pendingTransaction
                }],
                agent: params.transaction.agent,
                purpose: params.order
            };
        });

    // ムビチケ使用アクション
    let useMvtkAction: factory.action.consume.use.mvtk.IAttributes | null = null;
    const mvtkAuthorizeAction = <factory.action.authorize.discount.mvtk.IAction>params.transaction.object.authorizeActions
        .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
        .find((a) => a.object.typeOf === factory.action.authorize.discount.mvtk.ObjectType.Mvtk);
    if (mvtkAuthorizeAction !== undefined) {
        useMvtkAction = {
            typeOf: factory.actionType.UseAction,
            object: {
                typeOf: factory.action.consume.use.mvtk.ObjectType.Mvtk,
                seatInfoSyncIn: mvtkAuthorizeAction.object.seatInfoSyncIn
            },
            agent: params.transaction.agent,
            purpose: params.order
        };
    }

    // Pecorinoインセンティブに対する承認アクションの分だけ、Pecorinoインセンティブ付与アクションを作成する
    let givePecorinoAwardActions: factory.action.transfer.give.pecorinoAward.IAttributes[] = [];
    const pecorinoAwardAuthorizeActions =
        (<factory.action.authorize.award.pecorino.IAction[]>params.transaction.object.authorizeActions)
            .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
            .filter((a) => a.object.typeOf === factory.action.authorize.award.pecorino.ObjectType.PecorinoAward);
    givePecorinoAwardActions = pecorinoAwardAuthorizeActions.map((a) => {
        const actionResult = <factory.action.authorize.award.pecorino.IResult>a.result;

        return {
            typeOf: <factory.actionType.GiveAction>factory.actionType.GiveAction,
            agent: params.transaction.seller,
            recipient: params.transaction.agent,
            object: {
                typeOf: factory.action.transfer.give.pecorinoAward.ObjectType.PecorinoAward,
                pecorinoTransaction: actionResult.pecorinoTransaction,
                pecorinoEndpoint: actionResult.pecorinoEndpoint
            },
            purpose: params.order
        };
    });

    // メール送信ONであれば送信アクション属性を生成
    // tslint:disable-next-line:no-suspicious-comment
    // TODO メール送信アクションをセットする
    // 現時点では、フロントエンドからメール送信タスクを作成しているので不要
    let sendEmailMessageActionAttributes: factory.action.transfer.send.message.email.IAttributes | null = null;
    if (params.sendEmailMessage === true) {
        const emailMessage = await createEmailMessageFromTransaction({
            transaction: params.transaction,
            customerContact: params.customerContact,
            order: params.order,
            seller: params.seller
        });
        sendEmailMessageActionAttributes = {
            typeOf: factory.actionType.SendAction,
            object: emailMessage,
            agent: params.transaction.seller,
            recipient: params.transaction.agent,
            potentialActions: {},
            purpose: params.order
        };
    }

    // 会員プログラムが注文アイテムにあれば、プログラム更新タスクを追加
    const registerProgramMembershipTaskAttributes: factory.task.registerProgramMembership.IAttributes[] = [];
    const programMembershipOffers = <factory.order.IAcceptedOffer<factory.programMembership.IProgramMembership>[]>
        params.order.acceptedOffers.filter(
            (o) => o.itemOffered.typeOf === <factory.programMembership.ProgramMembershipType>'ProgramMembership'
        );
    if (programMembershipOffers.length > 0) {
        registerProgramMembershipTaskAttributes.push(...programMembershipOffers.map((o) => {
            const actionAttributes: factory.action.interact.register.programMembership.IAttributes = {
                typeOf: factory.actionType.RegisterAction,
                agent: params.transaction.agent,
                object: o
            };

            // どういう期間でいくらのオファーなのか
            const eligibleDuration = o.eligibleDuration;
            if (eligibleDuration === undefined) {
                throw new factory.errors.NotFound('Order.acceptedOffers.eligibleDuration');
            }
            // 期間単位としては秒のみ実装
            if (eligibleDuration.unitCode !== factory.unitCode.Sec) {
                throw new factory.errors.NotImplemented('Only \'SEC\' is implemented for eligibleDuration.unitCode ');
            }
            // プログラム更新日時は、今回のプログラムの所有期限
            const runsAt = moment(params.order.orderDate).add(eligibleDuration.value, 'seconds').toDate();

            return {
                name: <factory.taskName.RegisterProgramMembership>factory.taskName.RegisterProgramMembership,
                status: factory.taskStatus.Ready,
                runsAt: runsAt,
                remainingNumberOfTries: 10,
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: actionAttributes
            };
        }));
    }

    const sendOrderActionAttributes: factory.action.transfer.send.order.IAttributes = {
        typeOf: factory.actionType.SendAction,
        object: params.order,
        agent: params.transaction.seller,
        recipient: params.transaction.agent,
        potentialActions: {
            sendEmailMessage: (sendEmailMessageActionAttributes !== null) ? sendEmailMessageActionAttributes : undefined,
            registerProgramMembership: registerProgramMembershipTaskAttributes
        }
    };

    return {
        order: {
            typeOf: factory.actionType.OrderAction,
            object: params.order,
            agent: params.transaction.agent,
            potentialActions: {
                payCreditCard: (payCreditCardAction !== null) ? payCreditCardAction : undefined,
                payAccount: payAccountActions,
                useMvtk: (useMvtkAction !== null) ? useMvtkAction : undefined,
                sendOrder: sendOrderActionAttributes,
                givePecorinoAward: givePecorinoAwardActions
            }
        }
    };
}
