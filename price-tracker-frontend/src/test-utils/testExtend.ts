import { test as testBase } from 'vitest'
import { worker } from '../mocks/browser'

export const test = testBase.extend({
    worker: [
        // Vitest requires fixtures to destructure their first argument, even when unused
        // oxlint-disable-next-line no-empty-pattern
        async ({}, use) => {
            // Start the worker before the test.
            await worker.start()

            // Expose the worker object on the test's context.
            await use(worker)

            // Remove any request handlers added in individual test cases.
            // This prevents them from affecting unrelated tests.
            worker.resetHandlers()
        },
        {
            scope: 'worker',
            auto: true
        }
    ]
})
