/**
 * マスターデータ同期サービス
 */
import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';
// @ts-ignore
import * as difference from 'lodash.difference';
import * as moment from 'moment-timezone';

import { Repository as CreativeWorkRepo } from '../repo/creativeWork';
import { MongoRepository as EventRepo } from '../repo/event';
import { Repository as PlaceRepo } from '../repo/place';
import { MongoRepository as SellerRepo } from '../repo/seller';

import * as factory from '../factory';

const debug = createDebug('sskts-domain:service:masterSync');

/**
 * 映画作品インポート
 */
export function importMovies(theaterCode: string) {
    return async (repos: { creativeWork: CreativeWorkRepo }) => {
        // COAから作品取得
        const filmsFromCOA = await COA.services.master.title({ theaterCode: theaterCode });

        // 永続化
        await Promise.all(filmsFromCOA.map(async (filmFromCOA) => {
            const movie = createMovieFromCOA(filmFromCOA);
            debug('storing movie...', movie);
            await repos.creativeWork.saveMovie(movie);
            debug('movie stored.');
        }));
    };
}

// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
function createMovieFromCOA(filmFromCOA: COA.services.master.ITitleResult): factory.creativeWork.movie.ICreativeWork {
    return {
        identifier: filmFromCOA.titleCode,
        name: filmFromCOA.titleNameOrig,
        duration: moment.duration(filmFromCOA.showTime, 'm').toISOString(),
        contentRating: filmFromCOA.kbnEirin,
        typeOf: factory.creativeWorkType.Movie
    };
}

export function matchWithXML(
    xmlSchedules: COA.services.master.IXMLScheduleResult[][],
    coaSchedule: COA.services.master.IScheduleResult
): boolean {
    let result = false;
    xmlSchedules.forEach((xmlSchedule) => {
        const matchSchedule = xmlSchedule.find((schedule) => {
            if (schedule.date !== coaSchedule.dateJouei) { return false; }
            const matchMovie = schedule.movie.find((movie) => {
                if (movie.movieShortCode !== coaSchedule.titleCode) { return false; }
                const matchScreen = movie.screen.find((screen) => {
                    if (screen.screenCode !== coaSchedule.screenCode) { return false; }
                    const matchTime = screen.time.find((time) => {
                        if (time.startTime !== coaSchedule.timeBegin || time.endTime !== coaSchedule.timeEnd) {
                            return false;
                        } else {
                            return true;
                        }
                    });
                    if (matchTime !== undefined) {
                        return true;
                    } else {
                        return false;
                    }
                });
                if (matchScreen !== undefined) {
                    return true;
                } else {
                    return false;
                }
            });
            if (matchMovie !== undefined) {
                return true;
            } else {
                return false;
            }
        });
        if (matchSchedule !== undefined) {
            result = true;
        }
    });

    return result;
}

/**
 * COAから上映イベントをインポートする
 */
