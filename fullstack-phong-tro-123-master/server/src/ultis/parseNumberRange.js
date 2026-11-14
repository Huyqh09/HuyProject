const parseNumberRange = value => {
    if (value == null) return null
    const values = (Array.isArray(value) ? value : [value])
        .flatMap(item => String(item).split(','))
        .map(item => item.trim())
        .filter(Boolean)
        .map(Number)
        .filter(Number.isFinite)

    if (values.length === 0) return null
    return {
        min: values[0],
        max: values.length > 1 ? values[1] : null
    }
}

module.exports = parseNumberRange
