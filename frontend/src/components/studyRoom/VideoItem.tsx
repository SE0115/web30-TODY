import { useRef, useEffect } from 'react';
import styled from 'styled-components';

const VideoLayout = styled.div``;

const Video = styled.video`
  width: 405px;
  height: 308px;
  border-radius: 12px;
  background-color: var(--guideText);
`;

interface Props {
  stream: any;
}

export default function VideoItem({ stream }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <VideoLayout>
      <Video ref={ref} autoPlay />
    </VideoLayout>
  );
}
