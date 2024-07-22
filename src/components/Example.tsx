/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from "react";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleLinear, scaleBand } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { Text } from "@visx/text";

// Define the graph dimensions and margins
const width = 500;
const height = 300;
const margin = { top: 40, bottom: 80, left: 20, right: 20 };

// Then we'll create some bounds
const xMax = width - margin.left - margin.right;
const yMax = height - margin.top - margin.bottom;

export default function Example({ data }) {
  // We'll make some helpers to get at the data we want
  const x = (d) => d.candidate;
  const y = (d) => d.result;

  // And then scale the graph by our data
  const xScale = scaleBand({
    range: [0, xMax],
    round: true,
    domain: data.map(x),
    padding: 0.4,
  });
  const yScale = scaleLinear({
    range: [yMax, 0],
    round: true,
    domain: [0, Math.max(...data.map(y))],
  });

  // Compose together the scale and accessor functions to get point functions
  const compose = (scale, accessor) => (data) => scale(accessor(data));
  const xPoint = compose(xScale, x);
  const yPoint = compose(yScale, y);

  // Finally we'll embed it all in an SVG
  return (
    <div className="flex justify-center">
      <svg width={width} height={height} className="bg-slate-20s0 pt-3 pb-1">
        <Group top={margin.top} left={margin.left}>
          {data.map((d, i) => {
            const barHeight = yMax - yPoint(d);
            return (
              <Group key={`bar-${i}`}>
                <Bar
                  x={xPoint(d)}
                  y={yMax - barHeight}
                  height={barHeight}
                  width={xScale.bandwidth()}
                  fill="#1d4ed8"
                />
                <Text
                  x={xPoint(d) + xScale.bandwidth() / 2}
                  y={yMax - barHeight - 5}
                  textAnchor="middle"
                  verticalAnchor="end"
                  fill="black"
                  fontSize={12}
                  fontWeight="bold"
                >
                  {d.result.toFixed(1) + "%"}
                </Text>
              </Group>
            );
          })}
          <AxisBottom
            scale={xScale}
            top={yMax}
            stroke={"#1b1a1e"}
            tickStroke={"#1b1a1e"}
            tickComponent={({ x, y, formattedValue }) => {
              const candidateData = data.find(
                (d) => d.candidate === formattedValue,
              );
              return (
                <image
                  href={candidateData?.image}
                  x={x - xScale.bandwidth() / 2}
                  y={y}
                  width={xScale.bandwidth()}
                  height={40}
                />
              );
            }}
          />
        </Group>
      </svg>
    </div>
  );
}
