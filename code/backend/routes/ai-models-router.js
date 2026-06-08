const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsExtra = require("fs-extra");
const AdmZip = require("adm-zip");
const { cropdex_ai_models, cropdex_users, sequelize } = require("../models"); 
const authenticateToken = require('../authentication/authentication_middleware');
const bcrypt = require("bcrypt");
const { version } = require("os");
const { Op } = require("sequelize");

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Storage (Temporary and Local)
const upload_directory = path.join(__dirname, '../../ai_model_uploads/');
if (!fs.existsSync(upload_directory)) {
    fs.mkdirSync(upload_directory, { recursive: true });
}
router.use('/temp_previews', express.static(upload_directory));
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, upload_directory),
    filename: (req, file, cb) => cb(null, 'upload_' + Date.now() + '.zip')
});
const upload = multer({ storage: storage });

const graphStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, upload_directory),
    filename: (req, file, cb) => cb(null, 'manual_graph_' + Date.now() + path.extname(file.originalname))
});
const uploadGraphs = multer({ storage: graphStorage });

// POST /ai-models/upload-graphs - Handles manual image uploads during Step 5
router.post("/upload-graphs", authenticateToken, uploadGraphs.any(), async (req, res) => {
  try {
    const { tempDirName } = req.body;
    if (!tempDirName) {
      return res.status(400).json({ error: "No temporary directory specified." });
    }
    const targetDir = path.join(upload_directory, tempDirName);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const uploadedGraphNames = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const finalFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const finalPath = path.join(targetDir, finalFileName);
        fs.renameSync(file.path, finalPath);
        uploadedGraphNames.push(finalFileName);
      }
    }
    res.json({ message: "Graphs uploaded successfully", uploadedGraphs: uploadedGraphNames });
  } catch (error) {
      console.error("Manual Graph Upload Error:", error);
      res.status(500).json({ error: "Failed to upload graphs." });
  }
});

const isModelMatch = (localName, partnerName) => {
  if (!localName || !partnerName) return false;
  const cleanLocal = localName.trim().toLowerCase();
  const cleanPartner = partnerName.trim().toLowerCase().replace(/[\s_-]*v\d+$/i, '');
  return cleanLocal === cleanPartner || partnerName.trim().toLowerCase() === cleanLocal;
};

// GET /ai-models - Server-Side Paginated & Filtered
router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { search, crops, types, sort, status, developer_id } = req.query;
    let whereClause = {};

    const isAdmin = req.user.access_level_id === 6 || req.user.access_level_id === 5;
    const authUserId = req.user.userId || req.user.id;
    const requestingOwnModels = developer_id && String(developer_id) === String(authUserId);

    if (status === "Deleted" && (isAdmin || requestingOwnModels)) {
      whereClause.status = "Deleted";
    } else if (status === "Available") {
      whereClause.status = "Available";
    } else if (status === "all" && (isAdmin || requestingOwnModels)) {
    } else if (!isAdmin) {
      whereClause.status = "Available"; 
    }

    if (developer_id) {
      whereClause.developer_id = developer_id;
    }
    whereClause[Op.and] = [];

    if (crops) {
      const cropArray = crops.split(',').map(c => c.trim());
      const cropConditions = cropArray.map(c => ({
        crop: { [Op.like]: `%${c}%` }
      }));
      whereClause[Op.and].push({ [Op.or]: cropConditions });
    }

    if (types) {
      whereClause.model_type = { [Op.in]: types.split(',') };
    }

    if (search) {
      const searchWords = search.split(' ').filter(word => word.trim() !== '');
      
      const searchConditions = searchWords.map(word => ({
        [Op.or]: [
          { model_name: { [Op.like]: `%${word}%` } },
          { model_description: { [Op.like]: `%${word}%` } },
          { tags: { [Op.like]: `%${word}%` } }
        ]
      }));
      whereClause[Op.and].push(...searchConditions);
    }

    if (whereClause[Op.and].length === 0) {
      delete whereClause[Op.and];
    }

    if (req.query.developers) {
      whereClause['$developer.display_name$'] = { [Op.in]: req.query.developers.split(',') };
    }

    let orderClause = [['createdAt', 'DESC']]; 
    if (sort === 'date-asc') orderClause = [['createdAt', 'ASC']];
    if (sort === 'name-asc') orderClause = [['model_name', 'ASC']];
    if (sort === 'name-desc') orderClause = [['model_name', 'DESC']];

    const { count, rows } = await cropdex_ai_models.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: orderClause,
      include: [{
        model: cropdex_users,
        as: 'developer',
        attributes: ['id', 'display_name']
      }]
    });

    const { data: partnerData, error: supaError } = await supabase
      .from('models')
      .select('id, display_name, num_downloads');
      
    if (supaError) console.error("Supabase sync warning:", supaError.message);

    const mergedRows = await Promise.all(rows.map(async row => {
      const modelJson = row.toJSON();
      
      const partnerRecord = partnerData?.find(p => isModelMatch(modelJson.model_name, p.display_name));
      
      if (partnerRecord) {
        const supaCount = partnerRecord.num_downloads || 0;
        const localCount = modelJson.num_downloads || 0;

        if (supaCount > localCount) {
          await cropdex_ai_models.update({ num_downloads: supaCount }, { where: { id: modelJson.id } });
          modelJson.num_downloads = supaCount;
        } else if (localCount > supaCount) {
          await supabase.from('models').update({ num_downloads: localCount }).eq('id', partnerRecord.id);
          modelJson.num_downloads = localCount;
        }
      }

      return modelJson;
    }));

    res.json({
      models: mergedRows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });

  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /ai-models/analyze-upload - Extracts and scans the uploaded model folder
