import React from 'react';
import {StylesProvider} from '../../../../src/index.js'
import View from './View';

export default function Provider({ children }) {
  return (
    <StylesProvider options={{useCssTypedOm: true}}>
      <View>
        {children}
      </View>
    </StylesProvider>
  )
}
