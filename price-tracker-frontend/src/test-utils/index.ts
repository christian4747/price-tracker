import userEvent from '@testing-library/user-event'

export * from '@testing-library/react'
export { renderWithClient, RenderClientWrapper } from './renderWithClient'
export { modalCloseActions, tryEveryModalCloseAction } from './modalCloseActions'
export { getModalSize } from './getModalSize'
export { createPrice } from './createPrice'
export { createPeriod } from './createPeriod'
export { createProduct } from './createProduct'
export { createProductBody } from './createProductBody'
export { problemDetailResponse } from './problemDetailResponse'
export { userEvent }
export { test } from './testExtend'
import '@vitest/browser/matchers'