router.post("/analyze-upload", authenticateToken, upload.single('modelFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const uploadedPath = req.file.path;
    const originalName = req.file.originalname;
    const timestampId = Date.now().toString();
    const tempDirName = `temp_${timestampId}`;
    const tempDirPath = path.join(upload_directory, tempDirName);
    const extractDir = path.join(tempDirPath, 'raw_extract'); 

    fs.mkdirSync(tempDirPath, { recursive: true });
    if (originalName.toLowerCase().endsWith('.zip')) {
        const zip = new AdmZip(uploadedPath);
        zip.extractAllTo(extractDir, true);
    } else {
        fs.mkdirSync(extractDir, { recursive: true });
        fs.copyFileSync(uploadedPath, path.join(extractDir, originalName));
    }

    let detectedData = {
      tempDirName: tempDirName, 
      weights: [], configs: [], tflite: null, metricsFile: null, graphs: [], 
      extractedMetrics: { precision: "", recall: "", map50: "", map50_95: "", top1_acc: "", top5_acc: "", train_loss: "", val_loss: "" },
      readmeContent: "",
      inferredType: null,
      architecture: null,
    };

    let taskHint = null;

    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
                
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath); 
        } else {
          const ext = path.extname(file).toLowerCase();
          const lowerFile = file.toLowerCase();
          const targetPath = path.join(tempDirPath, file);

          if (['.pt', '.pth', '.h5', '.onnx', '.pb'].includes(ext)) {
            detectedData.weights.push(file);
            fs.copyFileSync(fullPath, targetPath);
          } 
          else if (ext === '.tflite') {
            detectedData.tflite = file;
            fs.copyFileSync(fullPath, targetPath);
          }
          else if (['.yaml', '.json', '.pbtxt'].includes(ext) && !lowerFile.includes('metrics')) {
            detectedData.configs.push(file);
            fs.copyFileSync(fullPath, targetPath);
            
            try {
              const configText = fs.readFileSync(fullPath, 'utf8').toLowerCase();
              if (configText.includes('task: detect') || configText.includes('model_type: detection')) {
                  taskHint = "Object Detection";
              } else if (configText.includes('task: classify') || configText.includes('model_type: classification')) {
                  taskHint = "Image Classification";
              }

              const cropMatch = configText.match(/crop\s*:\s*["']?([a-zA-Z]+)["']?/i) || 
                                configText.match(/target_crop\s*:\s*["']?([a-zA-Z]+)["']?/i);

              if (cropMatch && !detectedData.autoCrop) {
                  detectedData.autoCrop = cropMatch[1].trim(); 
              }

              const archMatch = configText.match(/model\s*:\s*["']?([^"'\r\n]+)["']?/i);
              if (archMatch && !detectedData.architecture) {
                  const rawArch = archMatch[1].trim();
                  const baseName = rawArch.split(/[/\\]/).pop();
                  const cleanArch = baseName.replace(/\.[^/.]+$/, "");
                  
                  if (cleanArch.toLowerCase() !== 'best' && cleanArch.toLowerCase() !== 'last') {
                    detectedData.architecture = cleanArch.toUpperCase(); 
                  }
              }
            } catch(e) { console.warn("Could not read config for automatic detection"); }
          } 
          else if (lowerFile.includes('results.csv') || lowerFile.includes('history.csv')) {
            detectedData.metricsFile = file;
            fs.copyFileSync(fullPath, targetPath);
                  
            const csvData = fs.readFileSync(fullPath, 'utf8').trim().split('\n');
            if (csvData.length > 1) {
              const headers = csvData[0].split(',').map(h => h.trim().toLowerCase());
              const lastRow = csvData[csvData.length - 1].split(',').map(v => parseFloat(v.trim()));
              
              if (headers.some(h => h.includes('box_loss') || h.includes('dfl_loss') || h.includes('map_0.5'))) {
                  taskHint = "Object Detection";
              } else if (headers.some(h => h.includes('top1_acc') || h.includes('top5_acc') || h.includes('cls_loss'))) {
                  taskHint = "Image Classification";
              }
              headers.forEach((h, idx) => {
                if (h === 'p' || h === 'metrics/precision(b)' || h.includes('precision')) detectedData.extractedMetrics.precision = lastRow[idx];
                else if (h === 'r' || h === 'metrics/recall(b)' || h.includes('recall')) detectedData.extractedMetrics.recall = lastRow[idx];
                else if (h === 'metrics/mAP50-95(B)' || h.includes('map50-95') || h.includes('map_0.5:0.95')) detectedData.extractedMetrics.map50_95 = lastRow[idx];
                else if (h === 'metrics/mAP50(B)'|| h.includes('map50') || h.includes('map_0.5')) detectedData.extractedMetrics.map50 = lastRow[idx];
                else if (h === 'metrics/accuracy_top1' || h.includes('top1_acc')) detectedData.extractedMetrics.top1_acc = lastRow[idx];
                else if (h === 'metrics/accuracy_top5' || h.includes('top5_acc')) detectedData.extractedMetrics.top5_acc = lastRow[idx];
                else if (h === 'train/loss' || h.includes('train/loss') || h.includes('train_loss')) detectedData.extractedMetrics.train_loss = lastRow[idx];
                else if (h === 'val/loss' || h.includes('val/loss') || h.includes('val_loss')) detectedData.extractedMetrics.val_loss = lastRow[idx];
              });
            }
          } 
          else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            if (lowerFile.includes('confusion') || lowerFile.includes('curve') || lowerFile.includes('results') || lowerFile.includes('labels')) {
              detectedData.graphs.push(file);
              fs.copyFileSync(fullPath, targetPath);
            }
          }
          else if (lowerFile.includes('readme.md') || lowerFile.includes('readme.txt')) {
            detectedData.readmeContent = fs.readFileSync(fullPath, 'utf8');
          }
        }
      }
    };

    scanDirectory(extractDir);

    let { precision, recall, map50, map50_95, top1_acc, top5_acc, train_loss, val_loss } = detectedData.extractedMetrics;
    precision = precision ? parseFloat(precision) : null;
    recall = recall ? parseFloat(recall) : null;
    map50 = map50 ? parseFloat(map50) : null;
    map50_95 = map50_95 ? parseFloat(map50_95) : null;
    top1_acc = top1_acc ? parseFloat(top1_acc) : null;
    top5_acc = top5_acc ? parseFloat(top5_acc) : null;
    train_loss = train_loss ? parseFloat(train_loss) : null;
    val_loss = val_loss ? parseFloat(val_loss) : null;

    detectedData.inferredType = taskHint || (map50 ? "Object Detection" : "Image Classification");

    if (detectedData.inferredType === "Object Detection") {
      detectedData.extractedMetrics = {
        precision: precision,
        recall: recall,
        map50: map50,
        map50_95: map50_95,
        top1_acc: null,
        top5_acc: null,
        train_loss: null,
        val_loss: null
      };
    } else {
      detectedData.extractedMetrics = {
        precision: null,
        recall: null,
        map50: null,
        map50_95: null,
        top1_acc: top1_acc,
        top5_acc: top5_acc,
        train_loss: train_loss,
        val_loss: val_loss
      };
    }

    fs.unlinkSync(uploadedPath); 
    fsExtra.removeSync(extractDir); 

    res.json({ message: "File analyzed successfully", detectedData });

  } catch (error) {
    console.error("File Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze file." });
  }
});

