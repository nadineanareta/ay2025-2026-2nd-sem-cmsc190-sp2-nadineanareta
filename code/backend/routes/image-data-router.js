const express = require("express");
const router = express.Router();
const db = require("../models");
const authenticateToken = require('../authentication/authentication_middleware');
const image_upload_directory = '/home/bitnami/image_uploads';

const archiver = require("archiver");
const path = require("path");
const fs = require("fs");

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SUPABASE_BUCKET_NAME = 'detection-feedback-images';

/*
The retrieve-image endpoint serves the image file assigned to the image id passed.
Request parameters: id (Int)
*/
router.get("/retrieve-image", async (req, res) => {
	const image_id = req.query.id;
	try {
		const retrieved_image_data = await db.cropdex_image_data.findOne({ 
			attributes : ['image_file_name'],
			where : { id : parseInt(image_id) }
		});
		res.sendFile(retrieved_image_data.image_file_name, {root : image_upload_directory});
	} catch (error) {
		console.error('Error retrieving data:', error);
		res.status(500).json({ error: 'Error retrieving data' });
	}
});

/*
The get-image-information endpoint retrieves the image information of the provided image id.
Request parameters: id (Int)
*/
router.get("/get-image-information", authenticateToken, async (req, res) => {
	const image_id = req.query.id;
	try {
		const retrieved_image_data = await db.cropdex_image_data.findOne({
			attributes: {
				// list of fields to exclude from the image data row
				exclude: [ 'image_file_name', 'text_file_name', 'coordinates', 'altitude', 'uploader_id' ]
			}, 
			where : { id : parseInt(image_id) },
			include: [
				// This attaches the name and username of the image uploader
				{ model:db.cropdex_users, attributes:['id', 'username', 'display_name'] },

				// This attaches the list of annotations of the image
				{
					model:db.cropdex_annotations,
					attributes: { exclude: [ 'image_data_id', 'annotator_id' ] },
					// this attaches the name and username of the annotation uploader to each annotation
					include: [{ model:db.cropdex_users, attributes: ['id', 'username', 'display_name'] }]
				},

				// This attaches the list of validations (However, this validation feature is currently not in use)
				{
					model:db.cropdex_validations,
					attributes: { exclude: [ 'image_data_id', 'validator_id'] },
					include: [{ model:db.cropdex_users, attributes:['username'] }]
				}
			]
		});
		const response_data = {
			image_data : retrieved_image_data,
			authorized_user_info : req.authUserData
		}
		res.json(response_data);
	} catch (error) {
		console.error('Error retrieving data:', error);
		res.status(500).json({ error: 'Error retrieving data' });
	}
});

