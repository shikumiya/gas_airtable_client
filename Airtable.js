function _AirtableClientFactory() {return AirtableClientFactory}
/*
function _AirtableClient() {return AirtableClient}
*/

/**
 * AirtableClientのファクトリクラス
 *
 * ベース毎にインスタンスを生成してください。
 */
class AirtableClientFactory {
  
  /**
   * コンストラクタ
   * @param {string} baseId - AirtableのベースID
   * @param {string} apiKey - AirtableのAPIキー
   * @param {bool} debug - デバッグモードフラグ(True:ON/False:OFF)
   */
  constructor(baseId, apiKey, debug=false) {
    this.baseId = baseId
    this.apiKey = apiKey
    this.debug = debug
  }
  
  /**
   * Airtableクライアントのインスタンスを生成して返却
   * @param {string} tableName - Airtableのテーブル名
   * @return {AirtableClient} - Airtableクライアント
   */
  create(tableName) {
    return new AirtableClient(this.baseId, tableName, this.apiKey, this.debug)
  }
}

/**
 * Airtableクライアントクラス
 */
class AirtableClient {
  
  /**
   * コンストラクタ
   * @param {string} baseId - AirtableのBASE ID
   * @param {string} tableName - Airtableのテーブル名
   * @param {string} apiKey - AirtableのAPIキー
   * @param {bool} debug - デバッグモードのフラグ(True:ON/False:OFF)
   */
  constructor(baseId, tableName, apiKey, debug) {
    this.baseId = baseId
    this.tableName = tableName
    this.apiKey = apiKey
    this.debug = debug
    
    this._VERSION = 'v0'
    this._API_BASE_URL = 'https://api.airtable.com'
    this._API_URL = Path.join(this._API_BASE_URL, this._VERSION)
    this._API_LIMIT = 1.0 / 5
    this._MAX_RECORDS_PER_REQUEST = 10
    
    this.BASE_URL = Path.join(this._API_URL, baseId, encodeURIComponent(tableName))
  }
  
  /**
   * filterByFormulaのfield=value条件式を1つ構築して返却
   * @param {string} field - フィールド名
   * @param {string} value - 検索値
   * @return {string} - 「{field}=value」の文字列
   */
  _makeSingleCondition(field, value) {
    return '{' + field + '}="' + value + '"'
  }
  
  /**
   * リクエストパラメータを構築
   * @param {string} formula - filterByFormula値, defaults to false
   * @param {string} offset - offset値, defaults to false
   * @param {AirtableSorter|Object|Array} sort - sort値, defaults to false
   * @param {number} maxRecords - maxRecords値, defaults to None ※未指定の場合はデフォルトで100件
   * @param {Array} fields - fields値, defaults to false
   * @param {string} view - view値, defaults to false
   */
  _makeParams(formula=false, offset=false, sort=false, maxRecords=false, fields=false, view=false) {
    let p = {}
    if (formula) {
      if (this.debug) {console.log('formulaあり' + formula)}
      p['filterByFormula'] = encodeURIComponent(formula)
    }
    if (offset) {
      if (this.debug) {console.log('offsetあり' + offset)}
      p['offset'] = offset
    }
    if (maxRecords) {
      if (this.debug) {console.log('maxRecordsあり' + maxRecords)}
      p['maxRecords'] = maxRecords
    }
    if (fields) {
      if (this.debug) {console.log('fieldsあり' + fields)}
      p['fields'] = []
      for (const field of fields) {
        p['fields'].append(field)
      }
    }
    if (view) {
      if (this.debug) {console.log('viewあり' + view)}
      p['view'] = view
    }
    if (sort) {
      if (this.debug) {console.log('sortあり' + sort)}
      p = AirtableSorter.makeParams(p, sort)
    }
    
    return p
  }
  
  /**
   * HTTPレスポンスのエラー処理
   * @param {HTTPResponse} response - レスポンスオブジェクト
   * @return {Object} - HTTPレスポンスボディのJSONオブジェクト
   */
  _processResponseError(response) {
    let jsonResponse = false
    try {
      jsonResponse = JSON.parse(response.getContentText())
    } catch (e) {
      //throw e
    }
    
    return jsonResponse
  }
  
  /**
   * HTTPレスポンスの事後処理
   * @param {HTTPResponse} response - レスポンスオブジェクト
   * @return {Object} - HTTPレスポンスボディのJSONオブジェクト
   */
  _processResponse(response) {
    let result = this._processResponseError(response)
    
    return result
  }
  