// GET /ai-models/check-name - Fast check if a model name is available
router.get("/check-name", authenticateToken, async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.json({ available: true });

        const existingModel = await cropdex_ai_models.findOne({
          where: { model_name: name, status: "Available" }
        });
        res.json({ available: !existingModel }); 
    } catch (error) {
        console.error("Name check error:", error);
        res.status(500).json({ error: "Failed to check name" });
    }
});

// POST /ai-models/publish - Finalize and rename folder
router.post("/publish", authenticateToken, async (req, res) => {
  try {
    const { formData, detectedData } = req.body;
    const transaction = await sequelize.transaction();

    let calculatedVersion = 1;
    let parsedParentId = null;

    if (formData.parent_model_id && formData.parent_model_id !== "none") {
        parsedParentId = formData.parent_model_id;
        const parentModel = await cropdex_ai_models.findByPk(parsedParentId);
        if (parentModel) {
            calculatedVersion = (Number(parentModel.version_number) || 1) + 1;
        }
    }

    const safeCrop = (formData.crop || 'Unknown').replace(/[^a-zA-Z0-9]/g, '');
    const safeModelName = (formData.model_name || 'Model').replace(/[^a-zA-Z0-9]/g, '_');
    
    const finalDirName = `${safeCrop}_${safeModelName}_${Date.now()}`;
    const finalDirPath = path.join(upload_directory, finalDirName);

    const tempDirPath = path.join(upload_directory, detectedData.tempDirName);
    if (fs.existsSync(tempDirPath)) {
        fs.renameSync(tempDirPath, finalDirPath);
    }

    const finalWeights = detectedData.weights.length > 0 ? `${finalDirName}/${detectedData.weights[0]}` : null;
    const finalConfig = detectedData.configs.length > 0 ? `${finalDirName}/${detectedData.configs[0]}` : null;
    const finalTflite = detectedData.tflite ? `${finalDirName}/${detectedData.tflite}` : null;
    const finalMetricsFile = detectedData.metricsFile ? `${finalDirName}/${detectedData.metricsFile}` : null;
    const finalGraphs = detectedData.graphs.map(graphName => `${finalDirName}/${graphName}`);

    const newModel = await cropdex_ai_models.create({
      ...formData,
      developer_id: req.user.userId,
      parent_model_id: parsedParentId, 
      version_number: calculatedVersion,
      weights_file: finalWeights,
      tflite_file: finalTflite,
      config_file: finalConfig,
      metrics_file: finalMetricsFile,
      evaluation_graphs: JSON.stringify(finalGraphs),
      tags: formData.tags.join(','),
      status: "Available",
      classes: Array.isArray(formData.classes) ? formData.classes.join(',') : formData.classes,
      metrics_map50: formData.metrics_map50 ? parseFloat(formData.metrics_map50) : null,
      metrics_map50_95: formData.metrics_map50_95 ? parseFloat(formData.metrics_map50_95) : null,
      metrics_precision: formData.metrics_precision ? parseFloat(formData.metrics_precision) : null,
      metrics_accuracy: formData.metrics_accuracy ? parseFloat(formData.metrics_accuracy) : null,
      metrics_top1_acc: formData.metrics_top1_acc ? parseFloat(formData.metrics_top1_acc) : null,
      metrics_top5_acc: formData.metrics_top5_acc ? parseFloat(formData.metrics_top5_acc) : null,
      metrics_train_loss: formData.metrics_train_loss ? parseFloat(formData.metrics_train_loss) : null,
      metrics_val_loss: formData.metrics_val_loss ? parseFloat(formData.metrics_val_loss) : null,
    }, { transaction });

    if (detectedData.tflite) {
      const localFilePath = path.join(finalDirPath, detectedData.tflite);
      const fileBuffer = fs.readFileSync(localFilePath);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('ai-models')
        .upload(`tflite/${formData.model_name}_v${calculatedVersion}.tflite`, fileBuffer, {
          contentType: 'application/octet-stream',
          upsert: true
        });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from('ai-models')
        .getPublicUrl(`tflite/${formData.model_name}_v${calculatedVersion}.tflite`);

      const { error: dbError } = await supabase
        .from('available_models')
        .upsert({
          model_id: newModel.id,
          name: formData.model_name,
          crop: formData.crop,
          version: calculatedVersion,
          download_url: urlData.publicUrl,
          updated_at: new Date()
        });

      if (dbError) throw dbError;
    }
    await transaction.commit();
    res.status(201).json({ message: "Model published successfully!", model: newModel });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Publish/Mirroring Error. MySQL Rolled Back.", error);
    if (error.statusCode === '403') {
      return res.status(500).json({ error: "Cloud storage auth failed. Check Supabase Keys." });
    }
    res.status(500).json({ error: "Failed to publish. Local database changes reverted." });
  }
});

