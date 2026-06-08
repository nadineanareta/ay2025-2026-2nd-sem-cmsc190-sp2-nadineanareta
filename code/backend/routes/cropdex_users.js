const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const { cropdex_users } = require("../models");
const authenticateToken = require('../authentication/authentication_middleware');

const secretKey = "cdex_secret_2024_sample"

// DO NOT REMOVE until CropDex Mobile 1.4 is phased out
// Will be replaced by /loginauth in CropDex Mobile 1.5 and app.cropdex.org
router.post("/login", async (req, res) => {
	try {
		const data = await cropdex_users.findOne({
			attributes: ["id", "username"],
			where: { username : req.body.username, password : req.body.password }
		});
		console.log(data);
		if (data != undefined) {
			res.json({userid: data.id, error_code : 0});
		} else {
			res.json({userid : -1, error_code : 770, error_message : "Incorrect Login Credentials"});
		}
	} catch (error) {
		console.error("Error fetching cropdex data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
})

// DEPRECATED
// moved to users-router
router.post("/loginauth", async (req, res) => {
	try {
		const data = await cropdex_users.findOne({
			attributes: [
				"id", "username"
			],
			where: { username : req.body.username, password : req.body.password }
		});
		if (data != undefined) {
			const token = jwt.sign({ userId: data.id }, secretKey, { expiresIn: '3d' });
			res.json({
				userid: data.id, 
				error_code : 0,
				token: token
			});
		} else {
			res.json({ userid : -1, error_code : 770, error_message : "Incorrect Login Credentials" });
		}
	} catch (error) {
		console.error("Error fetching cropdex data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
})

// DEPRECATED
// moved to users-router
router.post("/get-user-details", authenticateToken, async (req, res) => {
	try {
		const data = await cropdex_users.findOne({
			attributes: ["id", "username", "display_name", "access_level_id"],
			where: { id : req.user.userId }
		});

		if (data != undefined) {
			res.json({ 
				username: data.username, 
				display_name: data.display_name, 
				access_level_id: data.access_level_id,
				error_code : 0 });
		} else {
			res.json({ error_code : 771, error_message : "Missing User Data" });
		}
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
})

module.exports = router;