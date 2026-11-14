import db from '../models'
import { seedLookupData } from '../services/seedLookupData'

const connectDatabase = async () => {
    try {
        await db.sequelize.authenticate()
        console.log('Connection has been established successfully.')
        await seedLookupData()
        console.log('Lookup data is ready.')
    } catch (error) {
        console.error('Unable to initialize the database:', error)
        throw error
    }
}

export default connectDatabase
