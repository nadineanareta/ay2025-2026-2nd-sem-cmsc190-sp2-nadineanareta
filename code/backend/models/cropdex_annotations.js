//table for image and text
module.exports = (sequelize, DataTypes) => {
    const cropdex_annotations = sequelize.define("cropdex_annotations", {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },

          rect_left: DataTypes.FLOAT,
          rect_top: DataTypes.FLOAT,
          rect_right: DataTypes.FLOAT,
          rect_bottom: DataTypes.FLOAT,
          pest_disease_label: DataTypes.STRING,
          is_deleted: DataTypes.BOOLEAN,
          label_type: DataTypes.STRING,

          image_data_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'cropdex_image_data',
                key: 'id'
            }
          },

          annotator_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'cropdex_users',
                key: 'id'
            }
          }

        }, {
            
            timestamps: true// enable createdAt and updatedAt
    })

    cropdex_annotations.associate = (models) => {
        cropdex_annotations.belongsTo(models.cropdex_image_data, {
            foreignKey: 'image_data_id'
        });
        cropdex_annotations.belongsTo(models.cropdex_users, {
            foreignKey: 'annotator_id'
        });
    };

    return cropdex_annotations
}