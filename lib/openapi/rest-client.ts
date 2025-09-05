import type { FetchError } from 'ofetch'
import type { OpenApiBody, OpenApiParams, OpenApiPaths, OpenApiQuery, OpenApiResponse } from './type-utils'

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

interface Options<M extends Method, P extends OpenApiPaths<M, T>, T> {
  path?: OpenApiParams<M, P, T>
  body?: OpenApiBody<M, P, T>
  query?: OpenApiQuery<M, P, T>
}

export interface FetchLikeErrorResponse {
  success: false
  message: string
  error: FetchError & { status: number }
}

export type Result<M extends Method, P extends OpenApiPaths<M, T>, T> =
  | OpenApiResponse<M, P, T>
  | FetchLikeErrorResponse

export type FetchLike<T> = (opts: {
  method: Method
  url: string
  body?: OpenApiBody<Method, OpenApiPaths<Method, T>, T>
  query?: OpenApiQuery<Method, OpenApiPaths<Method, T>, T>
  headers?: Record<string, string>
  path?: OpenApiParams<Method, OpenApiPaths<Method, T>, T>
}) => Promise<Result<Method, OpenApiPaths<Method, T>, T>>

export interface IRestClient<T> {
  <M extends Method, P extends OpenApiPaths<M, T>>(
    method: M,
    url: P,
    options?: Options<M, P, T>,
  ): Promise<Result<M, P, T>>
  get: <P extends OpenApiPaths<'get', T>>(url: P, options?: Options<'get', P, T>) => Promise<Result<'get', P, T>>

  post: <P extends OpenApiPaths<'post', T>>(url: P, options?: Options<'post', P, T>) => Promise<Result<'post', P, T>>

  put: <P extends OpenApiPaths<'put', T>>(url: P, options?: Options<'put', P, T>) => Promise<Result<'put', P, T>>

  patch: <P extends OpenApiPaths<'patch', T>>(
    url: P,
    options?: Options<'patch', P, T>,
  ) => Promise<Result<'patch', P, T>>

  delete: <P extends OpenApiPaths<'delete', T>>(
    url: P,
    options?: Options<'delete', P, T>,
  ) => Promise<Result<'delete', P, T>>
}

const createRestClient = <T>(baseURL: string, fetchLike: FetchLike<T>): IRestClient<T> => {
  const restClient = async <M extends Method, P extends OpenApiPaths<M, T>>(
    method: M,
    url: P,
    options?: Options<M, P, T>,
  ): Promise<Result<M, P, T>> => {
    let urlString = String(url)

    if (options?.path) {
      for (const [key, value] of Object.entries(options.path)) {
        urlString = urlString.replace(`{${key}}`, String(value))
      }
    }

    const urlConstructed = new URL(`${baseURL}${urlString}`)

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        urlConstructed.searchParams.set(key, String(value))
      }
    }

    return fetchLike({
      method: method.toUpperCase() as Method,
      url: urlConstructed.toString(),
      // @ts-expect-error - TODO: fix this
      query: options?.query,
      // @ts-expect-error - TODO: fix this
      body: options?.body,
    })
  }

  restClient.get = <P extends OpenApiPaths<'get', T>>(
    url: P,
    options?: Options<'get', P, T>,
  ): Promise<Result<'get', P, T>> => restClient('get', url, options)

  restClient.post = <P extends OpenApiPaths<'post', T>>(
    url: P,
    options?: Options<'post', P, T>,
  ): Promise<Result<'post', P, T>> => restClient('post', url, options)

  restClient.put = <P extends OpenApiPaths<'put', T>>(
    url: P,
    options?: Options<'put', P, T>,
  ): Promise<Result<'put', P, T>> => restClient('put', url, options)

  restClient.patch = <P extends OpenApiPaths<'patch', T>>(
    url: P,
    options?: Options<'patch', P, T>,
  ): Promise<Result<'patch', P, T>> => restClient('patch', url, options)

  restClient.delete = <P extends OpenApiPaths<'delete', T>>(
    url: P,
    options?: Options<'delete', P, T>,
  ): Promise<Result<'delete', P, T>> => restClient('delete', url, options)

  return restClient
}

export { createRestClient }
