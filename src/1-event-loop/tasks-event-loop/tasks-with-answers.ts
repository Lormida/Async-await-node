import fs from 'fs'
import path from 'path'
import url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const baz = () => console.log('baz')
const foo = () => console.log('foo')
const zoo = () => console.log('zoo')

const testPromise = (value: string | number) =>
  new Promise<string | number>((res) => {
    console.log('X')
    res(value)
  }).then(logger)

const logger = (a: string | number) => console.log(a)
const sleep = () => new Promise((resolve) => setTimeout(resolve, 1000))

const tempFile = path.join(__dirname, '../../../file.txt')

// Part 1 - sync + await
async function sync_await1() {
  async function test() {
    logger('2')

    await testPromise(4)

    logger('5')
  }

  logger('1')
  test()
  logger('3')

  // 1 2 X 3 4 5
}

async function sync_await2() {
  /**
   * Case 2 - the only difference is test() ---> await test()
   */
  async function test() {
    logger('2')

    await testPromise(4)

    logger('5')
  }

  logger('1')
  await test()
  logger('3')

  // 1 2 x 4 5 3
}

// Part 2 - nextTick and promise queues (microtasks)
function attempt_unblock_event_loop() {
  function syncHeavy() {
    console.log('heavy sync operation start') // 2
    for (let i = 0; i < 3000000000; i++) {
      /* empty */
    }
    console.log('heavy sync operation end') // 3
  }

  setTimeout(() => {
    console.log('start setTimeout') // 1
    syncHeavy()
  }, 0)

  setTimeout(() => {
    console.log('timeout 1') // 4
  }, 10)
}

function nexttick_event_loop_starvation1() {
  /**
   * ? NextTick will be run recursively (setTimeout and setImmediate will never be achieved)
   */

  let count = 0
  const cb = () => {
    console.log(`Processing nextTick cb ${++count}`)
    process.nextTick(cb) // 3
  }

  setImmediate(() => console.log('setImmediate is called')) // never
  setTimeout(() => console.log('setTimeout executed'), 100) // never

  process.nextTick(cb) // 2

  console.log('Start') // 1
}

function nexttick_event_loop_starvation2() {
  setTimeout(() => console.log('timeout 0'), 0) // 4

  process.nextTick(() => {
    console.log('nextTick1') // 1

    process.nextTick(() => {
      console.log('nextTick2') // 2

      process.nextTick(() => {
        console.log('nextTick3') // 3
      })
    })
  })
}

function promise_event_loop_starvation() {
  /**
   * It works the same as with nextTick starvation
   */
  setTimeout(() => console.log('timeout 0'), 0) // 4

  Promise.resolve().then(() => {
    console.log('promise1') // 1

    Promise.resolve().then(() => {
      console.log('promise2') // 2

      Promise.resolve().then(() => {
        console.log('promise3') // 3
      })
    })
  })
}

function attempt_immediate_event_loop_starvation() {
  setTimeout(() => console.log('timeout 0'), 0) // 2

  setImmediate(() => {
    console.log('immediate 1') // 1

    setImmediate(() => {
      console.log('immediate 2') // 3

      setImmediate(() => {
        console.log('immediate 3') // 4
      })
    })
  })
}

function microtasks_sync1() {
  /**
   * ? All callbacks in the nextTick queue are executed before all callbacks in promise queue.
   * BUT! It works only for CJS modules,
   * When we run app in ES modules, it's running in global async context
   * => in microtasks queue => promises will be resolved earlier than the nextTicks
   */
  console.log('Start') // 1

  process.nextTick(() => {
    console.log('nextTick 1') // 3 || 5
  })

  process.nextTick(() => {
    console.log('nextTick 2') // 4 || 6
  })

  Promise.resolve().then(() => {
    console.log('Promise 1') // 5 || 3
  })

  Promise.resolve().then(() => {
    console.log('Promise 2') // 6 || 4
  })

  console.log('End') // 2
}