export function importScreeningEvents(params: factory.task.IData<factory.taskName.ImportScreeningEvents>) {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        event: EventRepo;
        place: PlaceRepo;
        seller: SellerRepo;
    }) => {
        // 劇場取得
        const movieTheater = await repos.place.findMovieTheaterByBranchCode(params.locationBranchCode);
        const sellers = await repos.seller.search({
            location: { branchCodes: [params.locationBranchCode] }
        });
        const seller = sellers.shift();
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (seller === undefined) {
            throw new factory.errors.NotFound('Seller');
        }

        let xmlEndPoint: any;
        if (Array.isArray((<any>seller).additionalProperty)) {
            const xmlEndPointProperty = (<any>seller).additionalProperty.find(((p: any) => {
                return p.name === 'xmlEndPoint';
            }));
            xmlEndPoint = (xmlEndPointProperty !== undefined) ? JSON.parse(xmlEndPointProperty.value) : undefined;
        }

        // COAから作品取得
        const filmsFromCOA = await COA.services.master.title({
            theaterCode: params.locationBranchCode
        });

        const targetImportFrom = moment(`${moment(params.importFrom)
            .tz('Asia/Tokyo').format('YYYY-MM-DD')}T00:00:00+09:00`);
        const targetImportThrough = moment(`${moment(params.importThrough)
            .tz('Asia/Tokyo').format('YYYY-MM-DD')}T00:00:00+09:00`).add(1, 'day');
        debug('importing screening events...', targetImportFrom, targetImportThrough);

        // COAから上映イベント取得
        debug(
            'finding schedules from COA...',
            moment(targetImportFrom).tz('Asia/Tokyo').format('YYYYMMDD'),
            moment(targetImportThrough).add(-1, 'day').tz('Asia/Tokyo').format('YYYYMMDD')
        );
        const schedulesFromCOA = await COA.services.master.schedule({
            theaterCode: params.locationBranchCode,
            begin: moment(targetImportFrom).tz('Asia/Tokyo').format('YYYYMMDD'), // COAは日本時間で判断
            end: moment(targetImportThrough).add(-1, 'day').tz('Asia/Tokyo').format('YYYYMMDD') // COAは日本時間で判断
        });

        let schedulesFromXML: COA.services.master.IXMLScheduleResult[][] = [];
        if (xmlEndPoint !== undefined) {
            try {
                schedulesFromXML = await COA.services.master.xmlSchedule({
                    baseUrl: xmlEndPoint.baseUrl,
                    theaterCodeName: xmlEndPoint.theaterCodeName
                });
            } catch (err) {
                // tslint:disable-next-line:no-console
                console.error(err);
            }
        }

        // xmlEndPointがない場合、処理を続きます
        if (xmlEndPoint === undefined || schedulesFromXML.length > 0) {
            // COAから区分マスター抽出
            const serviceKubuns = await COA.services.master.kubunName({
                theaterCode: params.locationBranchCode,
                kubunClass: '009'
            });
            const acousticKubuns = await COA.services.master.kubunName({
                theaterCode: params.locationBranchCode,
                kubunClass: '046'
            });
            const eirinKubuns = await COA.services.master.kubunName({
                theaterCode: params.locationBranchCode,
                kubunClass: '044'
            });
            const eizouKubuns = await COA.services.master.kubunName({
                theaterCode: params.locationBranchCode,
                kubunClass: '042'
            });
            const joueihousikiKubuns = await COA.services.master.kubunName({
                theaterCode: params.locationBranchCode,
                kubunClass: '045'
            });
            const jimakufukikaeKubuns = await COA.services.master.kubunName({
                theaterCode: params.locationBranchCode,
                kubunClass: '043'
            });
            debug('kubunNames found.');

            // 永続化
            const screeningEventSerieses = await Promise.all(filmsFromCOA.map(async (filmFromCOA) => {
                const screeningEventSeries = createScreeningEventSeriesFromCOA({
                    filmFromCOA: filmFromCOA,
                    movieTheater: movieTheater,
                    eirinKubuns: eirinKubuns,
                    eizouKubuns: eizouKubuns,
                    joueihousikiKubuns: joueihousikiKubuns,
                    jimakufukikaeKubuns: jimakufukikaeKubuns
                });

                await repos.event.save(screeningEventSeries);

                return screeningEventSeries;
            }));

            // 上映イベントごとに永続化トライ
            const screeningEvents: factory.event.screeningEvent.IEvent[] = [];
            schedulesFromCOA.forEach((scheduleFromCOA) => {
                if (xmlEndPoint === undefined || matchWithXML(schedulesFromXML, scheduleFromCOA)) {
                    const screeningEventSeriesId = createScreeningEventSeriesId({
                        theaterCode: params.locationBranchCode,
                        titleCode: scheduleFromCOA.titleCode,
                        titleBranchNum: scheduleFromCOA.titleBranchNum
                    });

                    // スクリーン存在チェック
                    const screenRoom = <factory.place.movieTheater.IScreeningRoom | undefined>movieTheater.containsPlace.find(
                        (place) => place.branchCode === scheduleFromCOA.screenCode
                    );
                    if (screenRoom === undefined) {
                        // tslint:disable-next-line:no-console
                        console.error('screenRoom not found.', scheduleFromCOA.screenCode);

                        return;
                    }

                    // 上映イベントシリーズ取得
                    const screeningEventSeries = screeningEventSerieses.find((e) => e.id === screeningEventSeriesId);
                    if (screeningEventSeries === undefined) {
                        // tslint:disable-next-line:no-console
                        console.error('screeningEventSeries not found.', screeningEventSeriesId);

                        return;
                    }

                    // 永続化
                    const screeningEvent = createScreeningEventFromCOA({
                        performanceFromCOA: scheduleFromCOA,
                        screenRoom: screenRoom,
                        superEvent: screeningEventSeries,
                        serviceKubuns: serviceKubuns,
                        acousticKubuns: acousticKubuns
                    });
                    screeningEvents.push(screeningEvent);
                }
            });

            debug(`storing ${screeningEvents.length} screeningEvents...`);
            await Promise.all(screeningEvents.map(async (screeningEvent) => {
                try {
                    await repos.event.save<factory.eventType.ScreeningEvent>(screeningEvent);
                } catch (error) {
                    // tslint:disable-next-line:no-single-line-block-comment
                    /* istanbul ignore next */
                    // tslint:disable-next-line:no-console
                    console.error(error);
                }
            }));
            debug(`${screeningEvents.length} screeningEvents stored.`);

            // COAから削除されたイベントをキャンセル済ステータスへ変更
            const ids = await repos.event.searchIndividualScreeningEvents({
                typeOf: factory.eventType.ScreeningEvent,
                superEvent: {
                    locationBranchCodes: [params.locationBranchCode]
                },
                startFrom: targetImportFrom.toDate(),
                startThrough: targetImportThrough.toDate()
            }).then((events) => events.map((e) => e.id));
            const idsShouldBe = screeningEvents.map((e) => e.id);
            const cancelledIds = difference(ids, idsShouldBe);
            debug(`cancelling ${cancelledIds.length} events...`);
            await Promise.all(cancelledIds.map(async (id) => {
                try {
                    await repos.event.cancelIndividualScreeningEvent(id);
                } catch (error) {
                    // tslint:disable-next-line:no-single-line-block-comment
                    /* istanbul ignore next */
                    // tslint:disable-next-line:no-console
                    console.error(error);
                }
            }));
            debug(`${cancelledIds.length} events cancelled.`);
        }
    };
}

