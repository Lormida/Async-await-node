/**
 * ? If to use makeFetch instead of Promise.resolve()
 * ? functions works as expected (check ./promises-predictable.ts)
 *
 * ! ❌❌❌ means that i don't understand yet how it works
 */

// ❌❌❌
async function promise1() {
  /**
   * Output:
   * 1
   * 2
   * data: undefined // why after 2 ?
   * 3
   * 4
   * 5
   * 6
   */
  Promise.resolve()
    .then(() => {
      console.log(1)
      Promise.resolve().then(() => {
        console.log(2)
        Promise.resolve().then(() => {
          console.log(3)
          Promise.resolve().then(() => {
            console.log(4)
            Promise.resolve().then(() => {
              console.log(5)
              Promise.resolve().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ❌❌❌
async function promise2() {
  /**
   * Return after console.log(1)
   */
  /**
   * Output:
   * 1
   * 2
   * 3
   * 4
   * data: undefined
   * 5
   * 6
   */
  Promise.resolve()
    .then(() => {
      console.log(1)

      return Promise.resolve().then(() => {
        console.log(2)
        Promise.resolve().then(() => {
          console.log(3)
          Promise.resolve().then(() => {
            console.log(4)
            Promise.resolve().then(() => {
              console.log(5)
              Promise.resolve().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ❌❌❌
async function promise3() {
  /**
   * The same as promise2 but with async
   */
  /**
   * Output:
   * 1
   * 2
   * 3
   * 4
   * 5
   * 6
   * data: undefined
   */
  Promise.resolve()
    .then(() => {
      console.log(1)

      return Promise.resolve().then(async () => {
        console.log(2)
        Promise.resolve().then(() => {
          console.log(3)
          Promise.resolve().then(() => {
            console.log(4)
            Promise.resolve().then(() => {
              console.log(5)
              Promise.resolve().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ❌❌❌
async function promise4() {
  /**
   * Return after console.log(2)
   */
  /**
   * Output:
   * 1
   * 2
   * data: undefined
   * 3
   * 4
   * 5
   * 6
   */
  Promise.resolve()
    .then(() => {
      console.log(1)
      Promise.resolve().then(() => {
        console.log(2)
        return Promise.resolve().then(() => {
          console.log(3)
          Promise.resolve().then(() => {
            console.log(4)
            Promise.resolve().then(() => {
              console.log(5)
              Promise.resolve().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ❌❌❌
async function promise5() {
  /**
   * Return after console.log(3)
   */
  /**
   * Output:
   * 1
   * 2
   * data: undefined
   * 3
   * 4
   * 5
   * 6
   */
  Promise.resolve()
    .then(() => {
      console.log(1)
      Promise.resolve().then(() => {
        console.log(2)
        Promise.resolve().then(async () => {
          console.log(3)
          return Promise.resolve().then(async () => {
            console.log(4)
            Promise.resolve().then(async () => {
              console.log(5)
              Promise.resolve().then(async () => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ❌❌❌
async function promise6() {
  /**
   * Output:
   * 1
   * 2
   * 3
   * 4
   * 5
   * data: undefined
   * 6
   */
  Promise.resolve()
    .then(async () => {
      console.log(1)
      return Promise.resolve().then(() => {
        console.log(2)
        Promise.resolve().then(() => {
          console.log(3)
          Promise.resolve().then(() => {
            console.log(4)
            Promise.resolve().then(() => {
              console.log(5)
              Promise.resolve().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

export { promise1, promise2, promise3, promise4, promise5, promise6 }
