/**
 * 作品リポジトリ
 *
 * @class FilmAdapter
 */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone = require("clone");
const createDebug = require("debug");
const monapt = require("monapt");
const film_1 = require("./mongoose/model/film");
const debug = createDebug('sskts-domain:adapter:film');
class FilmAdapter {
    constructor(connection) {
        this.connection = connection;
        this.model = this.connection.model(film_1.default.modelName);
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.findById(id).exec();
            return (doc) ? monapt.Option(doc.toObject()) : monapt.None;
        });
    }
    store(film) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('updating...', film);
            const update = clone(film, false);
            yield this.model.findByIdAndUpdate(update.id, update, {
                new: true,
                upsert: true
            }).lean().exec();
        });
    }
}
exports.default = FilmAdapter;