function microtasks_sync2() {
  /**
   * ? All user-written synchronous JavaScript code takes priority over
   * ? async code that the runtime would like to eventually execute.
   */
  console.log('1') // 1

  process.nextTick(() => console.log('nextTick')) // 4

  new Promise(() => console.log('new promise')) // 2

  Promise.resolve().then(() => console.log('Promise.resolve')) // 5

  console.log('2') // 3
}

function microtasks_sync3() {
  /**
   * It depends on we run code in CJS or in ES
   */
  process.nextTick(() => console.log('nextTick')) // 1 || 5

  Promise.resolve().then(() => console.log(2)) // 2 || 1
  Promise.resolve()
    .then(() => {
      console.log(3) // 3 || 2
      process.nextTick(() => console.log(4)) // 6 || 6
      Promise.resolve().then(() => console.log(5)) // 4 || 3
    })
    .then(() => {
      console.log(6) // 5 || 4
    })
}

function microtasks_sync4() {
  process.nextTick(() => console.log('this is process.nextTick 1')) // 1 || 4
  process.nextTick(() => {
    console.log('this is process.nextTick 2') // 2 || 5

    process.nextTick(() => console.log('this is the inner next tick inside next tick')) // 4 || 8
  })

  process.nextTick(() => console.log('this is process.nextTick 3')) // 3 || 6

  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 5 || 1
  Promise.resolve().then(() => {
    console.log('this is Promise.resolve 2') // 6 || 2
    process.nextTick(() => console.log('this is the inner next tick inside Promise then block')) // 8 || 7
  })
  Promise.resolve().then(() => console.log('this is Promise.resolve 3')) // 7 || 3
}

function microtasks_sleep_sync5() {
  sleep()
    .then(() => {
      process.nextTick(() => console.log('nextTick')) // 2
      sleep().then(() => {
        console.log('top') // 3
        sleep().then(() => {
          console.log('middle') // 4
          sleep().then(() => console.log('bottom')) //5
        })
      })
    })
    .then(() => console.log('then data')) // 1
}

// ❌❌❌
function microtasks_sync5() {
  Promise.resolve()
    .then(() => {
      process.nextTick(() => console.log('nextTick')) // 5
      Promise.resolve().then(() => {
        console.log('top') // 1
        Promise.resolve().then(() => {
          console.log('middle') // 3
          Promise.resolve().then(() => {
            console.log('bottom') // 4
          })
        })
      })
    })
    .then(() => console.log('then data')) // 2
}

function microtasks_sync6() {
  Promise.resolve()
    .then(() => {
      process.nextTick(() => console.log('nextTick')) // 5
      return Promise.resolve().then(() => {
        console.log('top') // 1
        Promise.resolve().then(() => {
          console.log('middle') // 2
          Promise.resolve().then(() => {
            console.log('bottom') // 3
          })
        })
      })
    })
    .then(() => console.log('then data')) // 4
}

async function microtasks_sync7() {
  process.nextTick(() => console.log('next tick 1')) // 1 || 6
  Promise.resolve().then(() => console.log('promise 1')) // 2 || 1

  await Promise.resolve().then(() => {
    process.nextTick(() => console.log('next tick 2')) // 7 || 7

    Promise.resolve().then(() => {
      console.log('sync 2') // 4 || 3
      Promise.resolve().then(() => console.log('promise 2')) // 6 || 5
    })

    console.log('sync 1') // 3 || 2
  })

  console.log('then data') // 5 || 4
}

function microtasks_sync8() {
  process.nextTick(() => console.log('nextTick1')) // 1 || 7

  Promise.resolve().then(() => console.log('promise 1')) // 2 || 1

  Promise.resolve()
    .then(() => {
      process.nextTick(() => console.log('nextTick 2')) // 8 || 8

      Promise.resolve().then(() => {
        console.log('promise 2') // 4 || 3

        Promise.resolve().then(() => {
          console.log('promise 3') // 6 || 5

          Promise.resolve().then(() => {
            console.log('promise 4') // 7 || 6
          })
        })
      })

      console.log('sync 1') // 3 || 2
    })
    .then(() => {
      console.log('then data') // 5 || 4
    })
}

