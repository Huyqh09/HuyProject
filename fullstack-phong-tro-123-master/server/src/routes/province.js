import express from 'express'
import * as controllers from '../controllers/province'
// CRUD
const router = express.Router()

router.get('/public', controllers.getPublicProvinces)
router.get('/public/:provinceId/districts', controllers.getPublicDistricts)
router.get('/all', controllers.getProvinces)

export default router