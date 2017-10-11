<img src="https://motionpicture.jp/images/common/logo_01.svg" alt="motionpicture" title="motionpicture" align="right" height="56" width="98"/>

# SSKTS Domain Library for Node.js

[![CircleCI](https://circleci.com/gh/motionpicture/sskts-domain.svg?style=svg&circle-token=26025d5a2df8ffd61173c72bbc1257fc6a2ad66d)](https://circleci.com/gh/motionpicture/sskts-domain)

SSKTSのバックエンドサービスをnode.jsで簡単に使用するためのパッケージを提供します。


## Table of contents

* [Usage](#usage)
* [Code Samples](#code-samples)
* [Jsdoc](#jsdoc)
* [License](#license)


## Usage

``` shell
npm install @motionpicture/sskts-domain
```

## Required environment variables
``` shell
set NPM_TOKEN=**********private packageをインストールするためのトークン**********
set NODE_ENV=**********環境名**********
set SENDGRID_API_KEY=**********sendgrid api key**********
set GMO_ENDPOINT=**********gmo apiのエンドポイント**********
set COA_ENDPOINT=**********coa apiのエンドポイント**********
set COA_REFRESH_TOKEN=**********coa apiのリフレッシュトークン**********
set SSKTS_DEVELOPER_EMAIL=**********本apiで使用される開発者メールアドレス**********
set SSKTS_DEVELOPER_LINE_NOTIFY_ACCESS_TOKEN=**********開発者へのLINE通知に必要なアクセストークン**********
set GMO_SITE_ID=**********システムで契約するGMOサイトID**********
set GMO_SITE_PASS=**********システムで契約するGMOサイトパス**********
set AZURE_STORAGE_CONNECTION_STRING=**********csv等ファイル保管に使用するBlobStorage接続文字列**********
```

only for test  
``` shell
set TEST_REDIS_HOST=**********テスト時に使用するredis情報**********
set TEST_REDIS_PORT=**********テスト時に使用するredis情報**********
set TEST_REDIS_KEY=**********テスト時に使用するredis情報**********
```

``` js
const sskts = require('@motionpicture/sskts-domain');
```

## Code Samples

コードサンプルは [example](https://github.com/motionpicture/sskts-domain/tree/master/example) にあります。

## Jsdoc

`npm run doc`でjsdocを作成できます。./docに出力されます。

# License

UNLICENSED
