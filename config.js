import dotenv from "dotenv"
import fc from "find-config"
const config = dotenv.config({ path: fc('.env') }).parsed||{}
export default config