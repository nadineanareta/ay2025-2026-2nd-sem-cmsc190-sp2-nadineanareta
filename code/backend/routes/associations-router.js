const express = require("express");
const router = express.Router();
const db = require("../models");
const authenticateToken = require('../authentication/authentication_middleware');

/* 
The all-associations endpoint retrieves the list of associations, their ids, and the total number of images uploaded by their users.
Request parameters: None
*/
router.get("/all-associations", authenticateToken, async(req, res) => {
	try {
		const query = 'SELECT a.id AS id, a.association AS division, COUNT(c.id) AS total_images FROM `cropdex_associations` a LEFT JOIN `cropdex_users` b ON a.id = b.association_id LEFT JOIN `cropdex_image_data` c ON b.id = c.uploader_id GROUP BY a.id ORDER BY total_images DESC';
		const association_data = await db.sequelize.query(query, {
			type: db.sequelize.QueryTypes.SELECT,
		});
		res.json(association_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/* 
The associations-names endpoint retrieves the list of associations names only. This is used for user registration.
Request parameters: None
*/
router.get("/association-names", async(req, res) => {
	try {
		const association_data = await db.cropdex_associations.findAll({
			attributes: ['id', 'association'],
			order: [['association', 'ASC']]
		});
		res.json(association_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/*
The association-images endpoint retrieves the list of images uploaded by the users of a specified association.
Request parameters: association_id (Int)
*/
router.get("/association-images", authenticateToken, async(req, res) => {
	try {
		const association_id = req.query.association_id;
		const image_data = await db.cropdex_image_data.findAll({
			attributes: {
				exclude: [ "image_file_name", "text_file_name", "coordinates", "altitude", "crop_id", "uploader_id" ]
			},
			include: [
				// This attaches the name and username of the image uploader
				{ 
					model: db.cropdex_users, 
					attributes:['username', 'display_name'],
					// This filters the output to only provide the photos of users under the association
					where: { association_id : association_id }
				}
			]
		});
		res.json(image_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/*
The association-image-annotation-uniques endpoint retrieves the list of unique labels + labeltype + croptype combinations
*/
router.get("/association-crop-image-count", authenticateToken, async(req, res) => {
	try {
		if (req.authUserData.access_level_id >= 5) {
			const association_id = req.query.association_id;

			const count_data = await db.cropdex_image_data.findAll({
				attributes: [
					[db.Sequelize.fn('COUNT', '*'), 'count'] // Count distinct images
				],
				include: [
					{ model: db.cropdex_crops, attributes: ['id', "crop_name"] },
					{ model: db.cropdex_users, attributes: [], where: { association_id: association_id } },
				],
				group: [db.Sequelize.col('cropdex_crop.crop_name')],
				order: [[db.Sequelize.literal('count'), 'DESC']], // Order by the count in descending order
				raw: true
			})

			const association_data = await db.cropdex_associations.findOne({
				attributes: [ 'association' ],
				where: { id: association_id },
				raw: true
			})

			res.json({ error_code : 0, data : count_data, association_data: association_data });
		} else {
			res.json({ error_code : 774, error_message : "Unauthorized User" });
		}
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/*
The association-image-annotation-uniques endpoint retrieves the list of unique labels + labeltype + croptype combinations
*/
router.get("/association-image-annotation-uniques", authenticateToken, async(req, res) => {
	try {
		if (req.authUserData.access_level_id >= 5) {
			const association_id = req.query.association_id;

			const annotation_data = await db.cropdex_image_data.findAll({
				attributes: [
					[db.Sequelize.col('cropdex_crop.crop_name'), 'crop_name'],
					[db.Sequelize.col('cropdex_annotations.pest_disease_label'), 'pest_disease_label'],
					// [db.Sequelize.fn('COUNT', '*'), 'count'] // Count of each unique combination with distinct image IDs
					[db.Sequelize.fn('COUNT', db.Sequelize.fn('DISTINCT', db.Sequelize.col('cropdex_image_data.id'))), 'count'] // Count distinct images
				],
				include: [
					{ model: db.cropdex_crops, attributes: ['id'] },
					{ model: db.cropdex_users, attributes: [], where: { association_id: association_id } },
					{ model: db.cropdex_annotations, attributes: [], where: { is_deleted: false}, required : true }
				],
				group: [db.Sequelize.col('cropdex_annotations.pest_disease_label'), db.Sequelize.col('cropdex_crop.crop_name')],
				order: [
					[db.Sequelize.col('cropdex_crop.crop_name'), 'ASC'],
					[db.Sequelize.literal('count'), 'DESC']
				], // Order by the count in descending order
				raw: true
			})
			res.json({ error_code : 0, label_data : annotation_data });
		} else {
			res.json({ error_code : 774, error_message : "Unauthorized User" });
		}
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

module.exports = router;