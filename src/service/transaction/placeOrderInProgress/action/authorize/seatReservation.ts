/**
 * 座席予約承認アクションサービス
 * @namespace service.transaction.placeOrderInProgress.action.authorize.seatReservation
 */

import * as COA from '@motionpicture/coa-service';
import * as factory from '@motionpicture/sskts-factory';
import * as createDebug from 'debug';
import { INTERNAL_SERVER_ERROR } from 'http-status';

import { MongoRepository as SeatReservationAuthorizeActionRepo } from '../../../../../repo/action/authorize/seatReservation';
import { MongoRepository as EventRepo } from '../../../../../repo/event';
import { MongoRepository as TransactionRepo } from '../../../../../repo/transaction';

const debug = createDebug('sskts-domain:service:transaction:placeOrderInProgress:action:authorize:seatReservation');

export type IEventAndActionAndTransactionOperation<T> = (
    eventRepo: EventRepo,
    seatReservationAuthorizeActionRepo: SeatReservationAuthorizeActionRepo,
    transactionRepo: TransactionRepo
) => Promise<T>;
export type IActionAndTransactionOperation<T> = (
    seatReservationAuthorizeActionRepo: SeatReservationAuthorizeActionRepo,
    transactionRepo: TransactionRepo
) => Promise<T>;

/**
 * 座席予約に対する承認アクションを開始する前の処理
 * 供給情報の有効性の確認などを行う。
 * この処理次第で、どのような供給情報を受け入れられるかが決定するので、とても大事な処理です。
 * バグ、不足等あれば、随時更新することが望ましい。
 * @function
 * @param {boolean} isMember 会員かどうか
 * @param {factory.event.individualScreeningEvent.IEvent} individualScreeningEvent 上映イベント
 * @param {factory.offer.ISeatReservationOffer[]} offers 供給情報
 */
