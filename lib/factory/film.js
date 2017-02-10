"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const film_1 = require("../model/film");
/**
 * 作品ファクトリー
 *
 * @namespace
 */
var FilmFactory;
(function (FilmFactory) {
    function create(args) {
        return new film_1.default(args._id, args.coa_title_code, args.coa_title_branch_num, args.theater, args.name, args.name_kana, // 作品タイトル名（カナ）
        args.name_short, // 作品タイトル名省略
        args.name_original, // 原題
        args.minutes, // 上映時間
        args.date_start, // 公演開始予定日※日付は西暦8桁 "YYYYMMDD"
        args.date_end, // 公演終了予定日※日付は西暦8桁 "YYYYMMDD"
        (args.kbn_eirin === undefined) ? "" : args.kbn_eirin, (args.kbn_eizou === undefined) ? "" : args.kbn_eizou, (args.kbn_joueihousiki === undefined) ? "" : args.kbn_joueihousiki, (args.kbn_jimakufukikae === undefined) ? "" : args.kbn_jimakufukikae);
    }
    FilmFactory.create = create;
    ;
    function createFromCOA(filmFromCOA) {
        return (theater) => __awaiter(this, void 0, void 0, function* () {
            return create({
                // title_codeは劇場をまたいで共有、title_branch_numは劇場毎に管理
                _id: `${theater._id}${filmFromCOA.title_code}${filmFromCOA.title_branch_num}`,
                coa_title_code: filmFromCOA.title_code,
                coa_title_branch_num: filmFromCOA.title_branch_num,
                theater: theater,
                name: {
                    ja: filmFromCOA.title_name,
                    en: filmFromCOA.title_name_eng,
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
            });
        });
    }
    FilmFactory.createFromCOA = createFromCOA;
})(FilmFactory || (FilmFactory = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FilmFactory;
