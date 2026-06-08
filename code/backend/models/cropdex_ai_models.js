module.exports = (sequelize, DataTypes) => {
    const cropdex_ai_models = sequelize.define("cropdex_ai_models", {
        
        // BASIC INFO
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        model_name: { type: DataTypes.STRING, allowNull: false },
        model_description: { type: DataTypes.TEXT, allowNull: false },
        model_type: DataTypes.STRING,
        crop: DataTypes.STRING,
        classes: DataTypes.STRING,
        architecture: DataTypes.STRING,
        version_number: DataTypes.INTEGER,
        status: { type: DataTypes.STRING, defaultValue: "Available" },
        num_downloads: DataTypes.INTEGER,
        tags: DataTypes.STRING,
        
        // RELATIONSHIPS
        developer_id: {
            type: DataTypes.INTEGER,
            references: { model: "cropdex_users", key: "id" }
        },
        
        // COMPLETE TRAINING FILE STORAGE 
        weights_file: DataTypes.STRING,  
        tflite_file: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },  
        dataset_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        config_file: DataTypes.STRING,   
        metrics_file: DataTypes.STRING,
        evaluation_graphs: {
            type: DataTypes.TEXT, 
            allowNull: true
        },

        // TRAINING METRICS
        metrics_map50: { type: DataTypes.FLOAT, allowNull: true },
        metrics_map50_95: { type: DataTypes.FLOAT, allowNull: true },
        metrics_precision: { type: DataTypes.FLOAT, allowNull: true },
        metrics_recall: { type: DataTypes.FLOAT, allowNull: true },
        metrics_top1_acc: { type: DataTypes.FLOAT, allowNull: true },
        metrics_top5_acc: { type: DataTypes.FLOAT, allowNull: true },
        metrics_train_loss: { type: DataTypes.FLOAT, allowNull: true },
        metrics_val_loss: { type: DataTypes.FLOAT, allowNull: true },
        num_images: DataTypes.INTEGER,

        // FUTURE EXPANSION
        parent_model_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "cropdex_ai_models", key: "id" }
        }
    });

    cropdex_ai_models.associate = (models) => {
        cropdex_ai_models.belongsTo(models.cropdex_users, { foreignKey: 'developer_id', as: 'developer' });
        cropdex_ai_models.belongsTo(models.cropdex_ai_models, { foreignKey: 'parent_model_id', as: 'parent_model' });
    };

    return cropdex_ai_models;
};