// tslint:disable-next-line:max-func-body-length
async function validateOffers(
    isMember: boolean,
    individualScreeningEvent: factory.event.individualScreeningEvent.IEvent,
    offers: factory.offer.ISeatReservationOffer[]
): Promise<void> {
    debug('individualScreeningEvent:', individualScreeningEvent);
    // 供給情報が適切かどうか確認
    const availableSalesTickets: COA.services.reserve.ISalesTicketResult[] = [];

    // COA券種取得(非会員)
    const salesTickets4nonMember = await COA.services.reserve.salesTicket({
        theaterCode: individualScreeningEvent.coaInfo.theaterCode,
        dateJouei: individualScreeningEvent.coaInfo.dateJouei,
        titleCode: individualScreeningEvent.coaInfo.titleCode,
        titleBranchNum: individualScreeningEvent.coaInfo.titleBranchNum,
        timeBegin: individualScreeningEvent.coaInfo.timeBegin,
        flgMember: COA.services.reserve.FlgMember.NonMember
    });
    availableSalesTickets.push(...salesTickets4nonMember);

    // COA券種取得(会員)
    if (isMember) {
        const salesTickets4member = await COA.services.reserve.salesTicket({
            theaterCode: individualScreeningEvent.coaInfo.theaterCode,
            dateJouei: individualScreeningEvent.coaInfo.dateJouei,
            titleCode: individualScreeningEvent.coaInfo.titleCode,
            titleBranchNum: individualScreeningEvent.coaInfo.titleBranchNum,
            timeBegin: individualScreeningEvent.coaInfo.timeBegin,
            flgMember: COA.services.reserve.FlgMember.Member
        });
        availableSalesTickets.push(...salesTickets4member);
    }

    debug('availableSalesTickets:', availableSalesTickets);

    // 利用可能でないチケットコードが供給情報に含まれていれば引数エラー
    // 供給情報ごとに確認
    // tslint:disable-next-line:max-func-body-length
    await Promise.all(offers.map(async (offer, offerIndex) => {
        // ムビチケの場合
        if (offer.ticketInfo.mvtkAppPrice > 0) {
            // ムビチケ情報をCOA券種に変換
            let mvtkTicket: COA.services.master.IMvtkTicketcodeResult;
            try {
                debug('finding mvtkTicket...', offer.ticketInfo.ticketCode, {
                    theaterCode: individualScreeningEvent.coaInfo.theaterCode,
                    kbnDenshiken: offer.ticketInfo.mvtkKbnDenshiken,
                    kbnMaeuriken: offer.ticketInfo.mvtkKbnMaeuriken,
                    kbnKensyu: offer.ticketInfo.mvtkKbnKensyu,
                    salesPrice: offer.ticketInfo.mvtkSalesPrice,
                    appPrice: offer.ticketInfo.mvtkAppPrice,
                    kbnEisyahousiki: offer.ticketInfo.kbnEisyahousiki,
                    titleCode: individualScreeningEvent.coaInfo.titleCode,
                    titleBranchNum: individualScreeningEvent.coaInfo.titleBranchNum
                });
                mvtkTicket = await COA.services.master.mvtkTicketcode({
                    theaterCode: individualScreeningEvent.coaInfo.theaterCode,
                    kbnDenshiken: offer.ticketInfo.mvtkKbnDenshiken,
                    kbnMaeuriken: offer.ticketInfo.mvtkKbnMaeuriken,
                    kbnKensyu: offer.ticketInfo.mvtkKbnKensyu,
                    salesPrice: offer.ticketInfo.mvtkSalesPrice,
                    appPrice: offer.ticketInfo.mvtkAppPrice,
                    kbnEisyahousiki: offer.ticketInfo.kbnEisyahousiki,
                    titleCode: individualScreeningEvent.coaInfo.titleCode,
                    titleBranchNum: individualScreeningEvent.coaInfo.titleBranchNum
                });
            } catch (error) {
                // COAサービスエラーの場合ハンドリング
                if (error.name === 'COAServiceError') {
                    // COAはクライアントエラーかサーバーエラーかに関わらずステータスコード200 or 500を返却する。
                    // 500未満であればクライアントエラーとみなす
                    // tslint:disable-next-line:no-single-line-block-comment
                    /* istanbul ignore else */
                    if (error.code < INTERNAL_SERVER_ERROR) {
                        throw new factory.errors.NotFound(
                            `offers.${offerIndex}`,
                            `ticketCode ${offer.ticketInfo.ticketCode} not found. ${error.message}`
                        );
                    }
                }

                throw error;
            }

            // COA券種が見つかっても、指定された券種コードと異なればエラー
            if (offer.ticketInfo.ticketCode !== mvtkTicket.ticketCode) {
                throw new factory.errors.NotFound(
                    `offers.${offerIndex}`,
                    `ticketInfo of ticketCode ${offer.ticketInfo.ticketCode} is invalid.`);
            }

            offer.ticketInfo.ticketName = mvtkTicket.ticketName;
            offer.ticketInfo.ticketNameEng = mvtkTicket.ticketNameEng;
            offer.ticketInfo.ticketNameKana = mvtkTicket.ticketNameKana;
            offer.ticketInfo.stdPrice = 0;
            offer.ticketInfo.addPrice = mvtkTicket.addPrice;
            offer.ticketInfo.disPrice = 0;
            offer.ticketInfo.salePrice = mvtkTicket.addPrice;
            offer.ticketInfo.addGlasses = mvtkTicket.addPriceGlasses;
        } else {
            const availableSalesTicket = availableSalesTickets.find(
                (salesTicket) => salesTicket.ticketCode === offer.ticketInfo.ticketCode
            );

            // 利用可能な券種が見つからなければエラー
            if (availableSalesTicket === undefined) {
                throw new factory.errors.NotFound(`offers.${offerIndex}`, `ticketCode ${offer.ticketInfo.ticketCode} not found.`);
            }

            // {
            //     "kubunCode": "011",
            //     "kubunName": "チケット制限区分",
            //     "kubunAddPrice": 0
            // },
            // 制限単位がn人単位(例えば夫婦割り)の場合、同一券種の数を確認
            if (availableSalesTicket.limitUnit === '001') {
                const numberOfSameOffer = offers.filter((o) => o.ticketInfo.ticketCode === availableSalesTicket.ticketCode).length;
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore else */
                if (numberOfSameOffer % availableSalesTicket.limitCount !== 0) {
                    // 割引条件が満たされていません
                    // 選択した券種の中に、割引券が含まれています。
                    // 割引券の適用条件を再度ご確認ください。
                    const invalidOfferIndexes = offers.reduce<number[]>(
                        (a, b, index) => (b.ticketInfo.ticketCode === availableSalesTicket.ticketCode) ? [...a, ...[index]] : a,
                        []
                    );

                    throw invalidOfferIndexes.map((index) => new factory.errors.Argument(`offers.${index}`, '割引条件が満たされていません。'));
                }
            }

            offer.ticketInfo.ticketName = availableSalesTicket.ticketName;
            offer.ticketInfo.ticketNameEng = availableSalesTicket.ticketNameEng;
            offer.ticketInfo.ticketNameKana = availableSalesTicket.ticketNameKana;
            offer.ticketInfo.stdPrice = availableSalesTicket.stdPrice;
            offer.ticketInfo.addPrice = availableSalesTicket.addPrice;
            offer.ticketInfo.salePrice = availableSalesTicket.salePrice;
            offer.ticketInfo.addGlasses = availableSalesTicket.addGlasses;
            offer.ticketInfo.mvtkAppPrice = 0; // ムビチケを使用しない場合の初期値をセット
            offer.ticketInfo.mvtkKbnDenshiken = '00'; // ムビチケを使用しない場合の初期値をセット
            offer.ticketInfo.mvtkKbnKensyu = '00'; // ムビチケを使用しない場合の初期値をセット
            offer.ticketInfo.mvtkKbnMaeuriken = '00'; // ムビチケを使用しない場合の初期値をセット
            offer.ticketInfo.mvtkNum = ''; // ムビチケを使用しない場合の初期値をセット
            offer.ticketInfo.mvtkSalesPrice = 0; // ムビチケを使用しない場合の初期値をセット
        }
    }));
}

