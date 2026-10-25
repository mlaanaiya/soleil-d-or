/** Shared shape of admin action results (importable from client components). */
export type ActionState = {
  ok: boolean
  message: string | null
  errors?: Record<string, string>
  /** Changes on every submission so the UI can show a fresh confirmation. */
  at?: number
}

export const initialState: ActionState = { ok: false, message: null }
