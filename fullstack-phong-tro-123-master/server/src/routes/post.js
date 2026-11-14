import express from 'express'
import * as postController from '../controllers/post'
import verifyToken from '../middlewares/verifyToken'

const router = express.Router()

router.get('/all', postController.getPosts)
router.get('/limit', postController.getPostsLimit)
router.get('/new-post', postController.getNewPosts)
router.get('/smart-search', postController.smartSearchPosts)
router.get('/detail/:id', postController.getPostById)

router.use(verifyToken)
router.post('/geocode-address', postController.geocodeAddress)
router.post('/create-new', postController.createNewPost)
router.get('/limit-admin', postController.getPostsLimitAdmin)
router.put('/:id', postController.updatePost)
router.delete('/:id', postController.deleteMyPost)

export default router