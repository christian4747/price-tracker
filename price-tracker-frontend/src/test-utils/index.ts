import userEvent from '@testing-library/user-event'

export * from '@testing-library/react'
export { renderWithClient, RenderClientWrapper } from './renderWithClient'
export { modalCloseActions, tryEveryModalCloseAction } from './modalCloseActions'
export { createPrice } from './createPrice'
export { userEvent }
export { test } from './testExtend'
import '@vitest/browser/matchers'