function microtasks_sync9() {
  setTimeout(() => console.log('timeout'), 0) // 11 || 12
  setImmediate(() => console.log('immediate')) // 12 || 1

  process.nextTick(() => console.log('nextTick1')) // 1 || 7

  Promise.resolve().then(() => console.log('promise 1')) // 2 || 1

  Promise.resolve()
    .then(() => {
      console.log('sync 1') // 3 || 2
      process.nextTick(() => console.log('nextTick 2')) // 8 || 8

      Promise.resolve().then(() => {
        console.log('sync 2') // 4 || 3

        Promise.resolve().then(() => {
          console.log('promise 3') // 6 || 5

          Promise.resolve().then(() => {
            process.nextTick(() => console.log('nextTick 3')) // 9 || 9
            console.log('promise 4') // 7
            process.nextTick(() => console.log('nextTick 5')) // 10 || 10
          })
        })
      })
    })
    .then(() => {
      console.log('sync 6') // 5 || 4
    })
}

function microtasks_setImmediate_sync1() {
  console.log('start') // 1

  setImmediate(baz) // 6

  Promise.resolve().then(() => {
    console.log('bar 2') // 3 || 2
    process.nextTick(zoo) // 5
  })

  new Promise<void>((resolve) => {
    resolve()
  }).then(() => {
    console.log('bar') // 4 || 3
  })

  process.nextTick(foo) // 2 || 4
}

function microtasks_setImmediate_sync2() {
  console.log('start') // 1

  setImmediate(baz) // 6

  new Promise((resolve) => {
    console.log('pre-promise') // 2
    resolve('bar')
  }).then((value) => {
    console.log(value) // 4 || 3
    process.nextTick(zoo) // 5
  })

  process.nextTick(foo) // 3 || 4
}

// Part 3 - timer queue
function microtasks_timeouts1() {
  /**
   * ? Callbacks in the Microtask Queues are executed before callbacks in the Timer Queue.
   * For ES the order will be another
   */
  setTimeout(() => console.log('this is setTimeout 1'), 0)
  setTimeout(() => console.log('this is setTimeout 2'), 0)
  setTimeout(() => console.log('this is setTimeout 3'), 0)

  process.nextTick(() => console.log('this is process.nextTick 1')) // 1
  process.nextTick(() => {
    console.log('this is process.nextTick 2') // 2
    process.nextTick(() => console.log('this is the inner next tick inside next tick')) // 4
  })
  process.nextTick(() => console.log('this is process.nextTick 3')) // 3

  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 5
  Promise.resolve().then(() => {
    console.log('this is Promise.resolve 2') // 6
    process.nextTick(() => console.log('this is the inner next tick inside Promise then block')) // 8
  })
  Promise.resolve().then(() => console.log('this is Promise.resolve 3')) // 7
}

function microtasks_timeouts2() {
  /**
   * ? Callbacks in microtask queues are executed in between the execution of callbacks in the timer queue
   */
  setTimeout(() => console.log('this is setTimeout 1'), 0) // 9
  setTimeout(() => {
    console.log('this is setTimeout 2') // 10
    process.nextTick(() => console.log('this is inner nextTick inside setTimeout')) // 11
  }, 0)

  setTimeout(() => console.log('this is setTimeout 3'), 0) // 12

  process.nextTick(() => console.log('this is process.nextTick 1')) // 1
  process.nextTick(() => {
    console.log('this is process.nextTick 2') // 2
    process.nextTick(() => console.log('this is the inner next tick inside next tick')) // 4
  })
  process.nextTick(() => console.log('this is process.nextTick 3')) // 3

  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 5
  Promise.resolve().then(() => {
    console.log('this is Promise.resolve 2') // 6
    process.nextTick(() => console.log('this is the inner next tick inside Promise then block')) // 8
  })
  Promise.resolve().then(() => console.log('this is Promise.resolve 3')) // 7
}

