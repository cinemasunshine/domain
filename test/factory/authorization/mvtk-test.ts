/**
 * ムビチケ着券情報ファクトリーテスト
 *
 * @ignore
 */
import * as assert from 'assert';

import ArgumentError from '../../../lib/error/argument';
import * as MvtkAuthorizationFactory from '../../../lib/factory/authorization/mvtk';

describe('mvtkAuthorization factory', () => {
    it('create ok', () => {
        MvtkAuthorizationFactory.create({
            price: 1234,
            owner_from: 'xxx',
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
    });

    it('create ng because knyknr_no_info is empty', () => {
        let createError: any;
        try {
            MvtkAuthorizationFactory.create({
                price: 1234,
                owner_from: 'xxx',
                owner_to: 'xxx',
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
                ],
                zsk_info: [
                    {
                        zsk_cd: 'Ａ－２'
                    }
                ],
                skhn_cd: '0000000000'
            });
        } catch (error) {
            createError = error;
        }

        assert(createError instanceof ArgumentError);
    });
});
