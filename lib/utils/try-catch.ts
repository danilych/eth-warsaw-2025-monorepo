export const tryCatch = async <T, E = Error>(
  target: Promise<T> | (() => Promise<T>) | (() => T),
): Promise<{ data: T; error: undefined } | { data: undefined; error: E }> => {
  let data: T | undefined
  let error: E | undefined

  try {
    data = await (target instanceof Promise ? target : target())
    return { data, error: undefined }
  } catch (_error) {
    error = _error as E
    return { data: undefined, error }
  }
}
