const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { 
  cropdex_users, 
  cropdex_image_data, 
  cropdex_annotations, 
  cropdex_ai_models,
  cropdex_crops,
  cropdex_datasets,
  cropdex_associations,
  sequelize 
} = require("../models");
const authenticateToken = require("../authentication/authentication_middleware");

// GET /crops
router.get("/crops", authenticateToken, async (req, res) => {
  try {
    const crops = await cropdex_crops.findAll({
      attributes: ['crop_name'],
      order: [['crop_name', 'ASC']],
      raw: true
    });
    const annotations = await cropdex_annotations.findAll({
      attributes: ['pest_disease_label', 'label_type'],
      where: { is_deleted: 0 },
      include: [{
        model: cropdex_image_data,
        required: true,
        attributes: ['id'],
        include: [{
          model: cropdex_crops,
          required: true,
          attributes: ['crop_name']
        }]
      }],
      raw: true,
      nest: true
    });

    const labelSet = new Set();
    const pestSet = new Set();
    const diseaseSet = new Set();
    const cropDetailedMap = {};

    annotations.forEach(ann => {
      const cropName = ann.cropdex_image_datum?.cropdex_crop?.crop_name;
      if (!cropName) return;

      const label = ann.pest_disease_label;
      const type = ann.label_type || 'Disease';
      labelSet.add(label);
      if (type === 'Pest') pestSet.add(label);
      if (type === 'Disease') diseaseSet.add(label);
      if (!cropDetailedMap[cropName]) cropDetailedMap[cropName] = [];   
      let labelEntry = cropDetailedMap[cropName].find(l => l.name === label);
      if (!labelEntry) {
        labelEntry = { name: label, type: type, count: 0 };
        cropDetailedMap[cropName].push(labelEntry);
      }
      labelEntry.count += 1;
    });
    Object.keys(cropDetailedMap).forEach(crop => {
      cropDetailedMap[crop].sort((a, b) => a.name.localeCompare(b.name));
    });

    res.json({
      totalCrops: crops.length,
      cropsList: crops.map(c => c.crop_name),
      totalLabels: labelSet.size,
      totalPests: pestSet.size,
      totalDiseases: diseaseSet.size,
      cropDetailedMap: cropDetailedMap 
    });
  } catch (error) {
    console.error("Statistics Fetch Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /annotations
router.get("/annotations", authenticateToken, async (req, res) => {
  try {
    const annotations = await cropdex_annotations.findAll({
      attributes: ['id', 'is_deleted', 'createdAt'],
      include: [{
        model: cropdex_image_data,
        required: true,
        attributes: ['photo_validity', 'location_name', 'coordinates', ], 
        include: [{
          model: cropdex_crops,
          required: true,
          attributes: ['crop_name']
        }]
      }],
      raw: true,
      nest: true
    });

    let totalAnnotations = annotations.length;
    let valid = 0;
    let invalid = 0;
    let reqEvaluation = 0;
    let deletedCount = 0;
    const cropStatsMap = {};

    annotations.forEach(ann => {
      const cropName = ann.cropdex_image_datum?.cropdex_crop?.crop_name;
      const validity = ann.cropdex_image_datum?.photo_validity;

      if (ann.is_deleted === 1) deletedCount++;

      if (cropName) {
        if (!cropStatsMap[cropName]) {
          cropStatsMap[cropName] = { 
            crop: cropName, all: 0, valid: 0, invalid: 0, 
            reqEvaluation: 0, deleted: 0, notDeleted: 0 
          };
        }
        const s = cropStatsMap[cropName];
        s.all++;
        if (ann.is_deleted === 1) {
          s.deleted++;
        } else {
          s.notDeleted++;
          if (validity === 1) { s.valid++; valid++; }
          else if (validity === -1) { s.invalid++; invalid++; }
          else if (validity === 0) { s.reqEvaluation++; reqEvaluation++; }
        }
      }
    });

    const view = req.query.view || "all-time"; 
    const targetYear = req.query.year || new Date().getFullYear();
    const targetMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
    let trendsTime = [];
    if (view === "all-time") {
      const alltimeData = await cropdex_annotations.findAll({
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("createdAt")), "yearValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        group: [sequelize.fn("YEAR", sequelize.col("createdAt"))],
        order: [[sequelize.fn("YEAR", sequelize.col("createdAt")), "ASC"]],
        raw: true
      });
      const currentYear = new Date().getFullYear();
      const startYear = 2024; 
      for (let y = startYear; y <= currentYear; y++) {
        const foundYear = alltimeData.find(d => parseInt(d.yearValue) === y);
        trendsTime.push({
          date: y.toString(), 
          count: foundYear ? parseInt(foundYear.count) : 0 
        });
      }
    } else if (view === "yearly") {
      const yearlyData = await cropdex_annotations.findAll({
        attributes: [
          [sequelize.fn("MONTH", sequelize.col("createdAt")), "monthValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        where: sequelize.where(sequelize.fn("YEAR", sequelize.col("createdAt")), targetYear),
        group: [sequelize.fn("MONTH", sequelize.col("createdAt"))],
        raw: true
      });
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];      
      trendsTime = months.map((monthName, index) => {
        const foundMonth = yearlyData.find(d => parseInt(d.monthValue) === index + 1);
        return {
          date: monthName,
          count: foundMonth ? parseInt(foundMonth.count) : 0
        };
      });
    } else if (view === "monthly") {
      const data = await cropdex_annotations.findAll({
        attributes: [
          [sequelize.fn("DAY", sequelize.col("createdAt")), "dayValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        where: {
          is_deleted: 0,
          [Op.and]: [
            sequelize.where(sequelize.fn("YEAR", sequelize.col("createdAt")), targetYear),
            sequelize.where(sequelize.fn("MONTH", sequelize.col("createdAt")), targetMonth)
          ]
        },
        group: [sequelize.fn("DAY", sequelize.col("createdAt"))],
        raw: true
      });
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();      
      for (let i = 1; i <= daysInMonth; i++) {
        const foundDay = data.find(d => parseInt(d.dayValue) === i);
        trendsTime.push({
          date: i.toString(),
          count: foundDay ? parseInt(foundDay.count) : 0
        });
      }
    }    

    const topAnnotators = await cropdex_annotations.findAll({
      attributes: [
        [sequelize.col('cropdex_user.display_name'), 'name'],
        [sequelize.col('cropdex_user.association_id'), 'associationId'],
        [sequelize.col('cropdex_user.cropdex_association.association'), 'associationName'],
        [sequelize.fn('COUNT', sequelize.col('cropdex_annotations.id')), 'count']
      ],
      where: { is_deleted: 0 },
      include: [{
        model: cropdex_users,
        attributes: [], 
        required: true,
        include: [{
          model: cropdex_associations, 
          attributes: [],
          required: true
        }]
      }],
      group: ['annotator_id', 'cropdex_user.id', 'cropdex_user.cropdex_association.id'], 
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      totalAnnotations, valid, invalid, reqEvaluation, deletedCount, notDeleted: totalAnnotations - deletedCount,
      perCropStats: Object.values(cropStatsMap), trendsTime, topAnnotators
    });
  } catch (error) {
    console.error("Annotation Stats Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /images
router.get("/images", authenticateToken, async (req, res) => {
  try {
    const total = await cropdex_image_data.count();
    const validated = await cropdex_image_data.count({ where: { photo_validity: 1 } });
    const invalid = await cropdex_image_data.count({ where: { photo_validity: -1 } });
    const pending = await cropdex_image_data.count({ where: { photo_validity: 0 } });
    const totalDatasets = await cropdex_datasets.count();

    const allImages = await cropdex_image_data.findAll({
      attributes: ['photo_validity'],
      include: [{ model: cropdex_crops, attributes: ['crop_name'] }],
      raw: true,
      nest: true
    });
    const cropStatsMap = {};
    allImages.forEach(img => {
      const cropName = img.cropdex_crop?.crop_name || 'Unknown';
      if (!cropStatsMap[cropName]) {
        cropStatsMap[cropName] = { crop: cropName, total: 0, valid: 0, invalid: 0, pending: 0 };
      }
      const s = cropStatsMap[cropName];
      s.total++;
      if (img.photo_validity === 1) s.valid++;
      else if (img.photo_validity === -1) s.invalid++;
      else s.pending++;
    });

    const datasetDownloads = await cropdex_datasets.findAll({
      attributes: ['crop', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['crop'],
      raw: true
    });

    const datasetDetails = await cropdex_datasets.findAll({
      attributes: ['id', 'crop', 'labels', 'num_images', 'createdAt'],
      include: [{
        model: cropdex_users,
        as: 'creator',
        attributes: ['display_name']
      }],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    const topUploaders = await cropdex_image_data.findAll({
      attributes: [
        [sequelize.col('cropdex_user.display_name'), 'name'],
        [sequelize.col('cropdex_user.association_id'), 'associationId'],
        [sequelize.col('cropdex_user.cropdex_association.association'), 'associationName'],
        [sequelize.fn('COUNT', sequelize.col('cropdex_image_data.id')), 'count']
      ],
      include: [{ model: cropdex_users, attributes: [], required: true, include: [{ model: cropdex_associations, attributes: [], required: true }] }],
      group: ['uploader_id', 'cropdex_user.id'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    let locationMap = {};
    const allLocations = await cropdex_image_data.findAll({
      attributes: ['location_name', 'coordinates'],
      raw: true
    });
    allLocations.forEach(loc => {
      const key = loc.location_name || loc.coordinates || 'Unknown';
      locationMap[key] = (locationMap[key] || 0) + 1;
    });
    const topLocations = Object.keys(locationMap).map(loc => ({
      location_name: loc,
      count: locationMap[loc]
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    const view = req.query.view || "all-time"; 
    const targetYear = req.query.year || new Date().getFullYear();
    const targetMonth = parseInt(req.query.month) || new Date().getMonth() + 1;

    let trendsTime = [];
    if (view === "all-time") {
      const alltimeData = await cropdex_image_data.findAll({
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("date_taken")), "yearValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        group: [sequelize.fn("YEAR", sequelize.col("date_taken"))],
        order: [[sequelize.fn("YEAR", sequelize.col("date_taken")), "ASC"]],
        raw: true
      });

      const currentYear = new Date().getFullYear();
      const startYear = 2024; 

      for (let y = startYear; y <= currentYear; y++) {
        const foundYear = alltimeData.find(d => parseInt(d.yearValue) === y);
        trendsTime.push({
          date: y.toString(), 
          count: foundYear ? parseInt(foundYear.count) : 0 // Insert 0 if the year has no data
        });
      }

    } else if (view === "yearly") {
      const yearlyData = await cropdex_ai_models.findAll({
        attributes: [
          [sequelize.fn("MONTH", sequelize.col("createdAt")), "monthValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        where: sequelize.where(sequelize.fn("YEAR", sequelize.col("createdAt")), targetYear),
        group: [sequelize.fn("MONTH", sequelize.col("createdAt"))],
        raw: true
      });
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      trendsTime = months.map((monthName, index) => {
        const foundMonth = yearlyData.find(d => parseInt(d.monthValue) === index + 1);
        return {
          date: monthName,
          count: foundMonth ? parseInt(foundMonth.count) : 0
        };
      });

    } else if (view === "monthly") {
      const data = await cropdex_ai_models.findAll({
        attributes: [
          [sequelize.fn("DAY", sequelize.col("createdAt")), "dayValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn("YEAR", sequelize.col("createdAt")), targetYear),
            sequelize.where(sequelize.fn("MONTH", sequelize.col("createdAt")), targetMonth)
          ]
        },
        group: [sequelize.fn("DAY", sequelize.col("createdAt"))],
        raw: true
      });
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const foundDay = data.find(d => parseInt(d.dayValue) === i);
        trendsTime.push({
          date: i.toString(),
          count: foundDay ? parseInt(foundDay.count) : 0
        });
      }
    }

    res.json({ 
      total, validated, invalid, pending, totalDatasets,
      cropStats: Object.values(cropStatsMap),
      datasetDownloads, datasetDetails,
      topUploaders,
      trendsTime,
      topLocations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /ai-models
router.get("/ai-models", authenticateToken, async (req, res) => {
  try {
    const allModels = await cropdex_ai_models.findAll({
      attributes: ['id', 'status', 'model_type', 'crop', 'num_downloads', 'createdAt'],
      raw: true
    });

    let totalModels = allModels.length;
    let activeModels = 0;
    let objectDetection = 0;
    let totalDownloads = 0;
    const cropStatsMap = {};

    allModels.forEach(m => {
      totalDownloads += (m.num_downloads || 0);
      if (m.status === 'Available') activeModels++;
      if (m.model_type === 'Object Detection') objectDetection++;

      const cropName = m.crop || 'Unknown';
      cropStatsMap[cropName] = (cropStatsMap[cropName] || 0) + 1;
    });

    const cropBreakdown = Object.entries(cropStatsMap).map(([crop, count]) => ({ crop, count }));

    const view = req.query.view || "all-time"; 
    const targetYear = req.query.year || new Date().getFullYear();
    const targetMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
    let trendsTime = [];
    if (view === "all-time") {
      const alltimeData = await cropdex_ai_models.findAll({
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("createdAt")), "yearValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        group: [sequelize.fn("YEAR", sequelize.col("createdAt"))],
        order: [[sequelize.fn("YEAR", sequelize.col("createdAt")), "ASC"]],
        raw: true
      });

      const currentYear = new Date().getFullYear();
      const startYear = 2024; 

      for (let y = startYear; y <= currentYear; y++) {
        const foundYear = alltimeData.find(d => parseInt(d.yearValue) === y);
        trendsTime.push({
          date: y.toString(), 
          count: foundYear ? parseInt(foundYear.count) : 0 // Insert 0 if the year has no data
        });
      }

    } else if (view === "yearly") {
      const yearlyData = await cropdex_ai_models.findAll({
        attributes: [
          [sequelize.fn("MONTH", sequelize.col("createdAt")), "monthValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        where: sequelize.where(sequelize.fn("YEAR", sequelize.col("createdAt")), targetYear),
        group: [sequelize.fn("MONTH", sequelize.col("createdAt"))],
        raw: true
      });
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      trendsTime = months.map((monthName, index) => {
        const foundMonth = yearlyData.find(d => parseInt(d.monthValue) === index + 1);
        return {
          date: monthName,
          count: foundMonth ? parseInt(foundMonth.count) : 0
        };
      });

    } else if (view === "monthly") {
      const data = await cropdex_ai_models.findAll({
        attributes: [
          [sequelize.fn("DAY", sequelize.col("createdAt")), "dayValue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"]
        ],
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn("YEAR", sequelize.col("createdAt")), targetYear),
            sequelize.where(sequelize.fn("MONTH", sequelize.col("createdAt")), targetMonth)
          ]
        },
        group: [sequelize.fn("DAY", sequelize.col("createdAt"))],
        raw: true
      });
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const foundDay = data.find(d => parseInt(d.dayValue) === i);
        trendsTime.push({
          date: i.toString(),
          count: foundDay ? parseInt(foundDay.count) : 0
        });
      }
    }

    const topDevelopers = await cropdex_ai_models.findAll({
      attributes: [
        [sequelize.col('developer.display_name'), 'name'],
        [sequelize.col('developer.cropdex_association.association'), 'associationName'],
        [sequelize.fn('COUNT', sequelize.col('cropdex_ai_models.id')), 'count']
      ],
      include: [{ 
        model: cropdex_users, 
        as: 'developer',
        attributes: [], 
        required: true,
        include: [{ 
          model: cropdex_associations, 
          attributes: [], 
          required: true 
        }]
      }],
      group: ['developer_id', 'developer.id', 'developer.cropdex_association.id'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });

    const modelDownloads = await cropdex_ai_models.findAll({
      attributes: ['model_name',  'crop', 'num_downloads', 'model_type'],
      order: [['num_downloads', 'DESC']],
      group: ['model_name'],
      limit: 5,
      raw: true
    });

    res.json({ 
      totalModels, 
      activeModels, 
      deletedModels : totalModels - activeModels, 
      objectDetection, 
      imageClassification : totalModels - objectDetection, 
      totalDownloads,
      cropBreakdown, 
      trendsTime,
      topDevelopers,
      modelDownloads
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /users
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const totalUsers = await cropdex_users.count({ where: { is_approved: 1 } }); 
    
    const byAssociation = await cropdex_users.findAll({
      attributes: [
        [sequelize.col('cropdex_association.association'), 'name'],
        [sequelize.fn('COUNT', sequelize.col('cropdex_users.id')), 'count']
      ],
      where: { is_approved: 1 },
      include: [{
        model: cropdex_associations,
        attributes: [],
        required: true
      }],
      group: ['cropdex_association.id'],
      raw: true,
    });

    const byRole = [
      { name: "Contributors", count: await cropdex_users.count({ where: { access_level_id: 4 } }) },
      { name: "AI Developers", count: await cropdex_users.count({ where: { access_level_id: 7 } }) }
    ];

    res.json({ 
      totalUsers,
      byRole,
      byAssociation
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;