  /**
   * HTTPリクエスト送信
   * @param {string} method - HTTPメソッド
   * @param {string} url - リクエストURL
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {Object} - HTTPレスポンスボディのJSONオブジェクト
   */
  _request(method, url, options={}) {
    const defaults = {
      data: false,
      jsonData: false
    }
    options = {...defaults, ...options}
    
    let headers = {
      'Authorization': 'Bearer ' + this.apiKey
    }
    let params = {
      'method': method,
      'headers': headers,
      'muteHttpExceptions': false
    }
    if (method == 'get') {
      if (options.data) {
        url += '?'
        let queryStrings = ''
        for (const key in options.data) {
          const value = options.data[key]
          
          if (queryStrings.length > 0) {
            queryStrings += '&' + key + '=' + value
          } else {
            queryStrings += key + '=' + value
          }
        }
        url += queryStrings
      }
      
    } else {
      if (options.data) {
        params['payload'] = options.data
      } else if (options.jsonData) {
        params['payload'] = JSON.stringify(options.jsonData)
        params['contentType'] = 'application/json'
      }
    }
    if (this.debug) {
      console.log(url)
      console.log(params)
    }
    
    const response = UrlFetchApp.fetch(url, params)
    
    if (this.debug) {
      console.log(response.getResponseCode())
      console.log(response.getContentText())
    }
    
    return this._processResponse(response)
  }
  
  /**
   * GETリクエスト送信
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {Object} - HTTPレスポンスボディのJSONオブジェクト
   */
  _get(options) {
    const defaults = {
      formula: false,
      offset: false,
      sort: false,
      maxRecords: false,
      fields: false,
      view: false
    }
    options = {...defaults, ...options}
    
    const data = this._makeParams(options.formula, options.offset, options.sort, options.maxRecords, options.fields, options.view)
    const url = this.BASE_URL
    return this._request('get', url, {data: data})
  }
  
  /**
   * POSTリクエスト送信
   * @param {Object} data - リクエストJSONデータオブジェクト
   * @return {Object} - HTTPレスポンスボディのJSONオブジェクト
   */
  _post(data) {
    const url = this.BASE_URL
    return this._request('post', url, {jsonData: data})
  }
  
  /**
   * PATCHリクエスト送信
   * @param {string} id - レコードID
   * @param {Object} data - リクエストJSONデータオブジェクト
   * @return {Object} - HTTPレスポンスボディのJSONオブジェクト
   */
  _patch(id, data) {
    const url = Path.join(this.BASE_URL, id)
    return this._request('patch', url, {jsonData: data})
  }
  
  /**
   * DELETEリクエスト送信
   * @param {string} id - レコードID
   * @return {Object} - HTTPレスポンスボディのJSONオブジェクト
   */
  _delete(id) {
    const url = Path.join(this.BASE_URL, id)
    return this._request('delete', url)
  }
  
  /**
   * 一括処理用のレコードリストを構築
   * @param {Array} fieldsList - fieldsのリスト
   * @return {Array} - recordsにセットするリスト
   */
  _buildBatchRecords(fieldsList) {
    return fieldsList.map(fields => ({'fields': fields}))
  }
  
