import express from 'express'
import verifyToken from '../middlewares/verifyToken'
import verifyAdmin from '../middlewares/verifyAdmin'
import * as adminController from '../controllers/admin'

const router = express.Router()

router.use(verifyToken, verifyAdmin)
router.get('/summary', adminController.getSummary)
router.post('/geocode-missing-posts', adminController.geocodeMissingPosts)
router.get('/users', adminController.getUsers)
router.delete('/users/:id', adminController.deleteUser)
router.get('/posts', adminController.getPosts)
router.put('/posts/:id', adminController.updatePost)
router.delete('/posts/:id', adminController.deletePost)
router.get('/categories', adminController.getCategories)
router.post('/categories', adminController.saveCategory)
router.put('/categories/:id', adminController.saveCategory)
router.delete('/categories/:id', adminController.deleteCategory)
router.get('/provinces', adminController.getProvinces)
router.post('/provinces', adminController.saveProvince)
router.put('/provinces/:id', adminController.saveProvince)
router.delete('/provinces/:id', adminController.deleteProvince)

export default router
