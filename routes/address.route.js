"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("../controllers/address.controller");
const auth_1 = require("../middleware/auth");
const addressrouter = express_1.default.Router();
addressrouter.post('/addresses', auth_1.isAuthenticated, address_controller_1.createAddress);
addressrouter.get('/get-addresses', auth_1.isAuthenticated, address_controller_1.getAddress);
addressrouter.put('/update-addresses', auth_1.isAuthenticated, address_controller_1.updateAddress);
exports.default = addressrouter;