/*
The update-image-data endpoint receives a complete image update object and updates the related image and its annotations.

Request Body:
{
	id (Int)
	photo_validity (Int)
	crop_id (Int)
	edited_annotations (Edited Annotation Array)
	added_annotations (Added Annotation Array)
}

Edited Annotation Object:
{
	id (Int)
	is_deleted (Boolean)
	label_type (String)
}

Added Annotation Object:
{
	rect_left (Float)
	rect_top (Float)
	rect_right (Float)
	rect_bottom (Float)
	pest_disease_label (String)
	is_deleted (Boolean)
	label_type (Boolean)
}

*/
router.post("/update-image-data", authenticateToken, async (req, res) => {
	try {

		if (req.authUserData.access_level_id >= 5) {

			await db.cropdex_image_data.update(
				{ 
					photo_validity: req.body.photo_validity,
					crop_id: req.body.crop_id
				},
				{ where: { id: req.body.id } }
			);

			for (let i = 0; i < req.body.edited_annotations.length; i++) {
				await db.cropdex_annotations.update(
					{ 
						is_deleted: req.body.edited_annotations[i].is_deleted,
						label_type: req.body.edited_annotations[i].label_type
					},
					{ where: { id: req.body.edited_annotations[i].id } }
				);
			}

			for (let i = 0; i < req.body.added_annotations.length; i++) {
				db.cropdex_annotations.create(
					{
						rect_left: req.body.added_annotations[i].rect_left,
						rect_top: req.body.added_annotations[i].rect_top,
						rect_right: req.body.added_annotations[i].rect_right,
						rect_bottom: req.body.added_annotations[i].rect_bottom,
						pest_disease_label: req.body.added_annotations[i].pest_disease_label,
						image_data_id: req.body.id,
						annotator_id: req.user.userId,
						is_deleted: req.body.added_annotations[i].is_deleted,
						label_type: req.body.added_annotations[i].label_type
					}
				);
			}
			res.json({ error_code : 0, message : "Success" });
		} else {
			res.json({ error_code : 774, error_message : "Unauthorized User" });
		}
	} catch (error) {
		console.error("Error saving data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
})

/*
The image-annotation-uniques endpoint retrieves the list of unique labels + labeltype + croptype combinations
*/
router.get("/image-annotation-uniques", authenticateToken, async(req, res) => {
	try {
		if (req.authUserData.access_level_id >= 5) {
			const annotation_data = await db.cropdex_annotations.findAll({
				attributes: [
					'pest_disease_label',
					'label_type',
					[db.Sequelize.col('cropdex_image_datum->cropdex_crop.crop_name'), 'crop_name'],
					[db.Sequelize.fn(
						'COUNT', 
						db.Sequelize.literal(`CASE WHEN label_type != 'unknown' THEN 1 ELSE NULL END`)
					), 'count'],
					[db.Sequelize.fn('COUNT', db.Sequelize.fn('DISTINCT', db.Sequelize.col('cropdex_image_datum.id'))), 'image_count']
				],
				include: [{
					model: db.cropdex_image_data,
					attributes: [],
					where: { photo_validity: 1 },
					include: [{ model: db.cropdex_crops, attributes: ['id'] }]
				}],
				group: [
					db.Sequelize.col('pest_disease_label'), db.Sequelize.col('label_type'), db.Sequelize.col('cropdex_image_datum.cropdex_crop.id')
					],
				order: [[db.Sequelize.literal('image_count'), 'DESC']],
				raw: true
			});
			res.json({ error_code : 0, label_data : annotation_data });
		} else {
			res.json({ error_code : 774, error_message : "Unauthorized User" });
		}
	} catch (error) {
		console.error("Error fetching data: ", error);
		res.status(500).json({error: "Internal Server Error"});
	}
});

// Gets the images uploaded by the logged-in user
router.get("/my-images", authenticateToken, async (req, res) => {
	
	const page=parseInt(req.query.page) || 1; 
	const limit=18; 
	const offset=(page-1)*limit;

	try {
	  const image_data = await db.cropdex_image_data.findAndCountAll({
      attributes: ["id", "date_taken", "photo_validity"],
      where: { uploader_id: parseInt(req.user.userId) },
      order: [["date_taken", "DESC"]],
	  offset: offset,
      limit: limit,
    });

	  if (image_data.count > 0) {
		
		const images = {
		  rows: image_data.rows.map(img => ({
			id: img.id,
			url: `/retrieve-image?id=${img.id}`,
			date: img.date_taken,
			validity: img.photo_validity
		  }))
		};
		const totalImages = image_data.count;
		const totalPages = Math.ceil(image_data.count / limit); 
		res.json({ images, totalPages, totalImages });
		  
	  } else {
		res.status(404).json({ error: "User has not yet uploaded pictures" });
	  }
	} catch (error) {
	  console.error("Error retrieving data:", error);
	  res.status(500).json({ error: "Error retrieving data" });
	}
  });

// POST /image-data/dataset-download - Download a custom dataset based on user-selected filters and ratios
router.post("/dataset/download", authenticateToken, async (req, res) => {
  try {
    const { crop_name, pests, diseases, split_mode, ratios } = req.body;    
    const selectedLabels = [...(pests || []), ...(diseases || [])];

    if (selectedLabels.length === 0) {
      return res.status(400).json({ error: "No labels selected for download." });
    }

    const uniqueLabelsQuery = await db.cropdex_annotations.findAll({
      attributes: [
        'pest_disease_label',
        [db.Sequelize.fn('MIN', db.Sequelize.col('cropdex_annotations.createdAt')), 'first_seen']
      ],
      include: [{
        model: db.cropdex_image_data,
        attributes: [],
        where: { photo_validity: 1 },
        include: [{ 
            model: db.cropdex_crops, 
            attributes: [],
            where: { crop_name: crop_name } 
        }]
      }],
      group: ['pest_disease_label'],
      order: [[db.Sequelize.literal('first_seen'), 'ASC']],
      raw: true
    });
    const globalMasterLabels = uniqueLabelsQuery.map(row => row.pest_disease_label);

    const images = await db.cropdex_image_data.findAll({
      where: { photo_validity: 1 },
      include: [
        {
          model: db.cropdex_crops,
          where: { crop_name: crop_name },
          attributes: []
        },
        {
          model: db.cropdex_annotations,
          where: { pest_disease_label: selectedLabels, is_deleted: false },
          attributes: ['pest_disease_label', 'rect_left', 'rect_top', 'rect_right', 'rect_bottom']
        }
      ]
    });

    if (images.length === 0) {
      return res.status(404).json({ error: "No valid images found for the selected labels." });
    }

    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }

    const totalImages = images.length;
    const trainCount = Math.floor(totalImages * (ratios.train / 100));
    const valCount = Math.floor(totalImages * (ratios.validate / 100));
    const testImagesArr = images.slice(trainCount + valCount);
    const trainImagesArr = images.slice(0, trainCount);
    const valImagesArr = images.slice(trainCount, trainCount + valCount);

    const formatImageMeta = (imgArray, splitName) => {
      return imgArray.map(img => {
        const relevantAnns = img.cropdex_annotations.filter(ann => selectedLabels.includes(ann.pest_disease_label));
        
        const annotations = relevantAnns.map(ann => ({
          label: ann.pest_disease_label,
          left: ann.rect_left,
          top: ann.rect_top,
          right: ann.rect_right,
          bottom: ann.rect_bottom
        }));
        
        return {
          id: img.id,
          split: splitName,
          labels: [...new Set(relevantAnns.map(a => a.pest_disease_label))], 
          annotations: annotations
        };
      });
    };

    const trainMeta = formatImageMeta(trainImagesArr, "train");
    const validMeta = formatImageMeta(valImagesArr, "valid");
    const testMeta = split_mode === "train_validate_test" ? formatImageMeta(testImagesArr, "test") : [];
    
    const allImageMetadata = [...trainMeta, ...validMeta, ...testMeta];
    const sortedLabels = selectedLabels.sort().join(', ');
    const cropName = crop_name;

    let datasetRecord = await db.cropdex_datasets.create({
        crop: cropName,
        labels: sortedLabels,
        num_images: totalImages,
        image_ids: JSON.stringify(allImageMetadata) ,
        creator_id: req.user.userId
    });

    res.attachment(`${crop_name}_${pests.join('_')}_${diseases.join('_')}${ratios.train}-${ratios.validate}-${ratios.test}_Dataset.zip`);
    const archive = archiver("zip", { zlib: { level: 9 } }); 

    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      res.status(500).end();
    });
    archive.pipe(res);

    archive.append('', { name: 'train/images/' });
    archive.append('', { name: 'train/labels/' });
    archive.append('', { name: 'valid/images/' });
    archive.append('', { name: 'valid/labels/' });
    if (split_mode === "train_validate_test") {
      archive.append('', { name: 'test/images/' });
      archive.append('', { name: 'test/labels/' });
    }

    let yamlContent = `train: ./train\nval: ./valid\n`;
    if (split_mode === "train_validate_test") yamlContent += `test: ./test\n`;
    yamlContent += `crop: ${crop_name}\n`;
    yamlContent += `\nnc: ${globalMasterLabels.length}\n`;
    yamlContent += `names:\n`;
    globalMasterLabels.forEach((label, index) => {
      yamlContent += `  ${index}: ${label}\n`;
    });
    archive.append(yamlContent, { name: 'data.yaml' });

    const appendToArchiveAsync = async (imgArray, folderName) => {
      for (const img of imgArray) {
        
        try {
          const imageUrl = `https://www.api.spidhive.net/image-data/retrieve-image?id=${img.id}`;
          const imageResponse = await fetch(imageUrl);
          
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            archive.append(imageBuffer, { name: `${folderName}/images/${img.image_file_name}` });
          } else {
            console.log(`[ZIP WARNING] Could not fetch image ID: ${img.id}`);
            continue;
          }
        } catch (fetchErr) {
          console.error(`[ZIP WARNING] API Fetch Error for ID ${img.id}`);
          continue; 
        }

        let yoloContent = "";
        
        if (img.cropdex_annotations && img.cropdex_annotations.length > 0) {
          img.cropdex_annotations.forEach(ann => {
            if (selectedLabels.includes(ann.pest_disease_label)) {
              const classIndex = globalMasterLabels.indexOf(ann.pest_disease_label);
              
              if (classIndex !== -1) {
                const x_center = (ann.rect_left + ann.rect_right) / 2;
                const y_center = (ann.rect_top + ann.rect_bottom) / 2;
                const width = ann.rect_right - ann.rect_left;
                const height = ann.rect_bottom - ann.rect_top;

                yoloContent += `${classIndex} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${Math.abs(width).toFixed(6)} ${Math.abs(height).toFixed(6)}\n`;
              }
            }
          });
        }
        const textFileName = img.image_file_name.replace(/\.[^/.]+$/, "") + ".txt";
        archive.append(yoloContent, { name: `${folderName}/labels/${textFileName}` });
      }
    };

    await appendToArchiveAsync(trainImagesArr, "train");
    await appendToArchiveAsync(valImagesArr, "valid");
    if (split_mode === "train_validate_test" && testImagesArr.length > 0) {
      await appendToArchiveAsync(testImagesArr, "test");
    }

    await archive.finalize();

  } catch (error) {
    console.error("Dataset generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error during dataset generation." });
    }
  }
});

