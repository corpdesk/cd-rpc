import { Request, Response } from "express";

import WebSocket, { Server as WSServer, WebSocket as WS } from "ws";
import { IncomingMessage } from "http";
import * as url from "url";
import * as jwt from "jsonwebtoken";
// import url from "url";
// import jwt from "jsonwebtoken";
import { BaseService } from "../../base/base.service";
import { CdService } from "../../base/cd.service";
import { SessionService } from "../../user/services/session.service";
import { UserService } from "../../user/services/user.service";
// import { ModuleModel } from '../models/module.model';
import {
    ICdResponse,
  IExtServiceInput,
  IQuery,
  IRespInfo,
  IServiceInput,
  IUser,
} from "../../base/i-base";
import { CdPushSocketModel, PushEnvelope, SocketData } from "../models/cd-push-socket.model";
// import { ModuleViewModel } from '../models/cd-push-view.model';
import { CdPushViewModel } from "../models/cd-push-view.model";
import { CdPushTypeModel } from "../models/cd-push-type.model";
import { UserModel } from "../../user/models/user.model";
import { server as WebSocketServer } from "websocket";
import { JwtService } from "../../moduleman/services/jwt.service";
import { safeStringify } from "../../utils/safe-stringify";
import { GenericService } from "../../base/generic-service";
import { SessionModel } from "../../user/models/session.model";

const { sign, verify } = jwt;
const jwtSecret = "example-secret";
const cdPushClients: any = [];
// ** userID: wss
const webSockets: any = [];

const socketsStore: any = [];

export class WebsocketService {
  b: any; // instance of BaseService
  cdToken!: string;
  srvSess!: SessionService;
  srvUser!: UserService;
  user!: IUser;
  serviceModel: CdPushSocketModel;
  sessModel!: SessionModel;
  // moduleModel: ModuleModel;

  /*
   * create rules
   */
  cRules: any = {
    required: ["resourceGuid"],
    noDuplicate: [],
  };
  uRules: any[] = [];
  dRules: any[] = [];

