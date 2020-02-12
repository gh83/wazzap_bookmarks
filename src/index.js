import HTTPService from "./http/service";
import http from "../config/http";
import models from "./models";

import publicRoutes from "./routes/public";

const publicHttpService = new HTTPService(publicRoutes);

models.sequelize.sync({
  force:
     //true ||
    !!process.env.DB_FORCE_SYNC
}).then(async() => {
  console.log('Sync success');
//создание списка доменов для бана
  if (await models.bannedDomaines.count() === 0)
    [new URL('http://yahoo.com'), new URL('http://yahoo1.com'), new URL('http://yahoo2.com')]
      .forEach(async url => (await models.bannedDomaines.build({ domain: url.hostname })).save())

}).catch(error => {
  console.error(error);
});

publicHttpService.start(process.env.PORT || http[process.env.NODE_ENV].port);