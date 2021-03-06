'use strict'

const { catchRouteErrors, catchAsyncErrorsOnRouter } = require('../lib/express-async-await-error-handler')
const assert = require('assert')
const sinon = require('sinon')

function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('ExpressAsyncAwaitErrorHandler', () => {
  describe('catchRouteErrors', () => {
    it('should return the function passed as argument if it the function is not async', () => {
      const fn = () => { }
      const result = catchRouteErrors(fn)
      assert.equal(fn, result)
    })

    it("should call the function 'next' with the error if an error occurs", async () => {
      const err = new Error('whoops!')
      const fn = async () => {
        await timeout(500) // simulate some async task
        throw err
      }
      const result = catchRouteErrors(fn)
      const next = sinon.spy()

      await result({}, {}, next)
      assert(next.calledWith(err))
    })

    it("should not call the function 'next' if no error occurs", async () => {
      const fn = async () => { }
      const result = catchRouteErrors(fn)
      const next = sinon.spy()

      await result({}, {}, next)
      assert(next.notCalled)
    })
  })

  describe('catchAsyncErrorsOnRouter', () => {
    let spy
    let routerStub

    beforeEach(() => {
      spy = sinon.spy()
      routerStub = { get: spy, post: spy, put: spy, delete: spy }
    })

    const verbs = ['get', 'post', 'put', 'delete']
    verbs.forEach(verb => {
      it(`should modify async functions for ${verb.toUpperCase()} calls`, () => {
        const fn1 = () => { }
        const fn2 = async () => { }
        const fn3 = async () => { }

        catchAsyncErrorsOnRouter(routerStub)
        routerStub[verb]('/route', fn1, fn2, fn3)

        assert(spy.called)
        assert.equal(spy.args[0][0], '/route')
        assert.equal(spy.args[0][1], fn1)
        assert.notEqual(spy.args[0][2], fn2)
        assert.notEqual(spy.args[0][3], fn3)
      })
    })
  })
})
