import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleLinear, scaleBand } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { Text } from "@visx/text";

// Bar chart of weighted results. Decorative for assistive technology: the
// results table next to it carries the same data. Neutral colour via
// currentColor, so it works in both themes and favours no community.
const width = 500;
const height = 300;
const margin = { top: 30, bottom: 50, left: 10, right: 10 };
const xMax = width - margin.left - margin.right;
const yMax = height - margin.top - margin.bottom;

export default function ResultsChart({ data }) {
  const xScale = scaleBand({
    range: [0, xMax],
    round: true,
    domain: data.map((d) => d.candidate),
    padding: 0.4,
  });
  const yScale = scaleLinear({
    range: [yMax, 0],
    round: true,
    domain: [0, Math.max(100, ...data.map((d) => d.result))],
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-xl h-auto mx-auto text-zinc-800 dark:text-zinc-200"
      aria-hidden="true"
      focusable="false"
    >
      <Group top={margin.top} left={margin.left}>
        {data.map((d) => {
          const x = xScale(d.candidate) ?? 0;
          const y = yScale(d.result);
          return (
            <Group key={d.candidate}>
              <Bar
                x={x}
                y={y}
                width={xScale.bandwidth()}
                height={yMax - y}
                fill="currentColor"
                opacity={0.75}
              />
              <Text
                x={x + xScale.bandwidth() / 2}
                y={y - 6}
                textAnchor="middle"
                verticalAnchor="end"
                fill="currentColor"
                fontSize={13}
                fontWeight="bold"
              >
                {`${d.result.toFixed(1)}%`}
              </Text>
            </Group>
          );
        })}
        <AxisBottom
          scale={xScale}
          top={yMax}
          stroke="currentColor"
          tickStroke="currentColor"
          tickLabelProps={() => ({
            fill: "currentColor",
            fontSize: 12,
            textAnchor: "middle",
          })}
        />
      </Group>
    </svg>
  );
}
