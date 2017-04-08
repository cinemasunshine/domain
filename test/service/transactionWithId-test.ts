/**
 * 取引(ID指定)サービステスト
 *
 * @ignore
 */
import * as assert from 'assert';
import * as clone from 'clone';
import * as mongoose from 'mongoose';

import ArgumentError from '../../lib/error/argument';
import * as sskts from '../../lib/index';

let connection: mongoose.Connection;
before(async () => {
    connection = mongoose.createConnection(process.env.MONGOLAB_URI);

    // 全て削除してからテスト開始
    const transactionAdapter = sskts.adapter.transaction(connection);
    await transactionAdapter.transactionModel.remove({}).exec();
    await transactionAdapter.transactionEventModel.remove({}).exec();
});

describe('取引成立', () => {
    // todo テストコード
    it('照会可能になっていなければ失敗', async () => {
        const transactionAdapter = sskts.adapter.transaction(connection);

        // 照会キーのないテストデータ作成
        const transaction = sskts.factory.transaction.create({
            status: sskts.factory.transactionStatus.UNDERWAY,
            owners: [],
            expires_at: new Date()
        });
        await transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();

        let closeError: any;
        try {
            await sskts.service.transactionWithId.close(transaction.id)(transactionAdapter);
        } catch (error) {
            closeError = error;
        }

        assert(closeError instanceof Error);

        // テストデータ削除
        await transactionAdapter.transactionModel.findByIdAndRemove(transaction.id).exec();
    });
});

