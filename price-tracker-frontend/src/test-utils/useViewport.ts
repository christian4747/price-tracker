import { afterEach, beforeEach } from 'vitest'
import { page } from 'vitest/browser'

/**
 * Run each test in the calling describe block at the given browser size, then put the browser's size back. Above
 * 1024 px wide the root font is 18 px instead of 16 px, so a desktop width gives the sizes the app has on a desktop,
 * and a phone's width gives the layout the app has on a phone.
 * @param width The browser's width
 * @param height The browser's height
 */
export const useViewport = (width: number, height: number) => {
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(async () => {
        defaultViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(width, height)
    })
    afterEach(async () => {
        await page.viewport(defaultViewport.width, defaultViewport.height)
    })
}
