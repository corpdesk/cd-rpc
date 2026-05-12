import { Request, Response } from "express";
import config, { mailConfig } from "../../../../config";
import { createConnection, getConnection } from "typeorm";
import nodemailer, { TransportOptions } from "nodemailer";
// import { NodemailerService } from "./nodemailerservice";
// import { SendMailClient } from "zeptomail";
import createZeptoClient from "zeptomail";
// import { ZeptoMailService } from "./zeptomai.service";
import {
  EMP_CONFIG_2,
  getEmailByName,
  MailData,
  MailModel,
  stripHTML,
  ZOHO_CONFIG_1,
} from "../models/mail.model";
import { GenericService } from "../../base/generic-service";
import { CdPushController } from "../../cd-push/controllers/cdpush.controller";
import { UserModel } from "../../user/models/user.model";
import { Comm } from "../models/comm.model";
import { Logging } from "../../base/winston.log";

// export class MailService {
export class MailService extends GenericService<MailModel> {
  logger!: Logging;
  cdToken!: string;
  serviceModel = MailModel;
  docName = "MailService";
  cdPush: CdPushController;

  // nodemailer items:
  nodemailerTransporter1 = nodemailer.createTransport(ZOHO_CONFIG_1);
  // // Create a Nodemailer transport with DKIM support
  nodemailerTransporter2 = nodemailer.createTransport(
    EMP_CONFIG_2 as TransportOptions,
  );

  constructor() {
    super(MailModel);
    this.cdPush = new CdPushController();
  }

  async sendEmailNotif(
    req: Request,
    res: Response,
    msg: string,
    recepientUser: any,
  ): Promise<any> {
    console.log(`starting UserController::sendEmailNotif(req, res)`);
    let ret;
    switch (await this.getMailInterface()) {
      case "nodemailer":
        console.log(`UserController::sendEmailNotif()/using nodemailer`);
        // const nm = new NodemailerService();
        ret = await this.sendNodeMail(req, res, msg, recepientUser);
        break;
      case "zeptomail":
        console.log(`UserController::sendEmailNotif()/using zeptomail`);
        // const zm = new ZeptoMailService();
        ret = await this.sendZeptoMail(req, res, msg, recepientUser);
        break;
    }
    return ret;
  }

  async getMailInterface(): Promise<string> {
    const activeInterface = config.emailInterface.find(
      (service) => service.active,
    );
    console.log(
      `UserController::getMailInterface()/activeInterface: ${JSON.stringify(activeInterface)}`,
    );
    return activeInterface ? activeInterface.name : "nodemailer"; // Default to nodemailer if none is active
  }