describe('ムビチケ着券承認追加', () => {
    // todo テストコードをかく

    it('成功', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);

        // test data
        const owner1 = sskts.factory.owner.anonymous.create({});
        const owner2 = sskts.factory.owner.anonymous.create({});

        const transaction = sskts.factory.transaction.create({
            status: sskts.factory.transactionStatus.UNDERWAY,
            owners: [owner1, owner2],
            expires_at: new Date()
        });

        const authorization = sskts.factory.authorization.mvtk.create({
            price: 1234,
            owner_from: owner1.id,
            owner_to: owner2.id,
            kgygish_cd: '000000',
            yyk_dvc_typ: '00',
            trksh_flg: '0',
            kgygish_sstm_zskyyk_no: 'xxx',
            kgygish_usr_zskyyk_no: 'xxx',
            jei_dt: '2012/02/01 25:45:00',
            kij_ymd: '2012/02/01',
            st_cd: '0000000000',
            scren_cd: '0000000000',
            knyknr_no_info: [
                {
                    knyknr_no: '0000000000',
                    pin_cd: '0000',
                    knsh_info: [
                        {
                            knsh_typ: '01',
                            mi_num: '1'
                        }
                    ]
                }
            ],
            zsk_info: [
                {
                    zsk_cd: 'Ａ－２'
                }
            ],
            skhn_cd: '0000000000'
        });

        await ownerAdapter.model.findByIdAndUpdate(owner1.id, owner1, { new: true, upsert: true }).exec();
        await ownerAdapter.model.findByIdAndUpdate(owner2.id, owner2, { new: true, upsert: true }).exec();
        const update = Object.assign(clone(transaction), { owners: transaction.owners.map((owner) => owner.id) });
        await transactionAdapter.transactionModel.findByIdAndUpdate(update.id, update, { new: true, upsert: true }).exec();

        await sskts.service.transactionWithId.addMvtkAuthorization(transaction.id, authorization)(transactionAdapter);

        // 取引イベントからオーソリIDで検索して、取引IDの一致を確認
        const transactionEvent = await transactionAdapter.transactionEventModel.findOne(
            {
                'authorization.id': authorization.id
            }
        ).exec();
        assert.equal(transactionEvent.get('transaction'), transaction.id);

        await transactionAdapter.transactionEventModel.remove({ transaction: transaction.id }).exec();
        await transactionAdapter.transactionModel.findByIdAndRemove(transaction.id).exec();
        await ownerAdapter.model.findByIdAndRemove(owner1.id).exec();
        await ownerAdapter.model.findByIdAndRemove(owner2.id).exec();
    });

    it('取引が存在しなければ失敗', async () => {
        const transactionAdapter = sskts.adapter.transaction(connection);

        // test data
        const owner1 = sskts.factory.owner.anonymous.create({});
        const owner2 = sskts.factory.owner.anonymous.create({});

        const transaction = sskts.factory.transaction.create({
            status: sskts.factory.transactionStatus.UNDERWAY,
            owners: [owner1, owner2],
            expires_at: new Date()
        });

        const authorization = sskts.factory.authorization.mvtk.create({
            price: 1234,
            owner_from: owner1.id,
            owner_to: owner2.id,
            kgygish_cd: '000000',
            yyk_dvc_typ: '00',
            trksh_flg: '0',
            kgygish_sstm_zskyyk_no: 'xxx',
            kgygish_usr_zskyyk_no: 'xxx',
            jei_dt: '2012/02/01 25:45:00',
            kij_ymd: '2012/02/01',
            st_cd: '0000000000',
            scren_cd: '0000000000',
            knyknr_no_info: [
                {
                    knyknr_no: '0000000000',
                    pin_cd: '0000',
                    knsh_info: [
                        {
                            knsh_typ: '01',
                            mi_num: '1'
                        }
                    ]
                }
            ],
            zsk_info: [
                {
                    zsk_cd: 'Ａ－２'
                }
            ],
            skhn_cd: '0000000000'
        });

        let addMvtkAuthorizationError: any;
        try {
            await sskts.service.transactionWithId.addMvtkAuthorization(transaction.id, authorization)(
                transactionAdapter
            );
        } catch (error) {
            addMvtkAuthorizationError = error;
        }

        assert(addMvtkAuthorizationError instanceof ArgumentError);
        assert.equal((<ArgumentError>addMvtkAuthorizationError).argumentName, 'transactionId');
    });

    it('所有者が存在しなければ失敗', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);

        // test data
        const owner1 = sskts.factory.owner.anonymous.create({});
        const owner2 = sskts.factory.owner.anonymous.create({});

        const transaction = sskts.factory.transaction.create({
            status: sskts.factory.transactionStatus.UNDERWAY,
            owners: [],
            expires_at: new Date()
        });

        const authorization = sskts.factory.authorization.mvtk.create({
            price: 1234,
            owner_from: owner1.id,
            owner_to: 'xxx', // 取引に存在しない所有者を設定
            kgygish_cd: '000000',
            yyk_dvc_typ: '00',
            trksh_flg: '0',
            kgygish_sstm_zskyyk_no: 'xxx',
            kgygish_usr_zskyyk_no: 'xxx',
            jei_dt: '2012/02/01 25:45:00',
            kij_ymd: '2012/02/01',
            st_cd: '0000000000',
            scren_cd: '0000000000',
            knyknr_no_info: [
                {
                    knyknr_no: '0000000000',
                    pin_cd: '0000',
                    knsh_info: [
                        {
                            knsh_typ: '01',
                            mi_num: '1'
                        }
                    ]
                }
            ],
            zsk_info: [
                {
                    zsk_cd: 'Ａ－２'
                }
            ],
            skhn_cd: '0000000000'
        });

        await ownerAdapter.model.findByIdAndUpdate(owner1.id, owner1, { new: true, upsert: true }).exec();
        await ownerAdapter.model.findByIdAndUpdate(owner2.id, owner2, { new: true, upsert: true }).exec();
        const update = Object.assign(clone(transaction), { owners: transaction.owners.map((owner) => owner.id) });
        await transactionAdapter.transactionModel.findByIdAndUpdate(update.id, update, { new: true, upsert: true }).exec();

        let addMvtkAuthorizationError: any;
        try {
            await sskts.service.transactionWithId.addMvtkAuthorization(transaction.id, authorization)(
                transactionAdapter
            );
        } catch (error) {
            addMvtkAuthorizationError = error;
        }

        assert(addMvtkAuthorizationError instanceof ArgumentError);
        assert.equal((<ArgumentError>addMvtkAuthorizationError).argumentName, 'authorization.owner_from');

        await transactionAdapter.transactionModel.findByIdAndRemove(transaction.id).exec();
        await ownerAdapter.model.findByIdAndRemove(owner1.id).exec();
        await ownerAdapter.model.findByIdAndRemove(owner2.id).exec();
    });
});