// Part 4 - IO queue
function timeouts_io() {
  /**
   * !Long explanation:
   * ? At the start of the event loop, Node.js needs to determine if the 1ms timer has elapsed or not.
   * ? If the event loop enters the timer queue at 0.05ms and the 1ms callback hasn't been queued,
   * ? control moves on to the I/O queue, executing the readFile() callback.
   * ? In the next iteration of the event loop, the timer queue callback will be executed.
   *
   * ? On the other hand, if the CPU is busy and enters the timer queue at 1.01 ms,
   * ? the timer will have elapsed and the callback function will be executed.
   * ? Control will then proceed to the I/O queue, and the readFile() callback will be executed.
   * ? Due to the uncertainty of how busy the CPU can be and the 0ms delay being overwritten as 1ms delay,
   * ? we can never guarantee the order of execution between a 0ms timer and an I/O callback.
   */
  /**
   * !TLTR:
   * ? When running setTimeout() with a delay of 0ms and an I/O async method,
   * ? the order of execution can never be guaranteed.
   */
  setTimeout(() => console.log('this is setTimeout 1'), 0) // 1 or 2

  fs.readFile(tempFile, () => {
    console.log('this is readFile 1') // 1 or 2
  })
}

function timeouts_io_immediate() {
  /**
   * ? Suggestion: we are planning the invoking of
   * ? setTimeout inside IO phase,
   * ? setImmediate in IO phase
   *
   * ? But since after IO phase goes always check phase
   * ? setImmediate always be run earlier than setTimeout
   *
   * >>> It's truth. setImmediate -> setTimeout
   */

  fs.readFile(tempFile, async (err) => {
    if (err) throw new Error(`error during read file: ${JSON.stringify(err)}`)

    setTimeout(() => {
      console.log('we are inside setTimeout') // 2
    }, 0)

    setImmediate(() => {
      console.log('we are inside setImmediate') // 1
    })
  })
}

function microtasks_timeouts_io_heavy_sync() {
  /**
   * ? I/O queue callbacks are executed after Microtask queues callbacks and Timer queue callbacks.
   * ? Thank to artificial block of event loop, we make sure that all operations are ready
   * ? and after unblocking of EL, this one starts new cycle: Mictrotasks -> Timeouts -> IO
   */
  fs.readFile(tempFile, () => {
    console.log('this is readFile 1') // 4
  })

  process.nextTick(() => console.log('this is process.nextTick 1')) // 1
  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 2
  setTimeout(() => console.log('this is setTimeout 1'), 0) // 3

  for (let i = 0; i < 2000000000; i++) {
    /* empty */
  }
}

// Part 5 - IO polling
function microtasks_timeouts_io_immediate_heavy_sync1() {
  // Source: https://www.builder.io/blog/visualizing-nodejs-io-polling#conclusion
  // https://cdn.builder.io/o/assets%2FYJIGb4i01jvw0SRdL5Bt%2F51da94592e4a405f94d2d0d3ce2ab3a5%2Fcompressed?apiKey=YJIGb4i01jvw0SRdL5Bt&token=51da94592e4a405f94d2d0d3ce2ab3a5&alt=media&optimized=true
  /**
   * ! I/O events are polled and callback functions are added to the I/O queue only after the I/O is complete
   */

  /**
   * ! Conclusion:
   * ? Once an I/O operation completes, its callback function is not immediately
   * ? queued into the I/O queue. Instead, an I/O polling phase checks for the completion
   * ? of I/O operations and queues up the callbacks for completed operations.
   * ? This can sometimes result in check queue callbacks being executed before I/O queue callbacks.
   *
   * ? However, when both queues contain callback functions, the callbacks in the I/O queue
   * ? always take priority and run first. It is crucial to understand this behaviour
   * ? when designing systems that rely on I/O callbacks to ensure the proper
   * ? ordering and execution of callbacks.
   */

  /**
   * ! Explanation:
   * ? Now comes the interesting part. When the control reaches the I/O queue,
   * ? we expect the readFile() callback to be present, right?
   * ? After all, we have a long-running for loop, and readFile() should have completed by now.
   * ? However, in reality, the event loop has to poll to check if I/O operations are complete,
   * ? and it only queues up completed operation callbacks.
   * ? This means that when the control enters the I/O queue for the first time, this queue is still empty.
   * ? The control then proceeds to the polling part of the event loop, where it checks with readFile()
   * ? if the task has been completed. readFile() confirms that it has, and the event loop now adds
   * ? the associated callback function to the I/O queue.
   *
   * ? However, the execution has already moved past the I/O queue,
   * ? and the callback has to wait for its turn to be executed.
   * ? The control then proceeds to the check queue, where it finds one callback.
   * ? It logs "setImmediate 1" to the console and then starts a new iteration because there
   * ? is nothing else left to process in the current iteration of the event loop.
   *
   * ? It appears that the microtask and timer queues are empty, but there is a callback in the I/O queue.
   * ? The callback is executed, and "readFile 1" is finally logged to the console.
   *
   * ? This is why we see "setImmediate 1" logged before "readFile 1".
   * ? This behavior actually occurred in our previous experiment as well,
   * ? but we didn't have any further code to run, so we didn't observe it.
   */
  fs.readFile(tempFile, () => {
    console.log('this is readFile 1') //! 5
  })

  process.nextTick(() => console.log('this is process.nextTick 1')) // 1
  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 2
  setTimeout(() => console.log('this is setTimeout 1'), 0) // 3
  setImmediate(() => console.log('this is setImmediate 1')) //! 4

  for (let i = 0; i < 2000000000; i++) {
    /* empty */
  }
}

