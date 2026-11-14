import { formatVietnameseToString } from './formatVietnameseToString'
import postReducer from '../../store/reducers/postReducer'
import actionTypes from '../../store/actions/actionTypes'
import { getSearchFilters } from './getSearchFilters'

describe('formatVietnameseToString', () => {
    it('creates a route-safe slug from Vietnamese titles with punctuation', () => {
        expect(formatVietnameseToString('Cho thuê phòng trọ đầy đủ nội thất, đường 3/2'))
            .toBe('cho-thue-phong-tro-day-du-noi-that-duong-3-2')
    })

    it('returns an empty string for an empty value', () => {
        expect(formatVietnameseToString('')).toBe('')
    })

    it('keeps the previous posts when a refresh fails', () => {
        const state = {
            posts: [{ id: 'existing-post' }],
            count: 1,
            msg: '',
            newPosts: [],
            postOfCurrent: [],
            dataEdit: {}
        }

        const nextState = postReducer(state, {
            type: actionTypes.GET_POSTS_LIMIT,
            msg: 'Network error'
        })

        expect(nextState.posts).toEqual(state.posts)
        expect(nextState.count).toBe(state.count)
        expect(nextState.msg).toBe('Network error')
    })

    it('parses repeated price and area bounds without treating display labels as keywords', () => {
        expect(getSearchFilters('?priceNumber=3&priceNumber=5&areaNumber=20&areaNumber=30&provinceCode=VN-HO-CHI-MINH'))
            .toEqual({
                priceNumber: [3, 5],
                areaNumber: [20, 30],
                provinceCode: 'VN-HO-CHI-MINH'
            })
    })
})
