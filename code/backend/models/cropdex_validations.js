//table for image and text
module.exports = (sequelize, DataTypes) => {

    const cropdex_validations = sequelize.define("cropdex_validations", {

            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            image_data_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'cropdex_image_data',
                    key: 'id'
                }
            },

            validator_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'cropdex_users',
                    key: 'id'
                }
            }

        }, 
        {
            timestamps: true //disable createdAt and updatedAt
        }
    )

    cropdex_validations.associate = (models) => {

        cropdex_validations.belongsTo(models.cropdex_image_data, {
            foreignKey: 'image_data_id'
        });

        cropdex_validations.belongsTo(models.cropdex_users, {
            foreignKey: 'validator_id'
        });
        
    };

    return cropdex_validations
}