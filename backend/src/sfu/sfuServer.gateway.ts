import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as wrtc from 'wrtc';

const PCConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

let receiverPeerConnectionInfo = {};
let senderPeerConnectionInfo = {};
const userInfo = {};
const roomInfoPerSocket = {};

function isIncluded(userList, socketId) {
  return userList.some((user) => user.socketId === socketId);
}

export function deleteUser(toDeleleteUserSocketId, roomId) {
  if (!userInfo[roomId]) return;

  userInfo[roomId] = userInfo[roomId].filter(
    (user) => user.socketId !== toDeleleteUserSocketId,
  );
  if (!userInfo[roomId].length) delete userInfo[roomId];
  delete roomInfoPerSocket[toDeleleteUserSocketId];
}

function getOtherUserListOfRoom(userSocketId, roomId) {
  let userList = [];
  if (!userInfo[roomId]) return userList;

  userList = userInfo[roomId]
    .filter((user) => user.socketId !== userSocketId)
    .map((user) => ({ socketId: user.socketId }));

  return userList;
}

@WebSocketGateway({ cors: true })
export class SFUServerGateway {
  @WebSocketServer() server: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('disconnected', client.id);
    const roomId = roomInfoPerSocket[client.id];
    deleteUser(client.id, roomId);
    closeReceivePeerConnection(client.id);
    closeSendPeerConnection(client.id);
    client.broadcast.to(roomId).emit('userLeftRoom', { socketId: client.id });
  }

  @SubscribeMessage('senderOffer')
  async handleSenderOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { senderSdp, senderSocketId, roomId } = data;
    roomInfoPerSocket[senderSocketId] = roomId;

    const pc = createReceiverPeerConnection(senderSocketId, client, roomId);
    await pc.setRemoteDescription(senderSdp);
    // const sdp = await pc.createAnswer();
    const sdp = await pc.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(sdp);

    client.join(roomId);
    this.server.to(senderSocketId).emit('getSenderAnswer', {
      receiverSdp: sdp,
    });
    // this.server.to(senderSocketId).emit('allUserList', {
    //   userList: getOtherUserListOfRoom(senderSocketId, roomId),
    // });
  }
  @SubscribeMessage('senderCandidate')
  async handleSenderCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { senderSocketId, candidate } = data;
    const pc = receiverPeerConnectionInfo[senderSocketId];
    await pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate));
  }

  @SubscribeMessage('getUserList')
  async handle(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    client.emit('allUserList', {
      userList: getOtherUserListOfRoom(client.id, data.roomId),
    });
  }

  @SubscribeMessage('receiverOffer')
  async handleReceiverOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    console.log('--receive Offer--');
    const { receiverSdp, receiverSocketId, senderSocketId, roomId } = data;
    const pc = createSenderPeerConnection(
      receiverSocketId,
      senderSocketId,
      client,
      roomId,
    );
    await pc.setRemoteDescription(receiverSdp);
    const sdp = await pc.createAnswer();
    // const sdp = await pc.createAnswer({
    //   offerToReceiveAudio: false,
    //   offerToReceiveVideo: false,
    // });
    await pc.setLocalDescription(sdp);
    this.server.to(receiverSocketId).emit('getReceiverAnswer', {
      senderSdp: sdp,
      senderSocketId: senderSocketId,
    });
  }
  @SubscribeMessage('receiverCandidate')
  async handleReceiverCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const senderPC = senderPeerConnectionInfo[data.senderSocketId].filter(
      (sPC) => sPC.socketId === data.receiverSocketId,
    )[0];
    await senderPC.pc.addIceCandidate(new wrtc.RTCIceCandidate(data.candidate));
  }
}

function createReceiverPeerConnection(senderSocketId, socket, roomId) {
  const pc = new wrtc.RTCPeerConnection(PCConfig);

  if (receiverPeerConnectionInfo[senderSocketId])
    receiverPeerConnectionInfo[senderSocketId] = pc;
  else
    receiverPeerConnectionInfo = {
      ...receiverPeerConnectionInfo,
      [senderSocketId]: pc,
    };

  pc.onicecandidate = (e) => {
    console.log('receiver oniceCandidate');
    socket.to(senderSocketId).emit('getSenderCandidate', {
      candidate: e.candidate,
    });
  };

  pc.ontrack = (e) => {
    console.log('--------ontrack------');
    console.log(e.streams[0]);
    if (userInfo[roomId]) {
      if (!isIncluded(userInfo[roomId], senderSocketId)) {
        userInfo[roomId].push({
          socketId: senderSocketId,
          stream: e.streams[0],
        });
      } else return;
    } else {
      userInfo[roomId] = [
        {
          socketId: senderSocketId,
          stream: e.streams[0],
        },
      ];
    }
    socket.broadcast.to(roomId).emit('enterNewUser', { id: senderSocketId });
  };

  return pc;
}

function createSenderPeerConnection(
  receiverSocketId,
  senderSocketId,
  socket,
  roomId,
) {
  const pc = new wrtc.RTCPeerConnection(PCConfig);
  console.log('create senderPC', senderSocketId, '->', receiverSocketId);
  if (senderPeerConnectionInfo[senderSocketId]) {
    senderPeerConnectionInfo[senderSocketId].filter(
      (user) => user.socketId !== receiverSocketId,
    );
    senderPeerConnectionInfo[senderSocketId].push({
      socketId: receiverSocketId,
      pc,
    });
  } else {
    senderPeerConnectionInfo = {
      ...senderPeerConnectionInfo,
      [senderSocketId]: [{ socketId: receiverSocketId, pc }],
    };
  }

  pc.onicecandidate = (e) => {
    console.log('sender oniceCandidate');
    socket.to(receiverSocketId).emit('getReceiverCandidate', {
      candidate: e.candidate,
      senderSocketId: senderSocketId,
    });
  };

  const sendUser = userInfo[roomId].filter(
    (user) => user.socketId === senderSocketId,
  )[0];

  sendUser.stream.getTracks().forEach((track) => {
    pc.addTrack(track, sendUser.stream);
  });

  return pc;
}

function closeReceivePeerConnection(toCloseSocketId) {
  if (!receiverPeerConnectionInfo[toCloseSocketId]) return;

  receiverPeerConnectionInfo[toCloseSocketId].close();
  delete receiverPeerConnectionInfo[toCloseSocketId];
}

function closeSendPeerConnection(toCloseSocketId) {
  if (!senderPeerConnectionInfo[toCloseSocketId]) return;

  senderPeerConnectionInfo[toCloseSocketId].forEach((senderPC) => {
    senderPC.pc.close();

    if (!senderPeerConnectionInfo[senderPC.socektId]) return;

    senderPeerConnectionInfo[senderPC.socektId] = senderPeerConnectionInfo[
      senderPC.socektId
    ].redecue((filtered, sPC) => {
      if (sPC.socketId === toCloseSocketId) {
        sPC.pc.close();
        return;
      }
      filtered.push(sPC);
      return filtered;
    }, []);
  });

  delete senderPeerConnectionInfo[toCloseSocketId];
}
