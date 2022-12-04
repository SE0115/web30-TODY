import { useCallback, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import styled from 'styled-components';
import VideoItem from '@components/studyRoom/VideoItem';

const Video = styled.video`
  width: 405px;
  height: 308px;
  border-radius: 12px;
  background-color: var(--guideText);
`;

const PCConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const socket = io(process.env.REACT_APP_SOCKET_URL!, {
  autoConnect: false,
});

export default function TestSFUClient() {
  let sendPC: RTCPeerConnection | null = null;
  const receivePCListRef = useRef<{ [socketId: string]: RTCPeerConnection }>(
    {},
  );

  const localStreamRef = useRef<MediaStream>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [userList, setUserList] = useState<
    {
      socketId: string;
      stream: MediaStream;
    }[]
  >([]);

  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
  }, []);

  const createSenderOffer = useCallback(async () => {
    if (!sendPC) return;
    const sdp = await sendPC.createOffer();
    // const sdp = await sendPC.createOffer({
    //   offerToReceiveAudio: false,
    //   offerToReceiveVideo: false,
    // });
    console.log('create sender offer');
    await sendPC.setLocalDescription(sdp);

    socket.emit('senderOffer', {
      senderSdp: sdp,
      senderSocketId: socket.id,
      roomId: '1',
    });
  }, []);

  const createSendPeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection(PCConfig);

    pc.onicecandidate = (e) => {
      if (!(e.candidate && socket)) return;
      console.log('sender PC onicecandidate');
      socket.emit('senderCandidate', {
        candidate: e.candidate,
        senderSocketId: socket.id,
      });
    };

    if (localStreamRef.current) {
      console.log('add local stream');
      localStreamRef.current.getTracks().forEach((track) => {
        if (!localStreamRef.current) return;
        pc.addTrack(track, localStreamRef.current);
      });
    } else console.log('no local stream');

    sendPC = pc;

    await createSenderOffer();
  }, []);

  const createReceiverOffer = useCallback(
    async (pc: any, senderSocketId: any) => {
      // const sdp = await pc.createOffer();
      const sdp = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      console.log('create receiver offer');
      await pc.setLocalDescription(sdp);

      if (!socket) return;
      socket.emit('receiverOffer', {
        receiverSdp: sdp,
        receiverSocketId: socket.id,
        senderSocketId,
        roomId: '1',
      });
    },
    [],
  );

  const createReceivePeerConnection = useCallback((senderSocketId: string) => {
    console.log(`create receivePeer: ${senderSocketId} user entered`);
    const pc = new RTCPeerConnection(PCConfig);

    receivePCListRef.current = {
      ...receivePCListRef.current,
      [senderSocketId]: pc,
    };

    pc.onicecandidate = (e) => {
      if (!(e.candidate && socket)) return;
      console.log('receiver PC onicecandidate');
      socket.emit('receiverCandidate', {
        candidate: e.candidate,
        receiverSocketId: socket.id,
        senderSocketId,
      });
    };

    pc.ontrack = (e) => {
      console.log('ontrack success');
      setUserList((prevUserList) =>
        prevUserList
          .filter((user) => user.socketId !== senderSocketId)
          .concat({
            socketId: senderSocketId,
            stream: e.streams[0],
          }),
      );
    };

    createReceiverOffer(pc, senderSocketId);
  }, []);

  const closeReceiverPeerConnection = (toCloseSocketId: string) => {
    if (!receivePCListRef.current[toCloseSocketId]) return;
    receivePCListRef.current[toCloseSocketId].close();
    delete receivePCListRef.current[toCloseSocketId];
  };

  useEffect(() => {
    socket.connect();

    socket.on('connect', async () => {
      await getLocalStream();
      createSendPeerConnection();
    });

    socket.on('enterNewUser', (data) => {
      console.log('enter new user');
      createReceivePeerConnection(data.id);
    });

    socket.on('userLeftRoom', (data) => {
      closeReceiverPeerConnection(data.socketId);
      setUserList((prevUserList) =>
        prevUserList.filter((user) => user.socketId !== data.socketId),
      );
    });

    socket.on('getSenderAnswer', async (data) => {
      const { receiverSdp } = data;
      console.log('get sender answer');
      if (!sendPC) return;
      await sendPC.setRemoteDescription(receiverSdp);
      socket.emit('getUserList', {
        roomId: '1',
      });
    });

    socket.on(
      'getSenderCandidate',
      async (data: { candidate: RTCIceCandidateInit }) => {
        if (!(data.candidate && sendPC)) return;
        console.log('get sender candidate');
        await sendPC.addIceCandidate(new RTCIceCandidate(data.candidate));
      },
    );

    socket.on('getReceiverAnswer', async (data) => {
      const { senderSocketId, senderSdp } = data;
      console.log(`get ${senderSocketId} receiver answer`);
      const pc = receivePCListRef.current[senderSocketId];
      if (!pc) return;
      await pc.setRemoteDescription(senderSdp);
    });

    socket.on('getReceiverCandidate', async (data) => {
      const { candidate, senderSocketId } = data;
      console.log(`get ${senderSocketId}'s reciever candidate`);
      const pc = receivePCListRef.current[senderSocketId];
      if (!(pc && candidate)) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('allUserList', (data) => {
      console.log('allUserList', data.userList);
      data.userList?.forEach((user: any) =>
        createReceivePeerConnection(user.socketId),
      );
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (sendPC) {
        sendPC.close();
      }
      userList.forEach((user) => closeReceiverPeerConnection(user.socketId));
    };
  }, []);

  return (
    <div>
      <Video muted ref={localVideoRef} autoPlay />
      {userList.map((user) => (
        <VideoItem key={user.socketId} stream={user.stream} />
      ))}
    </div>
  );
}
