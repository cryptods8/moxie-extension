import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "local"
})

export const get = async <T>(key: string): Promise<T | undefined> => {
  const value = await storage.get<T>(key)
  return value
}

export const set = async <T>(key: string, value: T): Promise<void> => {
  await storage.set(key, value)
}

const remove = async (key: string): Promise<void> => {
  await storage.remove(key)
}

type ComputeFn<T> = (key: string) => Promise<T>

export const getOrCompute = async <T>(
  key: string,
  computeFn: ComputeFn<T>,
  forceRecompute?: boolean
): Promise<T> => {
  if (!forceRecompute) {
    const val = await get<T>(key)
    if (val) {
      return val
    }
  }
  const computed = await computeFn(key)
  try {
    await set(key, computed)
  } catch (e) {
    console.warn("failed to save computed value", key, computed)
  }
  return computed
}

