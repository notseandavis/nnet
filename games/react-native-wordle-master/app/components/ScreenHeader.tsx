import { Box, Typography } from '@mui/material';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const ScreenHeader = () => {
  return (
    <Box sx={{ width: '100%', textAlign: "center"}}>
      <Typography variant="h4" component="div" gutterBottom>
        wordle ai
      </Typography>
    </Box>
  );
};

const styles = StyleSheet.create({

});

export default ScreenHeader;
