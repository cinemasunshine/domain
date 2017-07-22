/**
 * 企業ファクトリー
 *
 * @namespace factory/organization/corporation
 */

import IMultilingualString from '../multilingualString';
import * as OrganizationFactory from '../organization';
import CorporationOrganizationIdentifier from '../organizationIdentifier/corporation';
import OrganizationType from '../organizationType';

export interface IOrganization extends OrganizationFactory.IOrganization {
    identifier: CorporationOrganizationIdentifier;
}

export function create(args: {
    identifier: CorporationOrganizationIdentifier;
    name: IMultilingualString;
    legalName?: IMultilingualString;
}): IOrganization {
    const organization = OrganizationFactory.create({
        identifier: args.identifier,
        name: args.name,
        legalName: args.legalName,
        typeOf: OrganizationType.Corporation
    });

    return {
        ...organization,
        ...{
            identifier: args.identifier
        }
    };
}