/**
 * 供給情報から承認アクションの価格を導き出す
 * @function
 * @param {factory.offer.ISeatReservationOffer[]} offers 供給情報
 */
function offers2resultPrice(offers: factory.offer.ISeatReservationOffer[]) {
    return offers.reduce((a, b) => a + b.ticketInfo.salePrice + b.ticketInfo.mvtkSalesPrice, 0);
}

/**
 * 座席を仮予約する
 * 承認アクションオブジェクトが返却されます。
 * @export
 * @function
 * @memberof service.transaction.placeOrderInProgress.action.authorize.seatReservation
 * @param {string} agentId 取引主体ID
 * @param {string} transactionId 取引ID
 * @param {string} eventIdentifier イベント識別子
 * @param {factory.offer.ISeatReservationOffer[]} offers 供給情報
 */
export function create(
    agentId: string,
    transactionId: string,
    eventIdentifier: string,
    offers: factory.offer.ISeatReservationOffer[]
): IEventAndActionAndTransactionOperation<factory.action.authorize.seatReservation.IAction> {
    return async (
        eventRepo: EventRepo,
        seatReservationAuthorizeActionRepo: SeatReservationAuthorizeActionRepo,
        transactionRepo: TransactionRepo
    ) => {
        const transaction = await transactionRepo.findPlaceOrderInProgressById(transactionId);

        if (transaction.agent.id !== agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        // 上映イベントを取得
        const individualScreeningEvent = await eventRepo.findIndividualScreeningEventByIdentifier(eventIdentifier);

        // 供給情報の有効性を確認
        await validateOffers((transaction.agent.memberOf !== undefined), individualScreeningEvent, offers);

        // 承認アクションを開始
        const action = await seatReservationAuthorizeActionRepo.start(
            transaction.seller,
            transaction.agent,
            {
                transactionId: transactionId,
                offers: offers,
                individualScreeningEvent: individualScreeningEvent
            }
        );

        // COA仮予約
        const updTmpReserveSeatArgs = {
            theaterCode: individualScreeningEvent.coaInfo.theaterCode,
            dateJouei: individualScreeningEvent.coaInfo.dateJouei,
            titleCode: individualScreeningEvent.coaInfo.titleCode,
            titleBranchNum: individualScreeningEvent.coaInfo.titleBranchNum,
            timeBegin: individualScreeningEvent.coaInfo.timeBegin,
            screenCode: individualScreeningEvent.coaInfo.screenCode,
            listSeat: offers.map((offer) => {
                return {
                    seatSection: offer.seatSection,
                    seatNum: offer.seatNumber
                };
            })
        };
        let updTmpReserveSeatResult: COA.services.reserve.IUpdTmpReserveSeatResult;
        try {
            debug('updTmpReserveSeat processing...', updTmpReserveSeatArgs);
            updTmpReserveSeatResult = await COA.services.reserve.updTmpReserveSeat(updTmpReserveSeatArgs);
            debug('updTmpReserveSeat processed', updTmpReserveSeatResult);
        } catch (error) {
            // actionにエラー結果を追加
            try {
                await seatReservationAuthorizeActionRepo.giveUp(action.id, error);
            } catch (__) {
                // 失敗したら仕方ない
            }

            // メッセージ「座席取得失敗」の場合は、座席の重複とみなす
            if (error.message === '座席取得失敗') {
                throw new factory.errors.AlreadyInUse('action.object', ['offers'], error.message);
            }

            // COAはクライアントエラーかサーバーエラーかに関わらずステータスコード200 or 500を返却する。
            const coaServiceHttpStatusCode = error.code;

            // 500未満であればクライアントエラーとみなす
            if (Number.isInteger(coaServiceHttpStatusCode)) {
                if (coaServiceHttpStatusCode < INTERNAL_SERVER_ERROR) {
                    throw new factory.errors.Argument('individualScreeningEvent', error.message);
                } else {
                    throw new factory.errors.ServiceUnavailable('Reservation service temporarily unavailable.');
                }
            }

            console.error('COA.services.reserve.updTmpReserveSeat() threw', error);
            throw new factory.errors.ServiceUnavailable('Unexepected error occurred.');
        }

        // アクションを完了
        debug('ending authorize action...');

        return await seatReservationAuthorizeActionRepo.complete(
            action.id,
            {
                price: offers2resultPrice(offers),
                updTmpReserveSeatArgs: updTmpReserveSeatArgs,
                updTmpReserveSeatResult: updTmpReserveSeatResult
            }
        );
    };
}

/**
 * 座席予約承認アクションをキャンセルする
 * @export
 * @function
 * @memberof service.transaction.placeOrderInProgress.action.authorize.seatReservation
 * @param agentId アクション主体ID
 * @param transactionId 取引ID
 * @param actionId アクションID
 */
export function cancel(
    agentId: string,
    transactionId: string,
    actionId: string
) {
    return async (seatReservationAuthorizeActionRepo: SeatReservationAuthorizeActionRepo, transactionRepo: TransactionRepo) => {
        const transaction = await transactionRepo.findPlaceOrderInProgressById(transactionId);

        if (transaction.agent.id !== agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        // MongoDBでcompleteステータスであるにも関わらず、COAでは削除されている、というのが最悪の状況
        // それだけは回避するためにMongoDBを先に変更
        const action = await seatReservationAuthorizeActionRepo.cancel(actionId, transactionId);
        const actionResult = <factory.action.authorize.seatReservation.IResult>action.result;

        // 座席仮予約削除
        debug('delTmpReserve processing...', action);
        await COA.services.reserve.delTmpReserve({
            theaterCode: actionResult.updTmpReserveSeatArgs.theaterCode,
            dateJouei: actionResult.updTmpReserveSeatArgs.dateJouei,
            titleCode: actionResult.updTmpReserveSeatArgs.titleCode,
            titleBranchNum: actionResult.updTmpReserveSeatArgs.titleBranchNum,
            timeBegin: actionResult.updTmpReserveSeatArgs.timeBegin,
            tmpReserveNum: actionResult.updTmpReserveSeatResult.tmpReserveNum
        });
        debug('delTmpReserve processed');
    };
}

/**
 * 座席予約承認アクションの供給情報を変更する
 * @export
 * @function
 * @memberof service.transaction.placeOrderInProgress.action.authorize.seatReservation
 * @param {string} agentId アクション主体ID
 * @param {string} transactionId 取引ID
 * @param {string} actionId アクションID
 * @param {string} eventIdentifier イベント識別子
 * @param {factory.offer.ISeatReservationOffer[]} offers 供給情報
 */
export function changeOffers(
    agentId: string,
    transactionId: string,
    actionId: string,
    eventIdentifier: string,
    offers: factory.offer.ISeatReservationOffer[]
): IEventAndActionAndTransactionOperation<factory.action.authorize.seatReservation.IAction> {
    return async (
        eventRepo: EventRepo,
        seatReservationAuthorizeActionRepo: SeatReservationAuthorizeActionRepo,
        transactionRepo: TransactionRepo
    ) => {
        const transaction = await transactionRepo.findPlaceOrderInProgressById(transactionId);

        if (transaction.agent.id !== agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        // アクション中のイベント識別子と座席リストが合っているかどうか確認
        const authorizeAction = await seatReservationAuthorizeActionRepo.findById(actionId);
        // 完了ステータスのアクションのみ更新可能
        if (authorizeAction.actionStatus !== factory.actionStatusType.CompletedActionStatus) {
            throw new factory.errors.NotFound('authorizeAction');
        }
        // 上映イベントが一致しているかどうか
        if (authorizeAction.object.individualScreeningEvent.identifier !== eventIdentifier) {
            throw new factory.errors.Argument('eventIdentifier', 'eventIdentifier not matched.');
        }
        // 座席セクションと座席番号が一致しているかどうか
        const allSeatsMatched = authorizeAction.object.offers.every((offer, index) => {
            return (offer.seatSection === offers[index].seatSection && offer.seatNumber === offers[index].seatNumber);
        });
        if (!allSeatsMatched) {
            throw new factory.errors.Argument('offers', 'seatSection or seatNumber not matched.');
        }

        // 上映イベントを取得
        const individualScreeningEvent = await eventRepo.findIndividualScreeningEventByIdentifier(eventIdentifier);

        // 供給情報の有効性を確認
        await validateOffers((transaction.agent.memberOf !== undefined), individualScreeningEvent, offers);

        // 供給情報と価格を変更してからDB更新
        authorizeAction.object.offers = offers;
        (<factory.action.authorize.seatReservation.IResult>authorizeAction.result).price = offers2resultPrice(offers);

        return await seatReservationAuthorizeActionRepo.updateObjectAndResultById(
            actionId,
            transactionId,
            authorizeAction.object,
            (<factory.action.authorize.seatReservation.IResult>authorizeAction.result)
        );
    };
}