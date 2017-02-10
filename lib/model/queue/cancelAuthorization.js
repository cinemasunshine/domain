"use strict";
const queue_1 = require("../queue");
const queueGroup_1 = require("../queueGroup");
/**
 * オーソリ解除キュー
 *
 *
 * @class CancelAuthorizationQueue
 * @extends {Queue}
 * @template T
 */
class CancelAuthorizationQueue extends queue_1.default {
    /**
     * Creates an instance of CancelAuthorizationQueue.
     *
     * @param {ObjectId} _id
     * @param {QueueStatus} status
     * @param {Date} run_at
     * @param {number} max_count_try
     * @param {(Date | null)} last_tried_at
     * @param {number} count_tried
     * @param {Array<string>} results
     * @param {T} authorization
     *
     * @memberOf CancelAuthorizationQueue
     */
    constructor(_id, status, run_at, max_count_try, last_tried_at, count_tried, results, authorization) {
        super(_id, queueGroup_1.default.CANCEL_AUTHORIZATION, status, run_at, max_count_try, last_tried_at, count_tried, results);
        this._id = _id;
        this.status = status;
        this.run_at = run_at;
        this.max_count_try = max_count_try;
        this.last_tried_at = last_tried_at;
        this.count_tried = count_tried;
        this.results = results;
        this.authorization = authorization;
        // TODO validation
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CancelAuthorizationQueue;
