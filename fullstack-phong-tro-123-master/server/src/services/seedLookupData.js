import db from '../models'
import { dataArea, dataPrice } from '../ultis/data'
import generateProvinceCode from '../ultis/generateProvinceCode'
const { Op } = require('sequelize')

const categories = [
    {
        code: 'CTCH',
        value: 'Cho thuê căn hộ',
        header: 'Cho Thuê Căn Hộ Chung Cư, Giá Rẻ, Mới Nhất',
        subheader: 'Cho thuê căn hộ, chung cư với nhiều mức giá và diện tích.'
    },
    {
        code: 'CTMB',
        value: 'Cho thuê mặt bằng',
        header: 'Cho Thuê Mặt Bằng, Văn Phòng, Cửa Hàng',
        subheader: 'Tin cho thuê mặt bằng, văn phòng, cửa hàng và ki-ốt.'
    },
    {
        code: 'CTPT',
        value: 'Cho thuê phòng trọ',
        header: 'Cho Thuê Phòng Trọ, Giá Rẻ, Tiện Nghi',
        subheader: 'Tin cho thuê phòng trọ với nhiều mức giá và diện tích.'
    },
    {
        code: 'NCT',
        value: 'Nhà cho thuê',
        header: 'Cho Thuê Nhà Nguyên Căn, Giá Tốt',
        subheader: 'Tin cho thuê nhà nguyên căn tại các tỉnh, thành phố.'
    }
]

const provinces = [
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Giang', 'Bắc Kạn',
    'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước',
    'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk',
    'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
    'Hà Nam', 'Hà Nội', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang',
    'Hòa Bình', 'Hồ Chí Minh', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang',
    'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An',
    'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
    'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
    'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
    'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
    'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
]

const normalizeValue = value => value.trim()
    .replace(/^(Thành phố|Tỉnh|TP\.?)\s*/i, '')
    .toLocaleLowerCase('vi')

const getProvinceCodeFromAddress = address => {
    const province = normalizeValue(String(address || '').split(',').pop() || '')
    const normalizedProvince = ['tphcm', 'tp.hcm', 'tp hcm', 'sai gon'].includes(province)
        ? normalizeValue('Hồ Chí Minh')
        : province
    return provinces.find(value => normalizeValue(value) === normalizedProvince)
        ? generateProvinceCode(provinces.find(value => normalizeValue(value) === normalizedProvince))
        : null
}

const parseListingPrice = value => {
    const text = String(value || '').toLocaleLowerCase('vi')
    const match = text.match(/\d[\d.,]*/)
    if (!match) return null

    const amountText = match[0]
    const hasMillionUnit = /triệu|\btr\b/.test(text)
    const hasThousandUnit = /nghìn|ngàn/.test(text)
    const amount = hasMillionUnit
        ? Number(amountText.replace(',', '.'))
        : /^\d{1,3}(?:[.,]\d{3})+$/.test(amountText)
            ? Number(amountText.replace(/[.,]/g, ''))
            : Number(amountText.replace(',', '.'))

    if (!Number.isFinite(amount)) return null
    if (hasMillionUnit) return amount
    if (hasThousandUnit) return amount / 1000
    return amount > 1000 ? amount / 1000000 : amount
}

const parseListingArea = value => {
    const match = String(value || '').match(/\d+(?:[.,]\d+)?/)
    if (!match) return null
    const area = Number(match[0].replace(',', '.'))
    return Number.isFinite(area) ? area : null
}

const findRangeCode = (value, ranges) => {
    if (!Number.isFinite(value)) return null
    return ranges.find(range => range.min <= value && value < range.max)?.code || null
}

const ensureLookupTables = async () => {
    await Promise.all([
        db.Category.sync(),
        db.Price.sync(),
        db.Area.sync(),
        db.Province.sync()
    ])

    const queryInterface = db.sequelize.getQueryInterface()
    let categoryColumns = await queryInterface.describeTable(db.Category.getTableName())
    if (!categoryColumns.header) {
        await queryInterface.addColumn(db.Category.getTableName(), 'header', {
            type: db.Sequelize.STRING,
            allowNull: true
        })
        categoryColumns = await queryInterface.describeTable(db.Category.getTableName())
    }
    if (!categoryColumns.subheader) {
        await queryInterface.addColumn(db.Category.getTableName(), 'subheader', {
            type: db.Sequelize.STRING,
            allowNull: true
        })
    }
    if (categoryColumns.subtitle) {
        await db.Category.update(
            { header: db.sequelize.col('subtitle') },
            { where: { header: null, subtitle: { [Op.not]: null } } }
        )
    }
}

const ensurePostLookupColumns = async () => {
    const queryInterface = db.sequelize.getQueryInterface()
    const tableName = db.Post.getTableName()
    const columns = await queryInterface.describeTable(tableName)
    const postColumns = {
        priceCode: db.Sequelize.STRING,
        areaCode: db.Sequelize.STRING,
        provinceCode: db.Sequelize.STRING,
        priceNumber: db.Sequelize.FLOAT,
        areaNumber: db.Sequelize.FLOAT,
        latitude: db.Sequelize.DECIMAL(10, 7),
        longitude: db.Sequelize.DECIMAL(10, 7)
    }

    for (const [column, type] of Object.entries(postColumns)) {
        if (!columns[column]) {
            await queryInterface.addColumn(tableName, column, {
                type,
                allowNull: true
            })
        }
    }
}

const ensureRows = async (model, rows, key, defaultsForRow) => {
    for (const [index, row] of rows.entries()) {
        const defaults = defaultsForRow(row, index)
        const [record, created] = await model.findOrCreate({
            where: { [key]: defaults[key] },
            defaults
        })
        if (!created && model === db.Province && record.code !== defaults.code) {
            await record.update({ code: defaults.code })
        }
    }
}

const fillMissingPostLookupData = async () => {
    const posts = await db.Post.findAll({
        attributes: ['id', 'address', 'provinceCode', 'priceCode', 'areaCode', 'priceNumber', 'areaNumber'],
        include: [{ model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage'] }]
    })

    for (const post of posts) {
        const priceNumber = post.priceNumber ?? parseListingPrice(post.attributes?.price)
        const areaNumber = post.areaNumber ?? parseListingArea(post.attributes?.acreage)
        const updates = {
            priceNumber: post.priceNumber ?? priceNumber,
            areaNumber: post.areaNumber ?? areaNumber,
            priceCode: post.priceCode || findRangeCode(priceNumber, dataPrice),
            areaCode: post.areaCode || findRangeCode(areaNumber, dataArea),
            provinceCode: getProvinceCodeFromAddress(post.address) || post.provinceCode
        }
        const changed = Object.entries(updates).some(([key, value]) => value != null && post[key] !== value)
        if (changed) await post.update(updates)
    }
}

export const seedLookupData = async () => {
    await ensureLookupTables()
    await ensurePostLookupColumns()

    await ensureRows(db.Category, categories, 'code', category => category)
    await ensureRows(db.Price, dataPrice, 'code', (item, index) => ({
        code: item.code,
        value: item.value,
        order: index + 1
    }))
    await ensureRows(db.Area, dataArea, 'code', (item, index) => ({
        code: item.code,
        value: item.value,
        order: index + 1
    }))
    await ensureRows(db.Province, provinces, 'value', value => ({
        code: generateProvinceCode(value),
        value
    }))
    await fillMissingPostLookupData()
}
