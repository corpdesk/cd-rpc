// // https://www.npmjs.com/package/zeptomail

// // For ES6
// import { Request, Response } from "express";
// // import { SendMailClient } from "zeptomail";
// import createZeptoClient from "zeptomail";
// import { Logging } from "../../base/winston.log";
// import { BaseService } from "../../base/base.service";
// import { CdPushController } from "../../cd-push/controllers/cdpush.controller";
// import { UserModel } from "../../user/models/user.model";
// import config from "../../../../config";
// import { getEmailByName, stripHTML } from "../models/mail.model";
// import { safeStringify } from "../../utils/safe-stringify";
// import { GenericService } from "../../base/generic-service";

// // export class ZeptoMailService {
// export class ZeptoMailService extends GenericService<ZeptoMailModel> {
//   logger: Logging;
//   // b: BaseService;
//   cdPush: CdPushController;
//   constructor() {
//     // console.log('starting NodemailerController::constructor()');
//     this.b = new BaseService();
//     this.logger = new Logging();
//     this.cdPush = new CdPushController();
//   }

//   async sendZeptoMail(req, res, msg, recepientUser: UserModel) {
//     const zeptomail = await import("zeptomail");
//     const url = "api.zeptomail.com/";
//     const token = config.emailApiKeys.zepto;
//     // let client = new SendMailClient({ url, token });
//     if (!token) {
//       console.log(
//         "ZeptoMailService::sendMail()/error: ZeptoMail API token is not configured.",
//       );
//       return;
//     }
//     const client = createZeptoClient({ url, token });
//     const emailPl = {
//       from: {
//         address: getEmailByName("asdap-admin"),
//         name: "asdap-admin",
//       },
//       to: [
//         {
//           email_address: {
//             address: recepientUser.email,
//             name: recepientUser.userName,
//           },
//         },
//       ],
//       subject: "Welcome to ASDAP",
//       htmlbody: (req as any).post.dat.f_vals[0].data.msg,
//       //   text: stripHTML((req as any).post.dat.f_vals[0].data.msg),
//       //   html: (req as any).post.dat.f_vals[0].data.msg,
//     };
//     client
//       .sendMail(emailPl)
//       .then((resp) => {
//         console.log(`payload: ${JSON.stringify(emailPl)}`);
//         console.log(`resp: ${JSON.stringify(resp)}`);
//         console.log("success");
//       })
//       .catch((error) => console.log("error"));
//   }
// }
