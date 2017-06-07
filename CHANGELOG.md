# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Unreleased
### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## v16.0.0 - 2017-06-07
### Added
- 取引数をカウントアダプターをRedisCacheで実装。
- RedisCacheを使用して取引が利用可能かどうかを確認するサービスを追加。

### Changed
- 取引開始サービスを、redisで取引数制限をチェックする仕様に変更。

### Removed
- 強制取引開始サービスは不要なので削除。

## v15.3.1 - 2017-06-07
### Security
- npm@^5.0.0の導入に伴い、package-lock.jsonを追加。

## v15.3.0 - 2017-06-06
### Added
- 劇場検索サービスを追加(検索条件は未実装)。

### Fixed
- 劇場mongooseモデルにwebsitesフィールドが不足していたので追加。

## v15.2.0 - 2017-06-06
### Added
- パフォーマンス検索サービスの結果に作品上映時間フィールドを追加。

## v15.1.1 - 2017-06-05
### Changed
- パッケージを最新にアップデート
- [tslint@^5.4.2](https://github.com/palantir/tslint)に対応

## v15.1.0 - 2017-06-05
### Added
- パフォーマンス空席状況の概念を導入。
- 在庫状況サービスを追加。
- マスターサービスのパフォーマンス検索結果に、空席状況フィールドを追加。

## v15.0.0 - 2017-05-20
### Added
- 資産に所有権認証記録が残るように、資産所有権認証記録スキーマを追加。

## v14.0.1 - 2017-05-19
### Fixed
- テストコードをtslint対応

## v14.0.0 - 2017-05-19
### Changed
- 座席予約資産に、パフォーマンス詳細情報&取引情報&認証情報のフィールドを追加。フィールド追加に伴い、影響のあるファクトリーを修正。

## v13.0.2 - 2017-05-18
### Added
- apiの認証機構や、フロントエンドアプリケーションでのイベント受信等のために、クライアントスキーマを追加。
- クライアントサイドでの事象を分析してアプリケーション改善に役立てるため、クライアントイベントスキーマを追加。

## v13.0.1 - 2017-05-17
### Added
- 言語がさらに増えた場合にも備えて、mongooseの多言語文字列スキーマを追加。

## v13.0.0 - 2017-05-17
### Added
- COA本予約にムビチケ情報を連携。
- 座席資産にムビチケ連携情報フィールドを追加。

### Changed
- [tslint](https://github.com/palantir/tslint)を^5.2.0にアップデート

## v12.3.0 - 2017-04-20
### Added
- ファーストリリース