import { useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { ReactComponent as MicIcon } from '@assets/icons/mic.svg';
import { ReactComponent as MicOffIcon } from '@assets/icons/mic-off.svg';
import { ReactComponent as VideoIcon } from '@assets/icons/video.svg';
import { ReactComponent as VideoOffIcon } from '@assets/icons/video-off.svg';
import { ReactComponent as CanvasIcon } from '@assets/icons/canvas.svg';
import { ReactComponent as ChatIcon } from '@assets/icons/chat.svg';
import { ReactComponent as ParticipantsIcon } from '@assets/icons/participants.svg';
import ChatSideBar from '@components/studyRoom/ChatSideBar';
import { useEffect, useState } from 'react';
import useAxios from '@hooks/useAxios';
import ParticipantsSideBar from '@components/studyRoom/ParticipantsSideBar';
import getParticipantsListRequest from '../axios/requests/getParticipantsListRequest';

const StudyRoomPageLayout = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--yellow3);
`;

const RoomInfo = styled.div`
  margin-top: 24px;
  margin-left: 24px;
  display: flex;
  gap: 7px;
`;

const RoomTitle = styled.h1`
  font-family: 'yg-jalnan';
  font-size: 22px;
  font-weight: 700;
`;

const RoomStatus = styled.div`
  width: 42px;
  height: 24px;
  background-color: var(--grey);
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
`;

const VideoListLayout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const VideoList = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-content: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
`;
const VideoItem = styled.div`
  width: 405px;
  height: 308px;
  border-radius: 12px;
  background-color: var(--guideText);
`;

const BottomBarLayout = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 96px;
  background-color: var(--yellow);
`;

const MenuList = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
`;
const MenuItem = styled.button`
  width: 110px;
  height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  align-items: center;
  background: none;
  padding: 0;
  border-radius: 10px;
  font-size: 17px;

  &:hover,
  &.active {
    background: rgba(255, 255, 255, 0.45);
  }
`;

const IconWrapper = styled.span`
  height: 27.5px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RoomExitButton = styled.button`
  position: absolute;
  top: 0;
  right: 30px;
  transform: translate(0, 50%);
  width: 108px;
  height: 46px;
  background-color: var(--orange);
  border-radius: 8px;
  color: var(--white);
  font-family: 'yg-jalnan';
  font-size: 20px;
  font-weight: 700;
`;

export default function StudyRoomPage() {
  const { roomId } = useParams();
  const { state: roomInfo } = useLocation();

  const [getParticipants, loading, error, participantsList] = useAxios<{
    participantsList: any;
  }>(getParticipantsListRequest);

  useEffect(() => {
    getParticipants(roomInfo.studyRoomId);
  }, []);

  useEffect(() => {}, [participantsList]);

  const [activeSideBar, setActiveSideBar] = useState('');

  const onClickSideBarMenu = (clickedMenu: string) => {
    if (clickedMenu === activeSideBar) setActiveSideBar('');
    else setActiveSideBar(clickedMenu);
  };

  const onClickButtons = (e: any) => {
    const buttonEl = e.target.closest('button').textContent;

    switch (buttonEl) {
      case '':
        break;
      case '채팅':
      case '멤버':
        onClickSideBarMenu(buttonEl);
        break;
      default:
        console.log(buttonEl);
        break;
    }
  };

  return (
    <StudyRoomPageLayout>
      <Content>
        <VideoListLayout>
          <RoomInfo>
            <RoomTitle>{roomInfo.name}</RoomTitle>
            <RoomStatus>4/5</RoomStatus>
          </RoomInfo>
          <VideoList>
            <VideoItem />
            <VideoItem />
          </VideoList>
        </VideoListLayout>
        {activeSideBar !== '' &&
          (activeSideBar === '채팅' ? (
            <ChatSideBar />
          ) : (
            <ParticipantsSideBar participants={participantsList} />
          ))}
      </Content>
      <BottomBarLayout>
        <MenuList onClick={onClickButtons}>
          <MenuItem>
            <IconWrapper>
              <MicIcon />
            </IconWrapper>
            마이크 끄기
          </MenuItem>
          {/* <MenuItem>
            <IconWrapper>
              <MicOffIcon />
            </IconWrapper>
            마이크 켜기
          </MenuItem> */}
          <MenuItem>
            <IconWrapper>
              <VideoIcon />
            </IconWrapper>
            비디오 끄기
          </MenuItem>
          {/* <MenuItem>
            <IconWrapper>
              <VideoOffIcon />
            </IconWrapper>
            비디오 켜기
          </MenuItem> */}
          <MenuItem>
            <IconWrapper>
              <CanvasIcon />
            </IconWrapper>
            캔버스 공유
          </MenuItem>
          <MenuItem className={activeSideBar === '채팅' ? 'active' : ''}>
            <IconWrapper>
              <ChatIcon />
            </IconWrapper>
            채팅
          </MenuItem>
          <MenuItem className={activeSideBar === '멤버' ? 'active' : ''}>
            <IconWrapper>
              <ParticipantsIcon />
            </IconWrapper>
            멤버
          </MenuItem>
        </MenuList>
        <RoomExitButton>나가기</RoomExitButton>
      </BottomBarLayout>
    </StudyRoomPageLayout>
  );
}
