import React from 'react';

interface LiquidFillGaugeProps {
  value: number; // 0-100
  centerText: string;
  liquidColor?: string; // Optional: override default liquid color
}

const LiquidFillGauge: React.FC<LiquidFillGaugeProps> = ({
  value,
  centerText,
  liquidColor = 'var(--primary-green)',
}) => {
  const fillHeight = `${value}%`;

  return (
    <div className="liquid-fill-gauge-container">
      <div
        className="liquid-fill-gauge-liquid"
        style={{ height: fillHeight, backgroundColor: liquidColor }}
      >
        <div className="liquid-fill-gauge-wave"></div>
        <div className="liquid-fill-gauge-wave wave-back"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-center z-10">
        <span className="text-xl font-bold text-foreground">{centerText}</span>
      </div>
    </div>
  );
};

export default LiquidFillGauge;
