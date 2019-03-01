// tslint:disable:no-implicit-dependencies
/**
 * ownershipInfo repository test
 */
import { } from 'mocha';
import * as mongoose from 'mongoose';
import * as assert from 'power-assert';
import * as sinon from 'sinon';
// tslint:disable-next-line:no-require-imports no-var-requires
require('sinon-mongoose');

import { MongoRepository as OwnershipInfoRepo } from './ownershipInfo';

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.createSandbox();
});

describe('OwnershipInfoRepo.saveByIdentifier()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('MongoDBの状態が正常であれば、保管できるはず', async () => {
        const ownershipInfo = {};

        const repository = new OwnershipInfoRepo(mongoose.connection);

        sandbox.mock(repository.ownershipInfoModel)
            .expects('findOneAndUpdate').once()
            .chain('exec')
            .resolves(new repository.ownershipInfoModel());

        const result = await repository.saveByIdentifier(<any>ownershipInfo);

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('OwnershipInfo.searchProgramMembership', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('theaterIdsがない場合、全ての劇場で検索するはず', async () => {
        const searchConditions = {
            createdAtFrom: new Date(),
            createdAtTo: new Date(),
            theaterIds: []
        };
        const repository = new OwnershipInfoRepo(mongoose.connection);
        const data = [1, 1];
        sandbox.mock(repository.ownershipInfoModel).expects('distinct').once()
            .chain('exec').resolves(data);

        const result = await repository.searchProgramMembership(searchConditions);
        assert.equal(result, data.length);
        sandbox.verify();
    });

    it('theaterIdsが正しい場合、エラーがないはず', async () => {
        const searchConditions = {
            createdAtFrom: new Date(),
            createdAtTo: new Date(),
            theaterIds: ['59d20797e53ebc2b4e774465']
        };
        const repository = new OwnershipInfoRepo(mongoose.connection);
        const data = [1, 1];
        sandbox.mock(repository.ownershipInfoModel).expects('distinct').once()
            .chain('exec').resolves(data);

        const result = await repository.searchProgramMembership(searchConditions);
        assert.equal(result, data.length);
        sandbox.verify();
    });
});