// GET /ai-models/download/:id - Download the TFLite file and increment count
router.get("/download/:id", async (req, res) => {
    try {
        const model = await cropdex_ai_models.findByPk(req.params.id);        
        if (!model || !model.tflite_file) {
            return res.status(404).json({ error: "Model or .tflite file not found in database." });
        }
        
        const filePath = path.join(upload_directory, model.tflite_file);        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Physical file is missing from the server." });
        }
        await model.increment('num_downloads', { by: 1 });
        try {
          const { data: partnerData } = await supabase.from('models').select('id, display_name');
          const partnerRecord = partnerData?.find(p => isModelMatch(model.model_name, p.display_name));
          
          if (partnerRecord) {
             await supabase.rpc('increment_model_download', { model_id_param: partnerRecord.id });
          }
        } catch (e) {
          console.warn("Could not sync download count to Supabase:", e.message);
        }

        res.download(filePath, path.basename(model.tflite_file)); 
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: "Download failed" });
    }
});

// GET /ai-models/download-source/:id - Zips and downloads the entire training folder
router.get("/download-source/:id", async (req, res) => {
    try {
        const model = await cropdex_ai_models.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: "Model not found" });

        let folderName = null;
        if (model.weights_file) {
            folderName = path.dirname(model.weights_file);
        } else if (model.evaluation_graphs && model.evaluation_graphs.length > 5) {
            const graphs = JSON.parse(model.evaluation_graphs);
            if (graphs.length > 0) folderName = path.dirname(graphs[0]);
        }

        if (!folderName || folderName === '.') {
            return res.status(400).json({ error: "Source folder structure not found." });
        }

        const targetDir = path.join(upload_directory, folderName);
        if (!fs.existsSync(targetDir)) {
            return res.status(404).json({ error: "Source folder missing from server." });
        }

        const AdmZip = require("adm-zip");
        const zip = new AdmZip();
        zip.addLocalFolder(targetDir);
        const zipBuffer = zip.toBuffer();

        res.set('Content-Disposition', `attachment; filename="${folderName}_source.zip"`);
        res.set('Content-Type', 'application/zip');
        res.send(zipBuffer);
    } catch (error) {
        console.error("Source download error:", error);
        res.status(500).json({ error: "Failed to download source files" });
    }
});

