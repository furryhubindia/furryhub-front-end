import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  bgColor: string;
  textColor?: string;
  image?: string;
  onClick?: () => void;
}

export const ServiceCard = ({ title, bgColor, textColor = "text-white", image, onClick }: ServiceCardProps) => {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden rounded-3xl border-0 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl",
        "h-40 md:h-48 flex items-center justify-center",
        bgColor
      )}
      onClick={onClick}
    >
      {image && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-contain opacity-80 p-4"
          />
        </div>
      )}
      <h3 className={cn(
        "text-2xl md:text-3xl font-bold text-center px-4 relative z-10 tracking-wide",
        textColor,
        "drop-shadow-lg"
      )}>
        {title}
      </h3>
    </Card>
  );
};