describe('承認削除', () => {
    it('取引が存在しなければ失敗', async () => {
        const transactionAdapter = sskts.adapter.transaction(connection);

        // test data
        const owner1 = sskts.factory.owner.anonymous.create({});
        const owner2 = sskts.factory.owner.anonymous.create({});

        const transaction = sskts.factory.transaction.create({
            status: sskts.factory.transactionStatus.UNDERWAY,
            owners: [owner1, owner2],
            expires_at: new Date()
        });

        const authorization = sskts.factory.authorization.gmo.create({
            price: 1234,
            owner_from: 'xxx',
            owner_to: 'xxx',
            gmo_shop_id: 'xxx',
            gmo_shop_pass: 'xxx',
            gmo_order_id: 'xxx',
            gmo_amount: 1234,
            gmo_access_id: 'xxx',
            gmo_access_pass: 'xxx',
            gmo_job_cd: 'xxx',
            gmo_pay_type: 'xxx'
        });

        let removeAuthorizationError: any;
        try {
            await sskts.service.transactionWithId.removeAuthorization(transaction.id, authorization.id)(transactionAdapter);
        } catch (error) {
            removeAuthorizationError = error;
        }

        assert(removeAuthorizationError instanceof ArgumentError);
        assert.equal((<ArgumentError>removeAuthorizationError).argumentName, 'transactionId');
    });

    it('承認が存在しなければ失敗', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);

        // test data
        const owner1 = sskts.factory.owner.anonymous.create({});
        const owner2 = sskts.factory.owner.anonymous.create({});

        const transaction = sskts.factory.transaction.create({
            status: sskts.factory.transactionStatus.UNDERWAY,
            owners: [owner1, owner2],
            expires_at: new Date()
        });

        const authorization = sskts.factory.authorization.gmo.create({
            price: 1234,
            owner_from: 'xxx',
            owner_to: 'xxx',
            gmo_shop_id: 'xxx',
            gmo_shop_pass: 'xxx',
            gmo_order_id: 'xxx',
            gmo_amount: 1234,
            gmo_access_id: 'xxx',
            gmo_access_pass: 'xxx',
            gmo_job_cd: 'xxx',
            gmo_pay_type: 'xxx'
        });

        await ownerAdapter.model.findByIdAndUpdate(owner1.id, owner1, { new: true, upsert: true }).exec();
        await ownerAdapter.model.findByIdAndUpdate(owner2.id, owner2, { new: true, upsert: true }).exec();
        const update = Object.assign(clone(transaction), { owners: transaction.owners.map((owner) => owner.id) });
        await transactionAdapter.transactionModel.findByIdAndUpdate(update.id, update, { new: true, upsert: true }).exec();

        let removeAuthorizationError: ArgumentError | undefined;
        try {
            await sskts.service.transactionWithId.removeAuthorization(transaction.id, authorization.id)(transactionAdapter);
        } catch (error) {
            removeAuthorizationError = error;
        }

        assert(removeAuthorizationError instanceof ArgumentError);
        assert.equal((<ArgumentError>removeAuthorizationError).argumentName, 'authorizationId');

        await transactionAdapter.transactionModel.findByIdAndRemove(transaction.id).exec();
        await ownerAdapter.model.findByIdAndRemove(owner1.id).exec();
        await ownerAdapter.model.findByIdAndRemove(owner2.id).exec();
    });
});
