//table for image and text
module.exports = (sequelize, DataTypes) => {

    const cropdex_crops = sequelize.define("cropdex_crops", {

            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            crop_name: DataTypes.STRING
            
        }, 
        {
            timestamps: false //disable createdAt and updatedAt
        }
    )

    cropdex_crops.associate = (models) => {

        cropdex_crops.hasMany(models.cropdex_image_data, {
            foreignKey: 'crop_id'
        });
        
    };
    
    return cropdex_crops
}