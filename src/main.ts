import { defaultExpressThreadpool } from './4-libuv-threadpool/1-default-express-threadpool'
import { workerPoolRun } from './6-worker-pool/2-bcrypt-experiments/server'
import { expressWorkerThread } from './5-worker-thread/3-server/server'
import { resizeImage } from './5-worker-thread/2-resize-image/resize-main'
import { resizeVideo } from './6-worker-pool/3-resize-video/video-main'
import {
  non_blocking_sync_after_io_never,
  non_blocking_sync_after_io_sometimes,
  non_blocking_sync_sometimes,
} from './1-event-loop/tasks-event-loop/blocking-and-non-blocking-event-loop'
import { runOwnImplWorkerpool } from './6-worker-pool/1-own-implementation/main'

import './shared/global'
import { timeouts_io_immediate } from './1-event-loop/tasks-event-loop/tasks-with-answers'
import { ioOperations } from './2-async-debugger/examples/3-io-operations'
import { workerpoolVsWorkerthreads } from './6-worker-pool/4-workerpool-vs-worker-threads/server'
import {
  runSequentialPromises,
  runConcurrentPromises,
  runParallelPromises,
} from './1-event-loop/sequential-vs-concurrent-vs-parallel'

// runConcurrent()
// expressWorkerThread()

// defaultExpressThreadpool()
// workerPoolRun()
// expressWorkerThread()
// resizeImage()
// resizeVideo()
// resizeImage()
// resizeVideo()
// expressWorkerThread()
// workerPoolRun()`

// runOwnImplWorkerpool()

// workerPoolRun()
// workerpoolVsWorkerthreads({
//   mode: 'worker-threads',
//   // workerpoolMax: 12,
//   concurrentWorkers: 12,
// })

// workerPoolRun({ workersInWorkerpool: 11 })
// import './7-processing-and-clustering/2-base-clustering/cluster'
// import './7-processing-and-clustering/1-base-processing/main'
// import './8-semaphore-mutex-shared-buffer/semaphore/1-race-condition'
// import './8-primitive-parallel-sync-programming/semaphore/3-binary-semaphore-with-atomics'
// import './8-primitive-parallel-sync-programming/semaphore/4-binary-semaphore-with-atomics-2'
// import './8-primitive-parallel-sync-programming/semaphore/6-counting-semaphore-with-atomics'
// import './8-primitive-parallel-sync-programming/mutex/1-mutex'
// import './8-primitive-parallel-sync-programming/mutex/2-deadlock'
// import './8-primitive-parallel-sync-programming/mutex/3-livelock'
// import './8-primitive-parallel-sync-programming/mutex/point/point-race-condition'

// import './8-primitive-parallel-sync-programming/mutex/1-mutex-base'
// import './8-primitive-parallel-sync-programming/mutex/2-deadlock'
// import './8-primitive-parallel-sync-programming/mutex/3-livelock'
// import './8-primitive-parallel-sync-programming/mutex/point/point-race-condition'
// import './8-primitive-parallel-sync-programming/mutex/point/point-no-race'
import './8-sync-primitives-for-parallel-programming/mutex/5-async/root'
// expressWorkerThread()
// runSequentialPromises()
// runConcurrentPromises()
// runParallelPromises()
