/**
 * 劇場の上映イベントファクトリー
 *
 * @namespace factory/creativeWork/movie
 */

import * as COA from '@motionpicture/coa-service';
import * as moment from 'moment';

import CreativeWorkType from '../creativeWorkType';
import * as EventFactory from '../event';
import EventStatusType from '../eventStatusType';
import EventType from '../eventType';
import IMultilingualString from '../multilingualString';
import * as MovieTheaterPlaceFactory from '../place/movieTheater';
import PlaceType from '../placeType';

export interface IEvent extends EventFactory.IEvent {
    videoFormat: string; // 映像区分(２D、３D)
    workPerformed: { // 上映作品
        identifier: string; // COAタイトルコード
        name: string; // 原題
        duration: string; // 上映時間
        contentRating: string; // 映倫区分(PG12,R15,R18)
        typeOf: CreativeWorkType
    };
    location: {
        typeOf: PlaceType;
        branchCode: string; // 劇場コード
        name: IMultilingualString;
        kanaName: string;
    };
    // organizer: MovieTheaterOrganizationFactory.IOrganization // 提供劇場

    kanaName: string; // 作品タイトル名（カナ）
    alternativeHeadline: string; // 作品タイトル名省略
    name: IMultilingualString;

    endDate?: Date; // 公演終了予定日
    startDate?: Date; // 公演開始予定日
    coaInfo: {
        titleBranchNum: string;
        kbnJoueihousiki: string, // 上映方式区分(ＩＭＡＸ，４ＤＸ等)
        kbnJimakufukikae: string, // 字幕吹替区分(字幕、吹き替え)
        /**
         * ムビチケ使用フラグ
         * 1：ムビチケ使用対象
         */
        flgMvtkUse: string,
        /**
         * ムビチケ利用開始日
         * ※日付は西暦8桁 "YYYYMMDD"
         */
        dateMvtkBegin: string
    };
}

/**
 * COAの作品抽出結果からFilmオブジェクトを作成する
 */
export function createFromCOA(filmFromCOA: COA.services.master.ITitleResult) {
    return (movieTheater: MovieTheaterPlaceFactory.IPlace): IEvent => {
        const endDate = (moment(filmFromCOA.dateEnd, 'YYYYMMDD').isValid())
            ? moment(filmFromCOA.dateEnd, 'YYYYMMDD').toDate()
            : undefined;
        const startDate = (moment(filmFromCOA.dateBegin, 'YYYYMMDD').isValid())
            ? moment(filmFromCOA.dateBegin, 'YYYYMMDD').toDate()
            : undefined;

        return {
            // title_codeは劇場をまたいで共有、title_branch_numは劇場毎に管理
            identifier: createIdentifier(movieTheater.branchCode, filmFromCOA.titleCode, filmFromCOA.titleBranchNum),
            name: {
                ja: filmFromCOA.titleName,
                en: filmFromCOA.titleNameEng
            },
            kanaName: filmFromCOA.titleNameKana,
            alternativeHeadline: filmFromCOA.titleNameShort,
            location: {
                branchCode: movieTheater.branchCode,
                name: movieTheater.name,
                kanaName: movieTheater.kanaName,
                typeOf: movieTheater.typeOf
            },
            videoFormat: filmFromCOA.kbnEizou,
            workPerformed: {
                identifier: filmFromCOA.titleCode,
                name: filmFromCOA.titleNameOrig,
                duration: moment.duration(filmFromCOA.showTime, 'M').toISOString(),
                contentRating: filmFromCOA.kbnEirin,
                typeOf: CreativeWorkType.Movie
            },
            duration: moment.duration(filmFromCOA.showTime, 'M').toISOString(),
            endDate: endDate,
            startDate: startDate,
            coaInfo: {
                titleBranchNum: filmFromCOA.titleBranchNum,
                kbnJoueihousiki: filmFromCOA.kbnJoueihousiki,
                kbnJimakufukikae: filmFromCOA.kbnJimakufukikae,
                flgMvtkUse: filmFromCOA.flgMvtkUse,
                dateMvtkBegin: filmFromCOA.dateMvtkBegin
            },
            eventStatus: EventStatusType.EventScheduled,
            typeOf: EventType.ScreeningEvent
        };
    };
}

export function createIdentifier(theaterCode: string, titleCode: string, titleBranchNum: string) {
    return `${theaterCode}${titleCode}${titleBranchNum}`;
}
