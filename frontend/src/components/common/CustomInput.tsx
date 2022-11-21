import styled from 'styled-components';

const CustomInputLayout = styled.div`
  width: 100%;

  & + & {
    margin-top: 10px;
  }
`;

const Input = styled.input<Props>`
  padding: 21px 28px;
  width: ${({ width }) => width};
  border: 2px solid #ff8a00;
  border-radius: 15px;
  font-size: 18px;

  &::placeholder {
    color: #ffc7a1;
  }
`;

const GuideText = styled.div`
  margin: 8px 0 0 7px;
  color: var(--guideText);
  font-size: 14px;
`;

const WarningText = styled.div`
  margin: 8px 0 0 7px;
  color: var(--red);
  font-size: 14px;
  font-weight: 700;
`;

interface Props {
  width?: string;
  placeholder?: string;
  warningText?: string;
  guideText?: string;
  type?: string;
}

export default function CustomInput(props: Props) {
  const { warningText, guideText, ...rest } = props;
  return (
    <CustomInputLayout>
      <Input {...rest} />
      {guideText && <GuideText>{guideText}</GuideText>}
      {warningText && <WarningText>{warningText}</WarningText>}
    </CustomInputLayout>
  );
}

CustomInput.defaultProps = {
  width: '100%',
  placeholder: '',
  warningText: '',
  guideText: '',
  type: 'text',
};