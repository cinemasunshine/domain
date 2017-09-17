/**
 * 会員連絡先サービス
 * @namespace service.person.contact
 */

import * as factory from '@motionpicture/sskts-factory';
import * as AWS from 'aws-sdk';
import * as createDebug from 'debug';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

const debug = createDebug('sskts-domain:service:person:contact');

/**
 * retrieve contact from Amazon Cognito
 * @export
 * @function
 * @memberof service.person.contact
 */
export function getContact(accessToken: string) {
    return async () => {
        return new Promise<factory.person.IContact>((resolve, reject) => {
            const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
                apiVersion: 'latest',
                region: 'ap-northeast-1'
            });

            cognitoIdentityServiceProvider.getUser(
                {
                    AccessToken: accessToken
                },
                (err, data) => {
                    if (err instanceof Error) {
                        reject(err);
                    } else {
                        debug('cognito getUserResponse:', data);
                        const contact: factory.person.IContact = {
                            givenName: '',
                            familyName: '',
                            email: '',
                            telephone: ''
                        };

                        data.UserAttributes.forEach((userAttribute) => {
                            switch (userAttribute.Name) {
                                case 'given_name':
                                    contact.givenName = (userAttribute.Value !== undefined) ? userAttribute.Value : '';
                                    break;
                                case 'family_name':
                                    contact.familyName = (userAttribute.Value !== undefined) ? userAttribute.Value : '';
                                    break;
                                case 'email':
                                    contact.email = (userAttribute.Value !== undefined) ? userAttribute.Value : '';
                                    break;
                                case 'phone_number':
                                    if (userAttribute.Value !== undefined) {
                                        // format a phone number to a Japanese style
                                        const phoneUtil = PhoneNumberUtil.getInstance();
                                        const phoneNumber = phoneUtil.parse(userAttribute.Value, 'JP');
                                        contact.telephone = phoneUtil.format(phoneNumber, PhoneNumberFormat.NATIONAL);
                                    }
                                    break;
                                default:
                                    break;
                            }

                        });

                        resolve(contact);
                    }
                });
        });
    };
}

/**
 * 会員プロフィール更新
 * @export
 * @function
 * @memberof service.person.contact
 */
export function updateContact(
    accessToken: string,
    contact: factory.person.IContact
) {
    return async () => {
        return new Promise<void>((resolve, reject) => {
            const phoneUtil = PhoneNumberUtil.getInstance();
            const phoneNumber = phoneUtil.parse(contact.telephone, 'JP');
            debug('isValidNumber:', phoneUtil.isValidNumber(phoneNumber));
            if (!phoneUtil.isValidNumber(phoneNumber)) {
                reject(new factory.errors.Argument('telephone', 'invalid phone number format'));

                return;
            }

            const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
                apiVersion: 'latest',
                region: 'ap-northeast-1'
            });

            cognitoIdentityServiceProvider.updateUserAttributes(
                {
                    AccessToken: accessToken,
                    UserAttributes: [
                        {
                            Name: 'given_name',
                            Value: contact.givenName
                        },
                        {
                            Name: 'family_name',
                            Value: contact.familyName
                        },
                        {
                            Name: 'phone_number',
                            Value: phoneUtil.format(phoneNumber, PhoneNumberFormat.E164)
                        },
                        {
                            Name: 'email',
                            Value: contact.email
                        }
                    ]
                },
                (err) => {
                    if (err instanceof Error) {
                        reject(new factory.errors.Argument('contact', err.message));
                    } else {
                        resolve();
                    }
                });
        });
    };
}
