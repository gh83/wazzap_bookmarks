'use strict';
module.exports = (sequelize, DataTypes) => {
    var bookmarks = sequelize.define('bookmarks', {
        guid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        link: {
            type: DataTypes.STRING(256)
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        description: {
            type: DataTypes.TEXT
        },
        favorites: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: false
    });

    return bookmarks
};