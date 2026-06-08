// THIS ENTIRE FILE IS DEPRECATED AND REPLACED BY image-data-router.js

const express = require("express");
const router = express.Router();
const db = require("../models");
const { Op, col, fn } = require('sequelize');
const authenticateToken = require('../authentication/authentication_middleware');

const image_upload_directory = '/home/bitnami/image_uploads';

function isValidDate(d) { return d instanceof Date && !isNaN(d) }

router.get("/all-annotation-data", async (req, res) => {
    try {
        const start_date_filter = req.query.start_date;
        const end_date_filter = req.query.end_date;
        const crop_filters = req.query.crops;
        const label_filters = req.query.labels;

        var image_data_where = {};

        const start_date = new Date(start_date_filter);
        const end_date = new Date(end_date_filter);

        if (isValidDate(start_date) && isValidDate(end_date)) {
            image_data_where.date_taken = {
                [Op.between]: [start_date, end_date]
            };
        }

        if (Array.isArray(crop_filters)) {
            image_data_where.crop_id = {
                [Op.in] : crop_filters
            };
        } else if (!isNaN(crop_filters)) {
            image_data_where.crop_id = Number(crop_filters);
        }

        var annotation_query = {
            where : {},
            include: [
                {
                    model: db.cropdex_image_data,
                    where: image_data_where
                }
            ],
            group: ['pest_disease_label', 'image_data_id']
        };

        if (Array.isArray(label_filters)) {
            annotation_query.where.pest_disease_label = {
                [Op.in] : label_filters
            };
        } else if (label_filters) {
            annotation_query.where.pest_disease_label = label_filters;
        }

        console.log(annotation_query);
        const annotation_data = await db.cropdex_annotations.findAll(annotation_query);
        res.json(annotation_data);
    } catch (error) {
        console.error("Error fetching data: ", error);
        res.status(500).json({error: "Internal Server Error"});
    }

});

router.get("/get-images-without-label", async (req, res) => {
    const cropid = req.query.cropid;
    try {
        const data = await db.cropdex_image_data.findAll({
        include: [{
            model: db.cropdex_annotations,
            required: false,
            attributes: [],
        }],
        where: {
            '$cropdex_annotations.id$' : null,
            crop_id : cropid
        },
            raw: true
        });
        res.json(data);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Error retrieving data' });
    }
})

router.get("/get-images-via-label", async (req, res) => {
    const pest_disease_label = req.query.pdl;
    try {
        const data = await db.cropdex_image_data.findAll({ 
            include: [{
                model:db.cropdex_annotations,
                where: { 
                    pest_disease_label: pest_disease_label,
                    is_deleted: false
                }
            }],
            where: {
                photo_validity : 1
            }
        });
        res.json(data);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Error retrieving data' });
    }
})

// This route serves the image file
router.get("/retrieve-image", async (req, res) => {
    const image_id = req.query.id;
    try {
        const retrieved_image_data = await db.cropdex_image_data.findOne({ 
            where : {
                id : parseInt(image_id) 
            }
        });
        res.sendFile(retrieved_image_data.image_file_name, {root : image_upload_directory});
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Error retrieving data' });
    }
});

// This route serves the image file
router.get("/get-image-information", async (req, res) => {
    const image_id = req.query.id;
    try {
        const retrieved_image_data = await db.cropdex_image_data.findOne({
            attributes: {
                exclude: [ 'image_file_name', 'text_file_name', 'coordinates', 'altitude', 'uploader_id' ]
            }, 
            where : {
                id : parseInt(image_id) 
            },
            include: [
                {
                    model:db.cropdex_annotations,
                    attributes: { exclude: [ 'image_data_id', 'annotator_id' ] },
                    include: [ { model:db.cropdex_users, attributes: ['username', 'display_name'] } ]
                },
                {
                    model:db.cropdex_validations,
                    attributes: { exclude: [ 'image_data_id', 'validator_id' ] },
                    include: [
                        { model:db.cropdex_users, attributes:['username'] }
                    ]
                },
                {
                    model:db.cropdex_users,
                    attributes:['username', 'display_name']
                },
                {
                    model:db.cropdex_crops,
                    attributes:['crop_name']
                }
            ]
        });
        res.json(retrieved_image_data);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Error retrieving data' });
    }
});

// FOR GETTING LOCATION
router.get("/image-location-uniques", async(req, res) => {
    try {
        const location_data = await db.cropdex_image_data.findAll({
            attributes: [
                'coordinates',
                [db.Sequelize.fn('COUNT', '*'), 'count'], // Count of each unique combination
            ],
            group: ['coordinates'],
            order: [[db.Sequelize.literal('count'), 'DESC']], // Order by the count in descending order
            raw: true
        });
        res.json({ error_code : 0, label_data : location_data });
    } catch (error) {
        console.error("Error fetching data: ", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

module.exports = router;