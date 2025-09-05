import type { HTTPMethod } from 'h3'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type TypeGet<T, P extends any[]> = P extends [infer First, ...infer Rest]
  ? First extends keyof T
    ? TypeGet<T[First], Rest>
    : never
  : T

export type OpenApiPaths<M extends string, T> = {
  [K in keyof T]: Lowercase<M> extends keyof T[K] ? K : never
}[keyof T]

export type OpenApiResponse<M extends Lowercase<HTTPMethod>, P extends OpenApiPaths<M, T>, T> = TypeGet<
  T,
  [P, M, 'responses']
> extends infer Responses
  ? {
      [K in keyof Responses]: K extends 200 | 201 | 202 | 204
        ? TypeGet<T, [P, M, 'responses', K, 'content', 'application/json']>
        : never
    }[keyof Responses & (200 | 201 | 202 | 204)]
  : never

export type OpenApiBody<M extends Lowercase<HTTPMethod>, P extends OpenApiPaths<M, T>, T> = TypeGet<T, [P, M]> extends {
  requestBody: { content: { 'application/json': infer R } }
}
  ? R
  : TypeGet<T, [P, M]> extends { requestBody?: { content: { 'application/json': infer R } } }
    ? R | undefined
    : undefined

export type OpenApiQuery<M extends Lowercase<HTTPMethod>, P extends OpenApiPaths<M, T>, T> = TypeGet<
  T,
  [P, M, 'parameters', 'query']
>

export type OpenApiParams<M extends Lowercase<HTTPMethod>, P extends OpenApiPaths<M, T>, T> = TypeGet<
  T,
  [P, M, 'parameters', 'path']
>