// Part 6 - Check phase
function immediate_microtasks_timeouts() {
  console.log('Root Code - START') // 1

  setImmediate(() => {
    console.log('--Immediate 1') // 5
    process.nextTick(() => {
      console.log('--Next Tick 2')
    }) // 6
  })

  setTimeout(() => {
    Promise.resolve().then((x) => {
      console.log('--Promise 2')
    }) // 9
    setTimeout(() => {
      console.log('--Timeout 3')
    }, 1000) // 11
    setImmediate(() => {
      console.log('--Immediate 2')
    }) // 10
    process.nextTick(() => {
      console.log('--Next Tick 3')
    }) // 8

    console.log('--Timeout 1') // 7
  }, 1000)

  Promise.resolve().then((x) => {
    console.log('--Promise 1')
  }) // 4
  process.nextTick(() => {
    console.log('--Next Tick 1')
  }) // 3

  console.log('Root Code - END - Event Loop Takes Over') // 2
}

function immediate_recursive() {
  /**
   * ? Unlike process.nextTick(), recursive calls to setImmediate() won't block the event loop,
   * ? because every recursive call is executed only on the next event loop iteration.
   */
  let count = 0

  const cb = () => {
    console.log(`Processing setImmediate cb ${++count}`) // 2..500 (f.e), 502 ... ∞
    setImmediate(cb)
  }

  setImmediate(cb)
  setTimeout(() => console.log('setTimeout executed'), 100) // 501

  console.log('Start') // 1
}

function microtasks_timeouts_io_immediate_heavy_sync2() {
  /**
   * ? Check queue callbacks are executed after microtask queues callbacks, timer queue callbacks and I/O queue callbacks are executed.
   */
  fs.readFile(tempFile, () => {
    console.log('this is readFile 1') // 4
    setImmediate(() => console.log('this is setImmediate 1')) // 5
  })

  process.nextTick(() => console.log('this is process.nextTick 1')) // 1
  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 2
  setTimeout(() => console.log('this is setTimeout 1'), 0) // 3

  for (let i = 0; i < 2000000000; i++) {
    /* empty */
  }
}

function microtasks_timeouts_io_immediate_heavy_sync3() {
  /**
   * ? Microtask queues callbacks are executed after I/O queue callbacks and before check queue callbacks.
   */

  fs.readFile(tempFile, () => {
    console.log('this is readFile 1') // 4

    setImmediate(() => console.log('this is setImmediate 1')) // 7

    process.nextTick(
      () => console.log('this is inner process.nextTick inside readFile') // 5
    )

    Promise.resolve().then(
      () => console.log('this is inner Promise.resolve inside readFile') // 6
    )
  })

  process.nextTick(() => console.log('this is process.nextTick 1')) // 1
  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 2
  setTimeout(() => console.log('this is setTimeout 1'), 0) // 3

  for (let i = 0; i < 2000000000; i++) {
    /* empty */
  }
}