/**
 * 劇場インポート
 */
export function importMovieTheater(theaterCode: string) {
    return async (repos: {
        place: PlaceRepo;
        seller: SellerRepo;
    }): Promise<void> => {
        const movieTheater = createMovieTheaterFromCOA(
            await COA.services.master.theater({ theaterCode: theaterCode }),
            await COA.services.master.screen({ theaterCode: theaterCode })
        );

        // 場所を保管
        debug('storing movieTheater...', movieTheater);
        await repos.place.saveMovieTheater(movieTheater);
        debug('movieTheater stored.');

        // 組織の属性を更新
        await repos.seller.organizationModel.findOneAndUpdate(
            {
                typeOf: factory.organizationType.MovieTheater,
                'location.branchCode': movieTheater.branchCode
            },
            {
                'name.ja': movieTheater.name.ja,
                'name.en': movieTheater.name.en,
                'location.name.ja': movieTheater.name.ja,
                'location.name.en': movieTheater.name.en,
                telephone: movieTheater.telephone
            }
        ).exec();
    };
}

/**
 * COAデータから上映イベントを作成する
 */
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
export function createScreeningEventFromCOA(params: {
    performanceFromCOA: COA.services.master.IScheduleResult;
    screenRoom: factory.place.movieTheater.IScreeningRoom;
    superEvent: factory.event.screeningEventSeries.IEvent;
    serviceKubuns: COA.services.master.IKubunNameResult[];
    acousticKubuns: COA.services.master.IKubunNameResult[];
}): factory.event.screeningEvent.IEvent {
    const id = createScreeningEventIdFromCOA({
        theaterCode: params.superEvent.location.branchCode,
        titleCode: params.superEvent.workPerformed.identifier,
        titleBranchNum: params.performanceFromCOA.titleBranchNum,
        dateJouei: params.performanceFromCOA.dateJouei,
        screenCode: params.performanceFromCOA.screenCode,
        timeBegin: params.performanceFromCOA.timeBegin
    });

    // COA情報を整形して開始日時と終了日時を作成('2500'のような日またぎの時刻入力に対応)
    let timeEnd = params.performanceFromCOA.timeEnd;
    let addDay = 0;
    try {
        const DAY = 2400;
        addDay += Math.floor(Number(timeEnd) / DAY);
        // tslint:disable-next-line:no-magic-numbers
        timeEnd = `0000${Number(timeEnd) % DAY}`.slice(-4);
    } catch (error) {
        // no op
    }

    const endDate = moment(`${params.performanceFromCOA.dateJouei} ${timeEnd} +09:00`, 'YYYYMMDD HHmm Z').add(addDay, 'days')
        .toDate();
    const startDate = moment(`${params.performanceFromCOA.dateJouei} ${params.performanceFromCOA.timeBegin} +09:00`, 'YYYYMMDD HHmm Z')
        .toDate();

    const coaInfo: factory.event.screeningEvent.ICOAInfo = {
        theaterCode: params.superEvent.location.branchCode,
        dateJouei: params.performanceFromCOA.dateJouei,
        titleCode: params.performanceFromCOA.titleCode,
        titleBranchNum: params.performanceFromCOA.titleBranchNum,
        timeBegin: params.performanceFromCOA.timeBegin,
        timeEnd: params.performanceFromCOA.timeEnd,
        screenCode: params.performanceFromCOA.screenCode,
        trailerTime: params.performanceFromCOA.trailerTime,
        kbnService: params.serviceKubuns.filter((kubun) => kubun.kubunCode === params.performanceFromCOA.kbnService)[0],
        kbnAcoustic: params.acousticKubuns.filter((kubun) => kubun.kubunCode === params.performanceFromCOA.kbnAcoustic)[0],
        nameServiceDay: params.performanceFromCOA.nameServiceDay,
        availableNum: params.performanceFromCOA.availableNum,
        rsvStartDate: params.performanceFromCOA.rsvStartDate,
        rsvEndDate: params.performanceFromCOA.rsvEndDate,
        flgEarlyBooking: params.performanceFromCOA.flgEarlyBooking
    };

    return {
        typeOf: factory.eventType.ScreeningEvent,
        id: id,
        identifier: id,
        name: params.superEvent.name,
        eventStatus: factory.eventStatusType.EventScheduled,
        workPerformed: params.superEvent.workPerformed,
        location: {
            typeOf: <factory.placeType.ScreeningRoom>params.screenRoom.typeOf,
            branchCode: params.screenRoom.branchCode,
            name: params.screenRoom.name
        },
        endDate: endDate,
        startDate: startDate,
        superEvent: params.superEvent,
        coaInfo: coaInfo,
        offers: <any>{},
        checkInCount: 0,
        attendeeCount: 0,
        maximumAttendeeCapacity: params.screenRoom.maximumAttendeeCapacity,
        remainingAttendeeCapacity: params.screenRoom.maximumAttendeeCapacity,
        additionalProperty: [
            {
                name: 'COA_ENDPOINT',
                value: process.env.COA_ENDPOINT
            },
            {
                name: 'coaInfo',
                value: coaInfo
            }
        ]
    };
}

