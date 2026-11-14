import express from 'express'
require('dotenv').config()
import cors from 'cors'
import initRoutes from './src/routes'
import connectDatabase from './src/config/connectDatabase'

const app = express()
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["POST", 'GET', 'PUT', "DELETE"]
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

initRoutes(app)

const port = process.env.PORT || 8888
connectDatabase().then(() => {
    const listener = app.listen(port, () => {
        console.log(`Server is running on the port ${listener.address().port}`)
    })
}).catch(error => {
    console.error('Server startup failed:', error.message)
    process.exitCode = 1
})
