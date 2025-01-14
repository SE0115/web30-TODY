import styled, { css } from 'styled-components';

// memo: 제네릭 Props 적용 전 -> width를 읽을 수 없다는 에러가 남.
const Button = styled.button<Props>`
  padding: 21px 0;
  margin: ${({ margin }) => `${margin}`};
  width: ${({ width }) => `${width}`};
  height: ${({ height }) => `${height}`};
  background-color: ${({ color }) => color};
  border-radius: 15px;
  color: white;
  font-size: 20px;
  font-weight: 700;
  &:disabled {
    opacity: 50%;
  }
`;

interface Props {
  type?: 'button' | 'submit' | 'reset';
  children: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  width?: string;
  height?: string;
  color?: string;
  margin?: string;
  disabled?: boolean;
}

export default function CustomButton(props: Props) {
  const { children, ...restProps } = props;

  return <Button {...restProps}>{children}</Button>;
}

CustomButton.defaultProps = {
  type: 'button',
  onClick: () => {},
  width: '100%',
  height: '',
  color: 'var(--orange)',
  margin: '0',
  disabled: false,
};
