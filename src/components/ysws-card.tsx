import { Card, CardContent } from "@/components/ui/card";
import { ExternalLinkIcon } from "lucide-react";

interface YSWSCardProps {
  name: string;
}

export function YSWSCard({ name }: YSWSCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-medium tracking-tight">{name}</h3>
              <p className="text-sm text-muted-foreground">
                Youth Solving World Struggles Project
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
