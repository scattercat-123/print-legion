"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

const FAQ_ITEMS = {
  "what-is-print-legion": {
    title: "What is Print Legion?",
    content:
      "Print Legion is a platform that connects Hack Clubbers with 3D printers with those who don't",
  },
  "whats-in-it": {
    title: "What's in it for the printer?",
    content:
      "You get to help out the community! Any filament used will be reimbursed by Hack Club (rates: coming soon™️)",
  },
  "what-can-print": {
    title: "What can I print?",
    content: "You can print parts for anything as long as it's from a YSWS!",
  },
  "how-to-submit": {
    title: "How do I submit a print?",
    content: (
      <>
        You can submit a print by going to the{" "}
        <Link href="/dashboard/jobs/create">Submit Job</Link> page.
      </>
    ),
  },
} as const;

export default function FAQClientPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        For those of you who don't read the pins
      </p>
      <Accordion type="single" collapsible>
        {Object.entries(FAQ_ITEMS).map(([key, { title, content }]) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger>{title}</AccordionTrigger>
            <AccordionContent>{content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
