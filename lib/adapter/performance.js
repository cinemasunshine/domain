"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const performance_1 = require("./mongoose/model/performance");
class PerformanceAdapter {
    constructor(connection) {
        this.connection = connection;
        this.model = this.connection.model(performance_1.default.modelName);
    }
}
exports.default = PerformanceAdapter;
