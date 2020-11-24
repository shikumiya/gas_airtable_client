# Google Apps Script Airtable Client Library

## About - このライブラリについて

### [English]

This is an Airtable client library for Google Apps Script.

Make factory instance per a BASE. And make client instance per a table.

### [日本語]

Airtable用のGoogle Apps Scriptクライアントライブラリです。このライブラリはAirtable APIが提供している機能をラッピングしたものです。このライブラリを使えば容易にAirtableの操作を実装できます。それによって、実装コストやメンテナンスコストが大幅に低減できるでしょう。

ベース毎のファクトリインスタンスを生成し、テーブル毎にクライアントインスタンスを生成してください。

## Usage - 使用方法

### Install - インストール

スクリプトエディタ > リソース > ライブラリ > 「Add a Library」に以下のスクリプトIDを入力 > 追加

スクリプトID: 10os0YcREKRrlxjpZDbAnXRS9-lxzagan8icqeR3QiJIfgeRAW-OuHQA2


### Preparation - 準備

You have to get a base key and an api key of Airtable. You are able to get them from Airtable API documents page write.

AirtableのベースIDとAPIキーを取得しておく必要があります。Airtableの各ベース毎のAPIドキュメントに記載されています。

```javascript
const AirtableClientFactory = AirtableClient._AirtableClientFactory()
const AirtableSorter = AirtableClient._AirtableSorter()
const SortDirection = AirtableClient._SortDirection()

const AIRTABLE_BASE_KEY = 'YOUR BASE KEY'
const AIRTABLE_API_KEY = 'YOUR API KEY'
```

### Create a client instance - Clientの作成

```javascript
// Make factory instance.
// ベース毎にファクトリクラスのインスタンスを生成します。
const atf = new AirtableClientFactory(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, false)

// Make client instance.
// テーブル毎にクライアントクラスのインスタンスを生成します。
const at = atf.create('TABLE NAME')
```

### Note #1 - ノート1

```javascript
/*
# All interfaces return Airtabler class.
# When you would like to get all records contents, to use the 'get' method after call interfaces.
# 操作系の処理は全てAirtablerクラス型を返します。
# recordsの中身をobject型や配列で取得したい場合はgetメソッドを使用してください。
# 1件の場合はobject、2件以上の場合は配列で返却します。
# [Sample]
# - INPUT(JSON from HTTP r)
# {
#   'records': [
#      {
#        'id': 'xxxxxxxxx',
#        'fields': {
#          'Name': 'foo',
#          'Age': 16
#        }
#     }
#   ]
# }
#
# - OUTPUT(object)
# {
#   'Name': 'foo',
#   'Age': 16
# }
*/
let output = at.getAll().get()
```

### Search - 検索

```javascript
/*
# Searching by no conditions.
# 条件指定なしで検索しています。
*/
let r = at.get()
/*
# The 'records' property returns records contents with converted object or array type are got from HTTP r json.
# recordsプロパティでレスポンスJSON内のrecordsをobjetまたは配列にしたものを取得します。
# [Sample]
# - INPUT(JSON from HTTP r)
# {
#   'records': [
#     {
#       'id': 'xxxxxxxxx',
#       'fields': {
#         'Name': 'aaa',
#         'Age': 16
#       },
#     {
#       'id': 'xxxxxxxxx',
#       'fields': {
#         'Name': 'bbb',
#         'Age': 18
#       }
#     }
#   ]
# }
#
# - OUTPUT(array)
# [
#   {
#     'id': 'xxxxxxxxx',
#     'fields': {
#       'Name': 'aaa',
#       'Age': 16
#      }
#   },
#   {
#     'id': 'xxxxxxxxx',
#     'fields': {
#       'Name': 'bbb',
#       'Age': 18
#     }
#   }
# ]
*/
console.log(r.records)
/*
# The 'offset' property returns page offset value for getting next page contents.
# offsetプロパティでページングのoffsetを取得します。
*/
console.log(r.offset)
/*
# The 'get' method returns records contents by object type.
# getメソッドでrecordsの中身をobject型で取得します。
*/
console.log(r.get())
/*
# The 'get_ids' method returns record ids what are filtered from records contents.
# get_idsメソッドで取得されたレコードのidの配列を返します。
*/
console.log(r.getIds())
```

```javascript
/*
# Search for matching records by specifying a value in one field.
# ひとつのフィールドに値を指定して、一致するレコードを検索しています。1ページ目のみ取得します。
*/
r = at.getBy('Name', 'test', {view: 'Grid view'})
console.log(r.records)
console.log(r.offset)
```

```javascript
/*
# Searching for matching records by specifying a conditional expression. Gets only the first page.
# 条件式を指定して、一致するレコードを検索しています。1ページ目のみ取得します。
*/
r = at.get_by_formula('{Name}="test"', {view: 'Grid view'})
console.log(r.records)
console.log(r.offset)
```

```javascript
/*
# Searching for records for all pages.
# 全ページ分のレコードを検索しています。
*/
let records = at.getAll({view: 'Grid view'}).get()
console.log(records)
```

```javascript
/*
# Searching for records on all matching pages by specifying a value in one field.
# ひとつのフィールドに値を指定して、一致する全ページ分のレコードを検索しています。
*/
records = at.getAllBy('Name', 'test', {view: 'Grid view'}).get()
console.log(records)
```

