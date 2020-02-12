'use strict';
module.exports = (sequelize, DataTypes) => {
    var bannedDomaines = sequelize.define('bannedDomaines', {
        domain: {
            primaryKey: true,
            type: DataTypes.STRING(256)
        }
    }, {
        timestamps: false
    });

    return bannedDomaines
};