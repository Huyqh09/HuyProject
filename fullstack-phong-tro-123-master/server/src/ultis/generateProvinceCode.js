const generateProvinceCode = value => `VN-${String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, match => match === 'Đ' ? 'D' : 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

export default generateProvinceCode
