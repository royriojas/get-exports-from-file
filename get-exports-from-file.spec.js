import test from 'ava'
import getExportsFromFile from './get-exports-from-file'

require('@babel/polyfill')
// import glob from 'glob'

test('basic', async t => {
  const exp = await getExportsFromFile.es6('fixtures/basic.js')
  t.deepEqual(exp.exported, [
    { name: 'statelessComponent' },
    { name: 'ShoppingList', default: true, inferred: false }
    // {name: 'statelessComponentNotExported', exported: false},
  ])
})

test('flow', async t => {
  const exp = await getExportsFromFile.es6('fixtures/flow.js')
  t.deepEqual(exp.exported, [
    { name: 'DateRange' },
    { name: 'DateInterval' },
    { name: 'DateIntervalFlag' }
  ])
})

test('export as', async t => {
  const exp = await getExportsFromFile.es6('fixtures/export-as.js')
  t.deepEqual(exp.exported, [
    { name: 'b', localName: 'a' },
    { name: 'd' },
    { name: 'e' },
    { name: 'exportAs', default: true, inferred: true },
    { name: 'c' },
    { name: 'w', localName: 'c' }
  ])
})

test('classname', async t => {
  const exp = await getExportsFromFile.es6('fixtures/classname.js')
  t.deepEqual(exp.exported, [
    { name: 'ShoppingList', default: true, inferred: false }
  ])
})

test('named function', async t => {
  const exp = await getExportsFromFile.es6('fixtures/named-function.js')
  t.deepEqual(exp.exported, [
    { name: 'namedFn' }
  ])
})

test('all from another file, expect default', async t => {
  const exp = await getExportsFromFile.es6('fixtures/all.js')
  t.deepEqual(exp.exported, [
    { name: 'namedFn' }
  ])
})

test('index inherits a name from parent dir', async t => {
  const exp = await getExportsFromFile.es6('fixtures/index.js')
  t.deepEqual(exp.exported, [
    { name: 'fixtures', default: true, inferred: true }
  ])
})

test('capitalize when JSX', async t => { // JSX components cannot appear with a lowercase first letter
  const exp = await getExportsFromFile.es6('fixtures/should-get-capitalized.js')
  t.deepEqual(exp.exported, [
    { name: 'ShouldGetCapitalized', default: true, inferred: true }
  ])
})

test('commonJS', async t => {
  const exp = await getExportsFromFile.cjs('node_modules/react-intl/lib/index.js', true)
  t.deepEqual(exp.exported, [
    { name: 'addLocaleData' },
    { name: 'intlShape' },
    { name: 'injectIntl' },
    { name: 'defineMessages' },
    { name: 'IntlProvider' },
    { name: 'FormattedDate' },
    { name: 'FormattedTime' },
    { name: 'FormattedRelative' },
    { name: 'FormattedNumber' },
    { name: 'FormattedPlural' },
    { name: 'FormattedMessage' },
    { name: 'FormattedHTMLMessage' }
  ])
})
test('ignores first export in UMD', async t => {
  const exp = await getExportsFromFile.cjs('node_modules/react-datepicker/dist/react-datepicker.js', true)

  t.deepEqual([
    {
      name: 'DatePicker',
      default: true
    },
    {
      name: 'isSameDay'
    },
    {
      name: 'isDayInRange'
    },
    {
      name: 'isDayDisabled'
    },
    {
      name: 'allDaysDisabledBefore'
    },
    {
      name: 'allDaysDisabledAfter'
    },
    {
      name: 'getEffectiveMinDate'
    },
    {
      name: 'getEffectiveMaxDate'
    }
  ].every(entry => {
    const entryByName = exp.exported.find(e => e.name === entry.name)
    if (entry.default) {
      return entryByName && entryByName.default
    }
    return !!entryByName
  }), true)
})