// PUT /ai-models/:id - Edit model details (Name, Tags, Description, Architecture)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const modelId = req.params.id;
    const { model_name, tags, model_description, architecture, dataset_id, parent_model_id, crop, classes, evaluation_graphs } = req.body;

    const model = await cropdex_ai_models.findByPk(modelId);
    if (!model) return res.status(404).json({ error: "Model not found" });

    const authData = req.user || req.authUserData;
    const userId = authData.userId || authData.id;
    const isOwner = Number(userId) === Number(model.developer_id);

    if (!isOwner) {
      return res.status(403).json({ error: "Only the developer can edit this model." });
    }

    if (model_name.trim() !== model.model_name) {
      const existingModel = await cropdex_ai_models.findOne({ where: { model_name: model_name.trim() } });
      if (existingModel && Number(existingModel.id) !== Number(modelId)) {
        return res.status(400).json({ error: `A model named "${model_name}" already exists.` });
      }
    }

    let calculatedVersion = 1;
    let parsedParentId = null;
    let parsedDatasetId = null;

    if (parent_model_id && parent_model_id !== "none") {
        parsedParentId = parent_model_id;
        const parentModel = await cropdex_ai_models.findByPk(parsedParentId);
        if (parentModel) {
            calculatedVersion = (Number(parentModel.version_number) || 1) + 1;
        }
    }

    if (dataset_id && dataset_id !== "none" && dataset_id !== "") {
        parsedDatasetId = dataset_id;
    }
    
    await model.update({
      model_name: model_name.trim(),
      tags: Array.isArray(tags) ? tags.join(',') : tags,
      model_description: model_description,
      architecture: architecture,
      crop: crop,
      classes: Array.isArray(classes) ? classes.join(',') : classes,
      dataset_id: parsedDatasetId, 
      parent_model_id: parsedParentId,
      version_number: calculatedVersion,
      evaluation_graphs: evaluation_graphs ? JSON.stringify(evaluation_graphs) : model.evaluation_graphs
    });

    const { error: dbError } = await supabase
      .from('available_models')
      .update({
        name: model_name.trim(),
        version: calculatedVersion,
        updated_at: new Date(),
        crop: crop
      })
      .eq('model_id', modelId);

    if (dbError) {
      console.error("Supabase Edit Sync Error:", dbError);
    }

    res.json({ message: "Model updated successfully!" });
  } catch (error) {
    console.error("Edit error:", error);
    res.status(500).json({ error: "Internal Server Error during edit." });
  }
});


