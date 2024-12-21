import app from './index.js'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const PORT = process.env.PORT || 3000

function start () {
  try {
    app.listen(PORT, () => console.info(`Server started on port ${PORT}`))
  } catch (error) {
    console.error('Error starting the server:', error)
  }
}

start()