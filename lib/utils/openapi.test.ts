import { describe, expect, it } from 'bun:test'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { openapiSuccessResponse, withSerializer } from './openapi'

describe('OpenAPI Utils', () => {
  describe('withSerializer', () => {
    const mockSchema = z.object({
      name: z.string(),
      age: z.number(),
    })

    const createApp = (res: Record<string, unknown>) => {
      const app = new OpenAPIHono()

      app.openapi(
        withSerializer(
          createRoute({
            method: 'get',
            path: '/test',
            responses: {
              200: openapiSuccessResponse({
                schema: mockSchema,
              }),
            },
          }),
        ),
        async (c) => {
          return c.json(res)
        },
      )

      return app
    }

    it('should pass validation when response matches schema', async () => {
      const app = createApp({
        success: true,
        data: {
          name: 'John',
          age: 25,
        },
      })

      const res = await app.request('/test')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toEqual({
        success: true,
        data: {
          name: 'John',
          age: 25,
        },
      })
    })

    it('should omit extra fields when present', async () => {
      const app = createApp({
        success: true,
        data: {
          name: 'John',
          age: 25,
          extraField: 'should not be here',
        },
      })

      const res = await app.request('/test')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toEqual({
        success: true,
        data: {
          name: 'John',
          age: 25,
        },
      })
    })

    it('should throw ValidationException when required fields are missing', async () => {
      const app = createApp({
        success: true,
        data: {
          name: 'John',
          // age is missing
        },
      })

      const res = await app.request('/test')
      expect(res.status).toBe(500)

      const data = (await res.json()) as { success: boolean; details: { issues: unknown[] } }
      expect(data.success).toBe(false)
      expect(data.details).toBeDefined()
      expect(data.details.issues).toBeDefined()
    })

    it('should throw ValidationException when field types are incorrect', async () => {
      const app = createApp({
        success: true,
        data: {
          name: 'John',
          age: '25', // should be number, not string
        },
      })

      const res = await app.request('/test')
      expect(res.status).toBe(500)

      const data = (await res.json()) as { success: boolean; details: { issues: unknown[] } }
      expect(data.success).toBe(false)
      expect(data.details).toBeDefined()
      expect(data.details.issues).toBeDefined()
    })

    it('should skip validation when response is error', async () => {
      const app = createApp({
        success: false,
        message: 'Error occurred',
        error: { code: 'ERROR_CODE' },
      })

      const res = await app.request('/test')
      expect(res.status).toBe(200)

      const data = await res.json()

      expect(data).toEqual({
        success: false,
        message: 'Error occurred',
        error: { code: 'ERROR_CODE' },
      })
    })
  })
})
