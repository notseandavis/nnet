import React from 'react';
import Chart from 'react-google-charts';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface HistoryChartProps {
  historyData: [number, number, number][];
}const chartOptions = {
  title: "Best Guess vs Correct Asnwer",
  curveType: "function",
  legend: { position: "bottom" },
};
const Keyboard = (props: HistoryChartProps) => {
  const {historyData} = props;
  const chartData = [...[["Game", "Best Guess Certainty", "Correct Answer Certainty"]], ...historyData];

  return (
    <>

      <Chart
            chartType="LineChart"
            width="100%"
            height="300px"
            data={chartData}
            options={chartOptions}
          />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  cell: {
    padding: 5,
    paddingHorizontal: 8,
    margin: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'black',
  },
  cellDisabled: {
    borderColor: 'gray',
  },
  text: {
    color: 'black',
    fontSize: 16,
  },
  textDisabled: {
    color: 'gray',
  },
});

export default Keyboard;