```javascript
/*
# Search a record is first of result list with sort and specify a view. Sorting is specified by a one-dimensional array of field names.
# 検索し、得られたリスト内の最初の1件を取得しています。ソートとビューを指定しています。ソートはフィールド名の一次元配列で指定しています。
*/
let record = at.first().get()
console.log(record)
```

#### Sort - ソート

```javascript
/*
# Search a record is first of result list with sort and specify a view. Sorting is specified by a one-dimensional array of field names.
# 検索し、得られたリスト内の最初の1件を取得しています。ソートとビューを指定しています。ソートはフィールド名の一次元配列で指定しています。
*/
record = at.first({sort: ['Name'], view: 'Grid view'}).get()
console.log(record)

/*
# The sort argument is a object value that specifies the field name and sort order (ascending / descending).
# ソートはobject値でフィールド名とソート順(昇順/降順)を指定しています。
*/
record = at.first({sort: {'field': 'Name', 'direction': 'asc'}}).get()
console.log(record)

/*
# The sort argument is specified by an array in the object.
# ソートはobjectの配列で指定しています。
*/
console.log('first: sort is list.object')
record = at.first({sort: [{'field': 'Name', 'direction': 'asc'}]}).get()
console.log(record)

/*
# To make it easier to create a sort, specify the fields to sort in the AirtableSorter class.
# ソートを便利に構築するためのAirtableSorterクラスでソートするフィールドを指定しています。
*/
console.log('first: sort is AirtableSorter')
record = at.first({sort: (new AirtableSorter()).append('Name'))}.get()
console.log(record)

/*
# The AirtableSorter class makes it easy to create a sort by specifying the fields to sort and the sort order.
# ソートを便利に構築するためのAirtableSorterクラスでソートするフィールドとソート順を指定しています。
*/
console.log('first: sort is AirtableSorter with direction')
record = at.first({sort: (new AirtableSorter()).append('Name', SortDirection.ASC)}).get()
console.log(record)
```

```javascript
/*
# Searching by specifying a unique ID that is internally assigned to each record in Airtable. Get only the first one.
# Airtableの各レコードに内部的に振られているユニークなIDを指定して検索しています。先頭の1件のみ取得します。
*/
record = at.find(record['id'], {view: 'Grid view'}).get()
console.log(record)
```

```javascript
/*
# Searching for matching records by specifying a value in one field. Get only the first one.
# ひとつのフィールドに値を指定して、一致するレコードを検索しています。先頭の1件のみ取得します。
*/
record = at.findBy('Name', 'test', {view: 'Grid view'}).get()
console.log(record)
```

```javascript
/*
# Searching for matching records by specifying conditional expression. Get only the first one.
# 条件式を指定して、一致するレコードを検索しています。先頭の1件のみ取得します。
*/
record = at.findByFormula('{Name}="test"', {view: 'Grid view'}).get()
console.log(record)
```

### Register - 登録

```javascript
/*
# One record is newly registered. Pass a fields what is object type.
# fields（object型）を作成し、1件のレコードを新規登録しています。
# [Sample]
# - fields(object)
# {
#   'Name': 'foo',
#   'Age': 16
# }
*/
const fields = {
  'Name': 'foo',
  'Age': 16
}
record = at.insert(fields).get()
console.log(record)

/*
# Register multiple records at once. Create an array of fields and pass it.
# 複数のレコードを一括で新規登録しています。fieldsの配列を作成して渡します。
# [Sample]
# - fields_list(array)
# [
#   {'Name': 'aaa', 'Age': 16},
#   {'Name': 'bbb', 'Age': 18}
# ]
*/
records = at.bulkInsert([fields, fields]).get()
console.log(records)
```

### Update - 更新

```javascript
/*
# The target record is updated by specifying the record ID. Create and pass a fields for the item you would like to overwrite.
# レコードIDを指定して、対象のレコードを更新しています。上書きする項目のfieldsを作成して渡します。
*/
let id = record['id']
record = at.update(id, fields).get()
console.log(record)
```

### Delete - 削除

```javascript
/*
# The target record is deleted by specifying the record ID.
# レコードIDを指定して、対象のレコードを削除しています。
*/
record = at.delete(id).get()
console.log(record)

/*
# All records that match the criteria are specified and the records are deleted at once.
# 条件に一致する全てのレコードIDを指定して、一括でレコードを削除しています。
# [Sample]
# - ids(array)
# ['ID001', 'ID002', 'ID003]
*/
let ids = [record['id']]
records = at.bulkDelete({ids: ids}).get()
console.log(records)

/*
# You are able to also specify records and delete the records at once. All records must contain a record ID.
# recordsを指定して、一括でレコードを削除することもできます。recordsはidを含んでいる必要があります。
# [Sample]
# - records(array)
# [
#   {
#     'id': 'xxxxxxxxx',
#     'fields': {...}
#   },
#   {
#     'id': 'xxxxxxxxx',
#     'fields': {...}
#   },
#   {
#     'id': 'xxxxxxxxx',
#     'fields': {...}
#   }
# ]
*/
records = at.bulkDelete({records: records}).get()
console.log(records)
```
