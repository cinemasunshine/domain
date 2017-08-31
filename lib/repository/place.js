"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const place_1 = require("./mongoose/model/place");
/**
 * 場所レポジトリー
 *
 * @class PlaceRepository
 */
class PlaceRepository {
    constructor(connection) {
        this.placeModel = connection.model(place_1.default.modelName);
    }
}
exports.default = PlaceRepository;