test('es5 simple', async t => {
  const exp = await getExportsFromFile.cjs('fixtures/cjs.js', true)
  t.deepEqual(exp.exported, [
    { name: 'cjs', default: true }
  ])
})

test('bad cjs', async t => {
  const exp = await getExportsFromFile.cjs('fixtures/bad-export.js', true)
  t.deepEqual(exp.exported, [])
})

test('boom cjs', async t => {
  const exp = await getExportsFromFile.cjs('fixtures/boom.js', true)
  t.deepEqual(exp.exported, [
    { name: 'wrap' },
    { name: 'create' },
    { name: 'badRequest' },
    { name: 'unauthorized' },
    { name: 'paymentRequired' },
    { name: 'forbidden' },
    { name: 'notFound' },
    { name: 'methodNotAllowed' },
    { name: 'notAcceptable' },
    { name: 'proxyAuthRequired' },
    { name: 'clientTimeout' },
    { name: 'conflict' },
    { name: 'resourceGone' },
    { name: 'lengthRequired' },
    { name: 'preconditionFailed' },
    { name: 'entityTooLarge' },
    { name: 'uriTooLong' },
    { name: 'unsupportedMediaType' },
    { name: 'rangeNotSatisfiable' },
    { name: 'expectationFailed' },
    { name: 'teapot' },
    { name: 'badData' },
    { name: 'locked' },
    { name: 'preconditionRequired' },
    { name: 'tooManyRequests' },
    { name: 'illegal' },
    { name: 'internal' },
    { name: 'notImplemented' },
    { name: 'badGateway' },
    { name: 'serverUnavailable' },
    { name: 'gatewayTimeout' },
    { name: 'badImplementation' }
  ])
})

test('mobx', async t => {
  const exp = await getExportsFromFile.cjs('node_modules/mobx/lib/mobx.js', true)
  t.deepEqual([
    { name: 'extras' },
    { name: 'action' },
    { name: 'runInAction' },
    { name: 'isAction' },
    { name: 'autorun' },
    { name: 'when' },
    { name: 'autorunAsync' },
    { name: 'reaction' },
    { name: 'computed' },
    { name: 'createTransformer' },
    { name: 'expr' },
    { name: 'extendObservable' },
    { name: 'extendShallowObservable' },
    { name: 'intercept' },
    { name: 'isComputed' },
    { name: 'isObservable' },
    { name: 'observable' },
    { name: 'observe' },
    { name: 'toJS' },
    { name: 'transaction' },
    { name: 'whyRun' },
    { name: 'useStrict' },
    { name: 'isStrictModeEnabled' },
    { name: 'BaseAtom' },
    { name: 'Atom' },
    { name: 'untracked' },
    { name: 'Reaction' },
    { name: 'spy' },
    { name: 'asReference' },
    { name: 'asStructure' },
    { name: 'asFlat' },
    { name: 'asMap' },
    { name: 'isModifierDescriptor' },
    { name: 'isObservableArray' },
    { name: 'ObservableMap' },
    { name: 'map' },
    { name: 'isObservableMap' },
    { name: 'isObservableObject' },
    { name: 'isArrayLike' }
  ].every(entry => {
    const entryByName = exp.exported.find(e => e.name === entry.name)
    if (entry.default) {
      return entryByName && entryByName.default
    }
    return !!entryByName
  }), true)
})

test('typescript', async t => {
  const exp = await getExportsFromFile.es6('./fixtures/ts-example.ts')
  t.deepEqual(exp.exported, [{ name: 'IBuildReportParameters' }, { name: 'variable' }])
  t.deepEqual(exp.imported,
    [
      {
        name: 'get',
        module: 'lodash/get',
        nodeType: 'ImportDeclaration',
        type: 'ImportDefaultSpecifier'
      },
      {
        name: 'parsePropertyCriteria',
        module: 'screening-report-parser',
        nodeType: 'ImportDeclaration',
        type: 'ImportSpecifier'
      }
    ])
})
