import MixDonut from "./MixDonut";

export interface ChannelMixRow {
  channel: string;
  grossSales: number;
}

interface ChannelMixDonutProps {
  data: ChannelMixRow[];
  channelLabel: Record<string, string>;
}

export default function ChannelMixDonut({
  data,
  channelLabel,
}: ChannelMixDonutProps) {
  return (
    <MixDonut
      data={data.map((row) => ({
        key: row.channel,
        label: channelLabel[row.channel] ?? row.channel,
        value: row.grossSales,
      }))}
    />
  );
}
