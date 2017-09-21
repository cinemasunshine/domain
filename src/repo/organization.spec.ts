/**
 * organization repository test
 * @ignore
 */

import * as assert from 'power-assert';
import * as sinon from 'sinon';
// tslint:disable-next-line:no-require-imports
// tslint:disable-next-line:no-var-requires
require('sinon-mongoose');
import * as sskts from '../index';

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.sandbox.create();
});

describe('findMovieTheaterById()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('劇場が存在すれば、取得できるはず', async () => {
        const theaterId = 'theaterId';

        const repository = new sskts.repository.Organization(sskts.mongoose.connection);

        sandbox.mock(repository.organizationModel)
            .expects('findOne').once()
            .chain('exec')
            .resolves(new repository.organizationModel());

        const result = await repository.findMovieTheaterById(theaterId);

        assert.notEqual(result, undefined);
        sandbox.verify();
    });
});

describe('openMovieTheaterShop()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('MongoDBの状態が正常であれば、保管できるはず', async () => {
        const movieTheater = { id: 'id' };

        const repository = new sskts.repository.Organization(sskts.mongoose.connection);

        sandbox.mock(repository.organizationModel)
            .expects('findOneAndUpdate').once()
            .chain('exec')
            .resolves(new repository.organizationModel());

        const result = await repository.openMovieTheaterShop(<any>movieTheater);

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('searchMovieTheaters()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('MongoDBの状態が正常であれば、配列が返却されるはず', async () => {
        const conditions = {};

        const repository = new sskts.repository.Organization(sskts.mongoose.connection);

        sandbox.mock(repository.organizationModel)
            .expects('find').once()
            .chain('exec')
            .resolves([new repository.organizationModel()]);

        const result = await repository.searchMovieTheaters(conditions);

        assert(Array.isArray(result));
        sandbox.verify();
    });
});

describe('findMovieTheaterByBranchCode()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('MongoDBの状態が正常であれば、配列が返却されるはず', async () => {
        const branchCode = 'branchCode';

        const repository = new sskts.repository.Organization(sskts.mongoose.connection);

        sandbox.mock(repository.organizationModel)
            .expects('findOne').once()
            .chain('exec')
            .resolves(new repository.organizationModel());

        const result = await repository.findMovieTheaterByBranchCode(branchCode);

        assert.notEqual(result, undefined);
        sandbox.verify();
    });
});