// DELETE /ai-models/:id - Soft Delete with Password Verification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const model = await cropdex_ai_models.findByPk(req.params.id);
    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }
    const authData = req.user || req.authUserData;
    const userId = authData.userId || authData.id;
    const isOwner = Number(userId) === Number(model.developer_id);
    if (!isOwner) {
      return res.status(403).json({ error: "Only the developer of this model can delete it." });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required for deletion." });
    }
    const user = await cropdex_users.findByPk(userId);
    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }
    let isMatch = false;
    if (password && user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
    } else {
        isMatch = (password === user.password);
    }
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    const [updatedRows] = await cropdex_ai_models.update(
      { status: "Deleted" },
      { where: { id: req.params.id } }
    );
    if (updatedRows === 0) {
        return res.status(500).json({ error: "Database rejected the status. Run the SQL ENUM fix!" });
    }
    const { error: dbError } = await supabase
      .from('available_models')
      .update({
        is_active: false,
        updated_at: new Date()
      })
      .eq('model_id', req.params.id);

    if (dbError) {
      console.error("Supabase Delete Sync Error:", dbError);
    }
    return res.json({ message: "Model successfully deleted" });
    
  } catch (error) {
    console.error("Delete error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /ai-models/:id/restore
router.post("/:id/restore", async (req, res) => {
    try {
        const model = await cropdex_ai_models.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: "Model not found" });
        await model.update({ status: "Available" }); 
        const { error: dbError } = await supabase
          .from('available_models')
          .update({
            is_active: true,
            updated_at: new Date()
          })
          .eq('model_id', req.params.id);

        if (dbError) {
           console.error("Supabase Restore Sync Error:", dbError);
        }
        res.json({ message: "Model restored successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to restore model" });
    }
});

