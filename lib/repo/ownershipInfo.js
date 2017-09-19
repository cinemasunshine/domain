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
const ownershipInfo_1 = require("./mongoose/model/ownershipInfo");
/**
 * 所有権レポジトリー
 *
 * @class OwnershipInfoRepository
 */
class MongoRepository {
    constructor(connection) {
        this.ownershipInfoModel = connection.model(ownershipInfo_1.default.modelName);
    }
    /**
     * save an ownershipInfo
     * 所有権情報を保管する
     * @param ownershipInfo ownershipInfo object
     */
    save(ownershipInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ownershipInfoModel.findOneAndUpdate({
                identifier: ownershipInfo.identifier
            }, ownershipInfo, { upsert: true }).exec();
        });
    }
    /**
     * 上映イベント予約の所有権を検索する
     */
    searchScreeningEventReservation(searchConditions) {
        return __awaiter(this, void 0, void 0, function* () {
            const andConditions = [
                { 'typeOfGood.typeOf': 'EventReservation' },
                { 'typeOfGood.reservationFor.typeOf': 'IndividualScreeningEvent' } // 予約対象が個々の上映イベント
            ];
            // 誰の所有か
            if (searchConditions.ownedBy !== undefined) {
                andConditions.push({
                    'ownedBy.id': searchConditions.ownedBy
                });
            }
            // いつの時点での所有か
            if (searchConditions.ownedAt instanceof Date) {
                andConditions.push({
                    ownedFrom: { $lte: searchConditions.ownedAt },
                    ownedThrough: { $gte: searchConditions.ownedAt }
                });
            }
            return yield this.ownershipInfoModel.find({ $and: andConditions })
                .sort({ ownedFrom: 1 })
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));
        });
    }
}
exports.MongoRepository = MongoRepository;
