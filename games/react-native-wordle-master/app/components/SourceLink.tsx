import { Fab } from '@mui/material';
import React from 'react';
import {Linking, Platform, StyleSheet, Text, View} from 'react-native';

const HOME_URL = 'https://github.com/notseandavis/nnet';

const SourceLink = () => {
  return (
    <View style={styles.container}>
      <Fab variant="extended" onClick={() => Linking.openURL(HOME_URL)}>
        github
      </Fab>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: 16,
  },
  subtitle: {
    // color: '#5998c5',
    // fontWeight: '400',
    // fontSize: 16,
  },
});

export default SourceLink;
