"use strict";
/**
 * 作品ファクトリー
 *
 * @namespace factory/film
 *
 * @param {string} id
 * @param {string} coa_title_code COA作品コード
 * @param {string} coa_title_branch_num COA作品枝番
 * @param {Theater} theater 劇場
 * @param {MultilingualString} name 名称
 * @param {string} name_kana 作品タイトル名（カナ）
 * @param {string} name_short 作品タイトル名省略
 * @param {string} name_original 原題
 * @param {number} minutes 上映時間
 * @param {string} date_start 公演開始予定日※日付は西暦8桁 "YYYYMMDD"
 * @param {string} date_end 公演終了予定日※日付は西暦8桁 "YYYYMMDD"
 * @param {string} kbn_eirin 映倫区分
 * @param {string} kbn_eizou 映像区分
 * @param {string} kbn_joueihousiki 上映方式区分
 * @param {string} kbn_jimakufukikae 字幕吹替区分
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * COAの作品抽出結果からFilmオブジェクトを作成する
 *
 * @param {COA.services.master.TitleResult} filmFromCOA
 * @memberof tobereplaced$
 */
function createFromCOA(filmFromCOA) {
    return (theater) => {
        return {
            // title_codeは劇場をまたいで共有、title_branch_numは劇場毎に管理
            id: `${theater.id}${filmFromCOA.title_code}${filmFromCOA.title_branch_num}`,
            coa_title_code: filmFromCOA.title_code,
            coa_title_branch_num: filmFromCOA.title_branch_num,
            theater: theater.id,
            name: {
                ja: filmFromCOA.title_name,
                en: filmFromCOA.title_name_eng
            },
            name_kana: filmFromCOA.title_name_kana,
            name_short: filmFromCOA.title_name_short,
            name_original: filmFromCOA.title_name_orig,
            minutes: filmFromCOA.show_time,
            date_start: filmFromCOA.date_begin,
            date_end: filmFromCOA.date_end,
            kbn_eirin: filmFromCOA.kbn_eirin,
            kbn_eizou: filmFromCOA.kbn_eizou,
            kbn_joueihousiki: filmFromCOA.kbn_joueihousiki,
            kbn_jimakufukikae: filmFromCOA.kbn_jimakufukikae,
            copyright: '',
            flg_mvtk_use: filmFromCOA.flg_mvtk_use,
            date_mvtk_begin: filmFromCOA.date_mvtk_begin
        };
    };
}
exports.createFromCOA = createFromCOA;
