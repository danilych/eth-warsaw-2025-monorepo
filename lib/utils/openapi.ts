import type { ResponseConfig } from '@asteasolutions/zod-to-openapi'
import { type RouteConfig, z } from '@hono/zod-openapi'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ValidationException } from '../exceptions/http'
import { pick } from './utils'

export const withSerializer = <T extends RouteConfig>(route: T): T => {
  // Make sure the middleware is an array
  if (!route.middleware) route.middleware = []
  if (!Array.isArray(route.middleware)) route.middleware = [route.middleware]

  // Add the response validation & serializer middleware
  route.middleware.push(async (c, next) => {
    await next()
    const statusCode = c.res.status as ContentfulStatusCode
    const responseByStatusCode = route.responses?.[statusCode] as ResponseConfig
    const responseSchema = responseByStatusCode?.content?.['application/json']?.schema

    if (!responseSchema) return
    if (!(responseSchema instanceof z.ZodSchema)) return

    const value = (await c.res.json()) as { success: boolean; data: unknown }

    if (!value || !value.success || !value.data) {
      c.res = c.json(value, { status: statusCode })
      return
    }

    const result = await responseSchema.safeParseAsync(value)

    if (!result.success) {
      const exception = new ValidationException('Response validation failed', {
        issues: result.error.issues,
      })

      c.res = c.json(
        {
          success: false,
          ...pick(exception, ['message', 'errorType', 'details']),
        },
        { status: 500 },
      )
      return
    }

    c.res = c.json(result.data as typeof value, { status: statusCode })
  })

  return route
}

export const openapiBody = <T>(schema: z.ZodSchema<T>) => ({
  content: {
    'application/json': {
      schema,
    },
  },
})

export const openapiSuccessResponse = (data: {
  schema: z.ZodSchema
  description?: string
}): ResponseConfig => ({
  content: {
    'application/json': {
      schema: z.object({
        success: z.literal<boolean>(true),
        data: data.schema,
      }),
    },
  },
  description: data.description ?? '',
})

export const openapiPaginatedResponse = (data: {
  itemsSchema: z.ZodSchema
  description?: string
}): ResponseConfig => ({
  content: {
    'application/json': {
      schema: z.object({
        success: z.literal<boolean>(true),
        data: z.array(data.itemsSchema),
        total: z.number(),
        page: z.number(),
        perPage: z.number(),
      }),
    },
  },
  description: data.description ?? '',
})

export const openapiErrorResponse = (data: {
  schema?: z.ZodSchema
  description?: string
}): ResponseConfig => ({
  content: {
    'application/json': {
      schema: z.object({
        success: z.literal<boolean>(false),
        message: z.string(),
        error: data.schema ?? z.any(),
      }),
    },
  },
  description: data.description ?? '',
})
