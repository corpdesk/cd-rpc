// // /**
// //  *
// //  * Supported services
// //     Service names are case insensitive

// //         '126'
// //         '163'
// //         '1und1'
// //         'AOL'
// //         'DebugMail'
// //         'DynectEmail'
// //         'FastMail'
// //         'GandiMail'
// //         'Gmail'
// //         'Godaddy'
// //         'GodaddyAsia'
// //         'GodaddyEurope'
// //         'hot.ee'
// //         'Hotmail'
// //         'iCloud'
// //         'mail.ee'
// //         'Mail.ru'
// //         'Maildev'
// //         'Mailgun'
// //         'Mailjet'
// //         'Mailosaur'
// //         'Mandrill'
// //         'Naver'
// //         'OpenMailBox'
// //         'Outlook365'
// //         'Postmark'
// //         'QQ'
// //         'QQex'
// //         'SendCloud'
// //         'SendGrid'
// //         'SendinBlue'
// //         'SendPulse'
// //         'SES'
// //         'SES-US-EAST-1'
// //         'SES-US-WEST-2'
// //         'SES-EU-WEST-1'
// //         'Sparkpost'
// //         'Yahoo'
// //         'Yandex'
// //         'Zoho'
// //         'qiye.aliyun'
// //  */
// import { Request, Response } from "express";
// import "reflect-metadata";
// import { createConnection, getConnection } from "typeorm";
// import nodemailer from "nodemailer";
// // import Mail from 'nodemailer/lib/mailer';
// import { BaseService } from "../../base/base.service";
// import { CdPushController } from "../../cd-push/controllers/cdpush.controller";
// import config, { mailConfig } from "../../../../config";
// import { Comm } from "../models/comm.model";
// import { Logging } from "../../base/winston.log";
// import { UserModel } from "../../user/models/user.model";
// import dotenv from "dotenv";
// import { ZOHO_CONFIG_1, EMP_CONFIG_2, stripHTML } from "../models/mail.model";
// import { safeStringify } from "../../utils/safe-stringify";
// import { GenericService } from "../../base/generic-service";

// dotenv.config();

// // export class NodemailerService {
// export class NodemailerService extends GenericService<NodemailerModel> {
//   logger: Logging;
//   b: BaseService;
//   cdPush: CdPushController;
//   nodemailerTransporter1 = nodemailer.createTransport(ZOHO_CONFIG_1);

//   // // Create a Nodemailer transport with DKIM support
//   nodemailerTransporter2 = nodemailer.createTransport(EMP_CONFIG_2);
//   constructor() {
//     // console.log('starting NodemailerController::constructor()');
//     this.b = new BaseService();
//     this.logger = new Logging();
//     this.cdPush = new CdPushController();
//   }

//   async sendMail(req, res, msg, recepientUser: UserModel) {
//     try {
//       const mail = {
//         from: `${config.emailUsers[1].email} <${config.emailUsers[1].email}>`,
//         to: recepientUser.email,
//         subject: "Welcome!",
//         text: stripHTML((req as any).post.dat.f_vals[0].data.msg),
//         html: (req as any).post.dat.f_vals[0].data.msg,
//         headers: { "x-myheader": "test header" },
//       };
//       console.log(`Nodemailerservice::sendMail()/mail:${JSON.stringify(mail)}`);
//       const info = await this.nodemailerTransporter2.sendMail(mail);

//       console.log(`Message sent: ${JSON.stringify(info)}`);
//       return info;
//     } catch (error) {
//       console.error("Error sending email:", error);
//       throw error;
//     }
//   }

//   /**
//    * Also see Optional method following this method
//    * Refer to supported services at the top of this file
//    * @param req
//    * @param res
//    */
//   async sendMail1(req, res, msg, recepientUser: UserModel) {
//     this.logger.logInfo("starting NodemailerService::sendMail()");
//     this.logger.logInfo("NodemailerService::sendMail()/msg:", msg);
//     this.logger.logInfo(
//       "NodemailerService::sendMail()/emailUser:",
//       config.emailUsers[0]
//     );
//     // const transporter = nodemailer.createTransport(ZOHO_CONFIG_1);

//     const mail = {
//       from: `${config.emailUsers[0].name} <${config.emailUsers[0].user}>`,
//       to: recepientUser.email,
//       subject: "Welcome!",
//       text: stripHTML((req as any).post.dat.f_vals[0].data.msg),
//       html: (req as any).post.dat.f_vals[0].data.msg,
//       headers: { "x-myheader": "test header" },
//     };

//     this.nodemailerTransporter1.sendMail(mail, async (err, info) => {
//       console.log(err);
//       console.log(info.envelope);
//       console.log(info.messageId);
//       return await info;
//     });

//     return true;
//   }

  

//   /**
//    * Optional method
//    * @param req
//    * @param res
//    */
//   async sendMail2(req: Request, res: Response) {
//     const username = "corpdesk@zohomail.com";
//     const password = "Mw6udKgffR43S8a";

//     const transporter = nodemailer.createTransport(
//       mailConfig(username, password)
//     );
//     const data = {
//       t: transporter,
//       mail: {
//         from: `'Test' <corpdesk@zohomail.com>`,
//         to: "george.oremo@gmail.com",
//         subject: "Hello from node",
//         text: "Hello world?",
//         html: "<strong>Hello world?</strong>",
//         headers: { "x-myheader": "test header" },
//       },
//     };
//     this.exec(req, res, data);
//   }

//   sendMail3(req: Request, res: Response) {
//     const username = "corpdesk@zohomail.com";
//     const password = "Mw6udKgffR43S8a";

//     // Create a transporter object using the default SMTP transport
//     const transporter = nodemailer.createTransport({
//       host: "smtp.example.com", // replace with your SMTP host
//       port: 587, // replace with your SMTP port
//       secure: false, // true for 465, false for other ports
//       auth: {
//         user: "your-email@example.com", // replace with your SMTP username
//         pass: "your-email-password", // replace with your SMTP password
//       },
//     });

//     // Define the email options
//     const mailOptions = {
//       from: '"Sender Name" <your-email@example.com>', // sender address
//       to: "recipient@example.com", // list of receivers
//       subject: "Hello from Node.js", // Subject line
//       text: "Hello world?", // plain text body
//       html: "<b>Hello world?</b>", // html body
//     };

//     // Send the email
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         return console.log(error);
//       }
//       console.log("Message sent: %s", info.messageId);
//       console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//     });
//   }

//   async ArchiveMail(req: Request, res: Response) {
//     createConnection()
//       .then(async (connection) => {
//         console.log("Inserting a new user into the database...");
//         const comm = new Comm();
//         comm.comm_name = "Timber";
//         const ret = await connection.manager.save(comm);
//         getConnection().close();
//         console.log("ret", ret);
//         const r = await this.b.respond(req, res);
//         // return ret;
//       })
//       .catch(async (error) => {
//         getConnection().close();
//         console.log(`Error: ${error}`);
//         // return error;
//         // await this.b.respond(req, res, error);
//         // Notification.dispatch();
//       });
//   }

//   async exec(req, res, data) {
//     // send mail with defined transport object
//     const ret = await data.t.sendMail(data.mail, (err, info) => {
//       console.log(err);
//       console.log(info.envelope);
//       console.log(info.messageId);
//     });

//     // console.log('Message sent: %s', ret.response);
//     // this.cdPush.emit('mailSent', ret.response);
//     // return info.response;
//   }
// }
