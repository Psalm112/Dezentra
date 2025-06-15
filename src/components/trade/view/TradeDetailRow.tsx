import { FC, ReactNode } from "react";

interface TradeDetailRowProps {
  label: string;
  value: ReactNode;
  bottomNote?: ReactNode;
  className?: string;
}

const TradeDetailRow: FC<TradeDetailRowProps> = ({
  label,
  value,
  bottomNote,
  className = "",
}) => {
  return (
    <div>
      <div className={`flex justify-between items-center py-2 ${className}`}>
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <span className="text-white text-sm font-medium">{value}</span>
      </div>
      {bottomNote && <span className="w-full">{bottomNote}</span>}
    </div>
  );
};

export default TradeDetailRow;
