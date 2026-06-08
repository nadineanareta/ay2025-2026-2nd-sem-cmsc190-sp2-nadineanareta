const jwt = require('jsonwebtoken');  // for generating JWT tokens
const { cropdex_users } = require("../models");


const secretKey = "cdex_secret_2024_sample"

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) { return res.sendStatus(401) }

	jwt.verify(token, secretKey, async (err, user) => {
		if (err) { return res.sendStatus(403) };
		try {
			const userData = await cropdex_users.findOne({
				attributes: [ "id", "username", "display_name", "access_level_id" ],
				where: { id : user.userId }
			});

			if (userData != undefined && userData != null) {
				req.user = user;
				req.authUserData = { id: userData.id, username: userData.username, display_name: userData.display_name, access_level_id: userData.access_level_id }
				next();
			} else {
				return res.status(500).json({ error: "Internal Server Error" });
			}
		} catch (error) {
			console.error("Error fetching data: ", error);
			return res.status(500).json({ error: "Internal Server Error" });
		}
	});
};

module.exports = authenticateToken; // Export the function