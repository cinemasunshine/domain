"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 取引照会無効化キューファクトリー
 *
 * @namespace DisableTransactionInquiryQueueFactory
 */
const validator = require("validator");
const argument_1 = require("../../error/argument");
const argumentNull_1 = require("../../error/argumentNull");
const objectId_1 = require("../objectId");
const queueGroup_1 = require("../queueGroup");
function create(args) {
    if (validator.isEmpty(args.status))
        throw new argumentNull_1.default('status');
    if (!(args.run_at instanceof Date))
        throw new argument_1.default('run_at', 'run_at should be Date');
    return {
        id: (args.id === undefined) ? objectId_1.default().toString() : args.id,
        group: queueGroup_1.default.DISABLE_TRANSACTION_INQUIRY,
        status: args.status,
        run_at: args.run_at,
        max_count_try: args.max_count_try,
        last_tried_at: args.last_tried_at,
        count_tried: args.count_tried,
        results: args.results,
        transaction: args.transaction
    };
}
exports.create = create;