function microtasks_immediates() {
  /**
   * ? Microtask queue callbacks are executed between check queue callbacks.
   * ? (the same as timeouts)
   */
  setImmediate(() => console.log('this is setImmediate 1')) // 1
  setImmediate(() => {
    console.log('this is setImmediate 2') // 2
    process.nextTick(() => console.log('this is process.nextTick 1')) // 3
    Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 4
  })
  setImmediate(() => console.log('this is setImmediate 3')) // 5
}

function immediates_timeouts() {
  /**
   * * Source: https://github.com/nodejs/help/issues/392#issuecomment-305969168
   * The callback in the Timer phase is run if the current time of loop is greater than the timeout.
   * One more important things to note is setTimeout when set to 0 is internally converted to 1.
   * Also as the hr_time return time in Nanoseconds, this behaviour as shown by the timeout_vs_immediate.js becomes more explanatory now.
   * If the preparation before the first loop took more than 1ms then the Timer Phase calls the callback associated with it.
   * If it's is less than 1ms Event-loop continues to next phase and runs the setImmediate callback in check phase
   * of the loop and setTimeout in the next tick of the loop.
   *
   * Hopefully this clarifies the way around the non-deterministic behaviour of setTimeout and setImmediate when both are called from within the main module.
   */
  setTimeout(() => console.log('this is setTimeout 1'), 0)
  setImmediate(() => console.log('this is setImmediate 1'))
}

// Part 7 - Close phase
function microtasks_timeouts_immediate_close() {
  /**
   * ? Close queue callbacks are executed after all other queue callbacks in a given iteration of the event loop.
   */

  const readableStream = fs.createReadStream(tempFile)
  readableStream.close()

  readableStream.on('close', () => {
    console.log('this is from readableStream close event callback') // 5
  })

  setImmediate(() => console.log('this is setImmediate 1')) // 4 or 3
  setTimeout(() => console.log('this is setTimeout 1'), 0) // 3 or 4
  Promise.resolve().then(() => console.log('this is Promise.resolve 1')) // 2
  process.nextTick(() => console.log('this is process.nextTick 1')) // 1
}

function timeouts_io_immediate_close() {
  /**
   * ? Suggestion: we are planning the invoking of
   * ? setTimeout inside IO phase,
   * ? setImmediate in close phase
   *
   * ? Another words during close phase our setTimeout will be ready to be resolved.
   * ? And till to the next EL cycle setTimeout will be resolved earlier than setImmediate
   *
   * >>> It's truth. setTimeout -> setImmediate
   */

  fs.readFile(tempFile, async (err) => {
    if (err) throw new Error(`error during read file: ${JSON.stringify(err)}`)

    setTimeout(() => {
      console.log('we are inside setTimeout') // 1
    }, 0)

    const readableStream = fs.createReadStream(tempFile)

    readableStream.close()

    readableStream.on('close', () => {
      setImmediate(() => {
        console.log('we are inside setImmediate') // 2
      })
    })
  })
}

export {
  sync_await1,
  sync_await2,
  attempt_unblock_event_loop,
  // ..
  nexttick_event_loop_starvation1,
  nexttick_event_loop_starvation2,
  promise_event_loop_starvation,
  attempt_immediate_event_loop_starvation,
  microtasks_sync1,
  microtasks_sync2,
  microtasks_sync3,
  microtasks_sync4,
  microtasks_sync5,
  microtasks_sleep_sync5,
  microtasks_sync6,
  microtasks_sync7,
  microtasks_sync8,
  microtasks_sync9,
  microtasks_setImmediate_sync1,
  microtasks_setImmediate_sync2,
  // ..
  microtasks_timeouts1,
  microtasks_timeouts2,
  // ..
  timeouts_io,
  timeouts_io_immediate,
  microtasks_timeouts_io_heavy_sync,
  // ..
  immediate_recursive,
  microtasks_timeouts_io_immediate_heavy_sync1,
  microtasks_timeouts_io_immediate_heavy_sync2,
  microtasks_timeouts_io_immediate_heavy_sync3,
  microtasks_immediates,
  immediates_timeouts,
  // ..
  microtasks_timeouts_immediate_close,
  timeouts_io_immediate_close,
}
