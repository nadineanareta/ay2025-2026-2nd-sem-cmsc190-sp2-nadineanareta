//table for image and text
module.exports = (sequelize, DataTypes) => {
    const cropdex_image_data = sequelize.define("cropdex_image_data", {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },

          image_file_name: DataTypes.STRING,        // name of image file
          text_file_name: DataTypes.STRING,         // name of text file
          coordinates: DataTypes.TEXT,              // formatted as a string like this -> (lat, long)
          location_name: {                          // province or city name based on coordinates
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: "Unknown Location"
            },
          altitude: DataTypes.TEXT,                 // altitude based on coordinates (retrieved from google)
          date_taken: DataTypes.DATEONLY,           // date photo was taken
          photo_validity: DataTypes.INTEGER,

          crop_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'cropdex_crops',
                key: 'id'
            }
          },

          uploader_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'cropdex_users',
                key: 'id'
            }
          }

        }, {
            
            timestamps: false//disable createdAt and updatedAt

    })

    cropdex_image_data.associate = (models) => {

        cropdex_image_data.hasMany(models.cropdex_annotations, {
            foreignKey: 'image_data_id'
        });

        cropdex_image_data.hasMany(models.cropdex_validations, {
            foreignKey: 'image_data_id'
        });

        cropdex_image_data.belongsTo(models.cropdex_users, {
            foreignKey: 'uploader_id'
        });

        cropdex_image_data.belongsTo(models.cropdex_crops, {
            foreignKey: 'crop_id'
        });

    };

    return cropdex_image_data
}