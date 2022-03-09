import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const ScreenHeader = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>neural net wordle</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#df928e',
    fontWeight: '200',
    fontSize: 32,
  },
  subtitle: {
    color: '#91e5f6',
    fontWeight: '400',
    fontSize: 12,
  },
});

export default ScreenHeader;
