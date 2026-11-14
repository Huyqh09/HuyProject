export const getSearchFilters = search => {
    const params = new URLSearchParams(search)
    const filters = {}
    for (const key of ['categoryCode', 'provinceCode', 'keyword', 'priceMax', 'areaMin', 'radiusKm']) {
        const value = params.get(key)
        if (value) filters[key] = value
    }
    for (const key of ['priceNumber', 'areaNumber']) {
        const values = params.getAll(key)
            .map(value => value.trim())
            .filter(Boolean)
            .map(Number)
            .filter(Number.isFinite)
        if (values.length) filters[key] = values
    }
    return filters
}
