import express from 'express';
import { createAddress, getAddress, updateAddress } from '../controllers/address.controller';
import { isAuthenticated } from '../middleware/auth';


const addressrouter = express.Router();

addressrouter.post('/addresses',isAuthenticated, createAddress);

addressrouter.get('/get-addresses',isAuthenticated, getAddress);

addressrouter.put('/update-addresses',isAuthenticated, updateAddress);





export default addressrouter;
