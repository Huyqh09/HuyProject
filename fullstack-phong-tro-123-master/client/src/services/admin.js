import axios from '../axiosConfig'

const request = (method, url, data) => axios({ method, url: `/api/v1/admin${url}`, data })

export const apiGetAdminSummary = () => request('get', '/summary')
export const apiGeocodeMissingPosts = () => request('post', '/geocode-missing-posts', { limit: 10 })
export const apiGetAdminUsers = () => request('get', '/users')
export const apiDeleteAdminUser = id => request('delete', `/users/${id}`)
export const apiGetAdminPosts = () => request('get', '/posts')
export const apiUpdateAdminPost = (id, data) => request('put', `/posts/${id}`, data)
export const apiDeleteAdminPost = id => request('delete', `/posts/${id}`)
export const apiGetAdminCategories = () => request('get', '/categories')
export const apiSaveAdminCategory = (data, id) => request(id ? 'put' : 'post', id ? `/categories/${id}` : '/categories', data)
export const apiDeleteAdminCategory = id => request('delete', `/categories/${id}`)
export const apiGetAdminProvinces = () => request('get', '/provinces')
export const apiSaveAdminProvince = (data, id) => request(id ? 'put' : 'post', id ? `/provinces/${id}` : '/provinces', data)
export const apiDeleteAdminProvince = id => request('delete', `/provinces/${id}`)
