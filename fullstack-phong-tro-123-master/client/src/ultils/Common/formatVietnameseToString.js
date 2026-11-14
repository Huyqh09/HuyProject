
export const formatVietnameseToString = (keyword) => {
    return String(keyword || '')
        .toLocaleLowerCase('vi')
        .replace(/đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}