import express from "express"
import {getCategories} from "../controller/categories.js";

const route = express.Router()

route.get("/",getCategories)

export default route