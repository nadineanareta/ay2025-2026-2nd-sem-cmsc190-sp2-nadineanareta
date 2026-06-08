module.exports = (sequelize, DataTypes) => {
    const cropdex_datasets = sequelize.define("cropdex_datasets", {
        crop: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        labels: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        num_images: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        image_ids: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        },
        creator_id: {
            type: DataTypes.INTEGER,
            references: { model: "cropdex_users", key: "id" }
        }
    });

    cropdex_datasets.associate = (models) => {
        cropdex_datasets.belongsTo(models.cropdex_users, { foreignKey: "creator_id", as: "creator" });
        cropdex_datasets.hasMany(models.cropdex_ai_models, { foreignKey: "dataset_id", as: "models" });
    }

    return cropdex_datasets;
};