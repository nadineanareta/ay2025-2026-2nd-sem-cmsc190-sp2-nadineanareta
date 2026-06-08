const fs = require('fs');
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const db = require("./models");
const ExifParser = require('exif-parser');

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

//Deprecated routes
const cropdex_image_data_router = require("./routes/cropdex_image_data");
// const cropdex_users_router = require("./routes/cropdex_users");

const user_annotations_router = require("./routes/annotations-router");
// const user_images_router = require("./routes/images-router");

const image_data_router = require("./routes/image-data-router");
const associations_router = require("./routes/associations-router");
const crops_router = require("./routes/crops-router");
const users_router = require("./routes/users-router");
const ai_models_router = require("./routes/ai-models-router");
const statistics_router = require("./routes/statistics-router");

const cropdex_image_data = require('./models/cropdex_image_data');
const model = require('./models/index');
const { getProvinceFromCoords } = require('./utils/geocoder');

const image_upload_directory = '../image_uploads/';

app.use(cors());
app.use(express.json());

//Deprecated routes
app.use("/cropdex_image_data", cropdex_image_data_router);
// app.use("/cropdex_users", cropdex_users_router);

app.use("/image-data", image_data_router);
app.use("/associations", associations_router);
app.use("/crops", crops_router);
app.use("/users", users_router);
app.use("/annotations", user_annotations_router);
app.use("/ai-models", ai_models_router);
app.use("/statistics", statistics_router);
// app.use("/images", user_images_router);

function parseDateString(dateString) {
    try {
        const year = parseInt(dateString.substring(0, 2), 10);
        const month = parseInt(dateString.substring(2, 4), 10) - 1; // Months are 0-based in JavaScript Date
        const day = parseInt(dateString.substring(4, 6), 10);
        const hours = parseInt(dateString.substring(6, 8), 10);
        const minutes = parseInt(dateString.substring(8, 10), 10);
        const seconds = parseInt(dateString.substring(10, 12), 10);

        // Adjust the year to be in the correct century
        const fullYear = 2000 + year;
        return new Date(fullYear, month, day, hours, minutes, seconds);
    } catch(error) {
        return null;
    }
}

const crop_list = [
            "mango",
            "abaca",
            "rubber",
            "papaya",
            "ampalaya",
            "citrus",
            "eggplant",
            "cabbage",
            "cassava",
            "pineapple",
            "rice",
            "corn",
            "coconut",
            "coffee",
            "cacao",
            "banana",
            "soybean",
            "sugarcane",
            "tomato",
            "onion"
    ]

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, image_upload_directory)
	},
	filename: (req, file, cb) => {
		const base_file_name = path.parse(file.originalname).name
		cb(null, base_file_name + path.extname(file.originalname))
	}
})

const upload = multer({storage:storage});

app.post("/upload", upload.single('uploaded_file'), async (req, res) => {

    // filename of both jpg and txt files without the extension
    const base_file_name = path.parse(req.file.originalname).name;

    // get text data
    const text_data = "" + req.body.yolo_file_contents
    const text_lines = text_data.split("\n");

    // write the file
    fs.writeFile(image_upload_directory + base_file_name + '.txt', text_data, function (err) {
        if (err) throw err;
        console.log('File is created successfully.');
    });

    // get filename divider position
    const filename_divider_position = base_file_name.indexOf('-');

    //get uploader id and photo date from filename
    var final_uploader_id = 18;               //default 18 as it is the id of the account where all dump images go
    var final_photo_date = null;
    if (filename_divider_position !== -1) {

        // parse id
        const uploader_id_string = base_file_name.substring(filename_divider_position + 1);
        try {
            final_uploader_id = parseInt(uploader_id_string);
        } catch (error) {
            console.log("Failed to parse uploader id : " + error);
        }

        // parse date
        const photo_date_string = base_file_name.substring(0, filename_divider_position);
        final_photo_date = parseDateString(photo_date_string);
    } else {
        final_photo_date = parseDateString(base_file_name);
    }

    // get crop name
    const crop_name = text_lines[0].trim().toLowerCase();
    var crop_index = crop_list.indexOf(crop_name) + 1;
    if (crop_index < 1 || crop_index > 20) {
        crop_index = 21;
    }

    const image_buffer = fs.readFileSync(image_upload_directory + base_file_name + '.jpg');
    const parser = ExifParser.create(image_buffer);
    const exif_data = parser.parse();
    const { tags } = exif_data;

    // parse location data
    var final_location_data = null;
    if (tags && tags.GPSLatitude && tags.GPSLongitude) {
        const latitude = tags.GPSLatitude;
        const longitude = tags.GPSLongitude;
        final_location_data = `(${latitude},${longitude})`;
    } else {
        console.log('Location data not found in EXIF.');
    }

    const locationName = await getProvinceFromCoords(final_location_data);

    //save image data
    db.cropdex_image_data.create(
        {
            image_file_name: base_file_name + '.jpg',
            text_file_name: base_file_name + '.txt',
            coordinates: final_location_data,
            location_name: locationName,
            altitude: null,
            date_taken: final_photo_date,
            crop_id: crop_index,
            uploader_id: final_uploader_id,
            photo_validity: -1
        }
    ).then(newCropData => {
        for (let i = 1; i < text_lines.length; i++) {
            const line = text_lines[i].trim();
            if (line) {
                const parts = line.split(' ');
                db.cropdex_annotations.create(
                    {
                        rect_left: parts[1],
                        rect_top: parts[2],
                        rect_right: parts[3],
                        rect_bottom: parts[4],
                        pest_disease_label: parts[0],
                        image_data_id: newCropData.id,
                        annotator_id: newCropData.uploader_id,
                        is_deleted: false,
                        label_type: "unknown"
                    }
                );
            }
        }
        res.send("Image uploaded");
    }).catch(error => {
        console.error('Error saving crop data:', error);
        res.status(400).send({
            message: 'An upload error has occured!'
        })
    });
});

app.get("/", (req, res) => {
	res.send("Welcome to Cropdex!")
});

// Sync the database and start the server
db.sequelize.sync().then(() => {
    app.listen(3001, () => {
        console.log("Server running on port 3001");
    });
});