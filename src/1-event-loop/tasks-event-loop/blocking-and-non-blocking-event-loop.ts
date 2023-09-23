/**
 * Based on (including):
 * https://snyk.io/blog/nodejs-how-even-quick-async-functions-can-block-the-event-loop-starve-io/
 */

import fs from 'fs'
import bcryptjs from 'bcryptjs'
import url from 'url'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const tempFile = path.join(__dirname, '../../../../temp/old.txt')

/**
 * ? This technique is called as:
 * ! Synchronous code-splitting
 */
export function non_blocking_sync_always() {
  /**
   * ? Here we have the blocking of EL due to a lot of sync opearitions.
   * -----
   * ! Solution: forcefuly plan setImedidate on current promise and "scroll forward" EL
   * ! It unblocks EL always (because we have a lot of setImmeidate calls)
   */
  ;(async () => {
    let result = 0

    for (let i = 0; i < 250_000_000; i++) {
      result += i

      if (i % 100_000_000 === 0) {
        await new Promise((resolve) => setImmediate(resolve))
      }
    }

    console.log('Finished adding numbers', result)
  })()

  setTimeout(() => {
    console.log('0 ms timeout - non-blocking-sync-always')
  }, 0)
}

export function non_blocking_sync_sometimes() {
  return new Promise((resolve) => {
    /**
     * ? Here we have the blocking of EL due to a lot of sync opearitions.
     * -----
     * ! Solution: forcefuly plan setImedidate on current promise and "scroll forward" EL
     * ? It unblocks EL sometimes.
     * ? Unlike of NonBlockingSyncAfterIO it's possibe unblock with only 1 setImmediate.
     */

    ;(async () => {
      let result = 0

      for (let i = 0; i < 250_000_000; i++) {
        result += i

        if (i == 2) {
          await new Promise((resolve) => setImmediate(resolve))
        }
      }

      return resolve('sync')
      console.log('Finished adding numbers', result)
    })()

    setTimeout(() => {
      return resolve('timeout')
      console.log('0 ms timeout - non-blocking-sync-sometimes')
    }, 0)
  })
}

export function non_blocking_sync_after_io_never() {
  return new Promise((resolve, reject) => {
    fs.readFile(tempFile, async (err) => {
      if (err) {
        reject(new Error(`error during read file: ${JSON.stringify(err)}`))
      }
      /**
       * ? Here we have the blocking of EL due to a lot of sync opearitions.
       * -----
       * ! Solution: forcefuly plan setImedidate on current promise and "scroll forward" EL
       */

      /**
       * ? Suggestion: theoretically right now we are inside IO phase
       * ? --> setImmediate always runs before setTimeout => we can't unblock EL
       *
       * ! >>> It's truth!
       * ! >>> We need at least 2 setImmediate in order to unblock it
       */

      ;(async () => {
        let result = 0

        for (let i = 0; i < 250_000_000; i++) {
          result += i

          if (i == 2) {
            await new Promise((resolve) => setImmediate(resolve))
          }
        }

        return resolve('sync')
        console.log('Finished adding numbers', result)
      })()

      setTimeout(() => {
        return resolve('timeout')
        console.log('we are inside timeout phase - 0 ms')
      }, 0)
    })
  })
}

export function non_blocking_sync_after_io_sometimes() {
  return new Promise((resolve, reject) => {
    fs.readFile(tempFile, async (err) => {
      if (err) {
        reject(new Error(`error during read file: ${JSON.stringify(err)}`))
      }
      /**
       * ? Here we have the blocking of EL due to a lot of sync opearitions.
       * -----
       * ! Solution: forcefuly plan setImedidate on current promise and "scroll forward" EL
       */

      /**
       * ? Suggestion: theoretically right now we are inside IO phase
       * ? --> setImmediate always runs before setTimeout => we can't unblock EL
       *
       * ! >>> It's truth!
       * ! >>> We need at least 2 setImmediate in order to unblock it
       */

      ;(async () => {
        let result = 0

        for (let i = 0; i < 250_000_000; i++) {
          result += i

          if (i == 2) {
            await new Promise((resolve) => setImmediate(resolve))
            await new Promise((resolve) => setImmediate(resolve))
          }
        }

        return resolve('sync')
        console.log('Finished adding numbers', result)
      })()

      setTimeout(() => {
        return resolve('timeout')
        console.log('we are inside timeout phase - 0 ms')
      }, 0)
    })
  })
}

export function non_blocking_async() {
  /**
   * ? Here we have starvation IO usecase, because promise_queue add new promises
   * ? on current queue and EL can't move on to the next phase
   * -----
   * ! Solution: forcefuly plan setImedidate on current promise and "scroll forward" EL
   */
  ;(async () => {
    let result = 0

    for (let i = 0; i < 10; i++) {
      result += await Promise.resolve(i)

      if (i > 0 && i % 3 === 0) {
        await new Promise((resolve) => setImmediate(resolve))
      }
    }

    console.log('Finished adding numbers', result)
  })()

  setTimeout(() => {
    console.log('0 ms timeout - non-blocking-async')
  }, 0)
}

export function bcryptjs_proof_async() {
  /**
   * ? Despite the fact that bcryptjs doesn't use threads for libuv threapool
   * ! (proof in: 4-libuv-threadpool/1-default-express-threadpool.ts)
   * ? it's full asyncronous and doesn't block event loop
   */

  ;(async () => {
    for (let i = 0; i < 100; i++) {
      const hash = await bcryptjs.hash('this is a long password', 8)
    }

    console.log('end sync calculation') // 2
  })()

  setTimeout(() => {
    console.log('timeout 0ms') // 1
  }, 0)
}

export function bcryptjs_proof_sync() {
  /**
   * ! Full sync function and blocks EL
   */

  ;(async () => {
    /**
     * Intentially use async-await in order to proof that it doesn't affect to EL and
     * blocks it anyway
     */
    for (let i = 0; i < 100; i++) {
      const hash = await bcryptjs.hashSync('this is a long password', 8)
    }

    console.log('end sync calculation')
  })()

  setTimeout(() => {
    console.log('timeout 0ms')
  }, 0)
}
