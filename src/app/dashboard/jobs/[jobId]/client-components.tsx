"use client";

import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  CarouselButton,
} from "@/components/ui/carousel";
import { AirtableAttachmentSchema } from "@/lib/types";
import { DownloadIcon } from "lucide-react";
import { z } from "zod";
export const ImageCarousel = ({
  user_images,
  main_image_id,
}: {
  user_images?: z.infer<typeof AirtableAttachmentSchema>[];
  main_image_id?: string;
}) => {
  return (
    user_images &&
    user_images.length > 0 && (
      <div className="space-y-4">
        <h2 className="text-lg font-medium tracking-tight">Images</h2>
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {user_images.map((image) => (
                <CarouselItem
                  key={image.id}
                  className="basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <div className="relative aspect-square">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="absolute inset-0 object-cover w-full h-full rounded-lg border border-border"
                    />
                    {image.id === main_image_id && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2"
                      >
                        Main Image
                      </Badge>
                    )}

                    <p className="absolute bottom-2 left-2 z-20 text-xs text-card-foreground bg-card/60 hover:bg-card transition-colors rounded-full px-1">
                      {image.filename.length < 10
                        ? image.filename
                        : `${image.filename.split(".")[0].slice(0, 10)}.${
                            image.filename.split(".")[1]
                          }`}
                    </p>

                    <button
                      className="absolute bottom-2 right-2 z-20 size-4 bg-card/60 hover:bg-card hover:scale-110 transition-all rounded-full flex items-center justify-center"
                      type="button"
                      onClick={() => {
                        window.open(image.url, "_blank");
                      }}
                    >
                      <DownloadIcon className="size-3" />
                    </button>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex w-full mt-2">
              <CarouselDots />
              <div className="flex-grow"></div>
              <CarouselButton mode="prev" className="mr-2" />
              <CarouselButton mode="next" />
            </div>
          </Carousel>
        </div>
      </div>
    )
  );
};
