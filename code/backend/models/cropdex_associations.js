//table for image and text
module.exports = (sequelize, DataTypes) => {

    const cropdex_associations = sequelize.define("cropdex_associations", {

            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            association: DataTypes.STRING

        }, 
        {
            timestamps: false //disable createdAt and updatedAt
        }
    )

    cropdex_associations.associate = (models) => {

        cropdex_associations.hasMany(models.cropdex_users, {
            foreignKey: 'association_id'
        });
        
    };

    return cropdex_associations
}