  /**
   * レコードIDで検索（1件取得）
   * @param {string} id - 検索対象のレコードID
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  find(id, options) {
    const defaults = {
      fields: false,
      view: false
    }
    options = {...defaults, ...options}
    
    return this.findByFormula('RECORD_ID()="' + id + '"', options)
  }
  
  /**
   * 対象フィールドの値に一致するレコードを検索（先頭の1件取得）
   * @param {string} field - 検索対象のフィールド名
   * @param {string} value - 検索対象のフィールド値
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  findBy(field, value, options) {
    const defaults = {
      sort: false,
      fields: false,
      view: false
    }
    options = {...defaults, ...options}
    
    return this.findByFormula(this._makeSingleCondition(field, value), options)
  }
  
  /**
   * 条件式に一致するレコードを検索（先頭の1件取得）
   * @param {string} formula - 任意の条件式(Airtableのformulaを参照)
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  findByFormula(formula, options) {
    const defaults = {
      sort: false,
      fields: false,
      view: false,
      maxRecords: 1
    }
    options = {...defaults, ...options}
    
    return this.getByFormula(formula, options)
  }
  
  /**
   * 条件指定なしで検索し、先頭の1件を取得
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  first(options) {
    const defaults = {
      sort: false,
      fields: false,
      view: false,
      maxRecords: 1
    }
    options = {...defaults, ...options}
    
    return this.get(options)
  }
  
  /**
   * 条件指定なしで検索し、1ページ分のレコードを取得
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  get(options) {
    const defaults = {
      offset: false,
      sort: false,
      maxRecords: false,
      fields: false,
      view: false
    }
    options = {...defaults, ...options}
    
    const r = this._get(options)
    return new AirtableResponse(ObjectUtil.get(r, 'records', []), ObjectUtil.get(r, 'offset', false), [ObjectUtil.get(r, 'error')])
  }
  
  /**
   * 対象フィールドの値に一致するレコードを検索（1ページ分のレコードを取得）
   * @param {string} field - 検索対象のフィールド名
   * @param {string} value - 検索対象のフィールド値
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  getBy(field, value, options) {
    const defaults = {
      offset: false,
      sort: false,
      maxRecords: false,
      fields: false,
      view: false
    }
    options = {...defaults, ...options}
    
    return this.getByFormula(this._makeSingleCondition(field, value), options)
  }
  
  /**
   * 条件式に一致するレコードを検索（1ページ分のレコードを取得）
   * @param {string} formula - 任意の条件式(Airtableのformulaを参照)
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  getByFormula(formula, options) {
    const defaults = {
      offset: false,
      sort: false,
      maxRecords: false,
      fields: false,
      view: false,
      formula: formula
    }
    options = {...defaults, ...options}
    
    const r = this._get(options)
    return new AirtableResponse(ObjectUtil.get(r, 'records', []), ObjectUtil.get(r, 'offset', false), [ObjectUtil.get(r, 'error')])
  }
  
  /**
   * 全てのレコードを検索（全ページ）
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  getAll(options) {
    const defaults = {
      formula: false,
      sort: false,
      fields: false,
      view: false
    }
    options = {...defaults, ...options}
    
    let offset = false
    
    let allRecords = []
    let errors = []
    
    while (true) {
      const r = this._get(options)
      if (Object.keys(r) == 0) {
        break
      }
      const records = ObjectUtil.get(r, 'records')
      console.log(records)
      const error = ObjectUtil.get(r, 'error')
      if (error) {
        errors = errors.concat(error)
      }
      allRecords = allRecords.concat(records)
      offset = ObjectUtil.get(r, 'offset')
      if (!offset) {
        break
      }
      Utilities.sleep(this._API_LIMIT)
    }
    
    return new AirtableResponse(allRecords, errors)
  }
  
  /**
   * 対象フィールドの値に一致するレコードを検索（全ページ）
   * @param {string} field - 検索対象のフィールド名
   * @param {string} value - 検索対象のフィールド値
   * @param {Object} options - リクエストパラメータオブジェクト
   * @return {AirtableResponse} - 検索結果
   */
  getAllBy(field, value, options) {
    const defaults = {
      formula: this._makeSingleCondition(field, value),
      sort: false,
      fields: false,
      view: false
    }
    options = {...defaults, ...options}
    
    return this.getAll(options)
  }
  
  /**
   * 1件のレコードを新規登録
   * @param {Object} fields - レコードのフィールド
   * @return {AirtableResponse} - 登録結果
   */
  insert(fields) {
    const r = this._post({'fields': fields})
    return new AirtableResponse(r)
  }
  
  /**
   * 一括でレコードを新規登録
   * @param {Array} fieldsList - レコードのフィールドリスト
   * @return {AirtableResponse} - 登録結果
   */
  bulkInsert(fieldsList) {
    const self = this
    
    const insertedRecords = []
    
    fieldsList.chunk(this._MAX_RECORDS_PER_REQUEST).forEach(function(chunkRecords) {
      const newRecords = self._buildBatchRecords(chunkRecords)
      const r = self._post({'records': newRecords})
      
      ObjectUtil.get(r, 'records', []).map(function(records) {
        insertedRecords.push(records)
      })
      
      Utilities.sleep(self._API_LIMIT)
    })
    
    return new AirtableResponse(insertedRecords)
  }
  
  /**
   * 対象のレコードを更新
   * @param {string} id - 更新対象のレコードID
   * @param {Object} fields - 更新対象のフィールド（指定されたフィールドのみ上書き）
   * @return {AirtableResponse} - 更新結果
   */
  update(id, fields) {
    const r = this._patch(id, {'fields': fields})
    return new AirtableResponse(r)
  }
  
