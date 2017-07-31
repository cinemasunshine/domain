"use strict";
/**
 * ショップサービス
 *
 * @namespace service/shop
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const organizationType_1 = require("../factory/organizationType");
function open(organization) {
    return (organizationAdapter) => __awaiter(this, void 0, void 0, function* () {
        yield organizationAdapter.organizationModel.findOneAndUpdate({
            identifier: organization.identifier,
            typeOf: organizationType_1.default.MovieTheater
        }, organization, { upsert: true }).exec();
    });
}
exports.open = open;