/**
 * COAの作品抽出結果からFilmオブジェクトを作成する
 */
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
export function createScreeningEventSeriesFromCOA(params: {
    filmFromCOA: COA.services.master.ITitleResult;
    movieTheater: factory.place.movieTheater.IPlace;
    eirinKubuns: COA.services.master.IKubunNameResult[];
    eizouKubuns: COA.services.master.IKubunNameResult[];
    joueihousikiKubuns: COA.services.master.IKubunNameResult[];
    jimakufukikaeKubuns: COA.services.master.IKubunNameResult[];
}): factory.event.screeningEventSeries.IEvent {
    const endDate = (moment(`${params.filmFromCOA.dateEnd} +09:00`, 'YYYYMMDD Z').isValid())
        ? moment(`${params.filmFromCOA.dateEnd} +09:00`, 'YYYYMMDD Z').toDate()
        : undefined;
    const startDate = (moment(`${params.filmFromCOA.dateBegin} +09:00`, 'YYYYMMDD Z').isValid())
        ? moment(`${params.filmFromCOA.dateBegin} +09:00`, 'YYYYMMDD Z').toDate()
        : undefined;
    // title_codeは劇場をまたいで共有、title_branch_numは劇場毎に管理
    const id = createScreeningEventSeriesId({
        theaterCode: params.movieTheater.branchCode,
        titleCode: params.filmFromCOA.titleCode,
        titleBranchNum: params.filmFromCOA.titleBranchNum
    });

    return {
        id: id,
        identifier: id,
        name: {
            ja: params.filmFromCOA.titleName,
            en: params.filmFromCOA.titleNameEng
        },
        kanaName: params.filmFromCOA.titleNameKana,
        alternativeHeadline: params.filmFromCOA.titleNameShort,
        location: {
            id: (params.movieTheater.id !== undefined) ? params.movieTheater.id : '',
            branchCode: params.movieTheater.branchCode,
            name: params.movieTheater.name,
            kanaName: params.movieTheater.kanaName,
            typeOf: <factory.placeType.MovieTheater>params.movieTheater.typeOf
        },
        organizer: {
            typeOf: factory.organizationType.MovieTheater,
            identifier: params.movieTheater.id,
            name: params.movieTheater.name
        },
        videoFormat: params.eizouKubuns.filter((kubun) => kubun.kubunCode === params.filmFromCOA.kbnEizou)[0],
        soundFormat: [],
        workPerformed: {
            identifier: params.filmFromCOA.titleCode,
            name: params.filmFromCOA.titleNameOrig,
            duration: moment.duration(params.filmFromCOA.showTime, 'm').toISOString(),
            contentRating: params.eirinKubuns.filter((kubun) => kubun.kubunCode === params.filmFromCOA.kbnEirin)[0],
            typeOf: factory.creativeWorkType.Movie
        },
        duration: moment.duration(params.filmFromCOA.showTime, 'm').toISOString(),
        endDate: endDate,
        startDate: startDate,
        coaInfo: {
            titleBranchNum: params.filmFromCOA.titleBranchNum,
            kbnJoueihousiki: params.joueihousikiKubuns.filter((kubun) => kubun.kubunCode === params.filmFromCOA.kbnJoueihousiki)[0],
            kbnJimakufukikae: params.jimakufukikaeKubuns.filter((kubun) => kubun.kubunCode === params.filmFromCOA.kbnJimakufukikae)[0],
            flgMvtkUse: params.filmFromCOA.flgMvtkUse,
            dateMvtkBegin: params.filmFromCOA.dateMvtkBegin
        },
        eventStatus: factory.eventStatusType.EventScheduled,
        typeOf: factory.eventType.ScreeningEventSeries
    };
}

