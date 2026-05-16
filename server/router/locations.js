import express from "express"
import {getLocations} from "../controller/locations.js";

const route = express.Router()

route.get("/",getLocations)

export default route