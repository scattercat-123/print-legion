"use client";

import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  CarouselButton,
} from "@/components/ui/carousel";
import { getSlackUserInfo, SlackUserInfo } from "@/lib/slack";
import { AirtableAttachmentSchema, User } from "@/lib/types";
import {
  DownloadIcon,
  MessageCircle,
  Printer,
  MapPin,
  Info,
} from "lucide-react";
import { use } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
                        : `${image.filename
                            .split(".")
                            .slice(0, -1)
                            .join(".")
                            .slice(0, 10)}.${image.filename.split(".").pop()}`}
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

export const PrinterDetails = ({
  promise,
}: {
  promise: Promise<[SlackUserInfo | null, User | null] | null>;
}) => {
  const data = use(promise);
  const slackUser = data?.[0];
  const user = data?.[1];

  if (!slackUser || !user) return null;

  const openSlackChat = () => {
    window.open(
      `https://slack.com/app_redirect?team=T0266FRGM&channel=${slackUser.id}`,
      "_blank"
    );
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-medium tracking-tight mb-2">
        Assigned printer
      </h2>
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-grow space-y-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <img
                    src={slackUser.profile.image_192}
                    alt={slackUser.real_name}
                    className="size-12 shrink-0 rounded-xl border border-border"
                  />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
                    {slackUser.real_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    @{slackUser.name}
                  </p>
                </div>
              </div>

              {user.printer_has && (
                <div className="space-y-2">
                  {(user.printer_details || user.printer_type) && (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Printer className="h-4 w-4" />
                        Printer details
                      </div>

                      <span className="text-sm text-muted-foreground">
                        {user.printer_type ?? "Printer type not specified"}
                      </span>
                      {user.printer_details && (
                        <span className="text-sm text-muted-foreground">
                          {user.printer_details}
                        </span>
                      )}
                    </div>
                  )}
                  {user.region_coordinates && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>Region available</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={openSlackChat}
                className="w-full sm:w-auto"
                variant="secondary"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat on Slack
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
