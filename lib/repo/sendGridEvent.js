"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendGridEvent_1 = require("./mongoose/model/sendGridEvent");
/**
 * SendGridイベントレポジトリー
 *
 * @class SendGridEventRepository
 */
class SendGridEventRepository {
    constructor(connection) {
        this.sendGridEventModel = connection.model(sendGridEvent_1.default.modelName);
    }
}
exports.default = SendGridEventRepository;
