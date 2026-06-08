const express = require("express");
const router = express.Router();
const db = require("../models");
const authenticateToken = require('../authentication/authentication_middleware');

router.get("/my-annotations", authenticateToken, async (req, res) => {
	
	const page=parseInt(req.query.page) || 1; 
	const limit=20;  // Annotations per page
	const offset=(page-1)*limit; // To skip rows to fetch for pagination

	try {
	  const annotation_data = await db.cropdex_annotations.findAndCountAll({
      attributes: ["id", "rect_left","rect_top","rect_right","rect_bottom","pest_disease_label","image_data_id","createdAt","updatedAt","is_deleted","label_type"
      ],
      where: { annotator_id: parseInt(req.user.userId) },
      order: [["createdAt", "DESC"]],
	  offset: offset,
      limit: limit,
    });

	  if (annotation_data.count > 0) {
		
		const annotations = {
		  rows: annotation_data.rows.map(annotation=> ({
			id: annotation.id,
			rect_left: annotation.rect_left,
      rect_top: annotation.rect_top,
      rect_right: annotation.rect_right,
      rect_bottom: annotation.rect_bottom,
      pest_disease_label: annotation.pest_disease_label,
      image_data_id: annotation.image_data_id,
      createdAt: annotation.createdAt,
      updatedAt: annotation.updatedAt,
      is_deleted: annotation.is_deleted,
      label_type: annotation.label_type,
		  }))
		};
    const totalAnnotations = annotation_data.count // Total annotations for the user
		const totalPages = Math.ceil(totalAnnotations / limit); // Calculate total pages
		res.json({ annotations, totalPages, totalAnnotations});
		  
	  } else {
		res.status(404).json({ error: "User has not yet annotated on any image" });
	  }
	} catch (error) {
	  console.error("Error retrieving data:", error);
	  res.status(500).json({ error: "Error retrieving data" });
	}
  });


router.get("/recent-annotations", authenticateToken, async (req, res) => {
  console.log("Fetching recent annotations for user ID:", req.user.userId);
  const limit = parseInt(req.query.limit)
  try {
    const data = await db.cropdex_annotations.findAll({
      where: { annotator_id: req.user.userId },
      order: [["createdAt", "DESC"]],
      limit: limit,
    });
    if (data != undefined) {
      res.json(data);
    } else {
      res.status(404).json({ error: "No recent annotations found" });
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;