  /**
   * 1件のレコードを削除
   * @param {string} id - 削除対象のレコードID
   * @return {AirtableResponse} - 削除結果
   */
  delete(id) {
    const r = this._delete(id)
    return new AirtableResponse(r)
  }
  
  /**
   * 一括でレコードを削除
   * @param {Object} targets - 削除対象のレコードIDリストまたはレコードリストを含んだオブジェクト
   * @return {AirtableResponse} - 削除結果
   */
  bulkDelete(targets) {
    const self = this
    const defaults = {
      ids: false,
      records: false
    }
    targets = {...defaults, ...targets}
    
    const deletedRecords = []
    
    if (targets.ids) {
      targets.ids.chunk(this._MAX_RECORDS_PER_REQUEST).map(function(chunkIds) {
        chunkIds.forEach(function(id) {
          const r = self._delete(id)
          deletedRecords.push(r)
        })
        Utilities.sleep(self._API_LIMIT)
      })
    }
    
    if (targets.records) {
      const ids = targets.records.map(record => record['id'])
      ids.chunk(this._MAX_RECORDS_PER_REQUEST).map(function(chunkIds) {
        chunkIds.forEach(function(id) {
          const r = self._delete(id)
          deletedRecords.push(r)
        })
        Utilities.sleep(self._API_LIMIT)
      })
    }
    
    return new AirtableResponse(deletedRecords)
  }
  
}

/**
 * 配列の分割処理
 * @param {number} chunkSize - 分割するサイズ
 * @return {Array} - 分割した配列を二次元目に格納した二次元配列
 */
Array.prototype.chunk = function(chunkSize) {
  const resultArray = [];
  for(let i=0; i<this.length; i+=chunkSize) {
    resultArray.push(this.slice(i, i + chunkSize))
  }
  return resultArray
}

/**
 * レスポンスクラス
 * AirtableClientのインタフェースから返却されるクラス
 */
class AirtableResponse {
  
  /**
   *　コンストラクタ
   * @param {Array} records - HTTPレスポンスのrecords, defaults to []
   * @param {string|bool} offset - HTTPレスポンスから返却されるページオフセット値, defaults to false
   * @param {Array} errors - HTTPレスポンスから返却されるエラー文言, defaults to []
   */
  constructor(records=[], offset=false, errors=[]) {
    this._records = records
    this._offset = offset
    this._errors = errors
  }
  
  /**
   * recordsのgetter
   * @return {Array} - コンストラクタにセットしたrecords
   */
  get records() {
    return this._records
  }
  
  /**
   * offsetのgetter
   * @return {string} - コンストラクタにセットしたoffset
   */
  get offset() {
    return this._offset
  }
  
  /**
   * errorsのgetter
   * @return {Array} - コンストラクタにセットしたerrors
   */
  get errors() {
    return this._errors
  }
  
  /**
   * recordsの要素数を取得
   * @return {number} - recordsの要素数(=レコード数)
   */
  size() {
    return Object.keys(this._records).length
  }
  
  /**
   * recordsを取得
   * 
   * 0〜n件のレコードを返却。要素番号を指定した場合は、その要素のレコードを返却。
   * @param {number} index - recordsの要素番号, defaults to false
   * @return {Array} - 0〜n件のレコード
   */
  get(index=false) {
    if (this.size() == 1) {
      return this._records[0]
    } else if (this.size() > 1) {
      if (index) {
        return this._records[index]
      } else {
        return this._records
      }
    } else {
      return []
    }
  }
  
  /**
   * レコードIDのリストを取得
   * @return {Array} - レコードIDの一次元配列
   */
  getIds() {
    if (this.size() == 1) {
      return this.get()['id']
    } else if (this.size() > 1) {
      return this._records.map(record => record['id'])
    } else {
      return []
    }
  }
  
}

/**
 * ソート順の列挙型
 *
 * sortオプションに渡す値です。
 */
class SortDirection {
  /**
   * 昇順
   * @return {Object} - 昇順
   */
  static get ASC() {
    return {name: 'ASC', value: 'asc'}
  }
  /**
   * 降順
   * @return {Object} - 降順
   */
  static get DESC() {
    return {name: 'DESC', value: 'desc'}
  }
}

/**
 * ソートの設定を構築するクラス
 */
class AirtableSorter {
  /**
   * コンストラクタ
   */
  constructor() {
    this.sort = []
  }
  