/**
 * COA情報から上映イベントIDを作成する
 */
export function createScreeningEventIdFromCOA(params: {
    theaterCode: string;
    titleCode: string;
    titleBranchNum: string;
    dateJouei: string;
    screenCode: string;
    timeBegin: string;
}): string {
    return [
        createScreeningEventSeriesId(params),
        params.dateJouei,
        params.screenCode,
        params.timeBegin
    ].join('');
}

/**
 * COA情報から上映イベント識別子を作成する
 */
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
export function createScreeningEventSeriesId(params: {
    theaterCode: string;
    titleCode: string;
    titleBranchNum: string;
}) {
    return [
        params.theaterCode,
        params.titleCode,
        params.titleBranchNum
    ].join('');
}

/**
 * COAのマスター抽出結果から作成する
 */
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
export function createMovieTheaterFromCOA(
    theaterFromCOA: COA.services.master.ITheaterResult,
    screensFromCOA: COA.services.master.IScreenResult[]
): factory.place.movieTheater.IPlace {
    const id = `MovieTheater-${theaterFromCOA.theaterCode}`;

    return {
        id: id,
        screenCount: screensFromCOA.length,
        branchCode: theaterFromCOA.theaterCode,
        name: {
            ja: theaterFromCOA.theaterName,
            en: theaterFromCOA.theaterNameEng
        },
        kanaName: theaterFromCOA.theaterNameKana,
        containsPlace: screensFromCOA.map((screenFromCOA) => {
            return createScreeningRoomFromCOA(screenFromCOA);
        }),
        typeOf: factory.placeType.MovieTheater,
        telephone: theaterFromCOA.theaterTelNum
    };
}

/**
 * COAのスクリーン抽出結果から上映室を作成する
 */
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
export function createScreeningRoomFromCOA(
    screenFromCOA: COA.services.master.IScreenResult
): factory.place.movieTheater.IScreeningRoom {
    const sections: factory.place.movieTheater.IScreeningRoomSection[] = [];
    const sectionCodes: string[] = [];
    screenFromCOA.listSeat.forEach((seat) => {
        if (sectionCodes.indexOf(seat.seatSection) < 0) {
            sectionCodes.push(seat.seatSection);
            sections.push({
                branchCode: seat.seatSection,
                name: {
                    ja: `セクション${seat.seatSection}`,
                    en: `section${seat.seatSection}`
                },
                containsPlace: [],
                typeOf: factory.placeType.ScreeningRoomSection
            });
        }

        sections[sectionCodes.indexOf(seat.seatSection)].containsPlace.push({
            branchCode: seat.seatNum,
            typeOf: factory.placeType.Seat
        });
    });

    return {
        containsPlace: sections,
        branchCode: screenFromCOA.screenCode,
        name: {
            ja: screenFromCOA.screenName,
            en: screenFromCOA.screenNameEng
        },
        typeOf: factory.placeType.ScreeningRoom,
        maximumAttendeeCapacity: sections[0].containsPlace.length
    };
}
