//table for image and text
module.exports = (sequelize, DataTypes) => {

    const cropdex_access_levels = sequelize.define("cropdex_access_levels", {

            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            access_level: DataTypes.STRING
            
        }, 
        {
            timestamps: false //disable createdAt and updatedAt
        }
    )

    cropdex_access_levels.associate = (models) => {

        cropdex_access_levels.hasMany(models.cropdex_users, {
            foreignKey: 'access_level_id'
        });
        
    };

    return cropdex_access_levels
}