  /**
   * ソートの設定を追加
   *
   * チェーンメソッド方式で追加できます。
   * @param {string} field - ソート対象のフィールド名
   * @param {Object} - ソート順
   * @return {AirtableSorter} - 自インスタンス
   */
  append(field, direction=SortDirection.ASC) {
    let directionValue = direction.value
    
    this.sort.push({
      'field': field,
      'direction': directionValue
    })
    
    return this
  }
  
  /**
   * sortのクエリパラメータを構築
   *
   * appendで追加されたソート順にパラメータを構築します。
   * @return {Object} - クエリパラメータのオブジェクト
   */
  build() {
    const query = {}
    let idx = 0
    for (const item of this.sort) {
      const field = item['field']
      const direction = item['direction']
      
      query['sort[' + idx + '][field]'] = field
      query['sort[' + idx + '][direction]'] = direction
      
      idx += 1
    }
    
    return query
  }
  
  /**
   * クエリパラメータオブジェクトにsortを追加
   *
   * リクエスト用のクエリパラメータを構築します。
   * クエリパラメータ用のオブジェクトは以下のクエリパラメータを設定します。
   *   sort[0][field]={field}&sort[0][direction]={direction}&sort[1][field]={field}&sort[1][direction]={direction}...&sort[n][field]={field}&sort[n][direction]={direction}
   * sortパラメータは3種類の形式で指定可能です。
   *
   * - AirtableSorter
   *   appendを用いた設定済みのAirtableSorterオブジェクト
   * 
   * - dict型の単一フィールド指定
   *   {
   *     'field': 'field0',
   *     'direction': 'asc'
   *   }
   * 
   * - list型の複数フィールド指定
   *   [
   *     {'field': 'field0', 'direction': 'asc'},
   *     {'field': 'field1', 'direction': 'asc'},
   *     {'field': 'field2', 'direction': 'asc'}
   *   ]
   * @param {Object} params - クエリパラメータ構築用のオブジェクト
   * @param {AirtableSorter|Object|Array} sort - ソート順
   * @return {Object} - クエリパラメータオブジェクト
   */
  static makeParams(params, sort) {    
    let p = params
    
    if (sort instanceof AirtableSorter) {
      console.log('sort is AirtableSorter')
      p = {...p, ...sort.build()}
    
    } else if (sort instanceof Array) {
      console.log('sort is Array')
      let cnt = 0
      for (const sortItem of sort) {
        if (sortItem instanceof Object) {
          p['sort[' + cnt + '][field]'] = sortItem['field']
          if ('direction' in sortItem) {
            p['sort[' + cnt + '][direction]'] = sortItem['direction']
          } else {
            p['sort[' + cnt + '][direction]'] = SortDirection.ASC.value
          }
        } else {
          p['sort[' + cnt + '][field]'] = sortItem
          p['sort[' + cnt + '][direction]'] = SortDirection.ASC.value
        }
      }
    } else if (typeof sort == 'object') {
        console.log('sort is Object')
        p['sort[0][field]'] = sort['field']
        if ('direction' in sort) {
          p['sort[0][direction]'] = sort['direction']
        } else {
          p['sort[0][direction]'] = SortDirection.ASC.value
        }
    } else {
    }
    
    console.log(p)
    
    return p
  }
}

/**
 * パス系の操作クラス
 */
class Path {
  /**
   * パスを結合する（「/」で区切る)
   * @params {string} args - 結合したいパス文字列（可変長）
   * @return {string} - 結合済みのパス文字列
   */
  static join(...args) {
    const argsAry = Array.prototype.slice.call(arguments)
    let result = ''
    
    for (const arg of argsAry) {
      if (arg.lastIndexOf('/') == arg.length-1) {
        result += String(arg)
      } else {
        result += String(arg) + '/'
      }
    }
    
    return result
  }
}

/**
 * Objectのユーティリティクラス
 */
class ObjectUtil {
  /**
   * Objectから指定のキーの値を取得する。存在しないキーの場合は引数に渡したデフォルト値を取得する。
   * @param {Object} obj - 取得対象のオブジェクト
   * @param {string} key - キー値
   * @param {Object} defaultValue - キーが存在しなかった場合の値
   * @return {Object|bool} - キーが存在:値、キーが存在しない：defaultValue（未指定のデフォルト値はfalse）
   */
  static get(obj, key, defaultValue=false) {
    if (key in obj) {
      return obj[key]
    } else {
      return defaultValue
    }
  }
}