// GET /ai-models/:id/versions - Traverses the branching lineage
router.get("/:id/versions", async (req, res) => {
    try {
        const currentModel = await cropdex_ai_models.findByPk(req.params.id, {
            include: [{ model: cropdex_users, as: 'developer', attributes: ['display_name'] }]
        });
        if (!currentModel) return res.status(404).json({ error: "Model not found" });
        const modelData = currentModel.toJSON();
        const ancestors = [];
        let currentParentId = modelData.parent_model_id;
        let upDepth = 0;
        while (currentParentId && upDepth < 50) {
            const parentModel = await cropdex_ai_models.findByPk(currentParentId, {
                include: [{ model: cropdex_users, as: 'developer', attributes: ['display_name'] }]
            });
            if (!parentModel) break;
            ancestors.push(parentModel.toJSON());
            currentParentId = parentModel.parent_model_id;
            upDepth++;
        }
        const descendants = [];
        const queue = [modelData.id];
        let downDepth = 0;
        
        while (queue.length > 0 && downDepth < 50) {
            const currentIdToSearch = queue.shift();
            const children = await cropdex_ai_models.findAll({
                where: { parent_model_id: currentIdToSearch },
                include: [{ model: cropdex_users, as: 'developer', attributes: ['display_name'] }]
            });

            for (const child of children) {
                descendants.push(child.toJSON());
                queue.push(child.id);
            }
            downDepth++;
        }
        let combinedHistory = [...descendants, modelData, ...ancestors];
        combinedHistory = combinedHistory.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        combinedHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const { data: partnerData } = await supabase.from('models').select('id, display_name, num_downloads');
          
        const finalHistory = combinedHistory.map(m => {
            const partnerRecord = partnerData?.find(p => isModelMatch(m.model_name, p.display_name));
            m.num_downloads = partnerRecord?.num_downloads || m.num_downloads || 0;
            return m;
        });

        res.json(finalHistory);
    } catch (error) {
        console.error("Versions fetch error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /ai-models/:id - Get details of a specific model
router.get("/:id", async (req, res) => {
  try {
    const model = await cropdex_ai_models.findByPk(req.params.id, {
      include: [{
        model: cropdex_users,
        as: 'developer',
        attributes: ['display_name']
      }]
    });
    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }
    let all_graphs = [];
    let folderName = null;

    if (model.weights_file) {
      folderName = path.dirname(model.weights_file);
    } else if (model.evaluation_graphs) {
      const parsed = JSON.parse(model.evaluation_graphs);
      if (parsed.length > 0) folderName = path.dirname(parsed[0]);
    }

    if (folderName && folderName !== '.') {
      const targetDir = path.join(upload_directory, folderName);
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        all_graphs = files.filter(f =>
          f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
        ).filter(f =>
          f.toLowerCase().includes('confusion') || f.toLowerCase().includes('curve') || f.toLowerCase().includes('results') || f.toLowerCase().includes('labels')
        ).map(f => `${folderName}/${f}`);
      }
    }

    const modelData = model.toJSON();
    modelData.all_folder_graphs = all_graphs.length > 0 ? all_graphs : (modelData.evaluation_graphs ? JSON.parse(modelData.evaluation_graphs) : []);

    const { data: partnerData } = await supabase.from('models').select('id, display_name, num_downloads');
    const partnerRecord = partnerData?.find(p => isModelMatch(modelData.model_name, p.display_name));
      
    if (partnerRecord) {
      const supaCount = partnerRecord.num_downloads || 0;
      const localCount = modelData.num_downloads || 0;

      if (supaCount > localCount) {
        await cropdex_ai_models.update({ num_downloads: supaCount }, { where: { id: modelData.id } });
        modelData.num_downloads = supaCount;
      } else if (localCount > supaCount) {
        await supabase.from('models').update({ num_downloads: localCount }).eq('id', partnerRecord.id);
        modelData.num_downloads = localCount;
      }
    }

    res.json(modelData);
  } catch (error) {
    console.error("Error fetching model:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }  
});

module.exports = router;