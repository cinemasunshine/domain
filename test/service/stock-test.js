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
/**
 * 在庫サービステスト
 *
 * @ignore
 */
const assert = require("assert");
const mongoose = require("mongoose");
const argument_1 = require("../../lib/error/argument");
const asset_1 = require("../../lib/adapter/asset");
const owner_1 = require("../../lib/adapter/owner");
const transaction_1 = require("../../lib/adapter/transaction");
// import AssetGroup from '../../lib/factory/assetGroup';
const CoaSeatReservationAuthorizationFactory = require("../../lib/factory/authorization/coaSeatReservation");
// import AuthorizationGroup from '../../lib/factory/authorizationGroup';
const objectId_1 = require("../../lib/factory/objectId");
const TransactionFactory = require("../../lib/factory/transaction");
const StockService = require("../../lib/service/stock");
let connection;
before(() => {
    connection = mongoose.createConnection(process.env.MONGOLAB_URI);
});
describe('在庫サービス 取引照会無効化', () => {
    it('照会キーがなければ失敗', () => __awaiter(this, void 0, void 0, function* () {
        const transactionAdapter = new transaction_1.default(connection);
        const transaction = TransactionFactory.create({
            status: 'UNDERWAY',
            owners: [],
            expires_at: new Date()
        });
        let disableTransactionInquiryError;
        try {
            yield StockService.disableTransactionInquiry(transaction)(transactionAdapter);
        }
        catch (error) {
            disableTransactionInquiryError = error;
        }
        assert(disableTransactionInquiryError instanceof argument_1.default);
        assert.equal(disableTransactionInquiryError.argumentName, 'transaction.inquiry_key');
    }));
});
describe('在庫サービス 座席予約資産移動', () => {
    it('成功', () => __awaiter(this, void 0, void 0, function* () {
        const assetAdapter = new asset_1.default(connection);
        const ownerAdapter = new owner_1.default(connection);
        const authorization = {
            assets: [
                {
                    kbn_eisyahousiki: '00',
                    add_glasses: 0,
                    mvtk_app_price: 0,
                    sale_price: 2800,
                    dis_price: 0,
                    add_price: 1000,
                    std_price: 1800,
                    ticket_name_kana: 'トウジツイッパン',
                    ticket_name_en: 'General Price',
                    ticket_name_ja: '当日一般',
                    ticket_code: '10',
                    seat_code: 'Ａ－３',
                    section: '   ',
                    performance: '001201701208513021010',
                    authorizations: [],
                    price: 2800,
                    group: 'SEAT_RESERVATION',
                    ownership: {
                        authenticated: false,
                        owner: '58e344ac36a44424c0997dad',
                        id: '58e344b236a44424c0997dae'
                    },
                    id: '58e344b236a44424c0997daf'
                },
                {
                    kbn_eisyahousiki: '00',
                    add_glasses: 0,
                    mvtk_app_price: 0,
                    sale_price: 2800,
                    dis_price: 0,
                    add_price: 1000,
                    std_price: 1800,
                    ticket_name_kana: 'トウジツイッパン',
                    ticket_name_en: 'General Price',
                    ticket_name_ja: '当日一般',
                    ticket_code: '10',
                    seat_code: 'Ａ－４',
                    section: '   ',
                    performance: '001201701208513021010',
                    authorizations: [],
                    price: 2800,
                    group: 'SEAT_RESERVATION',
                    ownership: {
                        authenticated: false,
                        owner: '58e344ac36a44424c0997dad',
                        id: '58e344b236a44424c0997db0'
                    },
                    id: '58e344b236a44424c0997db1'
                }
            ],
            owner_to: '58e344ac36a44424c0997dad',
            owner_from: '5868e16789cc75249cdbfa4b',
            price: 5600,
            coa_screen_code: '60',
            coa_time_begin: '0950',
            coa_title_branch_num: '0',
            coa_title_code: '17165',
            coa_date_jouei: '20170404',
            coa_theater_code: '118',
            coa_tmp_reserve_num: 1103,
            group: 'COA_SEAT_RESERVATION',
            id: '58e344b236a44424c0997db2'
        };
        yield StockService.transferCOASeatReservation(authorization)(assetAdapter, ownerAdapter);
        // 資産の存在を確認
        const asset1Doc = yield assetAdapter.model.findById('58e344b236a44424c0997daf').exec();
        assert.notEqual(asset1Doc, null);
        assert.equal(asset1Doc.get('performance'), '001201701208513021010');
        assert.equal(asset1Doc.get('seat_code'), 'Ａ－３');
        assert.equal(asset1Doc.get('ownership').owner, '58e344ac36a44424c0997dad');
        const asset2Doc = yield assetAdapter.model.findById('58e344b236a44424c0997db1').exec();
        assert.notEqual(asset2Doc, null);
        assert.equal(asset2Doc.get('performance'), '001201701208513021010');
        assert.equal(asset2Doc.get('seat_code'), 'Ａ－４');
        assert.equal(asset2Doc.get('ownership').owner, '58e344ac36a44424c0997dad');
    }));
    it('所有者が存在しないので座席予約資産移動失敗', () => __awaiter(this, void 0, void 0, function* () {
        const assetAdapter = new asset_1.default(connection);
        const ownerAdapter = new owner_1.default(connection);
        const authorization = CoaSeatReservationAuthorizationFactory.create({
            price: 4000,
            owner_from: '5868e16789cc75249cdbfa4b',
            owner_to: objectId_1.default().toString(),
            coa_tmp_reserve_num: 995,
            coa_theater_code: '118',
            coa_date_jouei: '20170403',
            coa_title_code: '16344',
            coa_title_branch_num: '0',
            coa_time_begin: '1000',
            coa_screen_code: '30',
            assets: []
        });
        try {
            yield StockService.transferCOASeatReservation(authorization)(assetAdapter, ownerAdapter);
        }
        catch (error) {
            assert(error instanceof argument_1.default);
            assert.equal(error.argumentName, 'authorization.owner_to');
            return;
        }
        throw new Error('should not be passed');
    }));
    it('所有者が一般所有者ではないので座席予約資産移動失敗', () => __awaiter(this, void 0, void 0, function* () {
        const assetAdapter = new asset_1.default(connection);
        const ownerAdapter = new owner_1.default(connection);
        // テストデータ作成
        const ownerDoc = yield ownerAdapter.model.create({ group: 'xxx' });
        const authorization = CoaSeatReservationAuthorizationFactory.create({
            price: 4000,
            owner_from: '5868e16789cc75249cdbfa4b',
            owner_to: ownerDoc.get('id'),
            coa_tmp_reserve_num: 995,
            coa_theater_code: '118',
            coa_date_jouei: '20170403',
            coa_title_code: '16344',
            coa_title_branch_num: '0',
            coa_time_begin: '1000',
            coa_screen_code: '30',
            assets: []
        });
        let transferCOASeatReservationError;
        try {
            yield StockService.transferCOASeatReservation(authorization)(assetAdapter, ownerAdapter);
        }
        catch (error) {
            transferCOASeatReservationError = error;
        }
        // テストデータ削除
        ownerDoc.remove();
        assert(transferCOASeatReservationError instanceof Error);
    }));
});
