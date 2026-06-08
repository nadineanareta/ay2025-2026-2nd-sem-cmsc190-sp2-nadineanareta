const express = require("express");
const router = express.Router();
const db = require("../models");
const authenticateToken = require('../authentication/authentication_middleware');

/* 
The all-crops endpoint retrieves the list of crops, their ids, and the total number of images uploaded by their users.
Request parameters: None
*/
router.get("/all-crops", authenticateToken, async(req, res) => {
	try {
		const query = 'SELECT crops.id AS id, crops.crop_name AS division, COUNT(images.id) AS total_images FROM `cropdex_crops` crops LEFT JOIN `cropdex_image_data` images ON crops.id = images.crop_id GROUP BY crops.id ORDER BY total_images DESC';
		const crop_data = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });
		res.json(crop_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

router.get("/crop-pest-disease", authenticateToken, async(req, res)=>{
	try {
		const query = 'SELECT crops.id AS crop_id, crops.crop_name AS crop_name, annotations.pest_disease_label AS pest_disease, COUNT(annotations.pest_disease_label) AS total_count FROM `cropdex_crops` crops JOIN `cropdex_image_data` img_data ON crops.id = img_data.crop_id JOIN `cropdex_annotations` annotations ON img_data.id = annotations.image_data_id GROUP BY crops.id, crops.crop_name, annotations.pest_disease_label ORDER BY crops.crop_name, total_count DESC;';

		const crop_data = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });

		res.json(crop_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({ error:"Internal Server Error"});
	}

});


/* 
The crop-validities endpoint retrieves the unique validities types of the crops and counts the images.
Request parameters: 
crop_id (Int)
*/
router.get("/crop-validities", authenticateToken, async(req, res) => {
	try {
		const crop_id = req.query.crop_id;
		const query = `SELECT photo_validity AS division, COUNT(DISTINCT id) AS total_images FROM \`cropdex_image_data\` WHERE crop_id = ${crop_id} GROUP BY photo_validity ORDER BY total_images DESC`
		const crop_data = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });
		res.json(crop_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/* 
The crop-validity-label-types endpoint retrieves the unique label types of the crop's image annotations and counts the images.
Request parameters: 
crop_id (Int)
photo_validity (Int)
*/
router.get("/crop-validity-label-types", authenticateToken, async(req, res) => {
	try {
		const crop_id = req.query.crop_id;
		const photo_validity = req.query.photo_validity;
		const query = `SELECT annotations.label_type AS division, COUNT(DISTINCT images.id) AS total_images FROM \`cropdex_annotations\` as annotations LEFT JOIN \`cropdex_image_data\` as images ON images.id = annotations.image_data_id WHERE images.crop_id = ${crop_id} AND images.photo_validity = ${photo_validity} AND annotations.is_deleted = 'false' GROUP BY annotations.label_type ORDER BY total_images DESC`
		const crop_data = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });
		res.json(crop_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/*
The crop-images-filtered endpoint retrieves the list of images of a specific crop filtered by crop_id, label_type, and photo_validity
Request parameters: crop_id (Int)
*/
router.get("/crop-images-filtered", authenticateToken, async(req, res) => {
	try {
		const crop_id = req.query.crop_id;
		const label_type = req.query.label_type;
		const photo_validity = req.query.photo_validity;
		const image_data = await db.cropdex_image_data.findAll({
			attributes: { exclude: [ "image_file_name", "text_file_name", "coordinates", "altitude", "crop_id", "uploader_id" ] },
			include: [
				// This attaches the name and username of the image uploader
				{ model: db.cropdex_users, attributes:['id', 'username', 'display_name'] },

				// This filters the output to only provide the photos that have an annotation with a specific label type
				{ model: db.cropdex_annotations, attributes:['pest_disease_label', 'label_type'], where: { label_type : label_type, is_deleted : false } }
				],
			// This filters the output to only provide the photos under the crop id
			where: { crop_id : crop_id, photo_validity : photo_validity }
		});
		res.json(image_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/*
The crop-images-full-filter endpoint retrieves the list of images of a specific crop filtered by a multitude of parameters
Request parameters: 
crop_id (Int)
validity_requires_validation (Boolean)
validity_requires_evaluation (Boolean)
validity_valid (Boolean)
validity_invalid (Boolean)
label_pest (Boolean)
label_disease (Boolean)
label_unclassified (Boolean)
special_no_annotations (Boolean)
*/
router.get("/crop-images-full-filter", authenticateToken, async(req, res) => {
	try {
		const crop_id = req.query.crop_id;
		const validity_requires_validation = req.query.validity_requires_validation;
		const validity_requires_evaluation = req.query.validity_requires_evaluation;
		const validity_valid = req.query.validity_valid;
		const validity_invalid = req.query.validity_invalid;

		const label_pest = req.query.label_pest;
		const label_disease = req.query.label_disease;
		const label_unclassified = req.query.label_unclassified;

		const special_include_no_annotations = req.query.special_include_no_annotations;
		var include_no_annotation_flag = false;

		var photo_validity_values = [];
		var label_values = [];

		if (validity_requires_validation === 'true') {
			photo_validity_values.push(-1)
		}
		if (validity_requires_evaluation === 'true') {
			photo_validity_values.push(-2)
		}
		if (validity_valid === 'true') {
			photo_validity_values.push(1)
		}
		if (validity_invalid === 'true') {
			photo_validity_values.push(0)
		}

		if (label_pest === 'true') {
			label_values.push('pest')
		}
		if (label_disease === 'true') {
			label_values.push('disease')
		}
		if (label_unclassified === 'true') {
			label_values.push('unknown')
		}
		
		if (special_include_no_annotations === 'true') {
			include_no_annotation_flag = true
		} else {
			include_no_annotation_flag = false
		}

		const image_data = await db.cropdex_image_data.findAll({
			attributes: { exclude: [ "image_file_name", "text_file_name", "coordinates", "altitude", "crop_id", "uploader_id" ] },
			include: [
				{ model: db.cropdex_users, attributes:['id','username', 'display_name'] },
				{ model: db.cropdex_annotations,
					attributes:['pest_disease_label', 'label_type'],
					required: !include_no_annotation_flag,
					where: { label_type : { [db.Sequelize.Op.in] : label_values },
						is_deleted : false 
					}
				}
			],
			// This filters the output to only provide the photos under the crop id
			where: { crop_id : crop_id, photo_validity : { [db.Sequelize.Op.in] : photo_validity_values } }
		});
		res.json(image_data);

	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

/*
The crop-images endpoint retrieves the list of images of a specific crop.
Request parameters: crop_id (Int)
*/
router.get("/crop-images", authenticateToken, async(req, res) => {
	try {
		const crop_id = req.query.crop_id;
		const image_data = await db.cropdex_image_data.findAll({
			attributes: {
				exclude: [ "image_file_name", "text_file_name", "coordinates", "altitude", "crop_id", "uploader_id" ]
			},
			include: [
				// This attaches the name and username of the image uploader
				{ model: db.cropdex_users, attributes:['id','username', 'display_name'] }
			],
			// This filters the output to only provide the photos under the crop id
			where: { crop_id : crop_id }
		});
		res.json(image_data);
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

router.get("/crop-image-prev-next", authenticateToken, async(req, res) => {
	try {
		const crop_id = req.query.crop_id;
		// const label_type = req.query.label_type;
		// const photo_validity = req.query.photo_validity;
		const image_id = req.query.image_id;

		const validity_requires_validation = req.query.validity_requires_validation;
		const validity_requires_evaluation = req.query.validity_requires_evaluation;
		const validity_valid = req.query.validity_valid;
		const validity_invalid = req.query.validity_invalid;

		const label_pest = req.query.label_pest;
		const label_disease = req.query.label_disease;
		const label_unclassified = req.query.label_unclassified;

		const special_include_no_annotations = req.query.special_include_no_annotations;
		var include_no_annotation_flag = false;

		var photo_validity_values = [];
		var label_values = [];

		if (validity_requires_validation === 'true') {
			photo_validity_values.push(-1)
		}
		if (validity_requires_evaluation === 'true') {
			photo_validity_values.push(-2)
		}
		if (validity_valid === 'true') {
			photo_validity_values.push(1)
		}
		if (validity_invalid === 'true') {
			photo_validity_values.push(0)
		}

		if (label_pest === 'true') {
			label_values.push('pest')
		}
		if (label_disease === 'true') {
			label_values.push('disease')
		}
		if (label_unclassified === 'true') {
			label_values.push('unknown')
		}
		
		if (special_include_no_annotations === 'true') {
			include_no_annotation_flag = true
		} else {
			include_no_annotation_flag = false
		}

		// Query the previous image
		const previousImage = await db.cropdex_image_data.findOne({
			attributes: ['id'],
			where: {
				id: { [db.Sequelize.Op.lt]: image_id }, crop_id: crop_id, photo_validity: { [db.Sequelize.Op.in] : photo_validity_values }
			},
			include: [{ model: db.cropdex_annotations, required: !include_no_annotation_flag, attributes: [], where: { label_type: { [db.Sequelize.Op.in] : label_values }, is_deleted : false } }],
			order: [['id', 'DESC']]
		});

		// Query the previous image
		const nextImage = await db.cropdex_image_data.findOne({
			attributes: ['id'],
			where: {
				id: { [db.Sequelize.Op.gt]: image_id }, crop_id: crop_id, photo_validity: { [db.Sequelize.Op.in] : photo_validity_values }
			},
			include: [{ model: db.cropdex_annotations, required: !include_no_annotation_flag, attributes: [], where: { label_type: { [db.Sequelize.Op.in] : label_values }, is_deleted : false } }],
			order: [['id', 'ASC']]
		});

		res.json({ prev_image:previousImage, next_image:nextImage });
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
})

module.exports = router;