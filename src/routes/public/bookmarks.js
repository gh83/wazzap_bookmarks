import { Router } from 'express';
import models, { Sequelize } from '../../models';

const router = Router();
const Op = Sequelize.Op;

/*проверка url. субдомены не банятся, например http://hello.yahoo.com забанен не будет
. список доменов для бана создается при создании базы,
находится в src/index.js */
async function valiateLink(link) {
    let error = undefined;
    try {
        const parsedUrl = new URL(link)
        if ((await models.bannedDomaines.findOne({ where: { domain: parsedUrl.hostname } })))
            error = { code: 'BOOKMARKS_BLOCKED_DOMAIN', description: `"${parsedUrl.hostname}" banned` }
    } catch (e) {
        error = { code: 'BOOKMARKS_INVALID_LINK', description: 'Invalid link' }
    };
    return error;
};

//http://localhost:3010/api/v1/bookmarks?filter=favorites&filter_value=true&filter_from=1&filter_to=5
//curl -X GET -G 'http://localhost:3010/api/v1/bookmarks' -d 'filter=favorites&filter_value=true&filter_from=1&filter_to=5'
router.get("/", (req, res) => {
    let { limit, offset, sort_by, sort_dir, filter, filter_value, filter_from, filter_to } = req.query;
    let error = undefined;
    
    if (!filter) error = { code: 'BOOKMARKS_INVALID_LINK', description: 'Отсутствует фильтр' };
    if (!filter_value) error = { code: 'BOOKMARKS_INVALID_LINK', description: 'Отсутствует значение фильтра' };
    if (!filter_from || !filter_to) error = { code: 'BOOKMARKS_INVALID_LINK', description: 'Отсутствует параметр фильтрации' };
    if (!limit) limit = 50;
    if (!offset) offset = 0;
    if (!sort_by || sort_by !== 'favorites') sort_by = "createdAt";
    if (!sort_dir || sort_dir !== 'desc') sort_dir = "asc";
    //создание объекта запроса из параметров url (query string)
    //в случае если фильтр = favorites, то приводит значение к boolean
    const whereValue = Object.fromEntries(new Map().set(filter, filter === 'favorites' ? JSON.parse(filter_value.toLowerCase()) : filter_value));

    if (error) return res.status(200).json({ success: false, error });

    models.bookmarks
        .findAndCountAll({
            where: whereValue, attributes: ['guid', 'link', 'createdAt', 'description', 'favorites'], limit, offset,
            order: [[sort_by, sort_dir]], [Op.gte]: [filter_from], [Op.lte]: [filter_to]
        })
        .then(result => {
            const { count: length, rows: data } = result;
            res.status(200).json({ success: true, length, message: '//Всего записей с указанным фильтром в БД (внимание, всего - это без учета лимита пагинации)', data })
        })
        .catch(result => {
            res.status(200).json({ success: false })
        })
});

//curl -d '{"link":"http://yahoo.com","description":"это vk","favorites":true}' -H "Content-Type: application/json" -X POST http://localhost:3010/api/v1/bookmarks
router.post("/", async (req, res) => {
    const { link, description, favorites } = req.body;
    const error = await valiateLink(link);

    if (error) return res.status(200).json({ success: false, error });

    models.bookmarks
        .findOrCreate({ where: { link }, defaults: { description: String(description), favorites: Boolean(favorites) } })
        .then(result => {
            const responseObject = result[0].get({ plain: true });
            res.status(200).json({
                success: true,
                data: { guid: responseObject.guid, createdAt: responseObject.createdAt }
            })
        })
        .catch(result => {
            res.status(200).json({ success: false })
        })
});

//curl -d '{"guid":"fecb3b93-bd69-4475-a423-83ab6299e892","link":"http://yahoo.com","description":"yandex","favorites":true}' -H "Content-Type: application/json" -X PATCH http://localhost:3010/api/v1/bookmarks
router.patch("/", async (req, res) => {
    const { guid, link, description, favorites } = req.body;
    const error = await valiateLink(link);

    if (error) return res.status(200).json({ success: false, error });

    models.bookmarks
        .findOne({ where: { guid } })
        .then(async bookmark => {
            if (!bookmark)
                res.status(404).json({ success: false, message: 'нет закладки с таким ID' })
            else {
                bookmark.link = link
                bookmark.description = description
                bookmark.favorites = favorites
                await bookmark.save()
                res.status(200).json({ success: true })
            }
        })
        .catch(result => res.status(200).json({ success: false, message: 'некорректные параметры' }));
});

//curl -d '{"guid":"fa30a83a-7c09-4be4-8940-4684fbad34f7"}' -H "Content-Type: application/json" -X DELETE http://localhost:3010/api/v1/bookmarks
router.delete("/", (req, res) => {
    const { guid } = req.body;
    if (!guid)
        res.status(200).json({ success: false, code: 'BOOKMARKS_INVALID_LINK', description: 'неверный запрос' })

    models.bookmarks
        .findOne({ where: { guid } })
        .then(bookmark => {
            if (bookmark) {
                bookmark.destroy()
                res.status(200).json({ success: true, message: 'удаление прошло успешно' })
            } else {
                res.status(200).json({ success: false, message: 'нет закладки с таким ID' })
            }
        })
        .catch(bookmark => res.status(200).json({ success: false }))
});

export default router;