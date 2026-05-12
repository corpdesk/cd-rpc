// import {
//     Entity,
//     PrimaryGeneratedColumn,
//     Column,
// } from 'typeorm';
// import { v4 as uuidv4 } from 'uuid';
// import {
//     validateOrReject,
// } from 'class-validator';
// import { Binary } from 'mongodb';

// // SELECT cd_push_socket_id, cd_push_socket_guid, cd_push_socket_name, cd_push_socket_description, doc_id, cd_push_socket_type_id, `data`
// // FROM cd1213.cd_push_socket;




// @Entity(
//     {
//         name: 'cd_push_socket',
//         synchronize: false
//     }
// )
// // @CdModel
// export class CdPushSocketModel {

//     @PrimaryGeneratedColumn(
//         {
//             name: 'cd_push_socket_id'
//         }
//     )
//     cdPushSocketId?: number;

//     @Column({
//         name: 'cd_push_socket_guid',
//         length: 36,
//         default: uuidv4()
//     })
//     cdPushSocketGuid?: string;

//     @Column(
//         'varchar',
//         {
//             name: 'cd_push_socket_name',
//             length: 50,
//             nullable: true
//         }
//     )
//     cdPushSocketName: string;

//     @Column(
//         'varchar',
//         {
//             name: 'cd_push_socket_type_guid',
//             length: 40,
//             default: null
//         })
//     cdPushSocketTypeGuid: string;

//     @Column(
//         {
//             name: 'cd_push_socket_type_id',
//             default: null
//         }
//     )
//     cdPushSocketTypeId?: number;

//     @Column(
//         {
//             name: 'doc_id',
//             default: null
//         }
//     )
//     docId?: number;

//     @Column(
//         'tinyint',
//         {
//             name: 'cd_push_socket_enabled',
//             default: null
//         }
//     )
//     cdPushSocketEnabled?: boolean;

//     // {
//     //     "ngModule": "UserModule",
//     //     "resourceName": "SessService",
//     //     "resourceGuid": "resourceGuid",
//     //     "jwtToken": "",
//     //     "socket": "",
//     //     "commTrack": {
//     //         "initTime": 12345,
//     //         "relayTime": null,
//     //         "relayed": false,
//     //         "deliveryTime": null,
//     //         "deliverd": false
//     //     }
//     // }

//     @Column(
//         {
//             name: 'ng_module',
//             length: 60,
//             default: null
//         })
//     ngModule: string;

//     @Column(
//         {
//             name: 'resource_name',
//             length: 40,
//             default: null
//         })
//     resourceName: string;

//     @Column(
//         {
//             name: 'resource_guid',
//             length: 60,
//             default: null
//         })
//     resourceGuid: string;

//     @Column(
//         {
//             name: 'jwt_token',
//             length: 500,
//             default: null
//         })
//     jwtToken: string;

//     @Column(
//         {
//             name: 'socket',
//             type: 'binary',
//         }
//     )
//     socket: any;

//     @Column(
//         {
//             name: 'comm_track',
//             type: 'json',
//         }
//     )
//     commTrack: string;

//     @Column(
//         {
//             name: 'init_time',
//             default: null
//         })
//     initTime: string;

//     @Column(
//         {
//             name: 'relay_time',
//             default: null
//         })
//     relayTime: string;

//     @Column(
//         {
//             name: 'relayed',
//             default: null
//         })
//     relayed: boolean;

//     @Column(
//         {
//             name: 'delivery_time',
//             default: null
//         })
//     deliveryTime: string;

//     @Column(
//         {
//             name: 'deliverd',
//             default: null
//         })
//     deliverd: boolean;
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

import WebSocket, { Server as WSServer, WebSocket as WS } from "ws";
import { IncomingMessage } from "http";
import * as url from "url";
import * as jwt from "jsonwebtoken";

import { v4 as uuidv4 } from "uuid";
import { BaseService } from "../../base/base.service";

@Entity({
  name: "cd_push_socket",
  synchronize: false,
})
// @CdModel
export class CdPushSocketModel {
  b?: BaseService<CdPushSocketModel>;

  @PrimaryGeneratedColumn({
    name: "cd_push_socket_id",
  })
  cdPushSocketId?: number;

  @Column({
    name: "cd_push_socket_guid",
    length: 40,
    default: uuidv4(),
  })
  cdPushSocketGuid?: string;

  @Column({
    name: "cd_push_socket_name",
    type: "varchar",
    length: 40,
    nullable: true,
    default: null,
  })
  cdPushSocketName?: string;

  @Column({
    name: "cd_push_socket_description",
    type: "varchar",
    length: 160,
    nullable: true,
    default: null,
  })
  cdPushSocketDescription?: string;

  @Column({
    name: "doc_id",
    type: "int",
    nullable: true,
    default: null,
  })
  docId?: number;

  @Column({
    name: "cd_push_socket_type_id",
    type: "int",
    nullable: true,
    default: null,
  })
  cdPushSocketTypeId?: number;

  @Column({
    name: "data",
    type: "json",
    nullable: true,
    default: null,
  })
  data?: any;

  @Column({
    name: "cd_push_socket_type_guid",
    type: "varchar",
    length: 40,
    nullable: true,
    default: null,
  })
  cdPushSocketTypeGuid?: string;

  @Column({
    name: "cd_push_socket_enabled",
    type: "tinyint",
    nullable: true,
    default: null,
  })
  cdPushSocketEnabled?: boolean;

  @Column({
    name: "ng_module",
    type: "varchar",
    length: 50,
    nullable: true,
    default: null,
  })
  ngModule?: string;

  @Column({
    name: "resource_name",
    type: "varchar",
    length: 50,
    nullable: true,
    default: null,
  })
  resourceName?: string;

  @Column({
    name: "resource_guid",
    type: "varchar",
    length: 40,
    nullable: true,
    default: null,
  })
  resourceGuid?: string;

  @Column({
    name: "jwt_token",
    type: "varchar",
    length: 400,
    nullable: true,
    default: null,
  })
  jwtToken?: string;

  @Column({
    name: "socket",
    type: "json",
    nullable: true,
    default: null,
  })
  socket?: any;

  @Column({
    name: "init_time",
    type: "varchar",
    length: 20,
    nullable: true,
    default: null,
  })
  initTime?: string;

  @Column({
    name: "relay_time",
    type: "varchar",
    length: 20,
    nullable: true,
    default: null,
  })
  relayTime?: string;

  @Column({
    name: "relayed",
    type: "tinyint",
    nullable: true,
    default: null,
  })
  relayed?: boolean;

  @Column({
    name: "delivery_time",
    type: "varchar",
    length: 20,
    nullable: true,
    default: null,
  })
  deliveryTime?: string;

  @Column({
    name: "deliverd",
    type: "tinyint",
    nullable: true,
    default: null,
  })
  deliverd?: boolean;

  @Column({
    name: "comm_track",
    type: "json",
    nullable: true,
    default: null,
  })
  commTrack?: any;

  @Column({
    name: "app_id",
    type: "varchar",
    length: 40,
    nullable: true,
    default: null,
  })
  appId?: string;
}

// Define the shape of your message payload
export interface PushRecipient {
    subTypeId: number;
    userId: string;
    cdObjId: {
        jwtToken: string;
        resourceGuid: string;
    };
}

export interface PushEnvelope {
    pushData: {
        pushRecepients: PushRecipient[];
        pushGuid: string;
        triggerEvent?: string;
    };
    resp?: any;
}

export interface SocketData {
    resourceGuid: string;
    socket: WS;
}