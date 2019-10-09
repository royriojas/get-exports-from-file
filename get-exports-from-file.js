const babylon = require('@babel/parser')
const fs = require('mz/fs')
const path = require('path')
const traverse = require('@babel/traverse').default
const makeUpImportDefaultName = require('./lib/make-up-import-default-name')

const parse = (filePath) => {
  return fs.readFile(filePath, 'utf8').then((code) => {
    try {
      return babylon.parse(code, {
        sourceType: 'module',
        plugins: ['*', 'decorators-legacy', 'optionalChaining', 'estree', 'jsx', 'typescript', 'classProperties', 'classPrivateProperties', 'classPrivateMethods', 'objectRestSpread', 'doExpressions', 'exportDefaultFrom', 'exportNamespaceFrom']
      })
    } catch (err) {
      console.error('[get-exports-from-file]: error', filePath, err)
      throw err
    }
  })
}

module.exports = {
  es6: async function(filePath) {
    const tree = await parse(filePath)
    const exported = []
    const imported = []

    await Promise.all(
      tree.program.body.map(async (node) => {
        const {type} = node
        if (type === 'ExportNamedDeclaration') {
          let name
          if (node.declaration) {
            // normal named export
            if (node.declaration.declarations) {
              name = node.declaration.declarations[0].id.name
            } else if (node.declaration.id) {
              name = node.declaration.id.name
            }
            exported.push({
              name
            })
            // export { named } from './some/module'
          } else if (node.specifiers) {
            node.specifiers.forEach((specifier) => {
              exported.push({
                name: specifier.exported.name
              })
              if (specifier.imported && node.source) {
                imported.push({
                  name: specifier.imported.name,
                  module: node.source.value,
                  nodeType: node.type,
                  type: specifier.type,
                });
              }
            })
          }
        }

        if (type === 'ExportDefaultDeclaration') {
          let {name} = node.declaration
          let inferred = false;

          if (!name) {
            if (node.declaration.type === 'ClassDeclaration') {
              name = node.declaration.id.name
            } else {
              name = makeUpImportDefaultName(node, filePath)
              inferred = true;
            }
          }
          exported.push({
            name: name,
            inferred,
            default: true
          })
        }

        if (type === 'ExportAllDeclaration') {
          const subPath = require.resolve(path.resolve(path.dirname(filePath), (node.source || {}).value))
          const all = await module.exports.es6(subPath)

          all.imported.filter(i => !i.default).forEach(i => imported.push(i))
          all.exported.filter(e => !e.default).forEach(e => exported.push(e))
        }

        if (type === 'ImportDeclaration') {
          node.specifiers.forEach(specifier => {
            let name = (specifier.imported || {}).name;

            if (specifier.type === 'ImportDefaultSpecifier') {
              name = (specifier.local || {}).name;
            }

            imported.push({
              name,
              module: (node.source || {}).value,
              nodeType: node.type,
              type: specifier.type
            })
          });
        }
      })
    )

    return {
      imported,
      exported,
      ast: tree
    }
  },
  cjs (filePath) {
    return parse(filePath).then((tree) => {
      const exported = []

      let foundADefault = false
      traverse.cheap(tree.program, (node) => {
        const {type} = node
        if (type === 'ExpressionStatement') {
          if (node.expression.type === 'AssignmentExpression') {
            if (node.expression.left.object && node.expression.left.object.name === 'exports') {
              if (!node.expression.left.property) {
                return
              }
              if (!foundADefault && node.expression.left.property.name === 'default') {
                foundADefault = true
                // console.log('A', node.expression)
                const rightName = (node.expression.right || {}).name
                return exported.push({
                  name: rightName || makeUpImportDefaultName(node.expression.right, filePath),
                  default: true
                })
              } else {
                const {right} = node.expression
                if (right.type === 'CallExpression' && right.callee && right.callee.name === 'factory') {
                  return // skip this, because it's most likely a UMD defintion garbage
                }
                // console.log('B', node.expression)

                const {property} = node.expression.left
                return exported.push({
                  name: property.name || property.value
                })
              }
            } else if (node.expression.left.object && node.expression.left.property) {
              if (!foundADefault && node.expression.left.object.name === 'module' && node.expression.left.property.name === 'exports') {
                const {right} = node.expression
                if (right.type === 'CallExpression' && right.callee && right.callee.name === 'factory') {
                  return // skip this, because it's most likely a UMD defintion garbage
                }
                foundADefault = true
                // console.log('C', node.expression)
                return exported.push({
                  name: right.name || makeUpImportDefaultName(right, filePath),
                  default: true
                })
              }
            }
          }
        }
      })
      return {
        exported,
        ast: tree
      }
    })
  }
}