  constructor() {
    this.b = new BaseService();
    this.serviceModel = new CdPushSocketModel();
    // this.moduleModel = new ModuleModel();
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "WebSocket",
  //         "a": "Create",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "data": {
  //                         "cdPushSocketName": "/src/CdApi/sys/moduleman",
  //                         "WebSocketTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
  //                         "parentModuleGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
  //                     }
  //                 }
  //             ],
  //             "token": "3ffd785f-e885-4d37-addf-0e24379af338"
  //         },
  //         "args": {}
  //     }
  //  * @param req
  //  * @param res
  //  */
  async create(req: Request, res: Response) {
    console.log("WebSocketService::create()/01");
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      console.log("WebSocketService::create()/02");
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceInstance: this,
        serviceModel: CdPushSocketModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create cdPushSocket",
        dSource: 1,
      };
      console.log(
        "WebSocketService::create()/(req as any).post:",
        (req as any).post,
      );
      const respData = await this.b.create(
        req as any,
        res as any,
        serviceInput,
      );
      await this.afterCreate(req, res, respData, svSess);
    } else {
      console.log("WebSocketService::create()/03");
      this.b.setAppState(false, this.b.i, svSess.sessResp);
      return this.b.respond(req, res);
    }
  }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<any>,
  ): Promise<CdPushSocketModel | boolean> {
    return await this.b.createI(req, res, serviceInputExt);
  }

  async cdPushSocketectExists(
    req: Request,
    res: Response,
    q: IQuery,
  ): Promise<boolean> {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: CdPushSocketModel,
      docName: "WebSocketService::cdPushSocketectExists",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }

  /**
   * SELECT cd_push_socket_id, cd_push_socket_guid, cd_push_socket_name,
   * cd_push_socket_description, doc_id, cd_push_socket_type_id, `data`,
   * cd_push_socket_type_guid, cd_push_socket_enabled, ng_module, resource_name,
   * resource_guid, jwt_token, socket, init_time, relay_time, relayed, delivery_time,
   * deliverd, comm_track
   * @param req
   * @param res
   * @returns
   */
  async beforeCreate(req: Request, res: Response): Promise<any> {
    const pl = this.b.getPlData(req);
    this.b.setPlData(req, { key: "initTime", value: pl.commTrack.initTime });
    this.b.setPlData(req, { key: "relayTime", value: pl.commTrack.relayTime });
    this.b.setPlData(req, { key: "relayed", value: pl.commTrack.relayed });
    this.b.setPlData(req, {
      key: "deliveryTime",
      value: pl.commTrack.deliveryTime,
    });
    this.b.setPlData(req, { key: "deliverd", value: pl.commTrack.deliverd });
    this.b.setPlData(req, { key: "cdPushSocketGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "cdPushSocketEnabled", value: true });
    return true;
  }

  async afterCreate(req: Request, res: Response, respData: ICdResponse, svSess: SessionService): Promise<any> {
    const svJwt = new JwtService();
    await this.b.setJwt(await svJwt.fetchUserToken(req, res));
    console.log("WebsocketService::create()/this.b.cdResp1:", this.b.cdResp);
    console.log("WebsocketService::create()/respData:", respData);
    this.b.i.app_msg = "new cdPushSocket created";
    this.b.setAppState(true, this.b.i, this.b.cdResp.app_state.sess);
    this.b.cdResp.data = await respData;
    console.log("WebsocketService::create()/this.b.cdResp2:", this.b.cdResp);
    await this.b.respond(req, res);
  }

  async read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    //
  }

  update(req: Request, res: Response) {
    // console.log('WebSocketService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: CdPushSocketModel,
      docName: "WebSocketService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // console.log('WebSocketService::update()/02')
    this.b
      .update$(req, res, serviceInput)
      .subscribe((ret: any) => {
        this.b.cdResp.data = ret;
        this.b.respond(req, res);
      });
  }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any) {
    if (q.update.cdPushSocketEnabled === "") {
      q.update.cdPushSocketEnabled = null;
    }
    if (q.update.showIcon === "") {
      q.update.showIcon = null;
    }
    return q;
  }

  async remove(req: Request, res: Response) {
    //
  }

  /**
   * methods for transaction rollback
   */
  rbCreate(): number {
    return 1;
  }

  rbUpdate(): number {
    return 1;
  }

  rbDelete(): number {
    return 1;
  }

  async validateCreate(req: Request, res: Response) {
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    const params = {
      controllerInstance: this,
      model: CdPushSocketModel,
    };
    this.b.i.code = "WebSocketService::validateCreate";
    let ret = true;

    ///////////////////////////////////////////////////////////////////
    // 2. confirm the cd_obj referenced exists
    const pl: CdPushSocketModel = this.b.getPlData(req);

    // if ('WebSocketTypeGuid' in pl) {
    //     const serviceInput = {
    //         serviceModel: CdPushTypeModel,
    //         docName: 'WebSocketService::validateCreate',
    //         cmd: {
    //             action: 'find',
    //             query: { where: { WebSocketTypeGuid: pl.WebSocketTypeGuid } }
    //         },
    //         dSource: 1
    //     }
    //     const r: any = await this.b.read(req, res, serviceInput)
    //     if (r.length > 0) {
    //         ret = true;
    //     } else {
    //         ret = false;
    //         this.b.i.app_msg = `cdPushSocket type reference is invalid`;
    //         this.b.err.push(this.b.i.app_msg);
    //     }
    // } else {
    //     this.b.i.app_msg = `parentModuleGuid is missing in payload`;
    //     this.b.err.push(this.b.i.app_msg);
    // }

    // if ('WebSocketTypeGuid' in pl) {
    //     console.log('WebSocketService::validateCreate()/01')
    //     const WebSocketTypeData: CdPushTypeModel[] = await this.b.get(req, res, CdPushTypeModel, { where: { WebSocketTypeGuid: pl.WebSocketTypeGuid } });
    //     if (await this.b.validateInputRefernce(`cdPushSocket type reference is invalid`, WebSocketTypeData, svSess)) {
    //         console.log('WebSocketService::validateCreate()/02')
    //         console.log('WebSocketService::validateCreate()/WebSocketTypeData:', WebSocketTypeData);
    //         if (WebSocketTypeData[0].WebSocketTypeName === 'user') {
    //             console.log('WebSocketService::validateCreate()/03')
    //             if ('objGuid' in pl) {
    //                 console.log('WebSocketService::validateCreate()/04')
    //                 ret = true;
    //                 await this.b.setPlData(req, { key: 'cdPushSocketName', value: pl.objGuid });
    //                 const userData: UserModel[] = await this.b.get(req, res, UserModel, { where: { userGuid: pl.objGuid } });
    //                 await this.b.setPlData(req, { key: 'objId', value: userData[0].userId });
    //             } else {
    //                 console.log('WebSocketService::validateCreate()/05')
    //                 this.b.setAlertMessage(`if registering user type, objGuid must be provided`, svSess);
    //             }
    //         }
    //     } else {
    //         console.log('WebSocketService::validateCreate()/06')
    //         ret = false;
    //         this.b.setAlertMessage(`cdPushSocket type reference is invalid`, svSess);
    //     }
    // } else {
    //     console.log('WebSocketService::validateCreate()/07')
    //     this.b.setAlertMessage(`parentModuleGuid is missing in payload`, svSess);
    // }

    ///////////////////////////////////////////////////////////////////
    // 3. confirm the parent referenced exists
    // if ('parentModuleGuid' in pl) {
    //     console.log('WebSocketService::validateCreate()/08')
    //     const serviceInput = {
    //         serviceModel: ModuleModel,
    //         docName: 'WebSocketService::getModuleMenu$',
    //         cmd: {
    //             action: 'find',
    //             query: { where: { moduleGuid: pl.parentModuleGuid } }
    //         },
    //         dSource: 1
    //     }
    //     const moduleData: ModuleModel[] = await this.b.read(req, res, serviceInput)
    //     await this.b.setPlData(req, { key: 'parentModuleId', value: moduleData[0].moduleId });
    //     console.log('WebSocketService::validateCreate()/moduleData:', moduleData);
    //     if (moduleData.length > 0) {
    //         console.log('WebSocketService::validateCreate()/09')
    //         ret = true;
    //     } else {
    //         console.log('WebSocketService::validateCreate()/10')
    //         ret = false;
    //         this.b.i.app_msg = `parent reference is invalid`;
    //         this.b.err.push(this.b.i.app_msg);
    //     }
    // } else {
    //     console.log('WebSocketService::getWebSocket/11');
    //     this.b.i.app_msg = `parentModuleGuid is missing in payload`;
    //     this.b.err.push(this.b.i.app_msg);
    // }

    // console.log('WebSocketService::getWebSocket/111');
    // console.log('WebSocketService::validateCreate()/(req as any).post', JSON.stringify((req as any).post));
    // pl = this.b.getPlData(req);
    // console.log('WebSocketService::validateCreate()/pl', JSON.stringify(pl));
    // if (await this.b.validateUnique(req, res, params)) {
    //     if (await this.b.validateRequired(req, res, this.cRules)) {
    //         ret = true;
    //     } else {
    //         ret = false;
    //         this.b.i.app_msg = `the required fields ${this.cRules.required.join(', ')} is missing`;
    //         this.b.err.push(this.b.i.app_msg);
    //     }
    // } else {
    //     ret = false;
    //     this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(', ')} is not allowed`;
    //     this.b.err.push(this.b.i.app_msg);
    // }
    /////////////////////////////////////////////

    console.log("WebSocketService::getWebSocket/13");
    if (this.b.err.length > 0) {
      console.log("WebSocketService::validateCreate()/14");
      console.log("WebSocketService::validateCreate()/this.b.err:", this.b.err);
      ret = false;
    }
    console.log("WebSocketService::getWebSocket/15");
    console.log("WebSocketService::getWebSocket/ret:", ret);
    return ret;
  }

  getWebSocket(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("WebSocketService::getWebSocket/f:", q);
    const serviceInput = {
      serviceModel: CdPushViewModel,
      docName: "WebSocketService::getWebSocket$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r: any) => {
        console.log("WebSocketService::read$()/r:", r);
        this.b.i.code = "WebSocketController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log("WebSocketService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }

  getWebSocketType(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("WebSocketService::getWebSocket/q:", q);
    const serviceInput = {
      serviceModel: CdPushTypeModel,
      docName: "WebSocketService::getWebSocketType$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r: any) => {
        console.log("WebSocketService::read$()/r:", r);
        this.b.i.code = "WebSocketController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log("WebSocketService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }

  getWebSocketCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("WebSocketService::getWebSocketCount/q:", q);
    const serviceInput = {
      serviceModel: CdPushViewModel,
      docName: "WebSocketService::getWebSocketCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: any) => {
        this.b.i.code = "WebSocketController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  getWebSocketTypeCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("WebSocketService::getWebSocketCount/q:", q);
    const serviceInput = {
      serviceModel: CdPushViewModel,
      docName: "WebSocketService::getWebSocketCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: any) => {
        this.b.i.code = "WebSocketController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  delete(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("WebSocketService::delete()/q:", q);
    const serviceInput = {
      serviceModel: CdPushSocketModel,
      docName: "WebSocketService::delete",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };

    this.b
      .delete$(req, res, serviceInput)
      .subscribe((ret: any) => {
        this.b.cdResp.data = ret;
        this.b.respond(req, res);
      });
  }

  /////////////////////////////////////////////////////////////////////////

  clientHasSocket(userId: string, pushGuid: string) {
    console.log("clientHasSocket()/01");
    console.log("clientHasSocket()/socketsStore:", socketsStore);
    console.log("clientHasSocket()/userId:", userId);
    console.log("clientHasSocket()/pushGuid:", pushGuid);
    return (
      socketsStore.filter((s: any) => s.userId === userId && s.pushGuid === pushGuid)
        .length > 0
    );
  }

  // get destination socket based on the selected cdObjId;
  async destinationSocket(rg: string) {
    // console.log('destinationSocket()/cdObjId:', cdObjId)
    // console.log('destinationSocket()/cdPushClients:', cdPushClients)
    // const socketArr = cdPushClients.filter(c => c.resourceGuid === cdObjId.resourceGuid).map(c => c.socket);
    // console.log('destinationSocket()/socketArr:', socketArr)
    // if (socketArr.length > 0) {
    //     console.log('destinationSocket()/returning socket...')
    //     return socketArr[0];
    // } else {
    //     return false;
    // }

    const q = { where: { resourceGuid: rg } };
    console.log("WebsocketService::destinationSocket/q:", q);
    // const serviceInput = {
    //     serviceModel: CdPushSocketModel,
    //     docName: 'WebsocketService::destinationSocket',
    //     cmd: {
    //         action: 'find',
    //         query: q
    //     },
    //     dSource: 1
    // }
    try {
      return this.b.wsGet(CdPushSocketModel, q, "");
    } catch (e: any) {
      console.log("WebsocketService::destinationSocket/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "WebsocketService::destinationSocket",
        app_msg: "",
      };
      this.b.wsServiceErr(e, i.code, "");
      return [];
    }
  }

  saveSocket(uid: string, pGuid: string, ws: any) {
    console.log("saveSocket()/saving the socket");
    console.log("saveSocket()/socketsStore:", socketsStore);
    console.log("saveSocket()/pGuid:", pGuid);
    if (!this.clientHasSocket(uid, pGuid)) {
      const socketData = {
        socket: ws,
        userId: uid,
        pushGuid: pGuid,
      };
      socketsStore.push(socketData);
    } else {
      console.log("client socket exists!");
    }
  }

  resetSocket(uid: string, pGuid: string, ws: WS) {
    console.log("resetSocket()/resetting the socket");
    console.log("resetSocket()/socketsStore:", socketsStore);
    console.log("resetSocket()/pGuid:", pGuid);
    if (this.clientHasSocket(uid, pGuid)) {
      console.log("socket exists");
      socketsStore.forEach((s: any, i: any) => {
        if (s.userId === uid && s.pushGuid === pGuid) {
          console.log("about to remove the socket");
          s.socket.close();
          console.log("closed the socket");
          socketsStore.splice(i, 1);
          console.log("socket removed");
        }
      });
      const socketData = {
        socket: ws,
        userId: uid,
        pushGuid: pGuid,
      };
      console.log("saving new socket");
      socketsStore.push(socketData);
    }
  }

  // run(wss: any) {
  //     wss.on('connection', async (ws, wsReq) => {
  //         console.log('');
  //         console.log('');
  //         console.log('');
  //         console.log('wss.on(connection)/01');
  //         if (url.parse(wsReq.url, true).query.token) {
  //             const token = url.parse(wsReq.url, true).query.token;
  //             const resourceGuid = url.parse(wsReq.url, true).query.rg;
  //             console.log('wss.on(connection/token:', token);
  //             console.log('wss.on(connection/resourceGuid:', resourceGuid);
  //             // search and update registered data with socket

  //             console.log('wss.on(connection/cdPushClients:', JSON.stringify(cdPushClients));

  //             /**
  //              * update client data with connection socket
  //              */
  //             // cdPushClients.forEach((c) => {
  //             //     if (c.resourceGuid === resourceGuid) {
  //             //         console.log('setting socket for:', JSON.stringify(c));
  //             //         c.socket = ws;
  //             //     }
  //             // })
  //             await this.setSocketRedis(resourceGuid, ws)
  //             await this.setSocket(resourceGuid, ws)
  //         }

  //         // Handle the WebSocket `message` event. If any of the clients has a token
  //         // that is no longer valid, send an error message and close the client's
  //         // connection.
  //         ws.on('message', (data) => {
  //             console.log('');
  //             console.log('');
  //             console.log('');
  //             console.log('wss.on(message)/01');
  //             console.log('wss.on(message)/data1:', data);
  //             console.log('wss.on(message)/confirm that cdPushClients items have valid sockets');
  //             // console.log('wss.on(message)/cdPushClients:', cdPushClients);
  //             console.log('wss.on(message)/typeof(data)1:', typeof (data));
  //             let strData = data.toString();
  //             console.log('wss.on(message)/typeof(strData):', typeof (strData));
  //             console.log('wss.on(message)/strData:', strData);
  //             let pEnvelop = JSON.parse(strData);
  //             strData = JSON.stringify(pEnvelop);
  //             pEnvelop = JSON.parse(strData);
  //             console.log('wss.on(message)/typeof(pEnvelop):', typeof (pEnvelop));
  //             console.log('wss.on(message)/pEnvelop*:', pEnvelop);
  //             const recepients = pEnvelop.pushData.pushRecepients;
  //             const sender = recepients.filter((m) => m.subTypeId === 1)[0];
  //             const senderId = sender.userId;
  //             console.log('wss.on(message)/sender:', sender);
  //             let senderToken = '';
  //             if ('cdObjId' in sender) {
  //                 if ('jwtToken' in sender.cdObjId) {
  //                     senderToken = sender.cdObjId.jwtToken;
  //                     const pushGuid = pEnvelop.pushData.pushGuid;
  //                     console.log('wss.on(message)/pEnvelop*:', pEnvelop);
  //                     console.log('wss.on(message)/senderId*:', senderId);
  //                     console.log('wss.on(message)/pushGuid*:', pushGuid);
  //                     if (senderId) {
  //                         this.saveSocket(senderId, pushGuid, ws);
  //                         console.log('wss.on(message)/pEnvelop.pushRecepients:', JSON.stringify(pEnvelop.pushData.pushRecepients));
  //                         let jwtToken = '';
  //                         pEnvelop.pushData.pushRecepients.forEach(async (m, i) => {
  //                             console.log('wss.on(message)/m', m);
  //                             const cdObjId = m.cdObjId;
  //                             let ret;
  //                             let senderSocket;
  //                             let recepientSocket;
  //                             switch (m.subTypeId) {
  //                                 case 1:
  //                                     ret = await this.destinationSocket(cdObjId.resourceGuid);
  //                                     console.log('wss.on(message)/senderSocket:', senderSocket);
  //                                     console.log('wss.on(message)/senderSocket/ret[0].socket:', ret[0].socket);
  //                                     senderSocket = ret[0].socket;
  //                                     // senderSocket = await this.getSocketRedis(cdObjId.resourceGuid)
  //                                     // console.log('wss.on(message)/senderSocket/JSON.stringify(senderSocket):', JSON.stringify(senderSocket));
  //                                     // senderSocket = this.getSocketArr(cdObjId.resourceGuid);
  //                                     // console.log('wss.on(message)/senderSocket/JSON.stringify(senderSocket):', JSON.stringify(senderSocket));
  //                                     break;
  //                                 case 7:
  //                                     ret = await this.destinationSocket(cdObjId.resourceGuid);
  //                                     console.log('wss.on(message)/recepientSocket:', recepientSocket);
  //                                     console.log('wss.on(message)/recepientSocket/ret[0].socket:', ret[0].socket);
  //                                     recepientSocket = ret[0].socket;
  //                                     // recepientSocket = await this.getSocketRedis(cdObjId.resourceGuid)
  //                                     // console.log('wss.on(message)/recepientSocket/JSON.stringify(recepientSocket):', JSON.stringify(recepientSocket));
  //                                     // recepientSocket = this.getSocketArr(cdObjId.resourceGuid);
  //                                     // console.log('wss.on(message)/recepientSocket/JSON.stringify(recepientSocket):', JSON.stringify(recepientSocket));
  //                                     break;
  //                             }

  //                             console.log('wss.on(message)/recepients[i].userId:', recepients[i].userId);
  //                             console.log('wss.on(message)/pEnvelop.resp:', JSON.stringify(pEnvelop.resp));
  //                             jwtToken = senderToken;
  //                             console.log('wss.on(message)/jwtToken:', jwtToken);
  //                             try {
  //                                 jwt.verify(senderToken, jwtSecret, (err, decoded) => {
  //                                     console.log('wss.on(message)/02');

  //                                     if (err) {
  //                                         console.log('wss.on(message)/03');
  //                                         console.log('jwt.verify(token)/err:', err)

  //                                         if (senderSocket) {
  //                                             console.log('wss.on(message)/04');
  //                                             senderSocket.send({
  //                                                 msg: 'Error: Your token is no longer valid. Please reauthenticate.'
  //                                             });
  //                                             senderSocket.close();
  //                                         } else {
  //                                             console.log('wss.on(message)/05');
  //                                             console.log('senderSocket is invalid');
  //                                         }
  //                                     } else {
  //                                         console.log('wss.on(message)/06');
  //                                         /**
  //                                          * messege back to sender:
  //                                          * include message tracking info
  //                                          */
  //                                         if (pEnvelop.pushData.triggerEvent === 'reset-socket') {
  //                                             console.log('wss.on(message)/07');
  //                                             this.resetSocket(recepients[i].userId, pushGuid, ws);
  //                                         }
  //                                         console.log('wss.on(message)/senderSocket3:', senderSocket);
  //                                         if (senderSocket) {
  //                                             console.log('wss.on(message)/08');
  //                                             console.log('wss.on(message)/data to send:', pEnvelop);
  //                                             senderSocket.send(JSON.stringify(pEnvelop));
  //                                         } else {
  //                                             console.log('wss.on(message)/09');
  //                                             console.log('senderSocket is invalid');
  //                                         }

  //                                         // main message to recepient
  //                                         console.log('wss.on(message)/10');
  //                                         if (recepientSocket) {
  //                                             console.log('wss.on(message)/11');
  //                                             console.log('wss.on(message)/data to send:', pEnvelop);
  //                                             console.log('wss.on(message)/socket to use, recepientSocket:', recepientSocket);
  //                                             console.log('wss.on(message)/socket to use, JSON.stringify(recepientSocket):', JSON.stringify(recepientSocket));
  //                                             try {
  //                                                 recepientSocket.send(JSON.stringify(pEnvelop));
  //                                             } catch (e: any) {
  //                                                 console.log('Error sending message. Error:', e);
  //                                             }
  //                                         } else {
  //                                             console.log('wss.on(message)/12');
  //                                             console.log('recepientSocket is invalid', '\n', '\n');
  //                                         }
  //                                     }
  //                                 });
  //                             } catch (e: any) {
  //                                 console.log('error on jwt.verify. Error:', e)
  //                             }
  //                         })
  //                     } else {
  //                         console.log('Aborting! senderId cannot be resolved')
  //                     }
  //                 } else {
  //                     console.log('******sender missing jwtToken *********')
  //                 }
  //             } else {
  //                 console.log('******sender missing cdObjId *********')
  //             }
  //         });
  //     });
  // }

  // async setSocket(rg, s) {
  //     const socketData = {resourceGuid:rg, socket: s};
  //     await this.setSocketRedis(rg, socketData);
  //     socketsStore.push(socketData);
  //     // const pl: any = await this.b.getPlData(req);
  //     console.log('JwtService::setJwt()/rg:', rg);
  //     // pl.socket = socket;
  //     const q = {
  //         update: { socket: s },
  //         where: {
  //             resourceGuid: rg
  //         }
  //     }
  //     const serviceInput = {
  //         serviceModel: CdPushSocketModel,
  //         docName: 'WebsocketService::update',
  //         cmd: {
  //             action: 'update',
  //             query: q,
  //         },
  //         dSource: 1
  //     }

  //     const ret = await this.b.wsUpdate(serviceInput, '')
  //     console.log('WebsocketService::setJwt()/update ret:', ret);
  // }

  // async setSocketRedis(rg, s){
  //     const ret = await this.b.wsRedisCreate(rg,s.toString())
  //     console.log('WebsocketService::setSocketRedis()/ret:', ret);
  // }

  // async getSocketRedis(rg){
  //     const socketStr = await this.b.wsRedisRead(rg)
  //     console.log('WebsocketService::setSocketRedis()/socketStr:', socketStr);
  //     const socketData = socketStr;
  //     return socketData.socket;
  // }

  // getSocketArr(rg){
  //     return socketsStore.filter((s) => s.resourceGuid === rg)[0].socket;
  // }

  ///////////////////////////////////////

  // Replace 'any' with the actual WebSocket Server type
  run(wss: WSServer) {
    wss.on("connection", async (ws: WS, wsReq: IncomingMessage) => {
      const parsedUrl = url.parse(wsReq.url || "", true);
      const token = parsedUrl.query.token as string;
      const resourceGuid = parsedUrl.query.rg as string;

      if (token && resourceGuid) {
        await this.setSocketRedis(resourceGuid, ws);
        await this.setSocket(resourceGuid, ws);
      }

      ws.on("message", async (data: WebSocket.Data) => {
        // Ensure data is treated as string for parsing
        const strData = data.toString();
        const pEnvelop: PushEnvelope = JSON.parse(strData);

        const recipients = pEnvelop.pushData.pushRecepients;
        const sender = recipients.find((m) => m.subTypeId === 1);

        if (!sender || !sender.cdObjId?.jwtToken) {
          console.log("Aborting! Missing sender or JWT");
          return;
        }

        const senderToken = sender.cdObjId.jwtToken;
        const pushGuid = pEnvelop.pushData.pushGuid;
        const senderId = sender.userId;

        // Explicitly typing the callback for jwt.verify
        jwt.verify(senderToken, "your-secret", async (err, decoded) => {
          if (err) {
            ws.send(JSON.stringify({ msg: "Error: Token invalid" }));
            ws.close();
            return;
          }

          for (const recipient of recipients) {
            const resGuid = recipient.cdObjId.resourceGuid;
            const targetSocketData = await this.destinationSocket(resGuid);
            const targetSocket: WS | undefined = targetSocketData?.[0]?.socket;

            if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
              targetSocket.send(JSON.stringify(pEnvelop));
            }
          }
        });
      });
    });
  }

  async setSocket(rg: string, s: WS): Promise<void> {
    const socketData: SocketData = { resourceGuid: rg, socket: s };
    // ... logic for updating database/store
  }

  async setSocketRedis(rg: string, s: WS | SocketData): Promise<void> {
    // Note: You cannot stringify a raw Socket object easily.
    // Usually, you store the server ID in Redis, not the socket instance itself.
    const ret = await this.b.wsRedisCreate(rg, rg);
  }

  async getSocketRedis(rg: string): Promise<string | null> {
    return await this.b.wsRedisRead(rg);
  }
}