// GET /datasets - Fetch all dataset recipes for the dropdown
router.get("/datasets", authenticateToken, async (req, res) => {
    try {
        const datasets = await db.cropdex_datasets.findAll({
            include: [{
              model: db.cropdex_users,
              as: 'creator',
              attributes: ['display_name'] 
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(datasets);
    } catch (error) {
        console.error("Error fetching datasets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /dataset-preview/:datasetId - Server-Side Paginated API
router.get("/dataset-preview/:datasetId", async (req, res) => {
  try {
    const datasetId = req.params.datasetId;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const splitFilter = req.query.split || "all";
    const labelFilter = req.query.label || "all";
    const datasetRecipe = await db.cropdex_datasets.findByPk(datasetId);
    
    if (!datasetRecipe) {
      return res.status(404).json({ error: "Dataset recipe not found." });
    }

    let storedMeta = [];
    if (datasetRecipe.image_ids) {
      const parsed = JSON.parse(datasetRecipe.image_ids);
      if (parsed.length > 0 && typeof parsed[0] === 'number') {
        storedMeta = parsed.map(id => ({ id: id, split: "unknown", labels: [] }));
      } else {
        storedMeta = parsed;
      }
    }

    let filteredMeta = storedMeta;
    if (splitFilter !== "all") {
      filteredMeta = filteredMeta.filter(img => img.split === splitFilter);
    }
    if (labelFilter !== "all") {
      filteredMeta = filteredMeta.filter(img => img.labels && img.labels.includes(labelFilter));
    }

    const totalItems = filteredMeta.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const paginatedMeta = filteredMeta.slice(offset, offset + limit);

    res.json({
      recipe: datasetRecipe,
      images: paginatedMeta,
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: page
    });

  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /image-data/spidtech-live - Fetch raw mobile telemetry for the dedicated gallery
router.get("/spidtech-live", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const splitFilter = req.query.split || "all";
    const labelFilter = req.query.label || "all";

    let query = supabase.from('detection_feedback').select('*', { count: 'exact' });

    if (splitFilter !== "all") {
      query = query.eq('feedback_kind', splitFilter);
    }
    if (labelFilter !== "all") {
      query = query.eq('top_label', labelFilter);
    }

    const offset = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: supaData, count: supaCount, error: supaError } = await query;
    if (supaError) throw supaError;

    const formattedImages = supaData.map(row => {
      const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET_NAME) 
        .getPublicUrl(row.image_path);

      let annotations = [];
      try {
        const rawDetections = typeof row.detections === 'string' 
          ? JSON.parse(row.detections || "[]") 
          : (row.detections || []);
        const visibleDetections = rawDetections.filter(det => !det.is_deleted);

        annotations = visibleDetections.map(det => ({
          label: det.label,
          confidence: det.confidence,
          left: Math.max(0, det.boundingBox[0] / row.image_width),
          top: Math.max(0, det.boundingBox[1] / row.image_height),
          right: Math.min(1, det.boundingBox[2] / row.image_width),
          bottom: Math.min(1, det.boundingBox[3] / row.image_height)
        }));
      } catch (e) {
        console.warn(`Failed to parse detections for ${row.id}`, e);
      }

      return {
        id: row.id,
        date_taken: new Date(row.created_at).toLocaleString(),
        crop: row.model_display_name || "Unknown Model",
        feedback_kind: row.feedback_kind,
        photo_validity: row.photo_validity !== null ? parseInt(row.photo_validity) : -1,
        annotations: annotations,
        url: urlData.publicUrl
      };
    });

    const { data: labelsData } = await supabase.from('detection_feedback').select('top_label');
    const uniqueLabelsArray = [...new Set(labelsData.map(l => l.top_label).filter(Boolean))];

    res.json({
      images: formattedImages,
      totalItems: supaCount,
      totalPages: Math.ceil(supaCount / limit),
      currentPage: page,
      uniqueLabels: uniqueLabelsArray
    });
  } catch (error) {
    console.error("Supabase live gallery fetch error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /image-data/spidtech-live/:id - Emulates 'get-image-information' for Supabase!
router.get("/spidtech-live/:id", authenticateToken, async (req, res) => {
  try {
    const imageId = req.params.id;
    const { data, error } = await supabase.from('detection_feedback').select('*').eq('id', imageId).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Image not found" });

    const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(data.image_path);

    let mappedAnnotations = [];
    try {
      const rawDetections = typeof data.detections === 'string' ? JSON.parse(data.detections || "[]") : (data.detections || []);
      
      mappedAnnotations = rawDetections.map((det, index) => {
        const isAbs = det.boundingBox && det.boundingBox[2] > 1; // Checks if it's raw pixels
        const left = isAbs ? det.boundingBox[0] / data.image_width : (det.left || det.boundingBox[0]);
        const top = isAbs ? det.boundingBox[1] / data.image_height : (det.top || det.boundingBox[1]);
        const right = isAbs ? det.boundingBox[2] / data.image_width : (det.right || det.boundingBox[2]);
        const bottom = isAbs ? det.boundingBox[3] / data.image_height : (det.bottom || det.boundingBox[3]);

        return {
          id: `spidtech-${index}`, 
          rect_left: Math.max(0, left),
          rect_top: Math.max(0, top),
          rect_right: Math.min(1, right),
          rect_bottom: Math.min(1, bottom),
          pest_disease_label: det.label,
          label_type: "unknown",
          is_visible: true,
          is_deleted: false,
          confidence: det.confidence || 1.0,
          createdAt: data.created_at,
          cropdex_user: { display_name: "SPIDTECH+ App", id: -1 } 
        }
      });
    } catch (e) {
      console.warn(`Failed to parse detections for ${data.id}`);
    }

    res.json({
      image_data: {
        id: data.id,
        image_width: data.image_width,
        image_height: data.image_height,
        date_taken: new Date(data.created_at).toLocaleString(),
        crop_id: data.crop_id || -1,
        photo_validity: data.photo_validity !== null ? parseInt(data.photo_validity) : -1,
        crop: data.model_display_name || "Unknown",
        feedback_kind: data.feedback_kind,
        cropdex_annotations: mappedAnnotations,
        url: urlData.publicUrl,
        cropdex_user: { display_name: "SPIDTECH+ App", id: -1 }
      }
    });
  } catch (error) {
    console.error("Supabase single image fetch error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /update-spidtech-image
router.post("/update-spidtech-image", authenticateToken, async (req, res) => {
  try {
    if (req.authUserData.access_level_id >= 5) {
      const { id, edited_annotations, added_annotations, image_width, image_height, crop_id, photo_validity } = req.body;
      
      let finalDetections = [];
      
      for (let ann of edited_annotations) {
        if (!ann.is_deleted) {
          finalDetections.push({
            label: ann.pest_disease_label,
            confidence: ann.confidence || 1.0,
            boundingBox: [ ann.rect_left * image_width, ann.rect_top * image_height, ann.rect_right * image_width, ann.rect_bottom * image_height ]
          });
        }
      }

      for (let ann of added_annotations) {
        if (!ann.is_deleted) {
          finalDetections.push({
            label: ann.pest_disease_label,
            confidence: 1.0, 
            boundingBox: [ ann.rect_left * image_width, ann.rect_top * image_height, ann.rect_right * image_width, ann.rect_bottom * image_height ]
          });
        }
      }

      const { error } = await supabase.from('detection_feedback')
        .update({ 
          detections: finalDetections,
          photo_validity: photo_validity, 
          crop_id: crop_id               
        })
        .eq('id', id);

      if (error) throw error;
      res.json({ error_code: 0, message: "Success" });
    } else {
      res.status(403).json({ error_code: 774, error_message: "Unauthorized" });
    }
  } catch (error) {
    console.error("Error saving spidtech data: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /image-data/spidtech-prev-next/:id - Finds the adjacent images chronologically
router.get("/spidtech-prev-next/:id", authenticateToken, async (req, res) => {
  try {
    const currentId = req.params.id;

    const { data: current, error } = await supabase
      .from('detection_feedback')
      .select('created_at')
      .eq('id', currentId)
      .single();

    if (error || !current) return res.json({ prev_image: null, next_image: null });

    const { data: nextData } = await supabase
      .from('detection_feedback')
      .select('id')
      .lt('created_at', current.created_at)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: prevData } = await supabase
      .from('detection_feedback')
      .select('id')
      .gt('created_at', current.created_at)
      .order('created_at', { ascending: true })
      .limit(1);

    res.json({
      prev_image: prevData && prevData.length > 0 ? { id: prevData[0].id } : null,
      next_image: nextData && nextData.length > 0 ? { id: nextData[0].id } : null
    });
  } catch (err) {
    console.error("Prev/Next fetch error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;