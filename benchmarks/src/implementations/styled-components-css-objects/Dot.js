import styled from 'styled-components';
import View from './View';

export default styled(View).attrs(p => ({ style: { borderBottomColor: p.color } }))(p => ({
  position: 'absolute',
  cursor: 'pointer',
  width: 0,
  height: 0,
  borderColor: 'transparent',
  borderStyle: 'solid',
  borderTopWidth: 0,
  transform: 'translate(50%, 50%)',
  borderRightWidth: `${p.size / 2}px`,
  borderBottomWidth: `${p.size / 2}px`,
  borderLeftWidth: `${p.size / 2}px`,
  marginLeft: `${p.x}px`,
  marginTop: `${p.y}px`,
}));