  // start nodemailer items
  async sendNodeMail(
    req: Request,
    res: Response,
    msg: string,
    recepientUser: UserModel,
  ) {
    try {
      const mail = {
        from: `${config.emailUsers[1].email} <${config.emailUsers[1].email}>`,
        to: recepientUser.email,
        subject: "Welcome!",
        text: stripHTML((req as any).post.dat.f_vals[0].data.msg),
        html: (req as any).post.dat.f_vals[0].data.msg,
        headers: { "x-myheader": "test header" },
      };
      console.log(`Nodemailerservice::sendMail()/mail:${JSON.stringify(mail)}`);
      const info = await this.nodemailerTransporter2.sendMail(mail);

      console.log(`Message sent: ${JSON.stringify(info)}`);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  /**
   * Also see Optional method following this method
   * Refer to supported services at the top of this file
   * @param req
   * @param res
   */
  async sendNodeMail1(
    req: Request,
    res: Response,
    msg: string,
    recepientUser: UserModel,
  ) {
    this.logger.logInfo("starting NodemailerService::sendMail()");
    this.logger.logInfo("NodemailerService::sendMail()/msg:", msg);
    this.logger.logInfo(
      "NodemailerService::sendMail()/emailUser:",
      config.emailUsers[0],
    );
    // const transporter = nodemailer.createTransport(ZOHO_CONFIG_1);

    const mail = {
      from: `${config.emailUsers[0].name} <${config.emailUsers[0].user}>`,
      to: recepientUser.email,
      subject: "Welcome!",
      text: stripHTML((req as any).post.dat.f_vals[0].data.msg),
      html: (req as any).post.dat.f_vals[0].data.msg,
      headers: { "x-myheader": "test header" },
    };

    this.nodemailerTransporter1.sendMail(mail, async (err, info) => {
      console.log(err);
      console.log(info.envelope);
      console.log(info.messageId);
      return await info;
    });

    return true;
  }

  /**
   * Optional method
   * @param req
   * @param res
   */
  async sendNodeMail2(req: Request, res: Response) {
    const username = "corpdesk@zohomail.com";
    const password = "Mw6udKgffR43S8a";

    const transporter = nodemailer.createTransport(
      mailConfig(username, password),
    );
    const data = {
      t: transporter,
      mail: {
        from: `'Test' <corpdesk@zohomail.com>`,
        to: "george.oremo@gmail.com",
        subject: "Hello from node",
        text: "Hello world?",
        html: "<strong>Hello world?</strong>",
        headers: { "x-myheader": "test header" },
      },
    };
    this.execNodeMail(req, res, data);
  }

  sendNodeMail3(req: Request, res: Response) {
    const username = "corpdesk@zohomail.com";
    const password = "Mw6udKgffR43S8a";

    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: "smtp.example.com", // replace with your SMTP host
      port: 587, // replace with your SMTP port
      secure: false, // true for 465, false for other ports
      auth: {
        user: "your-email@example.com", // replace with your SMTP username
        pass: "your-email-password", // replace with your SMTP password
      },
    });

    // Define the email options
    const mailOptions = {
      from: '"Sender Name" <your-email@example.com>', // sender address
      to: "recipient@example.com", // list of receivers
      subject: "Hello from Node.js", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    });
  }

  async ArchiveNodeMail(req: Request, res: Response) {
    createConnection()
      .then(async (connection) => {
        console.log("Inserting a new user into the database...");
        const comm = new Comm();
        comm.commName = "Timber";
        const ret = await connection.manager.save(comm);
        getConnection().close();
        console.log("ret", ret);
        const r = await this.b.respond(req, res);
        // return ret;
      })
      .catch(async (error) => {
        getConnection().close();
        console.log(`Error: ${error}`);
        // return error;
        // await this.b.respond(req, res, error);
        // Notification.dispatch();
      });
  }

  // async execNodeMail(req: Request, res: Response, data: any) {
  //   // send mail with defined transport object
  //   const ret = await data.t.sendMail(data.mail, (err, info) => {
  //     console.log(err);
  //     console.log(info.envelope);
  //     console.log(info.messageId);
  //   });

  //   // console.log('Message sent: %s', ret.response);
  //   // this.cdPush.emit('mailSent', ret.response);
  //   // return info.response;
  // }
  async execNodeMail(req: Request, res: Response, data: MailData) {
    // send mail with defined transport object
    const ret = await data.t.sendMail(data.mail, (err, info) => {
      console.log(err);
      console.log(info.envelope);
      console.log(info.messageId);
    });

    // console.log('Message sent: %s', ret.response);
    // this.cdPush.emit('mailSent', ret.response);
    // return info.response;
  }

  async sendZeptoMail(req: Request, res: Response, msg: string, recepientUser: UserModel) {
    const zeptomail = await import("zeptomail");
    const url = "api.zeptomail.com/";
    const token = config.emailApiKeys.zepto;
    // let client = new SendMailClient({ url, token });
    if (!token) {
      console.log(
        "ZeptoMailService::sendMail()/error: ZeptoMail API token is not configured.",
      );
      return;
    }
    const client = createZeptoClient({ url, token });
    const emailPl = {
      from: {
        address: getEmailByName("asdap-admin"),
        name: "asdap-admin",
      },
      to: [
        {
          email_address: {
            address: recepientUser.email,
            name: recepientUser.userName,
          },
        },
      ],
      subject: "Welcome to ASDAP",
      htmlbody: (req as any).post.dat.f_vals[0].data.msg,
      //   text: stripHTML((req as any).post.dat.f_vals[0].data.msg),
      //   html: (req as any).post.dat.f_vals[0].data.msg,
    } as any;
    client
      .sendMail(emailPl)
      .then((resp) => {
        console.log(`payload: ${JSON.stringify(emailPl)}`);
        console.log(`resp: ${JSON.stringify(resp)}`);
        console.log("success");
      })
      .catch((error) => console.log("error"));
  }
}
