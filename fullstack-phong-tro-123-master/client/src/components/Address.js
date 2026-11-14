import React, { memo, useEffect, useState } from 'react'
import { Select, InputFormV2 } from '../components'
import { apiGetPublicProvinces, apiGetPublicDistrict } from '../services'
import { useSelector } from 'react-redux'

const Address = ({ payload, setPayload }) => {
    const savedProvinces = useSelector(state => state.app.provinces || [])
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [province, setProvince] = useState('')
    const [district, setDistrict] = useState('')
    const [locationError, setLocationError] = useState('')

    useEffect(() => {
        const fetchPublicProvince = async () => {
            const getSavedProvinces = () => savedProvinces.map(item => ({
                province_id: item.code,
                province_name: item.value
            }))
            try {
                const response = await apiGetPublicProvinces()
                if (response?.data?.results?.length) {
                    setProvinces(response.data.results)
                } else {
                    setProvinces(getSavedProvinces())
                    setLocationError('Không tải được danh sách tỉnh/thành phố. Bạn vẫn có thể nhập địa chỉ chính xác.')
                }
            } catch (error) {
                setProvinces(getSavedProvinces())
                setLocationError('Không tải được danh sách tỉnh/thành phố. Bạn vẫn có thể nhập địa chỉ chính xác.')
            }
        }
        fetchPublicProvince()
    }, [savedProvinces])
    useEffect(() => {
        setDistrict('')
        setDistricts([])
        if (!province) return
        const selectedProvince = provinces.find(item => String(item.province_id) === String(province))
        if (selectedProvince?.districts?.length) {
            setDistricts(selectedProvince.districts)
            setLocationError('')
            return
        }

        const fetchPublicDistrict = async () => {
            try {
                const response = await apiGetPublicDistrict(province)
                setDistricts(response?.data?.results || [])
                if (!response?.data?.results?.length) {
                    setLocationError('Không tải được danh sách quận/huyện. Bạn vẫn có thể nhập địa chỉ chính xác.')
                } else {
                    setLocationError('')
                }
            } catch (error) {
                setLocationError('Không tải được danh sách quận/huyện. Bạn vẫn có thể nhập địa chỉ chính xác.')
            }
        }
        fetchPublicDistrict()
    }, [province, provinces])

    useEffect(() => {
        const provinceName = provinces.find(item => String(item.province_id) === String(province))?.province_name
        const districtName = districts.find(item => String(item.district_id) === String(district))?.district_name
        const addressParts = String(payload.addressDetail || '').split(',')
            .map(part => part.trim())
            .filter(Boolean)
        for (const locationName of [districtName, provinceName]) {
            if (locationName && !addressParts.some(part => part.toLocaleLowerCase() === locationName.toLocaleLowerCase())) {
                addressParts.push(locationName)
            }
        }
        setPayload(prev => ({
            ...prev,
            address: addressParts.join(', '),
            province: provinceName || ''
        }))

    }, [province, district, districts, provinces, payload.addressDetail, setPayload])

    return (
        <div>
            <h2 className='font-semibold text-xl py-4'>Địa chỉ cho thuê</h2>
            <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-4'>
                    <Select type='province' value={province} setValue={setProvince} options={provinces} label='Tỉnh/Thành phố' />
                    <Select type='district' value={district} setValue={setDistrict} options={districts} label='Quận/Huyện' />
                </div>
                <InputFormV2
                    label='Địa chỉ chính xác (số nhà, đường, phường/xã)'
                    value={payload.addressDetail || ''}
                    setValue={setPayload}
                    name='addressDetail'
                    small='Bạn có thể nhập địa chỉ đầy đủ nếu danh sách tỉnh/quận không tải được.'
                />
                {locationError && <p className='text-sm text-amber-700'>{locationError}</p>}
            </div>
        </div>
    )
}

export default memo(Address)