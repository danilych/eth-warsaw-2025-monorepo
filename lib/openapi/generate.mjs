import { app as api } from 'api/src/main'
import openapiTS, { astToString } from 'openapi-typescript'
import ts from 'typescript'

const STRING = ts.factory.createIdentifier('string')
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull())

const generate = async (name, app, url) => {
  const res = await app.request(url, {}, process.env)
  const input = await res.json()

  await Bun.write(`${__dirname}/schema/${name}.json`, JSON.stringify(input, null, 2))

  const ast = await openapiTS(input, {
    transform: (schemaObject) => {
      if ('type' in schemaObject) return
      return {
        schema: schemaObject.nullable ? ts.factory.createUnionTypeNode([STRING, NULL]) : STRING,
        questionToken: schemaObject.nullable,
      }
    },
  })
  const contents = astToString(ast)

  await Bun.write(`${__dirname}/schema/${name}.ts`, contents)
}

console.info('Generating OpenAPI schemas for API')
await generate('api', api, '/docs.json')
  .then(() => console.info('Done'))
  .catch((err) => console.error('Failed: ', err))

console.info('OpenAPI schemas generated ')
process.exit(0)
