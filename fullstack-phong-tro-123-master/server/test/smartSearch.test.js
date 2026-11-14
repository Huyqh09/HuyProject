const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const parseNumberRange = require('../src/ultis/parseNumberRange')

describe('smart-search numeric ranges', () => {
    it('parses repeated query values as inclusive bounds', () => {
        assert.deepEqual(parseNumberRange(['3', '5']), { min: 3, max: 5 })
    })

    it('parses comma-delimited query values', () => {
        assert.deepEqual(parseNumberRange('20,30'), { min: 20, max: 30 })
    })

    it('treats a single value as a lower-bound filter', () => {
        assert.deepEqual(parseNumberRange('15'), { min: 15, max: null })
    })

    it('ignores invalid and empty bounds', () => {
        assert.equal(parseNumberRange(['', 'not-a-number']), null)
    })
})
