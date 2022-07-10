import React from 'react';
import Chart from 'react-google-charts';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface WinRatioChartProps {
  historyData: [number, number][];
  chartDataTitle: string;
}
const chartOptions = {
  title: "Accuracy (across Epochs)",
  curveType: "function",
  legend: { position: "bottom" },
};
const WinRatioChart = (props: WinRatioChartProps) => {
  const {historyData} = props;
  const chartData = [...[["Epoch", props.chartDataTitle]], ...historyData];

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

export default WinRatioChart;
